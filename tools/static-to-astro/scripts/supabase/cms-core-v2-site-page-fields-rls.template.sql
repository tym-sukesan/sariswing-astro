-- =============================================================================
-- CMS Core v2 site_page_fields RLS + minimal GRANT/REVOKE — TEMPLATE
-- DO NOT EXECUTE / GRANT / REVOKE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Requires: cms-core-v2-site-page-fields-migration.template.sql applied first
-- Authz: can_write_site(uuid) (existing Core helpers — not redefined here)
-- service_role: not used / not granted
-- Scope: public.site_page_fields ONLY (does not re-touch sites / site_embeds RLS)
-- Fail-closed: REVOKE ALL then minimal re-GRANT (PUBLIC/anon/authenticated/service_role;
--   re-GRANT anon/authenticated only — never service_role)
-- =============================================================================

begin;

alter table public.site_page_fields enable row level security;

-- Public read: published scalars only (anon + authenticated) for build-read
drop policy if exists site_page_fields_public_select_published on public.site_page_fields;
create policy site_page_fields_public_select_published
  on public.site_page_fields
  for select
  to anon, authenticated
  using (published = true);

-- Admin read: full site scope for members / platform
drop policy if exists site_page_fields_admin_select_site on public.site_page_fields;
create policy site_page_fields_admin_select_site
  on public.site_page_fields
  for select
  to authenticated
  using (public.can_write_site(site_id));

-- Writes: authenticated members/platform only (Edge still enforces field allowlists)
drop policy if exists site_page_fields_admin_insert on public.site_page_fields;
create policy site_page_fields_admin_insert
  on public.site_page_fields
  for insert
  to authenticated
  with check (public.can_write_site(site_id));

drop policy if exists site_page_fields_admin_update on public.site_page_fields;
create policy site_page_fields_admin_update
  on public.site_page_fields
  for update
  to authenticated
  using (public.can_write_site(site_id))
  with check (public.can_write_site(site_id));

-- DELETE deferred (no DELETE policy)

-- ---------------------------------------------------------------------------
-- Fail-closed then minimal re-GRANT
-- ---------------------------------------------------------------------------

revoke all on table public.site_page_fields from public;
revoke all on table public.site_page_fields from anon;
revoke all on table public.site_page_fields from authenticated;
revoke all on table public.site_page_fields from service_role;

-- INSERT columns (client): site_id, site_slug, page_key, field_key,
--   value_text, published, sort_order
-- UPDATE columns (client): value_text, published, sort_order
-- NOT client-writable: id, created_at, created_by, updated_at, updated_by
-- Identity freeze on UPDATE: site_id, site_slug, page_key, field_key (audit trigger)
-- created_by/updated_by: tg_site_page_fields_set_audit_actors (auth.uid())
-- updated_at: tg_site_page_fields_set_updated_at
-- service_role: REVOKE only — never GRANT (Kit path)
grant select on table public.site_page_fields to anon;
grant select on table public.site_page_fields to authenticated;
grant insert (
  site_id,
  site_slug,
  page_key,
  field_key,
  value_text,
  published,
  sort_order
) on table public.site_page_fields to authenticated;
grant update (
  value_text,
  published,
  sort_order
) on table public.site_page_fields to authenticated;

commit;

-- Verify (SELECT only) — service_role explicit table privileges must be 0:
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'site_page_fields'
--   and (grantee = 'service_role' or grantee ilike '%service%')
-- order by 1, 2;
