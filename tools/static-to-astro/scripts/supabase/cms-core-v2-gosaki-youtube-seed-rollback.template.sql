-- =============================================================================
-- CMS Core v2 rollback — seed only (DO NOT EXECUTE without explicit approval)
-- Staging: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
-- Order: AFTER access-assignment rollback (if used); BEFORE RLS/DDL rollback
-- Scope: remove ONLY the known Phase 2 seed embed row for gosaki-piano
-- Does NOT delete sites / site_members / platform_admins
-- Does NOT wipe arbitrary client data
-- Access undo: cms-core-v2-gosaki-access-assignment-rollback.template.sql
-- =============================================================================

begin;

-- Preflight (SELECT only — run manually first):
-- select id, site_slug, provider, legacy_item_id, source_url, published, updated_at
-- from public.site_embeds
-- where site_slug = 'gosaki-piano'
--   and provider = 'youtube'
--   and legacy_item_id = 'yt-placeholder-01';

delete from public.site_embeds
where site_slug = 'gosaki-piano'
  and provider = 'youtube'
  and legacy_item_id = 'yt-placeholder-01'
  and source_url = 'https://youtu.be/I-eY9YMq9GI'
  and embed_url = 'https://www.youtube-nocookie.com/embed/I-eY9YMq9GI';

-- Post-check:
-- select count(*) from public.site_embeds
-- where site_slug = 'gosaki-piano' and provider = 'youtube'
--   and legacy_item_id = 'yt-placeholder-01';
-- expect 0 for this seed id; other embeds (if any) remain

commit;
