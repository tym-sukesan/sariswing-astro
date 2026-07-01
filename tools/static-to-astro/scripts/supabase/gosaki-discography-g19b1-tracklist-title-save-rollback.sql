-- G-19b1 — Gosaki discography_tracks track 1 title Save ROLLBACK template (DO NOT RUN without separate approval)
-- Phase: G-19b1-preflight-gosaki-discography-tracklist-generic-single-title-save-final-preflight
-- Approval ID (rollback): separate from G-19b1 Save execution — operator explicit approval required
--
-- =============================================================================
-- Step 0 — Operator confirmation
-- =============================================================================
-- Project:  static-to-astro-cms-staging
-- Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if:  vsbvndwuajjhnzpohghh / production
--
-- Use ONLY if G-19b1 Save succeeded and operator needs to restore before title.
-- Cursor must NOT execute this file.
-- This is a TEMPLATE — not executed in G-19b1-preflight phase.
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md

-- =============================================================================
-- Step 1 — Pre-rollback SELECT (run first; confirm after-title present)
-- =============================================================================

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = '04e987a9-e251-4b0b-b860-21a61e711f8e';
-- expect before rollback: title = Mary Ann（テスト）

-- =============================================================================
-- Step 2 — Rollback UPDATE (operator manual — separate approval only)
-- =============================================================================

-- update public.discography_tracks
-- set title = 'Mary Ann'
-- where id = '04e987a9-e251-4b0b-b860-21a61e711f8e'
--   and discography_legacy_id = 'discography-004'
--   and track_number = 1
--   and title = 'Mary Ann（テスト）';
-- expect rowsAffected: 1

-- =============================================================================
-- Step 3 — Post-rollback SELECT
-- =============================================================================

-- select id, discography_legacy_id, track_number, title
-- from public.discography_tracks
-- where id = '04e987a9-e251-4b0b-b860-21a61e711f8e';
-- expect: title = Mary Ann
