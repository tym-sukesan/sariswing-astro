-- G-18d — Gosaki discography_tracks operator read-only preflight (SELECT ONLY — DO NOT MODIFY DATA)
-- Phase: G-18d-gosaki-discography-tracks-manual-sql-execution-readiness
-- Run in Supabase SQL Editor BEFORE any renumber UPDATE or backfill INSERT.
-- Paste full result to ChatGPT. STOP if any check fails.
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g18d-tracks-manual-sql-execution-readiness.md
-- Target project: static-to-astro-cms-staging (NOT sari-site / production)

-- ---------------------------------------------------------------------------
-- 1. Session / schema context
-- ---------------------------------------------------------------------------
select current_database() as current_database;
select current_schema() as current_schema;
select current_setting('search_path') as search_path;

-- ---------------------------------------------------------------------------
-- 2. Table columns
-- ---------------------------------------------------------------------------
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discography_tracks'
order by ordinal_position;

-- ---------------------------------------------------------------------------
-- 3. Constraints
-- ---------------------------------------------------------------------------
select conname, pg_get_constraintdef(c.oid) as constraint_def
from pg_constraint c
join pg_class t on c.conrelid = t.oid
join pg_namespace n on t.relnamespace = n.oid
where n.nspname = 'public'
  and t.relname = 'discography_tracks'
order by conname;

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'discography_tracks'
order by indexname;

-- ---------------------------------------------------------------------------
-- 5. Row counts (expect total = 16 before Step 2)
-- ---------------------------------------------------------------------------
select count(*) as track_total from public.discography_tracks;

select discography_legacy_id, count(*) as cnt
from public.discography_tracks
group by discography_legacy_id
order by discography_legacy_id;
-- expect: discography-001=5, 002=4, 003=4, 004=3

-- ---------------------------------------------------------------------------
-- 6. Full inventory (16 rows expected)
-- ---------------------------------------------------------------------------
select id, discography_legacy_id, track_number, sort_order, title, created_at
from public.discography_tracks
order by discography_legacy_id, sort_order;

-- ---------------------------------------------------------------------------
-- 7. Renumber targets — expect exactly 7 rows at CURRENT positions
-- ---------------------------------------------------------------------------
select id, discography_legacy_id, track_number, sort_order, title
from public.discography_tracks
where (discography_legacy_id, title, track_number, sort_order) in (
  ('discography-001', 'Continuous', 5, 5),
  ('discography-002', 'Skylark', 2, 2),
  ('discography-002', 'What a Wonderful World', 3, 3),
  ('discography-002', 'The Water Is Wide', 4, 4),
  ('discography-003', 'The Look Of Love', 4, 4),
  ('discography-004', 'Shreveport Stomp', 2, 2),
  ('discography-004', 'Bourbon Street Parade', 3, 3)
)
order by discography_legacy_id, track_number;
-- expect: 7 rows

select count(*) as renumber_target_count
from public.discography_tracks
where (discography_legacy_id, title, track_number, sort_order) in (
  ('discography-001', 'Continuous', 5, 5),
  ('discography-002', 'Skylark', 2, 2),
  ('discography-002', 'What a Wonderful World', 3, 3),
  ('discography-002', 'The Water Is Wide', 4, 4),
  ('discography-003', 'The Look Of Love', 4, 4),
  ('discography-004', 'Shreveport Stomp', 2, 2),
  ('discography-004', 'Bourbon Street Parade', 3, 3)
);
-- expect: 7

-- ---------------------------------------------------------------------------
-- 8. Unchanged rows — expect 9 rows (must not be renumbered)
-- ---------------------------------------------------------------------------
select discography_legacy_id, track_number, sort_order, title
from public.discography_tracks
where (discography_legacy_id, title) in (
  ('discography-001', 'Nature Boy'),
  ('discography-001', 'Waters Of March'),
  ('discography-001', 'With a Song In My Heart'),
  ('discography-001', 'Here Comes The Sun'),
  ('discography-002', 'On a Clear Day'),
  ('discography-003', '白玉Bluse'),
  ('discography-003', 'The Lady Is A Tramp'),
  ('discography-003', 'Honeysuckle Rose'),
  ('discography-004', 'Mary Ann')
)
order by discography_legacy_id, track_number;
-- expect: 9 rows

-- ---------------------------------------------------------------------------
-- 9. Missing INSERT titles — expect 0 rows present (18 not yet in DB)
-- ---------------------------------------------------------------------------
select discography_legacy_id, title
from public.discography_tracks
where (discography_legacy_id, title) in (
  ('discography-001', 'Ain''t She Sweet'),
  ('discography-001', 'Boplicity'),
  ('discography-001', 'Double Rainbow'),
  ('discography-001', 'Verrazano Moon'),
  ('discography-002', 'My Blue Heaven'),
  ('discography-002', 'How Deep Is The Ocean'),
  ('discography-002', 'Set Sail'),
  ('discography-002', 'Like a Lover'),
  ('discography-003', 'Darn That Dream'),
  ('discography-003', 'The Old Country'),
  ('discography-003', 'The Sweetest Sounds'),
  ('discography-003', 'Samba De Cafe Terrasse'),
  ('discography-003', 'I''d Climb The Highest Mountain'),
  ('discography-004', 'Nearer My God To Thee'),
  ('discography-004', 'A Fool Such As I'),
  ('discography-004', 'Si Tu Vois Ma Mere'),
  ('discography-004', 'St. Phillip Street Break Down'),
  ('discography-004', 'Girl Of My Dream')
);
-- expect: 0 rows

-- ---------------------------------------------------------------------------
-- 10. G-18c INSERT conflict probe — expect 5 rows BEFORE renumber (blocker)
-- ---------------------------------------------------------------------------
select discography_legacy_id, track_number, title
from public.discography_tracks
where (discography_legacy_id, track_number) in (
  ('discography-001', 5),
  ('discography-002', 2),
  ('discography-002', 3),
  ('discography-003', 4),
  ('discography-004', 2)
)
order by 1, 2;
-- expect before Step 2: 5 rows (confirms INSERT blocked until renumber)

-- ---------------------------------------------------------------------------
-- 11. Staging numbers absent — expect 0 before Step 2
-- ---------------------------------------------------------------------------
select count(*) as temp_9001_9007_count
from public.discography_tracks
where track_number between 9001 and 9007
   or sort_order between 9001 and 9007;
-- expect before Step 2: 0

-- ---------------------------------------------------------------------------
-- 12. Duplicate track_number per album — expect 0 rows
-- ---------------------------------------------------------------------------
select discography_legacy_id, track_number, count(*) as dup_cnt
from public.discography_tracks
group by discography_legacy_id, track_number
having count(*) > 1;
-- expect: 0 rows
