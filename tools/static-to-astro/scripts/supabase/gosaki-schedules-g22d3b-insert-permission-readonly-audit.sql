-- G-22d3b-blocker — Gosaki schedules INSERT permission read-only audit (SELECT ONLY)
-- Phase: G-22d3b-blocker-gosaki-schedule-duplicate-insert-permission-denied-audit
-- Run in Supabase SQL Editor on static-to-astro-cms-staging ONLY.
-- Project: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if project is vsbvndwuajjhnzpohghh / Sariswing production.
--
-- Doc: tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-permission-denied-audit.md
-- DO NOT GRANT / REVOKE / CREATE POLICY / INSERT / UPDATE / DELETE

-- =============================================================================
-- A. Failed INSERT no-write verification (G-22d3b operator report)
-- =============================================================================

-- A1. Planned legacy_id must still be absent after failed Save
select count(*) as insert_legacy_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-014';
-- Expected after failed Save: 0

-- A2. Source row unchanged
select id, legacy_id, title, updated_at
from public.schedules
where id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69';
-- Expected: legacy_id schedule-2026-03-003, title <Live & Session>

-- A3. March count still 13 (no +1 from failed INSERT)
select count(*) as march_count
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-03';
-- Expected: 13

-- A4. Copy-title duplicate rows (sanity — should be 0 before successful INSERT)
select id, legacy_id, title, published, sort_order, created_at
from public.schedules
where site_slug = 'gosaki-piano'
  and title = '<Live & Session>（コピー）'
order by created_at desc;
-- Expected: 0 rows (failed Save left no row)

-- =============================================================================
-- B. Session / role context (run while signed in as staging admin in another tab optional)
-- =============================================================================

select current_database() as current_database;
select current_user as sql_editor_role;
-- Note: SQL Editor runs as postgres/superuser — not the browser JWT role.
-- Browser Save uses PostgREST role = authenticated (when Supabase Auth session present).

-- =============================================================================
-- C. RLS enabled on public.schedules?
-- =============================================================================

select
  c.relname,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'schedules';

-- =============================================================================
-- D. Policies on public.schedules
-- =============================================================================

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
order by policyname;

-- Expected (from G-6-e4 / staging RLS audit):
--   schedules_public_select  — SELECT
--   schedules_admin_all      — ALL (or INSERT/UPDATE/DELETE) with is_admin()

-- =============================================================================
-- E. Table grants — compare schedules vs discography (UPDATE-only precedent)
-- =============================================================================

select
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('schedules', 'discography', 'discography_tracks')
  and grantee in ('anon', 'authenticated', 'postgres')
group by table_name, grantee
order by table_name, grantee;

-- Key question for G-22d3b blocker:
--   authenticated on schedules has UPDATE? (yes — G-6-e4)
--   authenticated on schedules has INSERT? (expected NO — root cause candidate)

-- =============================================================================
-- F. Detailed grants — schedules only
-- =============================================================================

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- =============================================================================
-- G. is_admin() dependency (RLS after table grant)
-- =============================================================================

select
  p.proname,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'is_admin';

-- =============================================================================
-- H. admin_users row for operator (replace email if needed)
-- =============================================================================

select au.user_id, au.role, u.email
from public.admin_users au
join auth.users u on u.id = au.user_id
where u.email = 'ysktoyamax@gmail.com';
-- Expected: role = admin (staging operator)

-- =============================================================================
-- I. INSERT vs UPDATE grant gap summary (informational query)
-- =============================================================================

select
  grantee,
  max(case when privilege_type = 'SELECT' then 'yes' else 'no' end) as has_select,
  max(case when privilege_type = 'INSERT' then 'yes' else 'no' end) as has_insert,
  max(case when privilege_type = 'UPDATE' then 'yes' else 'no' end) as has_update,
  max(case when privilege_type = 'DELETE' then 'yes' else 'no' end) as has_delete
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee = 'authenticated'
group by grantee;

-- Expected current state (high confidence):
--   has_select=yes, has_update=yes, has_insert=no → permission denied on INSERT
