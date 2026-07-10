-- G-20u23 — Discography site_slug migration (DDL + backfill)
-- Phase: G-20u23-discography-site-slug-migration-planning
-- Classification: **WRITE** — requires explicit operator approval (one-off)
-- Project: static-to-astro-cms-staging ONLY
-- STOP if project is vsbvndwuajjhnzpohghh / sari-site / production.
--
-- Doc: tools/static-to-astro/docs/discography-site-slug-migration-planning.md
-- TEMPLATE — DO NOT EXECUTE from Cursor / CI / automation.
-- Operator: run in Supabase SQL Editor **once** after:
--   1. before-verification SELECT PASS
--   2. explicit approval ID documented in execution phase (not G-20u23)
--
-- Scope: nullable site_slug column + Gosaki backfill only.
-- Out of scope (separate phases): NOT NULL, UNIQUE, RLS policy changes, GRANT/REVOKE.

begin;

-- ---------------------------------------------------------------------------
-- 1. Add nullable site_slug (no NOT NULL in this phase)
-- ---------------------------------------------------------------------------
alter table public.discography
  add column if not exists site_slug text;

comment on column public.discography.site_slug is
  'CMS Kit site identifier, e.g. gosaki-piano. NULL = legacy pre-migration rows.';

alter table public.discography_tracks
  add column if not exists site_slug text;

comment on column public.discography_tracks.site_slug is
  'CMS Kit site identifier mirrored from parent album. NULL = legacy pre-migration rows.';

-- ---------------------------------------------------------------------------
-- 2. Backfill existing Gosaki rows (single-tenant staging today)
-- ---------------------------------------------------------------------------
update public.discography
set site_slug = 'gosaki-piano'
where site_slug is null;

update public.discography_tracks
set site_slug = 'gosaki-piano'
where site_slug is null;

commit;

-- ---------------------------------------------------------------------------
-- Optional index (deferred — uncomment in separate approved phase if needed)
-- ---------------------------------------------------------------------------
-- create index if not exists discography_site_slug_published_idx
--   on public.discography (site_slug, published);
-- create index if not exists discography_tracks_site_slug_legacy_idx
--   on public.discography_tracks (site_slug, discography_legacy_id);
