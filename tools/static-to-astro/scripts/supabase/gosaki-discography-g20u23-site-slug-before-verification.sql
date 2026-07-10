-- G-20u23 — Discography site_slug migration BEFORE verification
-- Phase: G-20u23-discography-site-slug-migration-planning
-- Classification: **READ-ONLY** (SELECT only — safe for SQL Editor preflight)
-- Project: static-to-astro-cms-staging ONLY
-- STOP if project is vsbvndwuajjhnzpohghh / sari-site / production.
--
-- Doc: tools/static-to-astro/docs/discography-site-slug-migration-planning.md
-- Run this file **once** in Supabase SQL Editor **before** migration approval.
-- Cursor / CI must NOT execute this file.

-- ---------------------------------------------------------------------------
-- 1. Session context
-- ---------------------------------------------------------------------------
select current_database() as current_database;
select current_user as current_user;

-- ---------------------------------------------------------------------------
-- 2. site_slug column must NOT exist yet (pre-migration expectation)
-- ---------------------------------------------------------------------------
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('discography', 'discography_tracks')
  and column_name = 'site_slug';
-- EXPECT before migration: 0 rows

-- ---------------------------------------------------------------------------
-- 3. discography inventory (Gosaki staging baseline)
-- ---------------------------------------------------------------------------
select count(*) as discography_total
from public.discography;
-- EXPECT: 4

select count(*) as discography_published
from public.discography
where published = true;
-- EXPECT: 4

select
  legacy_id,
  title,
  artist,
  label,
  sort_order,
  published
from public.discography
order by sort_order, legacy_id;
-- EXPECT legacy_id set:
--   discography-001 .. discography-004 (4 rows)

-- ---------------------------------------------------------------------------
-- 4. discography_tracks inventory + album relation
-- ---------------------------------------------------------------------------
select count(*) as tracks_total
from public.discography_tracks;
-- EXPECT: 34

select
  discography_legacy_id,
  count(*) as track_count
from public.discography_tracks
group by discography_legacy_id
order by discography_legacy_id;
-- EXPECT: 4 album groups tied by discography_legacy_id

select
  t.id,
  t.discography_legacy_id,
  t.track_number,
  t.sort_order,
  t.title,
  d.title as album_title
from public.discography_tracks t
left join public.discography d on d.legacy_id = t.discography_legacy_id
order by t.discography_legacy_id, t.sort_order, t.track_number
limit 20;
-- sanity: join via discography_legacy_id → discography.legacy_id

-- ---------------------------------------------------------------------------
-- 5. orphan tracks check (should be 0)
-- ---------------------------------------------------------------------------
select count(*) as orphan_tracks
from public.discography_tracks t
left join public.discography d on d.legacy_id = t.discography_legacy_id
where d.legacy_id is null;
-- EXPECT: 0

-- ---------------------------------------------------------------------------
-- 6. RLS / grants snapshot (read-only — compare after migration if needed)
-- ---------------------------------------------------------------------------
select
  c.relname,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('discography', 'discography_tracks')
order by c.relname;

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('discography', 'discography_tracks')
order by table_name, grantee, privilege_type;
