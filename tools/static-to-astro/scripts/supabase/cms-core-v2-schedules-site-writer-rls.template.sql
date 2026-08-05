-- =============================================================================
-- CMS Core v2 — schedules site-writer RLS (SELECT + INSERT) — MIGRATION TEMPLATE
-- Phase: cms-core-v2-schedule-site-owner-authz-implementation-and-migration-template
-- DO NOT EXECUTE / APPLY without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Adds site-scoped writer policies for owner|editor|platform_admin via
--   site_slug → public.sites.id → public.can_write_site(site_id)
--
-- Does NOT:
--   - DROP any policy (forward migration has no DROP POLICY)
--   - alter schedules_public_select or schedules_admin_all
--   - add UPDATE / DELETE policies
--   - change grants / helpers / service_role
--   - hardcode site_slug = 'gosaki-piano' in policy bodies
--
-- Drift: if schedules_site_writer_select / schedules_site_writer_insert already
-- exist, CREATE POLICY fails — stop and ask human (do not DROP in forward path).
-- =============================================================================

begin;

-- Preflight (operator SELECT-only before apply; not executed by this file):
--   select policyname from pg_policies
--   where schemaname = 'public' and tablename = 'schedules'
--     and policyname in (
--       'schedules_site_writer_select',
--       'schedules_site_writer_insert'
--     );
-- Expect: 0 rows. If any row → STOP (drift).

create policy schedules_site_writer_select
  on public.schedules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = schedules.site_slug
        and public.can_write_site(site_row.id)
    )
  );

create policy schedules_site_writer_insert
  on public.schedules
  for insert
  to authenticated
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

commit;

-- After apply (SELECT-only fingerprint):
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'schedules'
-- order by policyname;
