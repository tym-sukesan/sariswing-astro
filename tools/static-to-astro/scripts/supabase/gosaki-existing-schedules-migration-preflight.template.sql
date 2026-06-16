-- G-9c2a — existing Gosaki schedule rows migration preflight / verification / rollback
-- TEMPLATE ONLY — operator manual execution on static-to-astro-cms-staging only
-- Do NOT run from Cursor / CI

-- =============================================================================
-- BEFORE migration (Step 1)
-- =============================================================================

select count(*) as schedule_2026_rows
from public.schedules
where legacy_id like 'schedule-2026-%';

select count(*) as legacy_id_duplicates
from (
  select legacy_id, count(*) as c
  from public.schedules
  where legacy_id like 'schedule-2026-%'
  group by legacy_id
  having count(*) > 1
) d;

select month, count(*) as events
from public.schedules
where legacy_id like 'schedule-2026-%'
group by month
order by month;

select source_route, count(*) as events
from public.schedules
where legacy_id like 'schedule-2026-%'
group by source_route
order by source_route;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name = 'site_slug';

-- SAVE for rollback — especially schedule-2026-07-010
select *
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

-- =============================================================================
-- AFTER migration (Step 7) — expect site_slug=gosaki-piano count 60
-- =============================================================================

select count(*) as gosaki_rows
from public.schedules
where site_slug = 'gosaki-piano';

select month, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by month
order by month;

select source_route, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by source_route
order by source_route;

select legacy_id, source_route
from public.schedules
where site_slug = 'gosaki-piano'
  and (
    source_route ~ '^/schedule-[0-9]{4}-[0-9]{2}/$'
    or (source_route ~ '^/[0-9]{4}-[0-9]{2}/$' and source_route not like '/schedule/%')
  );

select id, legacy_id, title, venue, open_time, start_time, description, source_route
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

-- =============================================================================
-- ROLLBACK (destructive — explicit operator approval required)
-- Approval: 承認します。この操作を1回だけ実行してください。
-- =============================================================================
--
-- A. Clear site_slug on Gosaki rows:
-- begin;
-- update public.schedules
-- set site_slug = null
-- where site_slug = 'gosaki-piano' and legacy_id like 'schedule-2026-%';
-- commit;
--
-- B. Revert source_route (only if needed — use Step 1 snapshot):
-- begin;
-- update public.schedules
-- set source_route = '/schedule-' || month || '/'
-- where legacy_id like 'schedule-2026-%' and site_slug is null;
-- commit;
--
-- C. Restore schedule-2026-07-010 PoC fields from Step 1 saved snapshot
