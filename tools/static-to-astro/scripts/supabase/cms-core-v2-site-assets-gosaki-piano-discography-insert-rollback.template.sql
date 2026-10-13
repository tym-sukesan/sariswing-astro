-- =============================================================================
-- CMS Core v2 — site-assets Gosaki Discography cover INSERT rollback
-- Phase: gosaki-discography-cover-image-upload-implementation
-- DO NOT EXECUTE without a separate explicit operator approval
-- Project: kmjqppxjdnwwrtaeqjta only · STOP vsbvndwuajjhnzpohghh
--
-- Drops ONLY site_assets_gosaki_piano_discography_insert
-- Does NOT drop "site-assets public read" or the Schedule INSERT policy
-- Does NOT change grants, buckets, objects, or discography rows
-- =============================================================================

begin;

drop policy if exists site_assets_gosaki_piano_discography_insert on storage.objects;

commit;
