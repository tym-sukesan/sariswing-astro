-- G-18c-f — Gosaki discography_tracks renumber (TEMPLATE ONLY — DO NOT RUN)
-- Phase: G-18c-f-gosaki-discography-tracks-renumber-update-preflight
-- Project: static-to-astro-cms-staging (operator staging Supabase only)
--
-- Scope:
--   UPDATE public.discography_tracks ONLY — 7 existing rows
--   No INSERT / DELETE / UPSERT / ALTER / schema migration
--   Renumber 9 unchanged rows MUST NOT be touched
--
-- Prerequisite: G-18c INSERT template must NOT run until this renumber succeeds
-- Next after success: G-18d INSERT backfill (gosaki-discography-tracks-backfill-g18c.template.sql)
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g18c-f-tracks-renumber-update-preflight.md
-- Approval: operator explicit approval required (destructive-operation form)

-- ---------------------------------------------------------------------------
-- PREFLIGHT SELECT — run before any UPDATE (read-only)
-- ---------------------------------------------------------------------------
-- select count(*) from public.discography_tracks;  -- expect: 16
--
-- select id, discography_legacy_id, track_number, sort_order, title
-- from public.discography_tracks
-- order by discography_legacy_id, sort_order;
--
-- -- Renumber targets (expect 7 rows):
-- select id, discography_legacy_id, track_number, sort_order, title
-- from public.discography_tracks
-- where (discography_legacy_id, title) in (
--   ('discography-001', 'Continuous'),
--   ('discography-002', 'Skylark'),
--   ('discography-002', 'What a Wonderful World'),
--   ('discography-002', 'The Water Is Wide'),
--   ('discography-003', 'The Look Of Love'),
--   ('discography-004', 'Shreveport Stomp'),
--   ('discography-004', 'Bourbon Street Parade')
-- )
-- order by 2, 3;
--
-- -- Constraints probe (operator SQL Editor — read-only):
-- select conname, pg_get_constraintdef(oid) as def
-- from pg_constraint
-- where conrelid = 'public.discography_tracks'::regclass
-- order by conname;
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public' and tablename = 'discography_tracks';

-- ---------------------------------------------------------------------------
-- PHASE 1 — stage to temporary track_number / sort_order (9001–9007)
-- Avoids direct 2->4 / 3->6 / 4->8 swap collisions within each album.
-- ---------------------------------------------------------------------------

BEGIN;

-- discography-001: Continuous 5 -> 9001
UPDATE public.discography_tracks
SET track_number = 9001, sort_order = 9001
WHERE discography_legacy_id = 'discography-001'
  AND title = 'Continuous'
  AND track_number = 5
  AND sort_order = 5;

-- discography-002: Skylark 2 -> 9002
UPDATE public.discography_tracks
SET track_number = 9002, sort_order = 9002
WHERE discography_legacy_id = 'discography-002'
  AND title = 'Skylark'
  AND track_number = 2
  AND sort_order = 2;

-- discography-002: What a Wonderful World 3 -> 9003
UPDATE public.discography_tracks
SET track_number = 9003, sort_order = 9003
WHERE discography_legacy_id = 'discography-002'
  AND title = 'What a Wonderful World'
  AND track_number = 3
  AND sort_order = 3;

-- discography-002: The Water Is Wide 4 -> 9004
UPDATE public.discography_tracks
SET track_number = 9004, sort_order = 9004
WHERE discography_legacy_id = 'discography-002'
  AND title = 'The Water Is Wide'
  AND track_number = 4
  AND sort_order = 4;

-- discography-003: The Look Of Love 4 -> 9005
UPDATE public.discography_tracks
SET track_number = 9005, sort_order = 9005
WHERE discography_legacy_id = 'discography-003'
  AND title = 'The Look Of Love'
  AND track_number = 4
  AND sort_order = 4;

-- discography-004: Shreveport Stomp 2 -> 9006
UPDATE public.discography_tracks
SET track_number = 9006, sort_order = 9006
WHERE discography_legacy_id = 'discography-004'
  AND title = 'Shreveport Stomp'
  AND track_number = 2
  AND sort_order = 2;

-- discography-004: Bourbon Street Parade 3 -> 9007
UPDATE public.discography_tracks
SET track_number = 9007, sort_order = 9007
WHERE discography_legacy_id = 'discography-004'
  AND title = 'Bourbon Street Parade'
  AND track_number = 3
  AND sort_order = 3;

-- Phase 1 row-count check (expect 7 updated — verify in SQL Editor if supported):
-- GET DIAGNOSTICS or select count where track_number between 9001 and 9007;

-- ---------------------------------------------------------------------------
-- PHASE 2 — move staged rows to seed/public final positions
-- ---------------------------------------------------------------------------

-- discography-001: Continuous 9001 -> 9
UPDATE public.discography_tracks
SET track_number = 9, sort_order = 9
WHERE discography_legacy_id = 'discography-001'
  AND title = 'Continuous'
  AND track_number = 9001
  AND sort_order = 9001;

-- discography-002: Skylark 9002 -> 4
UPDATE public.discography_tracks
SET track_number = 4, sort_order = 4
WHERE discography_legacy_id = 'discography-002'
  AND title = 'Skylark'
  AND track_number = 9002
  AND sort_order = 9002;

-- discography-002: What a Wonderful World 9003 -> 6
UPDATE public.discography_tracks
SET track_number = 6, sort_order = 6
WHERE discography_legacy_id = 'discography-002'
  AND title = 'What a Wonderful World'
  AND track_number = 9003
  AND sort_order = 9003;

