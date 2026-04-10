"""
index_oils.py — Run once (and again whenever you add new oils) to populate
the Supabase pgvector table with embedded knowledge from:
  1. Our curated essential oils CSV (mapped to our actual products)
  2. NAHA (National Association for Holistic Aromatherapy) public pages
  3. AromaWeb oil profile pages

Usage:
    cd agent/
    python scripts/index_oils.py

Set USE_OLLAMA=true in .env to use local Ollama embeddings (no OpenAI key needed).
Ollama must be running with nomic-embed-text pulled:
    ollama pull nomic-embed-text

Requirements:
    - .env file with SUPABASE_URL, SUPABASE_SERVICE_KEY
    - For OpenAI embeddings: OPENAI_API_KEY
    - For Ollama embeddings: USE_OLLAMA=true (and Ollama running locally)
    - Supabase migration 017_vector_store.sql already applied
"""

import os
import time
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
OLLAMA_BASE_URL     = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL  = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")

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


def clear_existing_documents(sb):
    print("Clearing existing oil_knowledge rows...")
    sb.table("oil_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("   Cleared")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    provider = "Ollama" if USE_OLLAMA else "OpenAI"
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
        print("   (Ollama embeds locally - no API cost, but slower than OpenAI)\n")
    else:
        print("   (OpenAI API - batched in groups of 100)\n")

    # Embed and insert in batches directly — avoids langchain-community/supabase version conflicts
    batch_size = 50 if USE_OLLAMA else 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c.page_content for c in batch]
        vectors = embeddings.embed_documents(texts)
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

    print(f"\nDone! {len(chunks)} chunks stored in oil_knowledge.")
    print("   The agent is ready.\n")


if __name__ == "__main__":
    main()
