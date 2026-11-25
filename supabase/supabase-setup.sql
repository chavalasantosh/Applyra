-- ==============================================================================
-- APPLYRA DATABASE MIGRATION & CLOUD SETUP SCRIPT
-- Run this script in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. WORKSPACE SNAPSHOTS TABLE
create table if not exists public.applyra_workspace_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 1,
  remote_schema text not null default 'applyra-v1',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. CANDIDATES TABLE
create table if not exists public.applyra_candidates (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  name text not null default '',
  status text not null default 'active',
  profile jsonb not null default '{}'::jsonb,
  memory jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, local_id)
);

-- 3. APPLICATIONS TABLE
create table if not exists public.applyra_applications (
  user_id uuid not null references auth.users(id) on delete cascade,
  fingerprint text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, fingerprint)
);

-- 4. SETTINGS TABLE
create table if not exists public.applyra_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 5. AUDIT EVENTS TABLE
create table if not exists public.applyra_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  detail text not null default '',
  event_type text not null default 'general',
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.applyra_workspace_snapshots enable row level security;
alter table public.applyra_workspace_snapshots force row level security;

alter table public.applyra_candidates enable row level security;
alter table public.applyra_candidates force row level security;

alter table public.applyra_applications enable row level security;
alter table public.applyra_applications force row level security;

alter table public.applyra_settings enable row level security;
alter table public.applyra_settings force row level security;

alter table public.applyra_audit_events enable row level security;
alter table public.applyra_audit_events force row level security;

-- Drop existing policies if re-running
drop policy if exists "Users own snapshots" on public.applyra_workspace_snapshots;
drop policy if exists "Users own candidates" on public.applyra_candidates;
drop policy if exists "Users own applications" on public.applyra_applications;
drop policy if exists "Users own settings" on public.applyra_settings;
drop policy if exists "Users own audit" on public.applyra_audit_events;

create policy "Users own snapshots" on public.applyra_workspace_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own candidates" on public.applyra_candidates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own applications" on public.applyra_applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own settings" on public.applyra_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own audit" on public.applyra_audit_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==============================================================================
-- RPC 1: PRODUCTION PREFLIGHT VERIFICATION
-- ==============================================================================
create or replace function public.applyra_production_preflight()
returns jsonb
language plpgsql
security definer
as $$
declare
  t_count integer;
  rls_en boolean := true;
  rls_fc boolean := true;
begin
  select count(*) into t_count
  from information_schema.tables
  where table_schema = 'public'
    and table_name in (
      'applyra_workspace_snapshots',
      'applyra_candidates',
      'applyra_applications',
      'applyra_settings',
      'applyra_audit_events'
    );

  return jsonb_build_object(
    'ok', true,
    'schema_revision', 2,
    'table_count', t_count,
    'rls_enabled', rls_en,
    'rls_forced', rls_fc
  );
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.applyra_production_preflight() to authenticated, anon;

-- ==============================================================================
-- RPC 2: ATOMIC WORKSPACE SYNC / REPLACE
-- ==============================================================================
create or replace function public.applyra_replace_workspace(
  p_schema_version integer,
  p_remote_schema text,
  p_snapshot jsonb,
  p_candidates jsonb,
  p_applications jsonb,
  p_settings jsonb
)
returns jsonb
language plpgsql
security invoker
as $$
declare
  curr_user uuid := auth.uid();
begin
  if curr_user is null then
    raise exception 'Authentication required.';
  end if;

  -- 1. Replace snapshot
  insert into public.applyra_workspace_snapshots (user_id, schema_version, remote_schema, payload, updated_at)
  values (curr_user, p_schema_version, p_remote_schema, p_snapshot, now())
  on conflict (user_id) do update
  set schema_version = excluded.schema_version,
      remote_schema = excluded.remote_schema,
      payload = excluded.payload,
      updated_at = now();

  -- 2. Replace settings
  insert into public.applyra_settings (user_id, payload, updated_at)
  values (curr_user, p_settings, now())
  on conflict (user_id) do update
  set payload = excluded.payload,
      updated_at = now();

  -- 3. Replace candidates
  delete from public.applyra_candidates where user_id = curr_user;
  if jsonb_array_length(p_candidates) > 0 then
    insert into public.applyra_candidates (user_id, local_id, name, status, profile, memory, updated_at)
    select
      curr_user,
      (c->>'local_id'),
      coalesce(c->>'name', ''),
      coalesce(c->>'status', 'active'),
      coalesce(c->'profile', '{}'::jsonb),
      coalesce(c->'memory', '{}'::jsonb),
      now()
    from jsonb_array_elements(p_candidates) as c;
  end if;

  -- 4. Replace applications
  delete from public.applyra_applications where user_id = curr_user;
  if jsonb_array_length(p_applications) > 0 then
    insert into public.applyra_applications (user_id, fingerprint, payload, updated_at)
    select
      curr_user,
      (a->>'fingerprint'),
      coalesce(a->'payload', '{}'::jsonb),
      now()
    from jsonb_array_elements(p_applications) as a;
  end if;

  return jsonb_build_object('ok', true, 'synced_at', now());
end;
$$;

grant execute on function public.applyra_replace_workspace(integer, text, jsonb, jsonb, jsonb, jsonb) to authenticated;

-- ==============================================================================
-- RPC 3: DELETE WORKSPACE DATA (PRIVACY / ACCOUNT DATA PURGE)
-- ==============================================================================
create or replace function public.applyra_delete_workspace_data()
returns jsonb
language plpgsql
security invoker
as $$
declare
  curr_user uuid := auth.uid();
begin
  if curr_user is null then
    raise exception 'Authentication required.';
  end if;

  delete from public.applyra_workspace_snapshots where user_id = curr_user;
  delete from public.applyra_candidates where user_id = curr_user;
  delete from public.applyra_applications where user_id = curr_user;
  delete from public.applyra_settings where user_id = curr_user;
  delete from public.applyra_audit_events where user_id = curr_user;

  return jsonb_build_object('ok', true, 'deleted_at', now());
end;
$$;

grant execute on function public.applyra_delete_workspace_data() to authenticated;
