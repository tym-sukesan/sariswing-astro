-- =============================================================================
-- Gosaki About CONTENT seed — profile.lede ONLY — TEMPLATE (DO NOT EXECUTE)
-- Source first paragraph: tools/static-to-astro/config/sites/gosaki-piano-about-content.json
--   block about-profile-html → first <p> text
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Prerequisite: public.sites row gosaki-piano + public.site_page_fields + RLS
-- Access (owner / platform_admin): reuse existing YouTube access assignment — not this file
-- Does NOT insert sites / site_members / platform_admins
-- Fail-closed: NO ON CONFLICT upsert — refuses if target row already exists
-- created_by / updated_by: set by audit trigger from auth.uid(); SQL Editor sessions
--   often have auth.uid()=null → both may remain null (acceptable for this seed)
-- =============================================================================

begin;

do $$
declare
  v_site_n int;
  v_field_n int;
  v_site_id uuid;
  v_site_slug text;
  v_value text;
  v_published boolean;
  v_sort int;
begin
  select count(*)::int into v_site_n
  from public.sites
  where site_slug = 'gosaki-piano';

  if v_site_n <> 1 then
    raise exception
      'STOP: expected exactly 1 sites row for gosaki-piano, found %',
      v_site_n;
  end if;

  if to_regclass('public.site_page_fields') is null then
    raise exception 'STOP: site_page_fields missing — apply migration first';
  end if;

  select count(*)::int into v_field_n
  from public.site_page_fields
  where site_slug = 'gosaki-piano'
    and page_key = 'about'
    and field_key = 'profile.lede';

  if v_field_n > 0 then
    raise exception
      'STOP: about/profile.lede already exists (% row(s)) — refuse overwrite; use approved rollback or new phase',
      v_field_n;
  end if;

  select s.id, s.site_slug
    into v_site_id, v_site_slug
  from public.sites s
  where s.site_slug = 'gosaki-piano';

  insert into public.site_page_fields (
    site_id,
    site_slug,
    page_key,
    field_key,
    value_text,
    published,
    sort_order
  )
  values (
    v_site_id,
    v_site_slug,
    'about',
    'profile.lede',
    '後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。',
    true,
    10
  );

  select value_text, published, sort_order
    into v_value, v_published, v_sort
  from public.site_page_fields
  where site_slug = 'gosaki-piano'
    and page_key = 'about'
    and field_key = 'profile.lede';

  if not found then
    raise exception 'STOP: seed insert verification failed — row missing after INSERT';
  end if;

  select count(*)::int into v_field_n
  from public.site_page_fields
  where site_slug = 'gosaki-piano'
    and page_key = 'about'
    and field_key = 'profile.lede';

  if v_field_n <> 1 then
    raise exception
      'STOP: expected exactly 1 about/profile.lede row after INSERT, found %',
      v_field_n;
  end if;

  if v_value is distinct from '後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。'
     or v_published is distinct from true
     or v_sort is distinct from 10 then
    raise exception
      'STOP: seed verification mismatch — value_text/published/sort_order not as seeded';
  end if;
end $$;

commit;

-- Verify (SELECT only):
-- select page_key, field_key, value_text, published, sort_order, site_slug,
--        created_by, updated_by, updated_at
-- from public.site_page_fields
-- where site_slug = 'gosaki-piano'
--   and page_key = 'about'
--   and field_key = 'profile.lede';
-- expect 1 row; created_by/updated_by may be null when run in SQL Editor
