-- G-20b — Gosaki production pre-release test text cleanup UPDATE template (DO NOT RUN without explicit approval)
-- Phase: G-20b-execution-gosaki-production-discography-test-text-cleanup (future)
-- Approval ID: G-20b-gosaki-production-discography-test-text-cleanup
--
-- =============================================================================
-- Step 0 — Operator confirmation
-- =============================================================================
-- Project:  static-to-astro-cms-staging
-- Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if:  vsbvndwuajjhnzpohghh / Sariswing production
--
-- Run ONLY after G-20b final preflight PASS and operator explicit approval:
--   承認します。この操作を1回だけ実行してください。
--
-- Expected total rowsAffected: 2 (one UPDATE per row — run separately or in one transaction)
-- Cursor must NOT execute this file.
-- This is a TEMPLATE — not executed in G-20b-preflight phase.
--
-- Doc: tools/static-to-astro/docs/gosaki-production-test-text-cleanup-final-preflight.md
-- Preflight SELECT: gosaki-production-test-text-cleanup-preflight-check.sql

-- =============================================================================
-- Step 1 — Pre-cleanup SELECT (run first; confirm beforeSnapshot)
-- =============================================================================

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id in (
  'fd58cd6e-2fff-4ff2-96af-3087c469450b',
  '04e987a9-e251-4b0b-b860-21a61e711f8e'
)
order by discography_legacy_id asc;

-- =============================================================================
-- Step 2 — Cleanup UPDATE row A (discography-002 track 7)
-- =============================================================================

-- update public.discography_tracks
-- set title = 'Like a Lover'
-- where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b'
--   and discography_legacy_id = 'discography-002'
--   and track_number = 7
--   and title = 'Like a Lover（テスト）';
-- expect rowsAffected: 1

-- =============================================================================
-- Step 3 — Cleanup UPDATE row B (discography-004 track 1)
-- =============================================================================

-- update public.discography_tracks
-- set title = 'Mary Ann'
-- where id = '04e987a9-e251-4b0b-b860-21a61e711f8e'
--   and discography_legacy_id = 'discography-004'
--   and track_number = 1
--   and title = 'Mary Ann（テスト）';
-- expect rowsAffected: 1

-- =============================================================================
-- Step 4 — Post-cleanup afterVerification SELECT
-- =============================================================================

-- select count(*) as test_title_rows
-- from public.discography_tracks
-- where title like '%（テスト）%';
-- expect: 0
--
-- select id, discography_legacy_id, track_number, title
-- from public.discography_tracks
-- where id in (
--   'fd58cd6e-2fff-4ff2-96af-3087c469450b',
--   '04e987a9-e251-4b0b-b860-21a61e711f8e'
-- );
-- expect: Like a Lover / Mary Ann
--
-- select count(*) from public.discography_tracks;
-- expect: 34
