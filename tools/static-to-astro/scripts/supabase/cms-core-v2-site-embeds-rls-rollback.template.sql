-- =============================================================================
-- CMS Core v2 rollback — RLS + table GRANTs (DO NOT EXECUTE without approval)
-- Staging: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
-- Order: AFTER seed rollback (optional); BEFORE migration/table drop rollback
-- Removes policies + revokes table privileges added by RLS template
-- Does NOT drop tables or authz helper functions
-- Does NOT delete row data
-- =============================================================================

begin;

drop policy if exists sites_select_member_or_platform on public.sites;
drop policy if exists site_members_select_self_or_platform on public.site_members;
drop policy if exists platform_admins_select_self on public.platform_admins;
drop policy if exists site_embeds_public_select_published on public.site_embeds;
drop policy if exists site_embeds_admin_select_site on public.site_embeds;
drop policy if exists site_embeds_admin_insert on public.site_embeds;
drop policy if exists site_embeds_admin_update on public.site_embeds;

revoke all on table public.sites from anon;
revoke all on table public.sites from authenticated;
revoke all on table public.site_members from anon;
revoke all on table public.site_members from authenticated;
revoke all on table public.platform_admins from anon;
revoke all on table public.platform_admins from authenticated;
revoke all on table public.site_embeds from anon;
revoke all on table public.site_embeds from authenticated;

-- RLS flags left enabled (safe default). Operator may disable only if required:
-- alter table public.sites disable row level security;
-- alter table public.site_members disable row level security;
-- alter table public.platform_admins disable row level security;
-- alter table public.site_embeds disable row level security;

commit;
