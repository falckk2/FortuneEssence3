import json
import os
import re
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.documents import Document
from supabase import create_client

from .state import AgentState, UserNeeds
from .prompts import SYSTEM_PROMPT, RECOMMEND_PROMPT, render_prompt
from .needs_heuristics import (
    build_template_recommendation,
    extract_needs_from_messages,
    goal_product_keywords,
    is_small_local_model,
    sanitize_advisor_reply,
    template_gather_reply,
)
from .tools import search_products

# ---------------------------------------------------------------------------
# Provider selection
#   USE_OLLAMA=true   → local Ollama (free, no API key)
#   USE_GROK=true     → xAI Grok free-tier via OpenAI-compatible API
#   (default)         → Anthropic LLM + OpenAI embeddings
# ---------------------------------------------------------------------------

USE_OLLAMA = os.environ.get("USE_OLLAMA", "false").lower() == "true"
USE_GROK   = os.environ.get("USE_GROK",   "false").lower() == "true"

# Ollama defaults (override via env)
OLLAMA_BASE_URL   = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_LLM_MODEL  = os.environ.get("OLLAMA_LLM_MODEL", "llama3.2")
OLLAMA_EMBED_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# Grok / xAI defaults (override via env)
GROK_API_KEY = os.environ.get("XAI_API_KEY", "")
GROK_MODEL   = os.environ.get("GROK_MODEL", "grok-3-mini")

# HuggingFace embeddings (used when USE_GROK=true)
HF_API_KEY     = os.environ.get("HF_API_KEY", "")
HF_EMBED_MODEL = os.environ.get("HF_EMBED_MODEL", "sentence-transformers/all-mpnet-base-v2")

# ---------------------------------------------------------------------------
# Shared singletons
# ---------------------------------------------------------------------------

_llm = None


def get_llm():
    global _llm
    if _llm is None:
        if USE_OLLAMA:
            from langchain_ollama import ChatOllama
            _llm = ChatOllama(
                model=OLLAMA_LLM_MODEL,
                base_url=OLLAMA_BASE_URL,
                temperature=0.3,
                num_ctx=4096,
                think=False,
            )
            print(f"[nodes] Using Ollama LLM: {OLLAMA_LLM_MODEL} @ {OLLAMA_BASE_URL}")
        elif USE_GROK:
            from langchain_openai import ChatOpenAI
            _llm = ChatOpenAI(
                model=GROK_MODEL,
                temperature=0.3,
                api_key=GROK_API_KEY,
                base_url="https://api.x.ai/v1",
                model_kwargs={"reasoning_effort": "low"},  # limits reasoning tokens on free tier
            )
            print(f"[nodes] Using Grok LLM: {GROK_MODEL}")
        else:
            from langchain_anthropic import ChatAnthropic
            _llm = ChatAnthropic(
                model="claude-sonnet-4-6",
                temperature=0.3,
                api_key=os.environ["ANTHROPIC_API_KEY"],
            )
    return _llm


def get_embeddings():
    if USE_OLLAMA:
        from langchain_ollama import OllamaEmbeddings
        return OllamaEmbeddings(
            model=OLLAMA_EMBED_MODEL,
            base_url=OLLAMA_BASE_URL,
        )
    elif USE_GROK:
        from langchain_community.embeddings import FastEmbedEmbeddings
        return FastEmbedEmbeddings(model_name="BAAI/bge-base-en-v1.5")
    else:
        openai_key = os.environ.get("OPENAI_API_KEY")
        if not openai_key:
            raise EnvironmentError(
                "OPENAI_API_KEY is required for embeddings when USE_OLLAMA and USE_GROK are both false."
            )
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(
            model="text-embedding-3-large",
            api_key=openai_key,
        )


def retrieve_similar_docs(query: str, k: int = 6) -> list[Document]:
    """
    Directly calls the Supabase match_oil_knowledge RPC function.
    Bypasses the langchain-community wrapper which has version incompatibilities.
    """
    embeddings = get_embeddings()
    query_vector = embeddings.embed_query(query)

    sb = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"],
    )
    result = sb.rpc(
        "match_oil_knowledge",
        {"query_embedding": query_vector, "match_count": k, "filter": {}},
    ).execute()

    docs = []
    for row in result.data or []:
        docs.append(Document(
            page_content=row["content"],
            metadata={**row.get("metadata", {}), "similarity": row.get("similarity", 0)},
        ))
    return docs


# ---------------------------------------------------------------------------
# Language + gathering guards
# ---------------------------------------------------------------------------

