-- G-9c0c — Gosaki schedule seed preflight / verification / rollback templates
-- TEMPLATE ONLY — operator manual execution on static-to-astro-cms-staging only
-- Do NOT run from Cursor / CI

-- =============================================================================
-- BEFORE seed
-- Confirm project: static-to-astro-cms-staging (NOT production)
-- =============================================================================

select count(*) as gosaki_rows_before
from public.schedules
where site_slug = 'gosaki-piano';

select legacy_id, date, title, venue, site_slug, source_route
from public.schedules
where legacy_id like 'schedule-2026-%'
order by legacy_id;

-- G-6 PoC row (do not modify in seed phase):
-- legacy_id: schedule-2026-07-010
-- id: aa440e29-5be8-402e-9190-0d81c48434c0
-- site_slug: NULL (expected until operator tags separately)

select legacy_id, date, title, venue, site_slug, source_route
from public.schedules
where legacy_id = 'schedule-2026-07-010';

-- site_slug column existence (expect 1 row after migration)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name = 'site_slug';

-- Collision check: Gosaki seed includes schedule-2026-07-010 (conflicts with G-6 PoC)
-- Recommended resolution before INSERT: rename PoC legacy_id to schedule-2026-07-010-poc
-- (separate operator approval — NOT part of G-9c0c)

-- =============================================================================
-- AFTER seed (expect 60 rows; month counts 13/10/12/11/14)
-- =============================================================================

select site_slug, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by site_slug;

select month, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by month
order by month;

-- source_route must be canonical /schedule/YYYY-MM/ (not legacy /YYYY-MM/)
select source_route, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by source_route
order by source_route;

-- expect zero rows: legacy root month routes in source_route
select legacy_id, source_route
from public.schedules
where site_slug = 'gosaki-piano'
  and source_route ~ '^/[0-9]{4}-[0-9]{2}/$'
  and source_route not like '/schedule/%';

select legacy_id, date, title, venue, open_time, start_time, price, published, source_route
from public.schedules
where site_slug = 'gosaki-piano'
order by date, sort_order;

-- =============================================================================
-- ROLLBACK (destructive — explicit operator approval required)
-- =============================================================================
-- Preconditions:
--   1. Confirm project = static-to-astro-cms-staging (NOT production)
--   2. Run BEFORE queries; save row count / sample legacy_ids
--   3. Approval text: 承認します。この操作を1回だけ実行してください。
--   4. Verify DELETE affects ONLY site_slug = 'gosaki-piano'
--
-- begin;
-- delete from public.schedules
-- where site_slug = 'gosaki-piano';
-- commit;
--
-- Post-rollback: expect gosaki_rows = 0; G-6 PoC row schedule-2026-07-010 unchanged
