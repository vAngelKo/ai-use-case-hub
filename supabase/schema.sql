-- Run in Supabase SQL Editor (once per project).
-- Server uses SUPABASE_SERVICE_ROLE_KEY only — no RLS required for this MVP.

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
  suggested_follow_up_questions jsonb not null default '[]'::jsonb
);

create index if not exists ideas_created_at_idx on public.ideas (created_at desc);
create index if not exists ideas_status_idx on public.ideas (status);
create index if not exists ideas_marketing_function_idx on public.ideas (marketing_function);
