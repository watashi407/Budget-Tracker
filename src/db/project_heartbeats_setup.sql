-- Lightweight project heartbeat storage for uptime/health monitoring.
-- This does not override Supabase plan pause policies.

create table if not exists public.project_heartbeats (
    id text primary key default 'primary',
    last_seen_at timestamptz not null default now(),
    source text not null default 'edge-function',
    metadata jsonb not null default '{}'::jsonb
);

alter table public.project_heartbeats enable row level security;

drop policy if exists "Authenticated users can read project heartbeat" on public.project_heartbeats;
create policy "Authenticated users can read project heartbeat"
on public.project_heartbeats
for select
to authenticated
using (true);

drop policy if exists "Users cannot write project heartbeat directly" on public.project_heartbeats;
create policy "Users cannot write project heartbeat directly"
on public.project_heartbeats
for all
to authenticated
using (false)
with check (false);
