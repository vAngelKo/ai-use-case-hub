-- Run in Supabase SQL Editor (once per project).
-- Server uses SUPABASE_SERVICE_ROLE_KEY only — no RLS required for this MVP.

-- Enable pgvector for duplicate detection
create extension if not exists vector;

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitter_email text not null,
  submitter_name text,
  marketing_function text,
  subfunction text,
  status text,
  business_owner text,
  additional_stakeholders text,
  use_case text,
  ai_tool text,
  description text,
  supporting_documentation text,
  escalation_tier text,
  roi text,
  roi_details text,
  hours_saved text,
  missing_info jsonb not null default '[]'::jsonb,
  suggested_follow_up_questions jsonb not null default '[]'::jsonb,
  embedding vector(1536)
);

create index if not exists ideas_created_at_idx on public.ideas (created_at desc);
create index if not exists ideas_status_idx on public.ideas (status);
create index if not exists ideas_marketing_function_idx on public.ideas (marketing_function);
create index if not exists ideas_embedding_idx on public.ideas using ivfflat (embedding vector_cosine_ops) with (lists = 10);

-- If the table already exists, add the embedding column (safe to run multiple times)
alter table public.ideas add column if not exists embedding vector(1536);

-- RPC function used by duplicate detection
create or replace function match_ideas(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  use_case text,
  similarity float
)
language sql stable
as $$
  select
    id,
    use_case,
    1 - (embedding <=> query_embedding) as similarity
  from public.ideas
  where embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
