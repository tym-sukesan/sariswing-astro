-- G-22g1e — Gosaki schedules unpublished row visibility readonly check (SELECT ONLY)
-- Phase: G-22g1e-gosaki-schedule-admin-read-unpublished-visibility
-- Run in Supabase SQL Editor on static-to-astro-cms-staging ONLY.
-- Project: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if project is vsbvndwuajjhnzpohghh / Sariswing production.
--
-- Doc: tools/static-to-astro/docs/gosaki-schedule-admin-read-unpublished-visibility.md
-- DO NOT apply GRANT, REVOKE, policy changes, or row mutations from this file.

-- =============================================================================
-- One-shot copy-paste block (WITH … SELECT) — policies, grants, target rows
-- =============================================================================

with
  target_rows as (
    select *
    from public.schedules
    where site_slug = 'gosaki-piano'
      and legacy_id in (
        'schedule-2026-07-008',
        'schedule-2026-03-014',
        'schedule-2026-09-001'
      )
  ),
  published_counts as (
    select
      count(*) filter (where published = true) as published_count,
      count(*) filter (where published = false) as unpublished_count,
      count(*) as total_count
    from public.schedules
    where site_slug = 'gosaki-piano'
  ),
  policy_rows as (
    select
      policyname,
      roles,
      cmd,
      qual,
      with_check
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
    order by policyname
  ),
  grant_rows as (
    select
      grantee,
      string_agg(privilege_type, ', ' order by privilege_type) as privileges
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'schedules'
      and grantee in ('anon', 'authenticated')
    group by grantee
    order by grantee
  )
select 'target_rows' as section, to_jsonb(t.*) as payload
from target_rows t
union all
select 'published_counts', to_jsonb(p.*) from published_counts p
union all
select 'policy_' || p.policyname, to_jsonb(p.*) from policy_rows p
union all
select 'grant_' || g.grantee, to_jsonb(g.*) from grant_rows g;

-- =============================================================================
-- Optional follow-ups (still SELECT only)
-- =============================================================================

-- RLS enabled?
select c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'schedules';

-- is_admin() definition
select p.proname, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin';

-- Simulated anon-visible rows (matches schedules_public_select intent)
select count(*) as anon_visible_count
from public.schedules
where site_slug = 'gosaki-piano'
  and published = true;

-- All unpublished gosaki-piano rows (SQL Editor / superuser view — not anon API)
select id, legacy_id, date, title, published, updated_at
from public.schedules
where site_slug = 'gosaki-piano'
  and published = false
order by date, legacy_id;
