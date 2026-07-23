-- =============================================================================
-- CMS Core v2 rollback — site_page_fields RLS + table GRANTs (DO NOT EXECUTE)
-- Staging: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
-- Order: AFTER seed rollback (optional); BEFORE site_page_fields migration rollback
-- Removes policies + revokes privileges added by About RLS template
-- Does NOT drop table or tenancy / site_embeds policies
-- Does NOT delete row data
-- =============================================================================

begin;

drop policy if exists site_page_fields_public_select_published on public.site_page_fields;
drop policy if exists site_page_fields_admin_select_site on public.site_page_fields;
drop policy if exists site_page_fields_admin_insert on public.site_page_fields;
drop policy if exists site_page_fields_admin_update on public.site_page_fields;

revoke all on table public.site_page_fields from anon;
revoke all on table public.site_page_fields from authenticated;

-- RLS flag left enabled (safe default). Operator may disable only if required:
-- alter table public.site_page_fields disable row level security;

commit;
