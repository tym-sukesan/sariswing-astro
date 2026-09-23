-- =============================================================================
-- CMS Core v2 site_embeds YouTube DELETE — ADDITIVE TEMPLATE
-- DO NOT EXECUTE / GRANT / REVOKE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Additive only: do NOT re-apply cms-core-v2-site-embeds-rls.template.sql
-- No DROP TABLE · no REVOKE ALL · no service_role
-- Authz: can_write_site(site_id) · scoped provider=youtube · site_slug=gosaki-piano
-- =============================================================================

begin;

drop policy if exists site_embeds_admin_delete_youtube on public.site_embeds;
create policy site_embeds_admin_delete_youtube
  on public.site_embeds
  for delete
  to authenticated
  using (
    public.can_write_site(site_id)
    and provider = 'youtube'
    and site_slug = 'gosaki-piano'
  );

-- Table DELETE is still filtered by RLS. Edge further requires exact legacy_item_id.
grant delete on table public.site_embeds to authenticated;

commit;
