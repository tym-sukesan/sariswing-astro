-- =============================================================================
-- Gosaki About CONTENT seed — profile.lede ONLY — TEMPLATE (DO NOT EXECUTE)
-- Source first paragraph: tools/static-to-astro/config/sites/gosaki-piano-about-content.json
--   block about-profile-html → first <p> text
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Prerequisite: public.sites row gosaki-piano + public.site_page_fields + RLS
-- Access (owner / platform_admin): reuse existing YouTube access assignment — not this file
-- Does NOT insert sites / site_members / platform_admins
-- =============================================================================

begin;

do $$
begin
  if not exists (
    select 1 from public.sites where site_slug = 'gosaki-piano'
  ) then
    raise exception 'STOP: sites.gosaki-piano missing — seed aborted';
  end if;
  if to_regclass('public.site_page_fields') is null then
    raise exception 'STOP: site_page_fields missing — apply migration first';
  end if;
end $$;

insert into public.site_page_fields (
  site_id,
  site_slug,
  page_key,
  field_key,
  value_text,
  published,
  sort_order
)
select
  s.id,
  s.site_slug,
  'about',
  'profile.lede',
  '後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。',
  true,
  10
from public.sites s
where s.site_slug = 'gosaki-piano'
on conflict (site_id, page_key, field_key) do update
  set value_text = excluded.value_text,
      published = excluded.published,
      sort_order = excluded.sort_order,
      site_slug = excluded.site_slug;

commit;

-- Verify (SELECT only):
-- select page_key, field_key, value_text, published, sort_order, site_slug, updated_at
-- from public.site_page_fields
-- where site_slug = 'gosaki-piano'
--   and page_key = 'about'
--   and field_key = 'profile.lede';
