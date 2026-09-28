-- =============================================================================
-- CMS Core v2 — site-assets Gosaki Schedule INSERT (Storage RLS) — TEMPLATE
-- Phase: gosaki-schedule-storage-upload-policy-review
-- DO NOT EXECUTE / APPLY without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Adds ONE authenticated INSERT policy on storage.objects:
--   bucket_id = 'site-assets'
--   path prefix gosaki-piano/schedule/
--   public.can_write_site(sites.id) after exact site_slug = 'gosaki-piano'
--
-- Does NOT:
--   - DROP / REPLACE any existing policy (including "site-assets public read")
--   - add UPDATE or DELETE policies
--   - GRANT / REVOKE (PRECHECK must already show INSERT for authenticated)
--   - ALTER bucket / allowed_mime_types
--   - touch production images bucket
--   - use service_role
--   - allow anon INSERT
--   - allow whole-bucket authenticated write
--   - allow gosaki/ (legacy G-4 discography prefix) or other folders
--
-- If CREATE POLICY fails because the name exists → STOP. Do not DROP in forward.
-- =============================================================================

begin;

create policy site_assets_gosaki_piano_schedule_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-assets'
    and name like 'gosaki-piano/schedule/%'
    and (storage.foldername(name))[1] = 'gosaki-piano'
    and (storage.foldername(name))[2] = 'schedule'
    and position('../' in name) = 0
    and name not like '%//%'
    and exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = 'gosaki-piano'
        and public.can_write_site(site_row.id)
    )
  );

commit;
