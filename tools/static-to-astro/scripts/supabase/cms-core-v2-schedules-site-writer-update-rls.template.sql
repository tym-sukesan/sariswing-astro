-- =============================================================================
-- CMS Core v2 — schedules site-writer RLS (UPDATE) — MIGRATION TEMPLATE
-- Phase: gosaki-production-cms-save-completion
-- DO NOT EXECUTE / APPLY without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Adds site-scoped UPDATE for owner|editor|platform_admin via
--   site_slug → public.sites.id → public.can_write_site(site_id)
--
-- Does NOT:
--   - DROP any policy
--   - alter schedules_public_select or schedules_admin_all
--     (platform admin ALL via is_admin() remains)
--   - add DELETE policy
--   - change grants / helpers / service_role
--   - hardcode a tenant slug in policy bodies (scope is via sites.site_slug join)
--
-- Requires: schedules_site_writer_select + schedules_site_writer_insert already
-- exist (2026-08-06 apply). If schedules_site_writer_update already exists,
-- CREATE POLICY fails — stop and ask human (do not DROP in forward path).
-- =============================================================================

begin;

-- Preflight (operator SELECT-only before apply; not executed by this file):
--   select policyname from pg_policies
--   where schemaname = 'public' and tablename = 'schedules'
--     and policyname = 'schedules_site_writer_update';
-- Expect: 0 rows. If any row → STOP (drift).

create policy schedules_site_writer_update
  on public.schedules
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = schedules.site_slug
        and public.can_write_site(site_row.id)
    )
  )
  with check (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = schedules.site_slug
        and public.can_write_site(site_row.id)
    )
  );

-- Existing policies intentionally untouched:
--   schedules_public_select (published = true)
--   schedules_admin_all (legacy is_admin())
--   schedules_site_writer_select
--   schedules_site_writer_insert

commit;

-- After apply (SELECT-only fingerprint):
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'schedules'
-- order by policyname;
