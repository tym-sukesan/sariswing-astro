-- =============================================================================
-- CMS Core v2 — schedules site-writer RLS rollback — TEMPLATE
-- Phase: cms-core-v2-schedule-site-owner-authz-implementation-and-migration-template
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Drops ONLY the two policies added by cms-core-v2-schedules-site-writer-rls.template.sql
-- Does NOT drop/alter:
--   schedules_public_select
--   schedules_admin_all
-- Does NOT change grants / helpers / service_role / table data
-- =============================================================================

begin;

drop policy if exists schedules_site_writer_select on public.schedules;
drop policy if exists schedules_site_writer_insert on public.schedules;

commit;

-- After rollback (SELECT-only):
-- select policyname from pg_policies
-- where schemaname = 'public' and tablename = 'schedules'
-- order by policyname;
-- Expect: schedules_admin_all, schedules_public_select only (pre-writer baseline).
