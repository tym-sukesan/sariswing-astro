-- =============================================================================
-- CMS Core v2 rollback — tenancy + site_embeds DDL (DO NOT EXECUTE without approval)
-- Staging: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
-- Order (strict):
--   1) Disarm Edge/client Save arms; Contents path remains default
--   2) cms-core-v2-gosaki-youtube-seed-rollback.template.sql (optional seed undo)
--   3) cms-core-v2-site-embeds-rls-rollback.template.sql
--   4) THIS file last
-- Data policy:
--   - Drops Core v2 tables created by the migration template
--   - CASCADE removes dependent site_embeds / site_members for those sites
--   - Does NOT touch schedules / discography / About / Contents JSON
--   - Do NOT run if other sites already share these tables in production-like use
-- =============================================================================

begin;

drop trigger if exists site_embeds_set_updated_at on public.site_embeds;
drop function if exists public.tg_site_embeds_set_updated_at();

-- Authz helpers (all known signatures)
drop function if exists public.can_write_site(uuid);
drop function if exists public.can_write_site(uuid, uuid);
drop function if exists public.is_site_member(uuid);
drop function if exists public.is_site_member(uuid, uuid);
drop function if exists public.is_platform_admin();
drop function if exists public.is_platform_admin(uuid);

-- Tables (child → parent). CASCADE clears members/embeds for dropped sites.
drop table if exists public.site_embeds cascade;
drop table if exists public.site_members cascade;
drop table if exists public.platform_admins cascade;
drop table if exists public.sites cascade;

commit;

-- Post-check:
-- select tablename from pg_tables where schemaname='public'
--   and tablename in ('sites','site_members','platform_admins','site_embeds');
-- expect 0 rows
