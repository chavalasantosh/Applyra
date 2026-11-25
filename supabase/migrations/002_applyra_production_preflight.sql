-- Applyra beta.6 production preflight.
-- Non-destructive authenticated RPC used by the extension to verify that
-- the expected schema exists and every user-owned table has RLS enabled + forced.

create or replace function public.applyra_production_preflight()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  expected_tables text[] := array[
    'applyra_workspace_snapshots',
    'applyra_candidates',
    'applyra_applications',
    'applyra_settings',
    'applyra_audit_events'
  ];
  found_count integer := 0;
  enabled_count integer := 0;
  forced_count integer := 0;
begin
  if uid is null then raise exception 'Authentication required'; end if;

  select count(*),
         count(*) filter (where c.relrowsecurity),
         count(*) filter (where c.relforcerowsecurity)
    into found_count, enabled_count, forced_count
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname='public'
    and c.relname = any(expected_tables)
    and c.relkind='r';

  return jsonb_build_object(
    'ok', found_count = array_length(expected_tables,1)
          and enabled_count = array_length(expected_tables,1)
          and forced_count = array_length(expected_tables,1),
    'schema_revision', 2,
    'table_count', found_count,
    'expected_table_count', array_length(expected_tables,1),
    'rls_enabled', enabled_count = array_length(expected_tables,1),
    'rls_forced', forced_count = array_length(expected_tables,1),
    'user_id', uid
  );
end;
$$;

revoke execute on function public.applyra_production_preflight() from public;
grant execute on function public.applyra_production_preflight() to authenticated;
