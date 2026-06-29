-- G-18g1 — Gosaki discography_tracks GRANT / RLS read-only check (SELECT ONLY — DO NOT MODIFY)
-- Phase: G-18g1-gosaki-discography-tracks-grant-rls-readonly-check
-- Run in Supabase SQL Editor on static-to-astro-cms-staging ONLY.
-- STOP if project is vsbvndwuajjhnzpohghh / sari-site / production.
--
-- Doc: tools/static-to-astro/docs/gosaki-discography-g18g1-tracks-grant-rls-readonly-check.md

-- ---------------------------------------------------------------------------
-- 1. Session context
-- ---------------------------------------------------------------------------
select current_database() as current_database;
select current_user as current_user;

-- ---------------------------------------------------------------------------
-- 2. RLS enabled?
-- ---------------------------------------------------------------------------
select
  c.relname,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'discography_tracks';

-- ---------------------------------------------------------------------------
-- 3. Policies on discography_tracks
-- ---------------------------------------------------------------------------
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'discography_tracks'
order by policyname;

-- ---------------------------------------------------------------------------
-- 4. Table grants (compare discography vs discography_tracks)
-- ---------------------------------------------------------------------------
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('discography', 'discography_tracks')
order by table_name, grantee, privilege_type;

-- ---------------------------------------------------------------------------
-- 5. Target row + album inventory (read-only)
-- ---------------------------------------------------------------------------
select id, discography_legacy_id, track_number, sort_order, title
from public.discography_tracks
where discography_legacy_id = 'discography-002'
order by sort_order;
-- expect: 8 rows; track 7 title = 'Like a Lover'

select id, discography_legacy_id, track_number, title
from public.discography_tracks
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b';
-- expect: discography-002 / 7 / Like a Lover

select count(*) as test_title_rows
from public.discography_tracks
where title = 'Like a Lover（テスト）';
-- expect: 0

select count(*) as track_total from public.discography_tracks;
-- expect: 34

-- ---------------------------------------------------------------------------
-- 6. is_admin() present (RLS dependency)
-- ---------------------------------------------------------------------------
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'is_admin';
