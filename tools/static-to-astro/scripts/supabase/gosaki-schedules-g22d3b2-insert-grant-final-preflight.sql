-- G-22d3b2 — Gosaki schedules INSERT grant final preflight (SELECT only — pre/post templates)
-- Phase: G-22d3b2-gosaki-schedules-insert-grant-final-preflight
-- Project: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta.supabase.co) ONLY
-- STOP if vsbvndwuajjhnzpohghh / Sariswing production
--
-- Doc: tools/static-to-astro/docs/gosaki-schedules-insert-grant-final-preflight.md
-- GRANT statement is in doc §5 — run only in G-22d3b3 operator execution phase

-- =============================================================================
-- PRE-GRANT baseline (run before G-22d3b3 GRANT — expect INSERT=no)
-- =============================================================================

select current_database() as current_database;

-- RLS enabled
select c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'schedules';
-- Expected: true

-- Policies unchanged baseline
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'schedules'
order by policyname;
-- Expected: schedules_public_select, schedules_admin_all (ALL, is_admin())

-- Grant gap summary
select
  grantee,
  max(case when privilege_type = 'SELECT' then 'yes' else 'no' end) as has_select,
  max(case when privilege_type = 'INSERT' then 'yes' else 'no' end) as has_insert,
  max(case when privilege_type = 'UPDATE' then 'yes' else 'no' end) as has_update,
  max(case when privilege_type = 'DELETE' then 'yes' else 'no' end) as has_delete
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
group by grantee
order by grantee;
-- Expected pre-GRANT:
--   anon:     has_select=yes, has_insert=no, has_update=no, has_delete=no
--   authenticated: has_select=yes, has_insert=no, has_update=yes, has_delete=no

-- No-write state (duplicate INSERT not yet succeeded)
select count(*) as insert_legacy_count
from public.schedules
where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-03-014';
-- Expected: 0

select count(*) as march_count
from public.schedules
where site_slug = 'gosaki-piano' and month = '2026-03';
-- Expected: 13

select count(*) as copy_title_count
from public.schedules
where site_slug = 'gosaki-piano' and title = '<Live & Session>（コピー）';
-- Expected: 0

-- Admin user
select au.user_id, au.role, u.email
from public.admin_users au
join auth.users u on u.id = au.user_id
where u.email = 'ysktoyamax@gmail.com';
-- Expected: role = admin

-- =============================================================================
-- POST-GRANT afterVerification (run after G-22d3b3 GRANT only — NOT in G-22d3b2)
-- =============================================================================

-- Grant state after GRANT INSERT
select
  grantee,
  max(case when privilege_type = 'SELECT' then 'yes' else 'no' end) as has_select,
  max(case when privilege_type = 'INSERT' then 'yes' else 'no' end) as has_insert,
  max(case when privilege_type = 'UPDATE' then 'yes' else 'no' end) as has_update,
  max(case when privilege_type = 'DELETE' then 'yes' else 'no' end) as has_delete
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
group by grantee
order by grantee;
-- Expected post-GRANT:
--   authenticated: has_insert=yes, has_update=yes, has_delete=no
--   anon: has_insert=no

-- RLS still enabled
select c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'schedules';
-- Expected: true

-- schedules_admin_all unchanged
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
  and policyname = 'schedules_admin_all';
-- Expected: authenticated, ALL, is_admin(), is_admin()

-- Row state still no INSERT from failed Save
select count(*) as insert_legacy_count
from public.schedules
where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-03-014';
-- Expected: 0 (GRANT alone does not insert rows)

select count(*) as march_count
from public.schedules
where site_slug = 'gosaki-piano' and month = '2026-03';
-- Expected: 13

-- =============================================================================
-- ROLLBACK template (G-22d3b3+ operator decision only — NOT in G-22d3b2)
-- =============================================================================
-- revoke insert on table public.schedules from authenticated;
