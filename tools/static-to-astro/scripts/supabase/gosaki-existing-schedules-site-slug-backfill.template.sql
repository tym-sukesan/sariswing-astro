-- G-9c2a — backfill site_slug on existing Gosaki schedule rows
-- TEMPLATE ONLY — DO NOT EXECUTE from Cursor / CI
-- Project: static-to-astro-cms-staging (operator manual SQL Editor only)
-- Precondition: count(*) where legacy_id like 'schedule-2026-%' = 60
-- Expect: exactly 60 rows updated

-- Pre-check (SELECT only — run before UPDATE):
-- select count(*) as schedule_2026_rows
-- from public.schedules where legacy_id like 'schedule-2026-%';
-- select count(*) as already_tagged
-- from public.schedules where site_slug = 'gosaki-piano';

begin;

update public.schedules
set site_slug = 'gosaki-piano'
where legacy_id like 'schedule-2026-%'
  and site_slug is null;

commit;

-- Post-check (SELECT only):
-- select count(*) as gosaki_rows
-- from public.schedules where site_slug = 'gosaki-piano';
-- EXPECT: 60
