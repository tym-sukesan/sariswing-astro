-- G-18c — Gosaki discography_tracks backfill (TEMPLATE ONLY — DO NOT RUN)
-- Phase: G-18c-gosaki-discography-tracks-gap-backfill-preflight
-- Project: static-to-astro-cms-staging (operator staging Supabase only)
--
-- Scope:
--   INSERT into public.discography_tracks ONLY — 18 rows
--   Existing 16 rows MUST NOT be updated or deleted by this template
--   No UPDATE / DELETE / UPSERT / ON CONFLICT in executable section
--
-- Source of truth for titles/order: data/gosaki/discography.seed.json
--   (= config/sites/gosaki-piano-discography.json trackList = fixture/public)
--
-- EXECUTION BLOCKER (read before running):
--   G-18c re-inventory found existing 16 rows use compressed track_number (1..N)
--   with sparse title selection — NOT a strict prefix of seed order.
--   5 of 18 INSERT rows below share track_number with an existing row:
--     discography-001 track 5  (Continuous occupies 5; insert Ain't She Sweet at 5)
--     discography-002 tracks 2,3 (Skylark / What a Wonderful World)
--     discography-003 track 4  (The Look Of Love)
--     discography-004 track 2  (Shreveport Stomp)
--   Running this template as-is may fail on UNIQUE (discography_legacy_id, track_number)
--   or produce duplicate track_number if no constraint exists.
--   Resolve via G-18c-f renumber preflight BEFORE operator execution (G-18d).
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g18c-tracks-gap-backfill-preflight.md
-- Approval: operator explicit approval required (destructive-operation form)

-- ---------------------------------------------------------------------------
-- PREFLIGHT SELECT — run before any INSERT (read-only)
-- ---------------------------------------------------------------------------
-- select count(*) as track_total from public.discography_tracks;
-- -- expect: 16
--
-- select discography_legacy_id, count(*) as cnt
-- from public.discography_tracks
-- group by discography_legacy_id
-- order by discography_legacy_id;
-- -- expect: 001=5, 002=4, 003=4, 004=3
--
-- select discography_legacy_id, track_number, sort_order, title
-- from public.discography_tracks
-- order by discography_legacy_id, sort_order;
--
-- -- Conflict probe (should return rows if blocker still present):
-- select t.discography_legacy_id, t.track_number, t.title as existing_title
-- from public.discography_tracks t
-- where (t.discography_legacy_id, t.track_number) in (
--   ('discography-001', 5),
--   ('discography-002', 2),
--   ('discography-002', 3),
--   ('discography-003', 4),
--   ('discography-004', 2)
-- )
-- order by 1, 2;

-- ---------------------------------------------------------------------------
-- INSERT — 18 missing tracks (DO NOT RUN in G-18c preflight phase)
-- ---------------------------------------------------------------------------

BEGIN;

INSERT INTO public.discography_tracks (discography_legacy_id, track_number, title, sort_order)
VALUES
  -- discography-001 Continuous — missing 4 (seed positions 5–8)
  ('discography-001', 5, 'Ain''t She Sweet', 5),
  ('discography-001', 6, 'Boplicity', 6),
  ('discography-001', 7, 'Double Rainbow', 7),
  ('discography-001', 8, 'Verrazano Moon', 8),

  -- discography-002 SKYLARK — missing 4 (seed positions 2, 3, 5, 7)
  ('discography-002', 2, 'My Blue Heaven', 2),
  ('discography-002', 3, 'How Deep Is The Ocean', 3),
  ('discography-002', 5, 'Set Sail', 5),
  ('discography-002', 7, 'Like a Lover', 7),

  -- discography-003 About Us!! — missing 5 (seed positions 4–6, 8–9)
  ('discography-003', 4, 'Darn That Dream', 4),
  ('discography-003', 5, 'The Old Country', 5),
  ('discography-003', 6, 'The Sweetest Sounds', 6),
  ('discography-003', 8, 'Samba De Cafe Terrasse', 8),
  ('discography-003', 9, 'I''d Climb The Highest Mountain', 9),

  -- discography-004 Ja-Jaaaaan! — missing 5 (seed positions 2, 4–7)
  ('discography-004', 2, 'Nearer My God To Thee', 2),
  ('discography-004', 4, 'A Fool Such As I', 4),
  ('discography-004', 5, 'Si Tu Vois Ma Mere', 5),
  ('discography-004', 6, 'St. Phillip Street Break Down', 6),
  ('discography-004', 7, 'Girl Of My Dream', 7);

COMMIT;

-- ---------------------------------------------------------------------------
-- POST-INSERT SELECT — run after INSERT (read-only verification)
-- ---------------------------------------------------------------------------
-- select count(*) as track_total from public.discography_tracks;
-- -- expect after success: 34
--
-- select discography_legacy_id, count(*) as cnt
-- from public.discography_tracks
-- group by discography_legacy_id
-- order by discography_legacy_id;
-- -- expect: 001=9, 002=8, 003=9, 004=8
--
-- select discography_legacy_id, track_number, sort_order, title
-- from public.discography_tracks
-- order by discography_legacy_id, sort_order;

-- ---------------------------------------------------------------------------
-- ROLLBACK DELETE — comment only; DO NOT RUN unless rolling back this backfill
-- Deletes exactly the 18 titles inserted above. Existing 16 rows untouched.
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM public.discography_tracks
-- WHERE (discography_legacy_id, title) IN (
--   ('discography-001', 'Ain''t She Sweet'),
--   ('discography-001', 'Boplicity'),
--   ('discography-001', 'Double Rainbow'),
--   ('discography-001', 'Verrazano Moon'),
--   ('discography-002', 'My Blue Heaven'),
--   ('discography-002', 'How Deep Is The Ocean'),
--   ('discography-002', 'Set Sail'),
--   ('discography-002', 'Like a Lover'),
--   ('discography-003', 'Darn That Dream'),
--   ('discography-003', 'The Old Country'),
--   ('discography-003', 'The Sweetest Sounds'),
--   ('discography-003', 'Samba De Cafe Terrasse'),
--   ('discography-003', 'I''d Climb The Highest Mountain'),
--   ('discography-004', 'Nearer My God To Thee'),
--   ('discography-004', 'A Fool Such As I'),
--   ('discography-004', 'Si Tu Vois Ma Mere'),
--   ('discography-004', 'St. Phillip Street Break Down'),
--   ('discography-004', 'Girl Of My Dream')
-- );
-- COMMIT;
--
-- -- verify after rollback:
-- -- select count(*) from public.discography_tracks;  -- expect: 16
