-- Encrypted BYOK storage for AI provider tokens.
-- Deploy this in Supabase SQL editor before deploying supabase/functions/ai.

create table if not exists public.ai_api_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null check (provider in ('gemini', 'nvidia')),
    encrypted_api_key text,
    encryption_iv text,
    masked_api_key text,
    text_model text not null,
    vision_model text not null,
    is_active boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, provider)
);

alter table public.ai_api_tokens enable row level security;

drop policy if exists "Users can read own AI token metadata" on public.ai_api_tokens;
create policy "Users can read own AI token metadata"
on public.ai_api_tokens
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users cannot write AI tokens directly" on public.ai_api_tokens;
create policy "Users cannot write AI tokens directly"
on public.ai_api_tokens
for all
to authenticated
using (false)
with check (false);
