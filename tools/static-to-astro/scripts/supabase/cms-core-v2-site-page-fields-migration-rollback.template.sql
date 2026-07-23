-- =============================================================================
-- CMS Core v2 rollback — site_page_fields DDL only (DO NOT EXECUTE)
-- Staging: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
-- Order (strict):
--   1) Disarm About Supabase path/Save arms; Contents About remains default
--   2) cms-core-v2-gosaki-about-profile-lede-seed-rollback.template.sql
--   3) cms-core-v2-site-page-fields-rls-rollback.template.sql
--   4) THIS file last
-- Fail-closed:
--   - No DROP TABLE … CASCADE
--   - Does NOT drop sites / site_members / platform_admins / site_embeds
--   - Does NOT drop can_write_site / other Core helpers
-- =============================================================================

begin;

drop trigger if exists site_page_fields_set_audit_actors on public.site_page_fields;
drop function if exists public.tg_site_page_fields_set_audit_actors();
drop trigger if exists site_page_fields_set_updated_at on public.site_page_fields;
drop function if exists public.tg_site_page_fields_set_updated_at();

-- NO CASCADE — if Postgres reports dependents, abort and ask human
drop table if exists public.site_page_fields;

commit;

-- Post-check:
-- select to_regclass('public.site_page_fields');
-- expect NULL