_SWEDISH_INDICATORS = [
    "hej", "hejsan", "hallå", "tjena", "tack", "snälla", "gärna",
    "jag", "du", "vi", "ni", "det", "den", "han", "hon", "de", "mig", "dig",
    "är", "vill", "kan", "har", "ska", "söker", "hjälper", "behöver", "letar", "sover", "sova", "vaknar",
    "sömn", "sämn", "sov", "sömnig", "trött", "utvilad", "natt", "säng", "kudde",
    "olja", "doft", "avslappning", "stress", "oro", "energi",
    "och", "eller", "för", "med", "men", "som", "till", "på", "av", "om", "hur",
    "vad", "var", "när", "varför", "vilken", "vilket", "hjälp", "ingen", "inget",
    "allergi", "gravid", "barn", "hud", "kväll", "morgon",
]

_ENGLISH_INDICATORS = [
    "the", "and", "for", "with", "help", "sleep", "stress", "energy", "want", "need",
    "looking", "please", "thanks", "hello", "hi", "my", "have", "would", "could",
    "diffuser", "topical", "allergy", "allergies", "pregnant", "children", "skin",
]


def _message_words(text: str) -> set[str]:
    return set(re.sub(r"[^\w\s]", "", text.lower()).split())


def _score_language(text: str) -> tuple[int, int]:
    words = _message_words(text)
    sv = sum(1 for w in _SWEDISH_INDICATORS if w in words)
    en = sum(1 for w in _ENGLISH_INDICATORS if w in words)
    return sv, en


def _resolve_language(human_texts: list[str], previous: str | None) -> str:
    """
    Pick conversation language from the full customer history, not just the latest turn.
    Short follow-ups like 'diffuser' or 'ja' should not flip Swedish → English.
    """
    sv_total = 0
    en_total = 0
    for text in human_texts:
        sv, en = _score_language(text)
        sv_total += sv
        en_total += en

    if sv_total >= 2 and sv_total >= en_total:
        return "sv"
    if en_total >= 2 and en_total > sv_total:
        return "en"
    if previous in ("sv", "en"):
        return previous
    return "sv" if sv_total > en_total else "en"


def _human_messages(messages: list) -> list[str]:
    return [m.content for m in messages if isinstance(m, HumanMessage)]


def _needs_sufficient(needs: UserNeeds, human_count: int) -> bool:
    """
    Code-level guard so the graph does not jump to recommendations too early.
    Turn 1: need goal + use_method. Turn 2+: goal is enough (safety was asked).
    """
    goal = (needs.get("goal") or "").strip()
    if not goal:
        return False

    use_method = (needs.get("use_method") or "").strip()
    if human_count <= 1:
        return bool(use_method)

    sensitivity = (needs.get("sensitivity") or "").strip()
    return bool(use_method or sensitivity or human_count >= 2)


# ---------------------------------------------------------------------------
# Node: detect language
# ---------------------------------------------------------------------------

def detect_language_node(state: AgentState) -> AgentState:
    """Detect conversation language from full history; stay sticky on short follow-ups."""
    human_texts = _human_messages(state["messages"])
    state["language"] = _resolve_language(human_texts, state.get("language"))
    return state


# ---------------------------------------------------------------------------
# Node: gather needs
# ---------------------------------------------------------------------------

def _extract_json(raw: str) -> dict:
    """Extract the first JSON object from a string, handling markdown fences and leading text."""
    # Strip markdown fences
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        for part in parts[1:]:
            if part.startswith("json"):
                part = part[4:]
            part = part.strip()
            if part:
                text = part
                break

    # Parse one complete JSON value starting at the first brace. raw_decode
    # handles braces inside string values correctly, unlike manual counting.
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found")
    obj, _ = json.JSONDecoder().raw_decode(text[start:])
    if not isinstance(obj, dict):
        raise ValueError("Extracted JSON is not an object")
    return obj


def _last_advisor_message(messages: list) -> str:
    for message in reversed(messages):
        if isinstance(message, AIMessage) and message.content:
            return message.content.strip()
    return ""


