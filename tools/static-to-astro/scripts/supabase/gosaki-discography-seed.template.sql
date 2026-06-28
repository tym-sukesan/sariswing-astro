-- G-15 — Gosaki discography seed reference (TEMPLATE ONLY — DO NOT RUN in G-15)
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta
--
-- Status: seed ALREADY APPLIED (2026-06-05). Re-INSERT would violate legacy_id UNIQUE.
-- Use read-only verification below. Full re-seed requires operator approval + rollback plan.

-- ---------------------------------------------------------------------------
-- READ-ONLY verification (G-15 allowed)
-- ---------------------------------------------------------------------------
-- select legacy_id, title, artist, release_date, sort_order, published
-- from public.discography
-- order by sort_order;

-- Expected 4 rows:
--   discography-001  Continuous
--   discography-002  SKYLARK
--   discography-003  About Us!!
--   discography-004  Ja-Jaaaaan!

-- select discography_legacy_id, track_number, title
-- from public.discography_tracks
-- order by discography_legacy_id, track_order;

-- Track counts (partial vs admin JSON):
--   discography-001: 5 (JSON has 9)
--   discography-002: 4 (JSON has 8)
--   discography-003: 4 (JSON has 9)
--   discography-004: 3 (JSON has 8)

-- ---------------------------------------------------------------------------
-- DRAFT re-seed shape (DO NOT RUN — documentation only)
-- Source: fixtures/gosaki-piano/discography.html via discography-seed-extractor.mjs
-- Inventory JSON: tools/static-to-astro/data/gosaki/discography.seed.json
-- ---------------------------------------------------------------------------
--
-- insert into public.discography (
--   legacy_id, title, artist, release_date, year, label, catalog_number,
--   description, cover_image_url, purchase_url, streaming_url,
--   sort_order, published, source_file, source_route
-- ) values (
--   'discography-001',
--   'Continuous',
--   'ごさきりかこTrio Feat.石川周之介',
--   '2023-07-26', 2023, null, 'GSRT-0002',
--   '...personnel merged...',
--   'https://.../cover.png',
--   'https://gosakirikako.base.shop/',
--   null,
--   1, true, 'discography.html', '/discography/'
-- );
-- (repeat for 002–004; then discography_tracks child rows)

-- ---------------------------------------------------------------------------
-- Rollback concept (operator-only; not executed in G-15)
-- ---------------------------------------------------------------------------
-- delete from public.discography_tracks where discography_legacy_id like 'discography-%';
-- delete from public.discography where legacy_id like 'discography-%';
