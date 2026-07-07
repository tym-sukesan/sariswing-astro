-- G-22h5 — Gosaki Schedule republish target preflight check
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
-- SELECT ONLY — do NOT run UPDATE / INSERT / DELETE / GRANT / REVOKE / ALTER / DROP
-- Operator runs in Supabase SQL editor (authenticated) before G-22h6 Save

select
  id,
  legacy_id,
  site_slug,
  date,
  title,
  published,
  updated_at,
  source_route,
  source_file,
  sort_order
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id in (
    'schedule-2026-07-008',
    'schedule-2026-03-014',
    'schedule-2026-09-001'
  )
order by legacy_id asc;
