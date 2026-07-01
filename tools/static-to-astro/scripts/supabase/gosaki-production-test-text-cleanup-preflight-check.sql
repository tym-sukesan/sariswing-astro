-- G-20b — Gosaki production pre-release test text cleanup preflight (SELECT only)
-- Phase: G-20b-gosaki-production-test-text-cleanup-final-preflight
-- Approval ID (execution): G-20b-gosaki-production-discography-test-text-cleanup
--
-- =============================================================================
-- Step 0 — Operator confirmation (read before running anything)
-- =============================================================================
-- Project:  static-to-astro-cms-staging
-- Host ref: kmjqppxjdnwwrtaeqjta.supabase.co
-- STOP if:  vsbvndwuajjhnzpohghh / Sariswing production
--
-- Scope:    read-only preflight SELECT — no UPDATE / INSERT / DELETE
-- Cursor:   must NOT execute writes from this file
-- Target:   revert 2 discography_tracks test titles before production release
--
-- Doc: tools/static-to-astro/docs/gosaki-production-test-text-cleanup-final-preflight.md

-- =============================================================================
-- Step 1 — Test title row count (expect exactly 2)
-- =============================================================================

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where title in ('Like a Lover（テスト）', 'Mary Ann（テスト）')
order by discography_legacy_id asc, track_number asc;
-- expect: 2 rows

select count(*) as test_title_rows
from public.discography_tracks
where title like '%（テスト）%';
-- expect: 2

-- =============================================================================
-- Step 2 — Target row A (discography-002 track 7)
-- =============================================================================

select id, discography_legacy_id, track_number, title, sort_order
from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: discography-002 / track_number 7 / title Like a Lover（テスト）

-- =============================================================================
-- Step 3 — Target row B (discography-004 track 1)
-- =============================================================================

select id, discography_legacy_id, track_number, title, sort_order
from public.discography_tracks
where id = '04e987a9-e251-4b0b-b860-21a61e711f8e';
-- expect: discography-004 / track_number 1 / title Mary Ann（テスト）

-- =============================================================================
-- Step 4 — Album track counts (expect 8 each; unchanged after cleanup)
-- =============================================================================

select count(*) as discography_002_track_count
from public.discography_tracks
where discography_legacy_id = 'discography-002';
-- expect: 8

select count(*) as discography_004_track_count
from public.discography_tracks
where discography_legacy_id = 'discography-004';
-- expect: 8

select track_number, title
from public.discography_tracks
where discography_legacy_id = 'discography-002'
order by sort_order asc, track_number asc;

select track_number, title
from public.discography_tracks
where discography_legacy_id = 'discography-004'
order by sort_order asc, track_number asc;

-- =============================================================================
-- Step 5 — Total table row count (expect 34)
-- =============================================================================

select count(*) as discography_tracks_total
from public.discography_tracks;
-- expect: 34

-- =============================================================================
-- Step 6 — Production titles must not exist yet on target rows (expect 0)
-- =============================================================================

select count(*) as like_a_lover_plain_on_target
from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b'
  and title = 'Like a Lover';
-- expect: 0 (still test title before cleanup)

select count(*) as mary_ann_plain_on_target
from public.discography_tracks
where id = '04e987a9-e251-4b0b-b860-21a61e711f8e'
  and title = 'Mary Ann';
-- expect: 0 (still test title before cleanup)

-- =============================================================================
-- Step 7 — afterVerification SELECT (run in G-20b-execution only — NOT now)
-- =============================================================================
-- After operator cleanup UPDATE (2 rows), re-run:
--
-- select count(*) from public.discography_tracks where title like '%（テスト）%';
-- expect: 0
--
-- select title from public.discography_tracks where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: Like a Lover
--
-- select title from public.discography_tracks where id = '04e987a9-e251-4b0b-b860-21a61e711f8e';
-- expect: Mary Ann
--
-- select count(*) from public.discography_tracks where discography_legacy_id = 'discography-002';
-- expect: 8
--
-- select count(*) from public.discography_tracks where discography_legacy_id = 'discography-004';
-- expect: 8
--
-- select count(*) from public.discography_tracks;
-- expect: 34
