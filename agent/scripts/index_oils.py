"""
index_oils.py — Run once (and again whenever you add new oils) to populate
the Supabase pgvector table with embedded knowledge from:
  1. Our curated essential oils CSV (mapped to our actual products)
  2. NAHA (National Association for Holistic Aromatherapy) public pages
  3. AromaWeb oil profile pages

Usage:
    cd agent/
    python scripts/index_oils.py

Embedding provider is selected by .env flags (same as the agent):
  USE_OLLAMA=true  → local Ollama (nomic-embed-text, 768-dim). Ollama must be running.
  USE_GROK=true    → HuggingFace Inference API (all-mpnet-base-v2, 768-dim). Needs HF_API_KEY.
  (default)        → OpenAI text-embedding-3-large. Needs OPENAI_API_KEY.

Requirements:
    - .env file with SUPABASE_URL, SUPABASE_SERVICE_KEY
    - Supabase migration 017_vector_store.sql already applied
"""

import os
import time
import random
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from langchain_community.document_loaders import CSVLoader, WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from supabase import create_client

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL        = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
USE_OLLAMA          = os.environ.get("USE_OLLAMA", "false").lower() == "true"
USE_GROK            = os.environ.get("USE_GROK",   "false").lower() == "true"
OLLAMA_BASE_URL     = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL  = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
HF_API_KEY          = os.environ.get("HF_API_KEY", "")
HF_EMBED_MODEL      = os.environ.get("HF_EMBED_MODEL", "sentence-transformers/all-mpnet-base-v2")

CSV_PATH = Path(__file__).parent.parent / "data" / "curated_oils.csv"

NAHA_URLS = [
    "https://naha.org/explore-aromatherapy/about-aromatherapy/what-are-essential-oils/",
    "https://naha.org/explore-aromatherapy/about-aromatherapy/how-do-i-use-essential-oils/",
    "https://naha.org/explore-aromatherapy/safety/",
    "https://naha.org/explore-aromatherapy/about-aromatherapy/what-is-aromatherapy/",
]

AROMAWEB_URLS = [
    "https://www.aromaweb.com/essential-oils/lavender-oil.php",
    "https://www.aromaweb.com/essential-oils/eucalyptus-oil.php",
    "https://www.aromaweb.com/essential-oils/peppermint-oil.php",
    "https://www.aromaweb.com/essential-oils/lemon-oil.php",
    "https://www.aromaweb.com/essential-oils/tea-tree-oil.php",
    "https://www.aromaweb.com/essential-oils/rosemary-oil.php",
    "https://www.aromaweb.com/carrier-oils/jojoba-oil.php",
    "https://www.aromaweb.com/carrier-oils/coconut-oil.php",
    "https://www.aromaweb.com/carrier-oils/sweet-almond-oil.php",
]

CHUNK_SIZE    = 600
CHUNK_OVERLAP = 80

# ---------------------------------------------------------------------------
# Embeddings factory
# ---------------------------------------------------------------------------

def get_embeddings():
    if USE_OLLAMA:
        from langchain_ollama import OllamaEmbeddings
        print(f"   Using Ollama embeddings: {OLLAMA_EMBED_MODEL} @ {OLLAMA_BASE_URL}")
        print("   (make sure Ollama is running: ollama serve)")
        return OllamaEmbeddings(model=OLLAMA_EMBED_MODEL, base_url=OLLAMA_BASE_URL)
    elif USE_GROK:
        if not HF_API_KEY:
            raise EnvironmentError("USE_GROK=true but HF_API_KEY is not set.")
        from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
        print(f"   Using HuggingFace embeddings: {HF_EMBED_MODEL}")
        return HuggingFaceInferenceAPIEmbeddings(
            api_key=HF_API_KEY,
            model_name=HF_EMBED_MODEL,
        )
    else:
        from langchain_openai import OpenAIEmbeddings
        print("   Using OpenAI embeddings: text-embedding-3-large")
        return OpenAIEmbeddings(
            model="text-embedding-3-large",
            api_key=os.environ["OPENAI_API_KEY"],
        )

# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def load_csv_documents() -> list[Document]:
    print("Loading curated CSV...")
    loader = CSVLoader(
        file_path=str(CSV_PATH),
        metadata_columns=["name", "sku", "scent_family", "category", "price_sek"],
    )
    docs = loader.load()
    for doc in docs:
        doc.metadata["source"] = "FortuneEssence curated catalog"
        doc.metadata["type"]   = "product_knowledge"
    print(f"   {len(docs)} product rows loaded")
    return docs


def load_web_documents(urls: list[str], source_label: str, delay: float = 1.5) -> list[Document]:
    docs = []
    for url in urls:
        try:
            loaded = WebBaseLoader([url]).load()
            for doc in loaded:
                doc.metadata["source"] = source_label
                doc.metadata["url"]    = url
                doc.metadata["type"]   = "web_knowledge"
            docs.extend(loaded)
            print(f"   OK: {url}")
        except Exception as e:
            print(f"   FAILED ({url}): {e}")
        time.sleep(delay)
    return docs


def chunk_documents(docs: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    return [c for c in chunks if len(c.page_content.strip()) > 80]


def _is_retriable(e: Exception) -> bool:
    """True for HuggingFace cold-start (503) and rate-limit (429) errors."""
    # huggingface_hub raises HfHubHTTPError with a numeric status_code attribute
    status = getattr(e, "response", None)
    if status is not None:
        code = getattr(status, "status_code", 0)
        if code in (429, 503):
            return True
    msg = str(e).lower()
    return any(k in msg for k in ("loading", "503", "429", "rate limit", "too many"))


def embed_with_retry(embeddings, texts: list[str], max_retries: int = 5) -> list:
    """Embed texts with exponential backoff — handles HuggingFace cold starts and rate limits."""
    for attempt in range(max_retries):
        try:
            return embeddings.embed_documents(texts)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            if _is_retriable(e):
                wait = 2 ** attempt + random.uniform(0, 1)
                print(f"   HuggingFace not ready (attempt {attempt + 1}), retrying in {wait:.1f}s...")
                time.sleep(wait)
            else:
                raise


def clear_existing_documents(sb):
    print("Clearing existing oil_knowledge rows...")
    sb.table("oil_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("   Cleared")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    provider = "Ollama" if USE_OLLAMA else ("HuggingFace" if USE_GROK else "OpenAI")
    print(f"\nFortuneEssence Oil Knowledge Indexer  [{provider} embeddings]")
    print("=" * 55)

    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    embeddings = get_embeddings()

    csv_docs = load_csv_documents()

    print("\nLoading NAHA pages...")
    naha_docs = load_web_documents(NAHA_URLS, "NAHA - National Association for Holistic Aromatherapy")

    print("\nLoading AromaWeb oil profiles...")
    aromaweb_docs = load_web_documents(AROMAWEB_URLS, "AromaWeb")

    all_docs = csv_docs + naha_docs + aromaweb_docs
    print(f"\nTotal documents: {len(all_docs)}")

    print("\nChunking...")
    chunks = chunk_documents(all_docs)
    print(f"   {len(chunks)} chunks after filtering")

    clear_existing_documents(sb)

    print(f"\nEmbedding and storing {len(chunks)} chunks...")
    if USE_OLLAMA:
        print("   (Ollama embeds locally - no API cost, but slower)\n")
    elif USE_GROK:
        print("   (HuggingFace Inference API - free tier, batches of 32)\n")
    else:
        print("   (OpenAI API - batched in groups of 100)\n")

    # Embed and insert in batches directly — avoids langchain-community/supabase version conflicts
    batch_size = 50 if USE_OLLAMA else (32 if USE_GROK else 100)
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c.page_content for c in batch]
        vectors = embed_with_retry(embeddings, texts) if USE_GROK else embeddings.embed_documents(texts)
        rows = [
            {
                "content":   doc.page_content,
                "metadata":  doc.metadata,
                "embedding": vec,
            }
            for doc, vec in zip(batch, vectors)
        ]
        sb.table("oil_knowledge").insert(rows).execute()
        print(f"   Stored batch {i // batch_size + 1}/{(len(chunks) - 1) // batch_size + 1}")
        if USE_GROK:
            time.sleep(1.5)  # stay under HuggingFace free-tier rate limit

    print(f"\nDone! {len(chunks)} chunks stored in oil_knowledge.")
    print("   The agent is ready.\n")


if __name__ == "__main__":
    main()