def gather_needs_node(state: AgentState) -> AgentState:
    """
    Ask clarifying questions and extract structured needs.
    Deterministic only — keyword extraction + templates (no LLM gather).
    """
    lang = state.get("language", "en")
    human_texts = _human_messages(state["messages"])
    human_count = len(human_texts)

    merged_needs = extract_needs_from_messages(human_texts)
    if state.get("user_needs"):
        merged_needs = {**state.get("user_needs", {}), **{k: v for k, v in merged_needs.items() if v}}
    state["user_needs"] = merged_needs

    if _needs_sufficient(merged_needs, human_count):
        state["gathered_enough"] = True
        return state

    state["gathered_enough"] = False
    reply = template_gather_reply(lang, merged_needs) or (
        "Berätta gärna lite mer om hur du vill använda oljan så jag kan ge ett bra förslag."
        if lang == "sv"
        else "Could you tell me a bit more about how you'd like to use the oil?"
    )

    previous_reply = _last_advisor_message(state["messages"])
    if previous_reply and reply.strip() == previous_reply:
        reply = (
            "Tack! Hur tänker du använda oljan — i en diffuser, som kuddspray, eller på huden?"
            if lang == "sv"
            else "Thanks! How would you like to use the oil — diffuser, pillow spray, or on the skin?"
        )

    state["messages"] = state["messages"] + [AIMessage(content=reply)]
    return state


# ---------------------------------------------------------------------------
# Node: retrieve RAG knowledge
# ---------------------------------------------------------------------------

def retrieve_knowledge_node(state: AgentState) -> AgentState:
    """Retrieve relevant essential oil knowledge from the vector store."""
    needs = state.get("user_needs", {})

    query_parts = [
        _str(needs.get("goal")),
        _str(needs.get("mood")),
        _str(needs.get("concerns")),
        _str(needs.get("scent_preference")),
        "essential oil benefits",
    ]
    query = " ".join(p for p in query_parts if p)

    docs = retrieve_similar_docs(query)

    state["rag_context"] = "\n\n---\n\n".join(
        f"[Source: {d.metadata.get('source', 'unknown')}]\n{d.page_content}"
        for d in docs
    )
    return state


# ---------------------------------------------------------------------------
# Node: search products
# ---------------------------------------------------------------------------

def search_products_node(state: AgentState) -> AgentState:
    """Query the FortuneEssence Supabase product catalog."""
    needs = state.get("user_needs", {})

    keywords = ",".join(filter(None, [
        goal_product_keywords(_str(needs.get("goal"))),
        _str(needs.get("scent_preference")),
        _str(needs.get("concerns")),
    ]))

    oils_json = search_products.invoke({"category": "essential-oils", "keywords": keywords})
    oils = json.loads(oils_json)

    products = list(oils)
    use_method = needs.get("use_method", "")
    if use_method in ("topical", "massage", "skin", "bath") or needs.get("concerns", "") in ("skin", "acne", "dry skin"):
        carriers_json = search_products.invoke({"category": "carrier-oils", "keywords": ""})
        products += json.loads(carriers_json)

    state["recommended_products"] = products
    return state


# ---------------------------------------------------------------------------
# Node: generate recommendation
# ---------------------------------------------------------------------------

def recommend_node(state: AgentState) -> AgentState:
    """Generate the final recommendation — templates for small local models, LLM otherwise."""
    lang = state.get("language", "en")
    products = state.get("recommended_products", [])
    needs = state.get("user_needs", {})

    use_template = USE_OLLAMA and (lang == "sv" or is_small_local_model(OLLAMA_LLM_MODEL))
    if use_template:
        reply = build_template_recommendation(lang, needs, products)
    else:
        llm = get_llm()
        lang_name = "Swedish" if lang == "sv" else "English"
        prompt = render_prompt(
            RECOMMEND_PROMPT,
            user_needs=json.dumps(needs, ensure_ascii=False, indent=2),
            rag_context=state.get("rag_context", "No additional context available."),
            products=json.dumps(products, ensure_ascii=False, indent=2),
            language=lang_name,
        )
        language_lock = (
            "VIKTIGT: Svara ENDAST på naturlig svenska. Max 120 ord. Inga engelska rubriker."
            if lang == "sv"
            else "IMPORTANT: Reply only in natural English. Max 120 words."
        )
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            SystemMessage(content=language_lock),
            HumanMessage(content=prompt),
        ]
        response = llm.invoke(messages)
        reply = response.content

    state["messages"] = state["messages"] + [
        AIMessage(content=sanitize_advisor_reply(reply, lang))
    ]
    return state


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _str(val) -> str:
    if isinstance(val, list):
        return " ".join(str(v) for v in val)
    return str(val) if val else ""


def _format_messages(messages: list) -> str:
    lines = []
    for m in messages:
        if isinstance(m, HumanMessage):
            lines.append(f"Customer: {m.content}")
        elif isinstance(m, AIMessage):
            lines.append(f"Advisor: {m.content}")
    return "\n".join(lines)
