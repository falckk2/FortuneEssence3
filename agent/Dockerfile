FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model so cold starts don't fetch it at runtime
RUN python -c "from fastembed import TextEmbedding; list(TextEmbedding('BAAI/bge-base-en-v1.5').embed(['warmup']))"

COPY . .

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