-- discography-002: The Water Is Wide 9004 -> 8
UPDATE public.discography_tracks
SET track_number = 8, sort_order = 8
WHERE discography_legacy_id = 'discography-002'
  AND title = 'The Water Is Wide'
  AND track_number = 9004
  AND sort_order = 9004;

-- discography-003: The Look Of Love 9005 -> 7
UPDATE public.discography_tracks
SET track_number = 7, sort_order = 7
WHERE discography_legacy_id = 'discography-003'
  AND title = 'The Look Of Love'
  AND track_number = 9005
  AND sort_order = 9005;

-- discography-004: Shreveport Stomp 9006 -> 3
UPDATE public.discography_tracks
SET track_number = 3, sort_order = 3
WHERE discography_legacy_id = 'discography-004'
  AND title = 'Shreveport Stomp'
  AND track_number = 9006
  AND sort_order = 9006;

-- discography-004: Bourbon Street Parade 9007 -> 8
UPDATE public.discography_tracks
SET track_number = 8, sort_order = 8
WHERE discography_legacy_id = 'discography-004'
  AND title = 'Bourbon Street Parade'
  AND track_number = 9007
  AND sort_order = 9007;

COMMIT;

-- ---------------------------------------------------------------------------
-- POST-UPDATE SELECT — run after UPDATE (read-only verification)
-- ---------------------------------------------------------------------------
-- select count(*) from public.discography_tracks;  -- still 16
--
-- select discography_legacy_id, track_number, sort_order, title
-- from public.discography_tracks
-- order by discography_legacy_id, sort_order;
--
-- -- Expect renumbered rows at seed positions:
-- -- 001 Continuous: 9
-- -- 002 Skylark: 4; WAWW: 6; Water Is Wide: 8
-- -- 003 The Look Of Love: 7
-- -- 004 Shreveport Stomp: 3; Bourbon Street Parade: 8
--
-- -- G-18c conflict probe (expect 0 rows):
-- select discography_legacy_id, track_number, title
-- from public.discography_tracks
-- where (discography_legacy_id, track_number) in (
--   ('discography-001', 5),
--   ('discography-002', 2),
--   ('discography-002', 3),
--   ('discography-003', 4),
--   ('discography-004', 2)
-- );

-- ---------------------------------------------------------------------------
-- ROLLBACK UPDATE — comment only; DO NOT RUN unless reversing this renumber
-- Reverse phase 2 then phase 1 (inverse of above).
-- ---------------------------------------------------------------------------
-- BEGIN;
--
-- UPDATE public.discography_tracks SET track_number = 9001, sort_order = 9001
-- WHERE discography_legacy_id = 'discography-001' AND title = 'Continuous' AND track_number = 9 AND sort_order = 9;
-- UPDATE public.discography_tracks SET track_number = 9002, sort_order = 9002
-- WHERE discography_legacy_id = 'discography-002' AND title = 'Skylark' AND track_number = 4 AND sort_order = 4;
-- UPDATE public.discography_tracks SET track_number = 9003, sort_order = 9003
-- WHERE discography_legacy_id = 'discography-002' AND title = 'What a Wonderful World' AND track_number = 6 AND sort_order = 6;
-- UPDATE public.discography_tracks SET track_number = 9004, sort_order = 9004
-- WHERE discography_legacy_id = 'discography-002' AND title = 'The Water Is Wide' AND track_number = 8 AND sort_order = 8;
-- UPDATE public.discography_tracks SET track_number = 9005, sort_order = 9005
-- WHERE discography_legacy_id = 'discography-003' AND title = 'The Look Of Love' AND track_number = 7 AND sort_order = 7;
-- UPDATE public.discography_tracks SET track_number = 9006, sort_order = 9006
-- WHERE discography_legacy_id = 'discography-004' AND title = 'Shreveport Stomp' AND track_number = 3 AND sort_order = 3;
-- UPDATE public.discography_tracks SET track_number = 9007, sort_order = 9007
-- WHERE discography_legacy_id = 'discography-004' AND title = 'Bourbon Street Parade' AND track_number = 8 AND sort_order = 8;
--
-- UPDATE public.discography_tracks SET track_number = 5, sort_order = 5
-- WHERE discography_legacy_id = 'discography-001' AND title = 'Continuous' AND track_number = 9001 AND sort_order = 9001;
-- UPDATE public.discography_tracks SET track_number = 2, sort_order = 2
-- WHERE discography_legacy_id = 'discography-002' AND title = 'Skylark' AND track_number = 9002 AND sort_order = 9002;
-- UPDATE public.discography_tracks SET track_number = 3, sort_order = 3
-- WHERE discography_legacy_id = 'discography-002' AND title = 'What a Wonderful World' AND track_number = 9003 AND sort_order = 9003;
-- UPDATE public.discography_tracks SET track_number = 4, sort_order = 4
-- WHERE discography_legacy_id = 'discography-002' AND title = 'The Water Is Wide' AND track_number = 9004 AND sort_order = 9004;
-- UPDATE public.discography_tracks SET track_number = 4, sort_order = 4
-- WHERE discography_legacy_id = 'discography-003' AND title = 'The Look Of Love' AND track_number = 9005 AND sort_order = 9005;
-- UPDATE public.discography_tracks SET track_number = 2, sort_order = 2
-- WHERE discography_legacy_id = 'discography-004' AND title = 'Shreveport Stomp' AND track_number = 9006 AND sort_order = 9006;
-- UPDATE public.discography_tracks SET track_number = 3, sort_order = 3
-- WHERE discography_legacy_id = 'discography-004' AND title = 'Bourbon Street Parade' AND track_number = 9007 AND sort_order = 9007;
--
-- COMMIT;
