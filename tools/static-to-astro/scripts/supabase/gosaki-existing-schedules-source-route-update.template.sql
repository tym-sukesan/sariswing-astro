-- G-9c2a — canonicalize source_route on existing Gosaki schedule rows
-- TEMPLATE ONLY — DO NOT EXECUTE from Cursor / CI
-- Project: static-to-astro-cms-staging (operator manual SQL Editor only)
-- From: /schedule-2026-XX/  To: /schedule/2026-XX/
-- Precondition: site_slug = 'gosaki-piano' on 60 rows

-- Pre-check (SELECT only):
-- select source_route, count(*) from public.schedules
-- where site_slug = 'gosaki-piano' group by source_route order by source_route;

begin;

update public.schedules
set source_route = '/schedule/' || month || '/'
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-%'
  and source_route is distinct from ('/schedule/' || month || '/');

commit;

-- Post-check (SELECT only):
-- select source_route, count(*) from public.schedules
-- where site_slug = 'gosaki-piano' group by source_route order by source_route;
-- EXPECT: only /schedule/2026-03/ … /schedule/2026-07/
