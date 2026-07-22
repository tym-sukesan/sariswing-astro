-- =============================================================================
-- Gosaki YouTube CONTENT seed — TEMPLATE (DO NOT EXECUTE)
-- Source: tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Scope: sites row + site_embeds youtube row ONLY
-- Access (owner / platform_admin): use cms-core-v2-gosaki-access-assignment.template.sql
-- =============================================================================

begin;

-- 1) Site row
insert into public.sites (site_slug, display_name, status)
values ('gosaki-piano', 'Gosaki Piano', 'active')
on conflict (site_slug) do update
  set display_name = excluded.display_name,
      status = 'active',
      updated_at = now();

-- 2) YouTube embed from current JSON SoT
insert into public.site_embeds (
  site_id,
  site_slug,
  provider,
  legacy_item_id,
  title,
  source_url,
  embed_url,
  published,
  sort_order
)
select
  s.id,
  s.site_slug,
  'youtube',
  'yt-placeholder-01',
  null,
  'https://youtu.be/I-eY9YMq9GI',
  'https://www.youtube-nocookie.com/embed/I-eY9YMq9GI',
  true,
  10
from public.sites s
where s.site_slug = 'gosaki-piano'
on conflict (site_id, provider, legacy_item_id) do update
  set source_url = excluded.source_url,
      embed_url = excluded.embed_url,
      published = excluded.published,
      sort_order = excluded.sort_order,
      site_slug = excluded.site_slug;

commit;

-- Verify (SELECT only):
-- select legacy_item_id, published, source_url, embed_url, site_id, site_slug, updated_at
-- from public.site_embeds
-- where site_slug = 'gosaki-piano' and provider = 'youtube';
