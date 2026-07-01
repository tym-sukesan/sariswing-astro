-- G-20b — Gosaki production test text cleanup ROLLBACK template (DO NOT RUN without separate approval)
-- Phase: G-20b-gosaki-production-test-text-cleanup-final-preflight
-- Approval ID (rollback): separate from G-20b cleanup execution — operator explicit approval required
--
-- =============================================================================
-- Step 0 — Operator confirmation
-- =============================================================================
-- Project:  static-to-astro-cms-staging
-- Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if:  vsbvndwuajjhnzpohghh / Sariswing production
--
-- Use ONLY if G-20b cleanup succeeded but operator needs to restore PoC test titles
-- (e.g. mistaken production cutover timing, or re-staging QA).
-- Cursor must NOT execute this file.
-- This is a TEMPLATE — not executed in G-20b-preflight phase.
--
-- Doc: tools/static-to-astro/docs/gosaki-production-test-text-cleanup-final-preflight.md

-- =============================================================================
-- Step 1 — Pre-rollback SELECT (run first; confirm production titles present)
-- =============================================================================

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id in (
  'fd58cd6e-2fff-4ff2-96af-3087c469450b',
  '04e987a9-e251-4b0b-b860-21a61e711f8e'
)
order by discography_legacy_id asc;
-- expect before rollback: Like a Lover / Mary Ann

-- =============================================================================
-- Step 2 — Rollback UPDATE row A (restore G-18g2 test title)
-- =============================================================================

-- update public.discography_tracks
-- set title = 'Like a Lover（テスト）'
-- where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b'
--   and discography_legacy_id = 'discography-002'
--   and track_number = 7
--   and title = 'Like a Lover';
-- expect rowsAffected: 1

-- =============================================================================
-- Step 3 — Rollback UPDATE row B (restore G-19b1 test title)
-- =============================================================================

-- update public.discography_tracks
-- set title = 'Mary Ann（テスト）'
-- where id = '04e987a9-e251-4b0b-b860-21a61e711f8e'
--   and discography_legacy_id = 'discography-004'
--   and track_number = 1
--   and title = 'Mary Ann';
-- expect rowsAffected: 1

-- =============================================================================
-- Step 4 — Post-rollback SELECT
-- =============================================================================

-- select count(*) as test_title_rows
-- from public.discography_tracks
-- where title like '%（テスト）%';
-- expect: 2
--
-- select id, title from public.discography_tracks
-- where id in (
--   'fd58cd6e-2fff-4ff2-96af-3087c469450b',
--   '04e987a9-e251-4b0b-b860-21a61e711f8e'
-- );
-- expect: Like a Lover（テスト） / Mary Ann（テスト）
