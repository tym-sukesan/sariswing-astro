-- G-18g2 — Gosaki discography_tracks track 7 title Save ROLLBACK template (DO NOT RUN without separate approval)
-- Phase: G-18g2-preflight-gosaki-discography-tracklist-single-title-save-final-preflight
-- Approval ID (rollback): separate from G-18g2 Save execution — operator explicit approval required
--
-- =============================================================================
-- Step 0 — Operator confirmation
-- =============================================================================
-- Project:  static-to-astro-cms-staging
-- Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if:  vsbvndwuajjhnzpohghh / production
--
-- Use ONLY if G-18g2 Save succeeded and operator needs to restore before title.
-- Cursor must NOT execute this file.
-- This is a TEMPLATE — not executed in G-18g2-preflight phase.
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-final-preflight.md

-- =============================================================================
-- Step 1 — Pre-rollback SELECT (run first; confirm after-title present)
-- =============================================================================

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect before rollback: title = Like a Lover（テスト）

-- =============================================================================
-- Step 2 — Rollback UPDATE (operator manual — separate approval only)
-- =============================================================================

-- update public.discography_tracks
-- set title = 'Like a Lover'
-- where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b'
--   and discography_legacy_id = 'discography-002'
--   and track_number = 7
--   and title = 'Like a Lover（テスト）';
-- expect rowsAffected: 1

-- =============================================================================
-- Step 3 — Post-rollback SELECT
-- =============================================================================

-- select id, discography_legacy_id, track_number, title
-- from public.discography_tracks
-- where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: title = Like a Lover
