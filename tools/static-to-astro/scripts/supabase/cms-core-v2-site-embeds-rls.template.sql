-- =============================================================================
-- CMS Core v2 site_embeds RLS + minimal table GRANT/REVOKE — TEMPLATE
-- DO NOT EXECUTE / GRANT / REVOKE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Requires: cms-core-v2-tenancy-and-site-embeds-migration.template.sql applied first
-- Authz helpers: is_platform_admin() / is_site_member(uuid) / can_write_site(uuid)
-- service_role: not used / not granted by this draft
-- Fail-closed: REVOKE ALL from PUBLIC/anon/authenticated, then minimal re-GRANT
-- =============================================================================

begin;

alter table public.sites enable row level security;
alter table public.site_members enable row level security;
alter table public.platform_admins enable row level security;
alter table public.site_embeds enable row level security;

-- sites: members/platform can SELECT their sites; anon none
drop policy if exists sites_select_member_or_platform on public.sites;
create policy sites_select_member_or_platform
  on public.sites
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or public.is_site_member(id)
  );

-- site_members: user can see own membership rows; platform sees all
drop policy if exists site_members_select_self_or_platform on public.site_members;
create policy site_members_select_self_or_platform
  on public.site_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_platform_admin()
  );

-- platform_admins: self-read only (active flag visible to self)
drop policy if exists platform_admins_select_self on public.platform_admins;
create policy platform_admins_select_self
  on public.platform_admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- site_embeds public read: published youtube only (anon + authenticated)
drop policy if exists site_embeds_public_select_published on public.site_embeds;
create policy site_embeds_public_select_published
  on public.site_embeds
  for select
  to anon, authenticated
  using (published = true and provider = 'youtube');

-- site_embeds admin read: full site scope for members / platform
drop policy if exists site_embeds_admin_select_site on public.site_embeds;
create policy site_embeds_admin_select_site
  on public.site_embeds
  for select
  to authenticated
  using (public.can_write_site(site_id));

-- Writes: authenticated members/platform only (Edge still enforces allowlists)
drop policy if exists site_embeds_admin_insert on public.site_embeds;
create policy site_embeds_admin_insert
  on public.site_embeds
  for insert
  to authenticated
  with check (public.can_write_site(site_id));

drop policy if exists site_embeds_admin_update on public.site_embeds;
create policy site_embeds_admin_update
  on public.site_embeds
  for update
  to authenticated
  using (public.can_write_site(site_id))
  with check (public.can_write_site(site_id));

-- DELETE deferred (Phase 2 Save uses published=false soft-hide; no DELETE policy)

-- ---------------------------------------------------------------------------
-- Fail-closed then minimal re-GRANT (staging apply draft — not executed here)
-- service_role intentionally omitted from grants in this Kit path
-- ---------------------------------------------------------------------------

revoke all on table public.sites from public;
revoke all on table public.sites from anon;
revoke all on table public.sites from authenticated;

revoke all on table public.site_members from public;
revoke all on table public.site_members from anon;
revoke all on table public.site_members from authenticated;

revoke all on table public.platform_admins from public;
revoke all on table public.platform_admins from anon;
revoke all on table public.platform_admins from authenticated;

revoke all on table public.site_embeds from public;
revoke all on table public.site_embeds from anon;
revoke all on table public.site_embeds from authenticated;

-- authenticated: SELECT on tenancy tables (RLS still filters)
grant select on table public.sites to authenticated;
grant select on table public.site_members to authenticated;
grant select on table public.platform_admins to authenticated;

-- site_embeds: anon SELECT (RLS → published); authenticated SELECT + column-level write
-- INSERT columns (client): site_id, site_slug, provider, legacy_item_id,
--   title, source_url, embed_url, published, sort_order
-- UPDATE columns (client): title, source_url, embed_url, published, sort_order
-- NOT client-writable: id, site_id(on update), site_slug(on update), provider(on update),
--   legacy_item_id(on update), created_at, created_by, updated_at, updated_by
-- created_by/updated_by: tg_site_embeds_set_audit_actors (auth.uid())
-- updated_at: tg_site_embeds_set_updated_at
grant select on table public.site_embeds to anon;
grant select on table public.site_embeds to authenticated;
grant insert (
  site_id,
  site_slug,
  provider,
  legacy_item_id,
  title,
  source_url,
  embed_url,
  published,
  sort_order
) on table public.site_embeds to authenticated;
grant update (
  title,
  source_url,
  embed_url,
  published,
  sort_order
) on table public.site_embeds to authenticated;

commit;
