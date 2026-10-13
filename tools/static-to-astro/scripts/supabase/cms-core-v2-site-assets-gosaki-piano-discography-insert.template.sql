-- =============================================================================
-- CMS Core v2 — site-assets Gosaki Discography cover INSERT (Storage RLS)
-- Phase: gosaki-discography-cover-image-upload-implementation
-- DO NOT EXECUTE / APPLY without a separate explicit operator approval
-- Project: kmjqppxjdnwwrtaeqjta only · STOP vsbvndwuajjhnzpohghh
--
-- Adds ONE authenticated INSERT policy on storage.objects:
--   bucket_id = 'site-assets'
--   path prefix gosaki-piano/discography/
--   public.can_write_site(sites.id) after exact site_slug = 'gosaki-piano'
--
-- Existing public covers live at site-assets/gosaki/discography/{legacy_id}/cover.*
-- This policy cannot write that prefix, and it adds no UPDATE or DELETE.
-- Client uploads use a new random file name and x-upsert=false.
--
-- Browser checks (12MB input, 1200px WebP, 2MB output) are NOT the server
-- guarantee. This policy does not read byte size or MIME, and it does not
-- ALTER storage.buckets. Existing bucket file_size_limit / allowed_mime_types
-- stay as they are. Optimization does not require a policy change.
--
-- Does NOT:
--   - DROP / REPLACE any existing policy (including "site-assets public read"
--     and site_assets_gosaki_piano_schedule_insert)
--   - add UPDATE or DELETE policies
--   - GRANT / REVOKE
--   - ALTER the bucket or allowed_mime_types
--   - write, overwrite, or delete any object
--   - allow anon INSERT
--   - allow the whole bucket
--   - use service_role
--
-- If CREATE POLICY fails because the name exists → STOP. Do not DROP in forward.
-- =============================================================================

begin;

create policy site_assets_gosaki_piano_discography_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-assets'
    and name like 'gosaki-piano/discography/%'
    and (storage.foldername(name))[1] = 'gosaki-piano'
    and (storage.foldername(name))[2] = 'discography'
    and position('../' in name) = 0
    and name not like '%//%'
    and name not like 'gosaki/discography/%'
    and exists (
      select 1
      from public.sites site_row
      where site_row.site_slug = 'gosaki-piano'
        and public.can_write_site(site_row.id)
    )
  );

commit;
