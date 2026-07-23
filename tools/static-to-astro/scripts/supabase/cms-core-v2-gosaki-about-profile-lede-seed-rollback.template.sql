-- =============================================================================
-- CMS Core v2 rollback — About profile.lede seed only (DO NOT EXECUTE)
-- Staging: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
-- Order: AFTER disarm arms; BEFORE site_page_fields RLS/DDL rollback
-- Scope: DELETE ONLY the known seed row for gosaki-piano about/profile.lede
-- Does NOT delete sites / site_members / platform_admins / site_embeds
-- Does NOT wipe arbitrary client fields
-- =============================================================================

begin;

-- Preflight (SELECT only — run manually first):
-- select id, site_slug, page_key, field_key, value_text, published, updated_at
-- from public.site_page_fields
-- where site_slug = 'gosaki-piano'
--   and page_key = 'about'
--   and field_key = 'profile.lede';

delete from public.site_page_fields
where site_slug = 'gosaki-piano'
  and page_key = 'about'
  and field_key = 'profile.lede'
  and value_text = '後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。';

-- Post-check:
-- select count(*) from public.site_page_fields
-- where site_slug = 'gosaki-piano'
--   and page_key = 'about'
--   and field_key = 'profile.lede';
-- expect 0 for this seed key; other fields (if any) remain

commit;
