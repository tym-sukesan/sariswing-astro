-- G-18g2-preflight — Gosaki discography_tracks track 7 title Save pre-check (SELECT only)
-- Phase: G-18g2-preflight-gosaki-discography-tracklist-single-title-save-final-preflight
-- Approval ID (execution): G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice
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
-- Target:   discography-002 track 7 title PoC only
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-final-preflight.md

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
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: discography-002 / track_number 7 / title Like a Lover

-- =============================================================================
-- Step 2 — Album track count (expect 8 rows for discography-002)
-- =============================================================================

select
  count(*) as discography_002_track_count
from public.discography_tracks
where discography_legacy_id = 'discography-002';
-- expect: 8

select track_number, title
from public.discography_tracks
where discography_legacy_id = 'discography-002'
order by sort_order asc, track_number asc;
-- expect 8 titles ending with The Water Is Wide; track 7 = Like a Lover

-- =============================================================================
-- Step 3 — After title must not exist yet (expect 0 rows)
-- =============================================================================

select count(*) as test_title_rows
from public.discography_tracks
where title = 'Like a Lover（テスト）';
-- expect: 0

-- =============================================================================
-- Step 4 — Table grants (expect authenticated UPDATE present; anon write absent)
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
-- Step 5 — RLS + policies (informational; abort if missing)
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
-- Step 6 — Post-Save verification SELECT (run in G-18g2-execution only — NOT now)
-- =============================================================================
-- After operator Save once, re-run:
--
-- select id, discography_legacy_id, track_number, title
-- from public.discography_tracks
-- where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: title = Like a Lover（テスト）
--
-- select count(*) from public.discography_tracks
-- where discography_legacy_id = 'discography-002';
-- expect: 8
--
-- select count(*) from public.discography_tracks where title = 'Like a Lover';
-- expect: 7 (track 7 no longer Like a Lover)
