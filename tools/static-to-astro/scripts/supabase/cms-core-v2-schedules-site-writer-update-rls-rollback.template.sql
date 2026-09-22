-- =============================================================================
-- CMS Core v2 — schedules site-writer UPDATE RLS rollback — TEMPLATE
-- Phase: gosaki-production-cms-save-completion
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Drops ONLY schedules_site_writer_update
-- Does NOT drop/alter:
--   schedules_public_select
--   schedules_admin_all
--   schedules_site_writer_select
--   schedules_site_writer_insert
-- Does NOT change grants / helpers / service_role / table data
-- =============================================================================

begin;

drop policy if exists schedules_site_writer_update on public.schedules;

commit;

-- After rollback (SELECT-only):
-- select policyname from pg_policies
-- where schemaname = 'public' and tablename = 'schedules'
-- order by policyname;
-- Expect: admin_all, public_select, site_writer_insert, site_writer_select
-- (no site_writer_update).
