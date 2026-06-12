import json
import os
import re
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.documents import Document
from supabase import create_client

from .state import AgentState, UserNeeds
from .prompts import SYSTEM_PROMPT, RECOMMEND_PROMPT
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
# Node: detect language
# ---------------------------------------------------------------------------

def detect_language_node(state: AgentState) -> AgentState:
    """Detect if the user is writing in Swedish or English."""
    last_human = next(
        (m.content for m in reversed(state["messages"]) if isinstance(m, HumanMessage)),
        "",
    )
    swedish_indicators = [
        # Greetings
        "hej", "hejsan", "hallå", "tjena",
        # Pronouns
        "jag", "du", "vi", "ni", "det", "den", "han", "hon", "de",
        # Common verbs
        "är", "vill", "kan", "har", "ska", "söker", "hjälper", "behöver", "letar",
        # Conjunctions / prepositions
        "och", "eller", "för", "med", "men", "som", "till", "på", "av", "om",
        # Question words
        "vad", "var", "hur", "när", "varför", "vilken", "vilket",
        # Useful nouns / phrases
        "hjälp", "tack", "snälla", "gärna", "bra", "olja", "doft",
    ]
    text_lower = last_human.lower()
    words = set(re.sub(r"[^\w\s]", "", text_lower).split())
    is_swedish = sum(1 for w in swedish_indicators if w in words) >= 2
    state["language"] = "sv" if is_swedish else "en"
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


def gather_needs_node(state: AgentState) -> AgentState:
    """
    Ask the user clarifying questions and extract structured needs.
    Sets gathered_enough=True when enough info exists to make a recommendation.
    """
    llm = get_llm()

    # For Ollama, bind JSON mode so the model is forced to output valid JSON.
    invoke_llm = llm.bind(format="json") if USE_OLLAMA else llm

    extraction_prompt = f"""
{SYSTEM_PROMPT}

Your task right now: Continue the conversation to understand the customer's needs.
Extract any details you can from the conversation and decide if you have enough to recommend.

You need at minimum to set gathered_enough to true:
- Their primary goal or concern (e.g. sleep, stress, energy, focus, skin, mood)
- Any safety considerations (pregnancy, children, medical conditions, allergies) — asking once is enough; "no allergies" or silence counts as clear

You do NOT need all fields — use your judgment. If you know their goal and have checked for safety concerns, set gathered_enough to true.

Current known needs: {json.dumps(state.get("user_needs", {}), ensure_ascii=False)}

You MUST respond with ONLY a valid JSON object and nothing else. No markdown, no explanation outside the JSON.
The JSON must have exactly these three fields:
{{
  "reply": "<your conversational reply in {state.get("language", "en")}; if asking a follow-up ask ONE focused question and acknowledge what they shared>",
  "needs": {{"goal": "", "mood": "", "scent_preference": "", "concerns": "", "sensitivity": "", "use_method": ""}},
  "gathered_enough": false
}}

Fill in the needs fields with any information extracted from the conversation. Set gathered_enough to true when you have goal + safety check.

Conversation:
{_format_messages(state["messages"])}
"""

    response = invoke_llm.invoke([HumanMessage(content=extraction_prompt)])

    try:
        parsed = _extract_json(response.content)

        existing_needs = state.get("user_needs", {})
        new_needs = parsed.get("needs", {})
        merged_needs: UserNeeds = {**existing_needs, **{k: v for k, v in new_needs.items() if v}}

        state["user_needs"] = merged_needs
        state["gathered_enough"] = parsed.get("gathered_enough", False)
        reply = parsed.get("reply", "")
        if reply:
            state["messages"] = state["messages"] + [AIMessage(content=reply)]

    except (json.JSONDecodeError, ValueError, KeyError):
        state["gathered_enough"] = False
        state["messages"] = state["messages"] + [AIMessage(content=response.content)]

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
        _str(needs.get("goal")),
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
    """Generate the final recommendation using LLM with RAG context + product data."""
    llm = get_llm()
    lang = state.get("language", "en")

    prompt = RECOMMEND_PROMPT.format(
        user_needs=json.dumps(state.get("user_needs", {}), ensure_ascii=False, indent=2),
        rag_context=state.get("rag_context", "No additional context available."),
        products=json.dumps(state.get("recommended_products", []), ensure_ascii=False, indent=2),
        language="Swedish" if lang == "sv" else "English",
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        *state["messages"][:-1],
        HumanMessage(content=prompt),
    ]

    response = llm.invoke(messages)
    state["messages"] = state["messages"] + [AIMessage(content=response.content)]
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
