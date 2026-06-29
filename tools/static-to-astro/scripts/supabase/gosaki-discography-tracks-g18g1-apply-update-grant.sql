-- G-18g1-apply — Gosaki discography_tracks authenticated UPDATE grant (OPERATOR MANUAL — staging only)
-- Phase: G-18g1-apply-gosaki-discography-tracks-update-grant
-- Approval ID: G-18g1-discography-tracks-update-grant-apply
--
-- =============================================================================
-- Step 0 — Operator confirmation (read before running anything)
-- =============================================================================
-- Project:  static-to-astro-cms-staging
-- Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if:  vsbvndwuajjhnzpohghh / sari-site / Sariswing production
--
-- Scope:    GRANT UPDATE on public.discography_tracks TO authenticated ONLY
-- Excludes: anon write; INSERT/DELETE/TRUNCATE; discography table; RLS/policy DDL
-- Cursor:    must NOT execute this file
-- Data:      this GRANT does not modify rows; enables future authenticated UPDATE
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g18g1-apply-update-grant-preflight.md

-- =============================================================================
-- Step 1 — Pre-check SELECT (run first; abort if unexpected)
-- =============================================================================

-- 1a. Grants on discography_tracks (expect: anon SELECT; authenticated SELECT; NO authenticated UPDATE)
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- 1b. Confirm discography (parent) already has authenticated UPDATE — do NOT re-grant here
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE';

-- 1c. RLS enabled on discography_tracks
select
  c.relname,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'discography_tracks';

-- 1d. Policies (expect discography_tracks_admin_all for admin UPDATE path)
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'discography_tracks'
order by policyname;

-- 1e. Target row baseline (expect unchanged before GRANT)
select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: discography-002 / 7 / Like a Lover

select count(*) as test_title_rows
from public.discography_tracks
where title = 'Like a Lover（テスト）';
-- expect: 0

-- =============================================================================
-- Step 2 — GRANT apply (run ONCE after Step 1 passes; operator approval required)
-- =============================================================================

grant update on table public.discography_tracks to authenticated;

-- Expected SQL Editor message: Success. No rows returned.

-- =============================================================================
-- Step 3 — Post-check SELECT (run immediately after Step 2)
-- =============================================================================

-- 3a. Grants after apply
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
-- expect: authenticated UPDATE present; anon still SELECT only

-- 3b. anon must NOT have write privileges
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and grantee = 'anon'
  and privilege_type in ('UPDATE', 'INSERT', 'DELETE', 'TRUNCATE');
-- expect: 0 rows

-- 3c. authenticated must NOT gain INSERT/DELETE/TRUNCATE from this apply
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'DELETE', 'TRUNCATE');
-- expect: 0 rows

-- =============================================================================
-- Step 4 — Target row read-only SELECT (grant must not change data)
-- =============================================================================

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where discography_legacy_id = 'discography-002'
order by sort_order;
-- expect: 8 rows; track 7 = Like a Lover

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: Like a Lover (unchanged)

select count(*) as test_title_rows
from public.discography_tracks
where title = 'Like a Lover（テスト）';
-- expect: 0

-- =============================================================================
-- Rollback (doc-only — separate operator approval; NOT part of apply)
-- =============================================================================
-- revoke update on table public.discography_tracks from authenticated;
