-- =============================================================================
-- Gosaki YouTube seed into site_embeds — TEMPLATE (DO NOT EXECUTE)
-- Source: tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Replace :owner_user_id / :platform_admin_user_id before run.
-- =============================================================================

begin;

-- 1) Site row
insert into public.sites (site_slug, display_name, status)
values ('gosaki-piano', 'Gosaki Piano', 'active')
on conflict (site_slug) do update
  set display_name = excluded.display_name,
      status = 'active',
      updated_at = now();

-- 2) Membership (operator fills UUIDs — never commit real emails/ids in git)
-- insert into public.site_members (site_id, user_id, role)
-- select s.id, ':owner_user_id'::uuid, 'owner'
-- from public.sites s where s.site_slug = 'gosaki-piano'
-- on conflict do nothing;

-- insert into public.platform_admins (user_id, active)
-- values (':platform_admin_user_id'::uuid, true)
-- on conflict (user_id) do update set active = true;

-- 3) YouTube embed from current JSON SoT
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
  'gosaki-piano',
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
-- select legacy_item_id, published, source_url, embed_url, updated_at
-- from public.site_embeds
-- where site_slug = 'gosaki-piano' and provider = 'youtube';
