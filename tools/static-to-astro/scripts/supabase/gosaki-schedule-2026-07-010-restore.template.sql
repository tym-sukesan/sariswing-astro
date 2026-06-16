-- G-9c2a — restore schedule-2026-07-010 from G-6 PoC alterations to Gosaki seed values
-- TEMPLATE ONLY — DO NOT EXECUTE from Cursor / CI
-- Project: static-to-astro-cms-staging (operator manual SQL Editor only)
-- Source of truth: gosaki-schedules-seed.template.sql (schedule-2026-07-010 row)
-- EXPECT: exactly 1 row updated
-- WHERE must include id + legacy_id — never update by legacy_id alone

-- Pre-check (SELECT only — SAVE snapshot for rollback):
-- select * from public.schedules
-- where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

begin;

update public.schedules
set
  title = '<>',
  venue = null,
  open_time = null,
  start_time = null,
  price = null,
  description = '出演：',
  source_file = '2026-07.html',
  source_route = '/schedule/2026-07/',
  show_on_home = false,
  home_order = null,
  published = true,
  sort_order = 100
where legacy_id = 'schedule-2026-07-010'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano';

commit;

-- Post-check (SELECT only):
-- select id, legacy_id, title, venue, open_time, start_time, description, source_route
-- from public.schedules
-- where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
