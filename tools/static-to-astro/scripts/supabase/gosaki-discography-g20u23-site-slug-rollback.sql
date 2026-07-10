-- G-20u23 — Discography site_slug migration ROLLBACK
-- Phase: G-20u23-discography-site-slug-migration-planning
-- Classification: **WRITE** — requires separate explicit operator approval
-- Project: static-to-astro-cms-staging ONLY
-- TEMPLATE — DO NOT EXECUTE from Cursor / CI / automation.
--
-- Use only if migration must be reversed before code enables filtered reads.
-- Prefer Option A (clear values) if column may be reused; Option B drops columns.

-- ---------------------------------------------------------------------------
-- Option A — Clear site_slug values (keeps nullable columns)
-- ---------------------------------------------------------------------------
-- begin;
-- update public.discography_tracks set site_slug = null where site_slug = 'gosaki-piano';
-- update public.discography set site_slug = null where site_slug = 'gosaki-piano';
-- commit;

-- ---------------------------------------------------------------------------
-- Option B — Drop site_slug columns (full schema rollback)
-- ---------------------------------------------------------------------------
-- begin;
-- alter table public.discography_tracks drop column if exists site_slug;
-- alter table public.discography drop column if exists site_slug;
-- commit;

-- Post-rollback verification (SELECT only — run after Option A or B):
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'discography' and column_name = 'site_slug';
-- EXPECT Option A: column exists, all site_slug NULL
-- EXPECT Option B: 0 rows (column dropped)
