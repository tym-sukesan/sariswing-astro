-- =============================================================================
-- Discography Slice A — site-writer SELECT RLS (FORWARD) — MIGRATION TEMPLATE
-- Phase: discography-site-owner-authz-implementation-and-migration-template-slice-a
-- DO NOT EXECUTE / APPLY without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Adds site-scoped writer SELECT for owner|editor|platform_admin via
--   site_slug → public.sites.id → public.can_write_site(site_id)
-- on BOTH public.discography and public.discography_tracks.
--
-- Does NOT:
--   - DROP any existing policy
--   - alter discography*_public_select or discography*_admin_all
--   - add UPDATE / INSERT / DELETE policies (Slice B/C)
--   - change grants / helpers / service_role
--   - hardcode site_slug = 'gosaki-piano' in policy bodies
--
-- Drift: if discography_site_writer_select / discography_tracks_site_writer_select
-- already exist, CREATE POLICY fails — stop and ask human (do not DROP in forward path).
-- =============================================================================

begin;

-- Preflight (operator SELECT-only before apply; not executed by this file):
--   select policyname from pg_policies
--   where schemaname = 'public'
--     and tablename in ('discography', 'discography_tracks')
--     and policyname in (
--       'discography_site_writer_select',
--       'discography_tracks_site_writer_select'
--     );
-- Expect: 0 rows. If any row → STOP (drift).

create policy discography_site_writer_select
  on public.discography
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = discography.site_slug
        and public.can_write_site(site_row.id)
    )
  );

create policy discography_tracks_site_writer_select
  on public.discography_tracks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = discography_tracks.site_slug
        and public.can_write_site(site_row.id)
    )
  );

-- Existing policies intentionally untouched:
--   discography_public_select / discography_tracks_public_select (published)
--   discography_admin_all / discography_tracks_admin_all (legacy is_admin)
--   RESTRICTIVE slice policies (G-20u36e / G-20u43 prep)

commit;

-- After apply (SELECT-only fingerprint):
-- select tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('discography', 'discography_tracks')
-- order by tablename, policyname;
