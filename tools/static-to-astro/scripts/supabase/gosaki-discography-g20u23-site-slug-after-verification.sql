-- G-20u23 / G-20u24d — Discography site_slug migration AFTER verification
-- Phase: G-20u23-discography-site-slug-migration-planning (G-20u24d after SQL fix)
-- Classification: **READ-ONLY** (SELECT only — safe for SQL Editor post-check)
-- Project: static-to-astro-cms-staging ONLY
-- Run **after** migration WRITE SQL completes successfully.

-- ---------------------------------------------------------------------------
-- 1. Column exists and is nullable
-- ---------------------------------------------------------------------------
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('discography', 'discography_tracks')
  and column_name = 'site_slug'
order by table_name;
-- EXPECT: 2 rows · data_type text · is_nullable YES

-- ---------------------------------------------------------------------------
-- 2. Row counts unchanged
-- ---------------------------------------------------------------------------
select count(*) as discography_total from public.discography;
-- EXPECT: 4

select count(*) as tracks_total from public.discography_tracks;
-- EXPECT: 34

-- ---------------------------------------------------------------------------
-- 3. Backfill complete — no NULL site_slug
-- ---------------------------------------------------------------------------
select count(*) as discography_null_site_slug
from public.discography
where site_slug is null;
-- EXPECT: 0

select count(*) as tracks_null_site_slug
from public.discography_tracks
where site_slug is null;
-- EXPECT: 0

select count(*) as discography_gosaki
from public.discography
where site_slug = 'gosaki-piano';
-- EXPECT: 4

select count(*) as tracks_gosaki
from public.discography_tracks
where site_slug = 'gosaki-piano';
-- EXPECT: 34

-- ---------------------------------------------------------------------------
-- 4. Filtered read preview (matches future loader .eq site_slug)
-- ---------------------------------------------------------------------------
select
  legacy_id,
  title,
  site_slug,
  published
from public.discography
where site_slug = 'gosaki-piano'
  and published = true
order by sort_order;
-- EXPECT: 4 published releases

select
  discography_legacy_id,
  count(*) as track_count
from public.discography_tracks
where site_slug = 'gosaki-piano'
group by discography_legacy_id
order by discography_legacy_id;
-- EXPECT: 4 album groups (detail rows)

select
  count(*) as filtered_album_groups,
  coalesce(sum(track_count), 0) as filtered_tracks
from (
  select
    discography_legacy_id,
    count(*) as track_count
  from public.discography_tracks
  where site_slug = 'gosaki-piano'
  group by discography_legacy_id
) grouped;
-- EXPECT: filtered_album_groups 4 · filtered_tracks 34
-- G-20u24c bug: count(*) on grouped subquery alone returns 4 (album groups), not 34 tracks

-- ---------------------------------------------------------------------------
-- 5. Orphan tracks (should remain 0)
-- ---------------------------------------------------------------------------
select count(*) as orphan_tracks
from public.discography_tracks t
left join public.discography d on d.legacy_id = t.discography_legacy_id
where d.legacy_id is null;
-- EXPECT: 0

-- ---------------------------------------------------------------------------
-- 6. Cross-table consistency (tracks site_slug matches parent album)
-- ---------------------------------------------------------------------------
select count(*) as mismatched_track_site_slug
from public.discography_tracks t
join public.discography d on d.legacy_id = t.discography_legacy_id
where t.site_slug is distinct from d.site_slug;
-- EXPECT: 0

-- ---------------------------------------------------------------------------
-- 7. RLS remains enabled
-- ---------------------------------------------------------------------------
select
  c.relname,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('discography', 'discography_tracks')
order by c.relname;
-- EXPECT: rls_enabled true on both tables

-- ---------------------------------------------------------------------------
-- 8. Non-Gosaki filter returns empty (staging has no other tenants yet)
-- ---------------------------------------------------------------------------
select count(*) as other_site_discography
from public.discography
where site_slug is not null
  and site_slug <> 'gosaki-piano';
-- EXPECT: 0
