-- =============================================================================
-- Discography Slice A — site-writer SELECT RLS rollback — TEMPLATE
-- Phase: discography-site-owner-authz-implementation-and-migration-template-slice-a
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Drops ONLY the two policies added by
--   gosaki-discography-site-writer-select-rls.template.sql
-- Does NOT drop/alter existing catalog policies (current staging count = 4):
--   discography_public_select / discography_tracks_public_select
--   discography_admin_all / discography_tracks_admin_all
-- Current catalog has no RESTRICTIVE slice policies; this rollback neither
-- creates nor drops any such policy.
-- Does NOT change grants / helpers / service_role / table data / RPC body
-- (RPC rollback is a separate template.)
-- =============================================================================

begin;

drop policy if exists discography_site_writer_select on public.discography;
drop policy if exists discography_tracks_site_writer_select on public.discography_tracks;

commit;

-- After rollback (SELECT-only):
-- select tablename, policyname from pg_policies
-- where schemaname = 'public'
--   and tablename in ('discography', 'discography_tracks')
-- order by tablename, policyname;
-- Expect: no discography*_site_writer_select rows.
