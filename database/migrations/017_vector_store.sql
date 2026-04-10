-- Migration 017: Essential oil knowledge vector store for RAG agent
-- Dimensions: 768 for Ollama nomic-embed-text (dev default)
--             Switch to 3072 if using OpenAI text-embedding-3-large in prod

create extension if not exists vector;

-- Drop and recreate if dimensions need to change
drop table if exists oil_knowledge cascade;

create table oil_knowledge (
  id        bigserial primary key,
  content   text        not null,
  metadata  jsonb       default '{}',
  embedding vector(768)   -- nomic-embed-text (Ollama). Change to vector(3072) for OpenAI.
);

-- IVFFlat index for cosine similarity search
create index oil_knowledge_embedding_idx
  on oil_knowledge
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- RPC function required by langchain SupabaseVectorStore
create or replace function match_oil_knowledge(
  query_embedding  vector(768),
  match_count      int     default 6,
  filter           jsonb   default '{}'
)
returns table (
  id         bigint,
  content    text,
  metadata   jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    ok.id,
    ok.content,
    ok.metadata,
    1 - (ok.embedding <=> query_embedding) as similarity
  from oil_knowledge ok
  where ok.metadata @> filter
  order by ok.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RLS
alter table oil_knowledge enable row level security;

create policy "Service role full access"
  on oil_knowledge for all
  to service_role
  using (true) with check (true);

create policy "Anon read"
  on oil_knowledge for select
  to anon
  using (true);
