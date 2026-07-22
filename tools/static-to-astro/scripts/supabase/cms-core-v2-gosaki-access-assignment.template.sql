-- =============================================================================
-- Gosaki access assignment — TEMPLATE (DO NOT EXECUTE)
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- First-time registration ONLY (fail-closed). No ON CONFLICT / upsert.
-- NEVER commit real Auth UUIDs or emails into this file / git.
-- Operator: replace BOTH placeholders in a local working copy, then apply once.
-- =============================================================================

begin;

do $$
declare
  -- Sentinel placeholders — MUST be replaced before apply
  c_placeholder_owner constant uuid := '00000000-0000-4000-8000-000000000001';
  c_placeholder_admin constant uuid := '00000000-0000-4000-8000-000000000002';
  -- Replace these two lines in a local working copy (do not commit):
  v_owner_id uuid := '00000000-0000-4000-8000-000000000001';
  v_admin_id uuid := '00000000-0000-4000-8000-000000000002';
  v_site_id uuid;
begin
  if v_owner_id = c_placeholder_owner or v_admin_id = c_placeholder_admin then
    raise exception
      'STOP: access assignment placeholders not replaced — refuse apply';
  end if;

  if v_owner_id = v_admin_id then
    raise exception
      'STOP: owner_user_id and platform_admin_user_id must be distinct UUIDs';
  end if;

  select s.id into v_site_id
  from public.sites s
  where s.site_slug = 'gosaki-piano';

  if v_site_id is null then
    raise exception
      'STOP: sites row missing for site_slug=gosaki-piano — run content seed first';
  end if;

  if not exists (select 1 from auth.users u where u.id = v_owner_id) then
    raise exception
      'STOP: owner Auth user not found in auth.users';
  end if;

  if not exists (select 1 from auth.users u where u.id = v_admin_id) then
    raise exception
      'STOP: platform_admin Auth user not found in auth.users';
  end if;

  if exists (
    select 1
    from public.site_members sm
    where sm.site_id = v_site_id
      and sm.user_id = v_owner_id
  ) then
    raise exception
      'STOP: site_members row already exists for this owner on gosaki-piano — first-time only';
  end if;

  if exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = v_admin_id
  ) then
    raise exception
      'STOP: platform_admins row already exists for this user_id — first-time only';
  end if;

  insert into public.site_members (site_id, user_id, role)
  values (v_site_id, v_owner_id, 'owner');

  insert into public.platform_admins (user_id, active)
  values (v_admin_id, true);
end $$;

commit;

-- Verify (SELECT only — do not paste real emails into git docs):
-- select sm.user_id, sm.role, s.site_slug
-- from public.site_members sm
-- join public.sites s on s.id = sm.site_id
-- where s.site_slug = 'gosaki-piano';
-- select user_id, active from public.platform_admins;
