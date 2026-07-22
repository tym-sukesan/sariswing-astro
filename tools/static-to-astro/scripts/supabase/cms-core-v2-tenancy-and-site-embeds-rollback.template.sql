-- =============================================================================
-- CMS Core v2 rollback — tenancy + site_embeds DDL (DO NOT EXECUTE without approval)
-- Staging: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
-- Order (strict):
--   1) Disarm Edge/client Save arms; Contents path remains default
--   2) cms-core-v2-gosaki-access-assignment-rollback.template.sql (if access applied)
--   3) cms-core-v2-gosaki-youtube-seed-rollback.template.sql (optional content undo)
--   4) cms-core-v2-site-embeds-rls-rollback.template.sql
--   5) THIS file last
-- Fail-closed:
--   - No DROP TABLE … CASCADE
--   - Abort if unexpected foreign keys reference Core tables
--   - Unknown dependents → transaction ERROR → stop (do not force-drop)
-- Does NOT touch schedules / discography / About / Contents JSON
-- =============================================================================

begin;

-- Refuse DROP if non-Core objects FK-reference Core tables
do $$
declare
  dep_count int;
  dep_sample text;
begin
  select count(*)::int,
         string_agg(format('%I.%I→%I.%I', n.nspname, rel.relname, rn.nspname, ref.relname), ', ')
    into dep_count, dep_sample
  from pg_constraint c
  join pg_class rel on rel.oid = c.conrelid
  join pg_namespace n on n.oid = rel.relnamespace
  join pg_class ref on ref.oid = c.confrelid
  join pg_namespace rn on rn.oid = ref.relnamespace
  where c.contype = 'f'
    and rn.nspname = 'public'
    and ref.relname in ('sites', 'site_members', 'platform_admins', 'site_embeds')
    and not (
      n.nspname = 'public'
      and rel.relname in ('sites', 'site_members', 'platform_admins', 'site_embeds')
    );

  if coalesce(dep_count, 0) > 0 then
    raise exception
      'STOP: unexpected FKs reference Core v2 tables (%): % — refuse DDL rollback',
      dep_count,
      coalesce(dep_sample, '');
  end if;
end $$;

drop trigger if exists site_embeds_set_audit_actors on public.site_embeds;
drop function if exists public.tg_site_embeds_set_audit_actors();
drop trigger if exists site_embeds_set_updated_at on public.site_embeds;
drop function if exists public.tg_site_embeds_set_updated_at();

-- Authz helpers (all known signatures)
drop function if exists public.can_write_site(uuid);
drop function if exists public.can_write_site(uuid, uuid);
drop function if exists public.is_site_member(uuid);
drop function if exists public.is_site_member(uuid, uuid);
drop function if exists public.is_platform_admin();
drop function if exists public.is_platform_admin(uuid);

-- Tables child → parent. NO CASCADE — if Postgres reports dependents, abort.
drop table if exists public.site_embeds;
drop table if exists public.site_members;
drop table if exists public.platform_admins;
drop table if exists public.sites;

commit;

-- Post-check:
-- select tablename from pg_tables where schemaname='public'
--   and tablename in ('sites','site_members','platform_admins','site_embeds');
-- expect 0 rows
