-- =============================================================================
-- CMS Core v2 — site-assets Gosaki Schedule INSERT rollback — TEMPLATE
-- Phase: gosaki-schedule-storage-upload-policy-review
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Drops ONLY site_assets_gosaki_piano_schedule_insert
-- Does NOT drop/alter "site-assets public read" or any other Storage policy
-- Does NOT change grants / helpers / buckets / objects / public.schedules
-- =============================================================================

begin;

drop policy if exists site_assets_gosaki_piano_schedule_insert on storage.objects;

commit;
