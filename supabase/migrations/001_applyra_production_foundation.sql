-- Applyra production foundation schema.
-- Deploy this to the SAME Supabase project configured in the extension.
-- RLS is intentionally enabled on every user-owned table.

create table if not exists public.applyra_workspace_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 0,
  remote_schema text not null default 'applyra-v1',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

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

create table if not exists public.applyra_applications (
  user_id uuid not null references auth.users(id) on delete cascade,
  fingerprint text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, fingerprint)
);

create table if not exists public.applyra_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.applyra_audit_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  event_type text not null default 'data-control',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.applyra_workspace_snapshots enable row level security;
alter table public.applyra_candidates enable row level security;
alter table public.applyra_applications enable row level security;
alter table public.applyra_settings enable row level security;
alter table public.applyra_audit_events enable row level security;

-- Force RLS even for table owners in normal application paths.
alter table public.applyra_workspace_snapshots force row level security;
alter table public.applyra_candidates force row level security;
alter table public.applyra_applications force row level security;
alter table public.applyra_settings force row level security;
alter table public.applyra_audit_events force row level security;

do $$
declare t text;
begin
  foreach t in array array['applyra_workspace_snapshots','applyra_candidates','applyra_applications','applyra_settings','applyra_audit_events'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for select using (auth.uid() = user_id)', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id)', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete using (auth.uid() = user_id)', t || '_delete_own', t);
  end loop;
end $$;

revoke all on public.applyra_workspace_snapshots from anon;
revoke all on public.applyra_candidates from anon;
revoke all on public.applyra_applications from anon;
revoke all on public.applyra_settings from anon;
revoke all on public.applyra_audit_events from anon;

grant select, insert, update, delete on public.applyra_workspace_snapshots to authenticated;
grant select, insert, update, delete on public.applyra_candidates to authenticated;
grant select, insert, update, delete on public.applyra_applications to authenticated;
grant select, insert, update, delete on public.applyra_settings to authenticated;
grant select, insert, update, delete on public.applyra_audit_events to authenticated;

-- Atomic workspace replacement: exact copy or rollback as one transaction.
create or replace function public.applyra_replace_workspace(
  p_schema_version integer,
  p_remote_schema text,
  p_snapshot jsonb,
  p_candidates jsonb,
  p_applications jsonb,
  p_settings jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  candidate_count integer := 0;
  application_count integer := 0;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(coalesce(p_candidates,'[]'::jsonb)) <> 'array' then raise exception 'Candidates must be an array'; end if;
  if jsonb_typeof(coalesce(p_applications,'[]'::jsonb)) <> 'array' then raise exception 'Applications must be an array'; end if;

  delete from public.applyra_candidates where user_id = uid;
  delete from public.applyra_applications where user_id = uid;

  insert into public.applyra_workspace_snapshots(user_id,schema_version,remote_schema,payload,updated_at)
  values(uid,coalesce(p_schema_version,0),coalesce(nullif(p_remote_schema,''),'applyra-v1'),coalesce(p_snapshot,'{}'::jsonb),now())
  on conflict(user_id) do update set schema_version=excluded.schema_version, remote_schema=excluded.remote_schema, payload=excluded.payload, updated_at=now();

  insert into public.applyra_settings(user_id,payload,updated_at)
  values(uid,coalesce(p_settings,'{}'::jsonb),now())
  on conflict(user_id) do update set payload=excluded.payload, updated_at=now();

  for item in select value from jsonb_array_elements(coalesce(p_candidates,'[]'::jsonb)) loop
    if coalesce(item->>'local_id','') <> '' then
      insert into public.applyra_candidates(user_id,local_id,name,status,profile,memory,updated_at)
      values(uid,item->>'local_id',coalesce(item->>'name',''),coalesce(nullif(item->>'status',''),'active'),coalesce(item->'profile','{}'::jsonb),coalesce(item->'memory','{}'::jsonb),now());
      candidate_count := candidate_count + 1;
    end if;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(p_applications,'[]'::jsonb)) loop
    if coalesce(item->>'fingerprint','') <> '' then
      insert into public.applyra_applications(user_id,fingerprint,payload,updated_at)
      values(uid,item->>'fingerprint',coalesce(item->'payload','{}'::jsonb),now());
      application_count := application_count + 1;
    end if;
  end loop;

  return jsonb_build_object('ok',true,'candidates',candidate_count,'applications',application_count,'remote_schema',coalesce(nullif(p_remote_schema,''),'applyra-v1'));
end;
$$;

create or replace function public.applyra_delete_workspace_data()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required'; end if;
  delete from public.applyra_audit_events where user_id = uid;
  delete from public.applyra_applications where user_id = uid;
  delete from public.applyra_candidates where user_id = uid;
  delete from public.applyra_settings where user_id = uid;
  delete from public.applyra_workspace_snapshots where user_id = uid;
  return jsonb_build_object('ok',true);
end;
$$;

grant execute on function public.applyra_replace_workspace(integer,text,jsonb,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.applyra_delete_workspace_data() to authenticated;

-- Tighten default function privileges: authenticated users only.
revoke execute on function public.applyra_replace_workspace(integer,text,jsonb,jsonb,jsonb,jsonb) from public;
revoke execute on function public.applyra_delete_workspace_data() from public;
grant execute on function public.applyra_replace_workspace(integer,text,jsonb,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.applyra_delete_workspace_data() to authenticated;

revoke all on public.applyra_workspace_snapshots from public;
revoke all on public.applyra_candidates from public;
revoke all on public.applyra_applications from public;
revoke all on public.applyra_settings from public;
revoke all on public.applyra_audit_events from public;
-- Re-grant the authenticated role after PUBLIC revocation.
grant select, insert, update, delete on public.applyra_workspace_snapshots to authenticated;
grant select, insert, update, delete on public.applyra_candidates to authenticated;
grant select, insert, update, delete on public.applyra_applications to authenticated;
grant select, insert, update, delete on public.applyra_settings to authenticated;
grant select, insert, update, delete on public.applyra_audit_events to authenticated;
