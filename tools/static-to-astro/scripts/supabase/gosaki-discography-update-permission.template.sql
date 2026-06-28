-- G-15b-fail — Gosaki discography UPDATE permission template (TEMPLATE ONLY — DO NOT RUN without operator approval)
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta
--
-- Context: G-15b Save on discography-002 failed with:
--   permission denied for table discography
-- DB row unchanged (safe failure). Mirror Schedule G-6-e4 grant path.
--
-- =============================================================================
-- SECTION A — READ-ONLY AUDIT (allowed in investigation phases; run in SQL Editor)
-- =============================================================================

-- A.1 RLS enabled?
select
  c.relname,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('discography', 'discography_tracks', 'schedules')
order by c.relname;

-- A.2 Policies
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
  and tablename in ('discography', 'discography_tracks', 'schedules')
order by tablename, policyname;

-- A.3 Table grants (compare discography vs schedules)
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('discography', 'discography_tracks', 'schedules')
order by table_name, grantee, privilege_type;

-- A.4 is_admin() present?
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'is_admin';

-- A.5 Target row (read-only)
select
  id,
  legacy_id,
  title,
  purchase_url,
  published,
  updated_at
from public.discography
where legacy_id = 'discography-002';

-- =============================================================================
-- SECTION B — EXPECTED GAP (G-15b-fail inference — confirm with Section A)
-- =============================================================================
-- schedules (working Save path):
--   - GRANT SELECT to anon, authenticated (observed)
--   - GRANT UPDATE to authenticated (applied manually in G-6-e4)
--   - RLS schedules_admin_all FOR ALL TO authenticated USING (is_admin())
--
-- discography (G-15b failure):
--   - GRANT SELECT likely present (admin read + public policies work)
--   - GRANT UPDATE on authenticated likely ABSENT (same error as pre-G-6-e4 schedules)
--   - discography_admin_all policy may be absent OR present but insufficient without UPDATE grant
--
-- PostgREST error "permission denied for table discography" typically indicates
-- missing table-level privilege before RLS policy evaluation (Schedule G-6-e4 precedent).

-- =============================================================================
-- SECTION C — PROPOSED FIX (DO NOT RUN in G-15b-fail — separate approval phase)
-- =============================================================================
-- Minimum (mirror G-6-e4 schedules):
--
-- grant update on table public.discography to authenticated;
--
-- Verify after grant (read-only):
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'discography'
--   and grantee = 'authenticated'
-- order by privilege_type;
--
-- If discography_admin_all policy is missing, apply Kit draft policy (review qual/with_check):
--
-- drop policy if exists "discography_admin_all" on public.discography;
-- create policy "discography_admin_all"
--   on public.discography
--   for all
--   to authenticated
--   using (public.is_admin())
--   with check (public.is_admin());
--
-- Explicit exclusions (do NOT grant):
--   - anon UPDATE
--   - authenticated INSERT / DELETE / TRUNCATE on discography
--   - discography_tracks (not in G-15b purchase_url slice)
--
-- After permission fix: re-run G-15b Save once (new approval ID for retry phase).
