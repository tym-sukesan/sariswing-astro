-- G-19b1-preflight — Gosaki discography_tracks track 1 title Save pre-check (SELECT only)
-- Phase: G-19b1-preflight-gosaki-discography-tracklist-generic-single-title-save-final-preflight
-- Approval ID (execution): G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice
--
-- =============================================================================
-- Step 0 — Operator confirmation (read before running anything)
-- =============================================================================
-- Project:  static-to-astro-cms-staging
-- Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if:  vsbvndwuajjhnzpohghh / sari-site / Sariswing production
--
-- Scope:    read-only preflight SELECT — no UPDATE / INSERT / DELETE / GRANT / REVOKE
-- Cursor:   must NOT execute writes from this file
-- Target:   discography-004 track 1 title PoC only
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md

-- =============================================================================
-- Step 1 — Target row exists (expect id / legacy_id / track_number / title)
-- =============================================================================

select
  id,
  discography_legacy_id,
  track_number,
  title,
  sort_order
from public.discography_tracks
where id = '04e987a9-e251-4b0b-b860-21a61e711f8e';
-- expect: discography-004 / track_number 1 / title Mary Ann

-- =============================================================================
-- Step 2 — Album track count (expect 8 rows for discography-004)
-- =============================================================================

select
  count(*) as discography_004_track_count
from public.discography_tracks
where discography_legacy_id = 'discography-004';
-- expect: 8

select track_number, title
from public.discography_tracks
where discography_legacy_id = 'discography-004'
order by sort_order asc, track_number asc;
-- expect 8 titles; track 1 = Mary Ann; track 8 = Bourbon Street Parade

-- =============================================================================
-- Step 3 — After title must not exist yet (expect 0 rows)
-- =============================================================================

select count(*) as test_title_rows
from public.discography_tracks
where title = 'Mary Ann（テスト）';
-- expect: 0

-- =============================================================================
-- Step 4 — G-18g2 closed chain spot-check (discography-002 track 7 unchanged)
-- =============================================================================

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: discography-002 / track_number 7 / title Like a Lover（テスト）

-- =============================================================================
-- Step 5 — Table grants (expect authenticated UPDATE present; anon write absent)
-- =============================================================================

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
-- expect includes: authenticated UPDATE (G-18g1-apply-result)

select count(*) as anon_write_grants
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and grantee = 'anon'
  and privilege_type in ('UPDATE', 'INSERT', 'DELETE', 'TRUNCATE');
-- expect: 0

select count(*) as authenticated_broad_write_grants
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'DELETE', 'TRUNCATE');
-- expect: 0

-- =============================================================================
-- Step 6 — RLS + policies (informational; abort if missing)
-- =============================================================================

select
  c.relname,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'discography_tracks';
-- expect: rls_enabled = true

select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'discography_tracks'
order by policyname;
-- expect: discography_tracks_admin_all, discography_tracks_public_select

-- =============================================================================
-- Step 7 — Post-Save verification SELECT (run in G-19b1-execution only — NOT now)
-- =============================================================================
-- After operator Save once, re-run:
--
-- select id, discography_legacy_id, track_number, title
-- from public.discography_tracks
-- where id = '04e987a9-e251-4b0b-b860-21a61e711f8e';
-- expect: title = Mary Ann（テスト）
--
-- select count(*) from public.discography_tracks
-- where discography_legacy_id = 'discography-004';
-- expect: 8
--
-- select count(*) from public.discography_tracks where title = 'Mary Ann';
-- expect: 0 (track 1 no longer Mary Ann)
--
-- select title from public.discography_tracks
-- where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: Like a Lover（テスト） (G-18g2 chain unchanged)
