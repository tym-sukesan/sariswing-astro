-- =============================================================================
-- Gosaki access assignment rollback — TEMPLATE (DO NOT EXECUTE without approval)
-- Staging: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
--
-- Premise:
--   Deletes ONLY the exact rows created by a successful first-time run of
--   cms-core-v2-gosaki-access-assignment.template.sql for the same two UUIDs:
--     - site_members (gosaki-piano, owner, v_owner_id)
--     - platform_admins (v_admin_id)
--   Does NOT delete sites / site_embeds / other members / other platform_admins.
--
-- Preconditions (all required — fail-closed):
--   1) Placeholders replaced with the SAME UUIDs used at assignment apply
--   2) gosaki-piano site exists
--   3) Target site_members + platform_admins rows exist (else STOP — wrong UUID
--      or already rolled back / never assigned)
--
-- NEVER commit real Auth UUIDs — replace placeholders in a local working copy
-- =============================================================================

begin;

do $$
declare
  c_placeholder_owner constant uuid := '00000000-0000-4000-8000-000000000001';
  c_placeholder_admin constant uuid := '00000000-0000-4000-8000-000000000002';
  -- Replace with the SAME UUIDs used when assignment was applied (do not commit):
  v_owner_id uuid := '00000000-0000-4000-8000-000000000001';
  v_admin_id uuid := '00000000-0000-4000-8000-000000000002';
  v_site_id uuid;
  v_member_deleted int;
  v_admin_deleted int;
begin
  if v_owner_id = c_placeholder_owner or v_admin_id = c_placeholder_admin then
    raise exception
      'STOP: access rollback placeholders not replaced — refuse rollback';
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
      'STOP: sites row missing for site_slug=gosaki-piano';
  end if;

  if not exists (
    select 1
    from public.site_members sm
    where sm.site_id = v_site_id
      and sm.user_id = v_owner_id
      and sm.role = 'owner'
  ) then
    raise exception
      'STOP: target site_members owner row not found — refuse rollback (wrong UUID or already undone)';
  end if;

  if not exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = v_admin_id
  ) then
    raise exception
      'STOP: target platform_admins row not found — refuse rollback (wrong UUID or already undone)';
  end if;

  delete from public.site_members sm
  where sm.site_id = v_site_id
    and sm.user_id = v_owner_id
    and sm.role = 'owner';
  get diagnostics v_member_deleted = row_count;

  delete from public.platform_admins pa
  where pa.user_id = v_admin_id;
  get diagnostics v_admin_deleted = row_count;

  if v_member_deleted <> 1 or v_admin_deleted <> 1 then
    raise exception
      'STOP: unexpected delete counts (members=%, admins=%) — transaction abort',
      v_member_deleted,
      v_admin_deleted;
  end if;
end $$;

commit;

-- Post-check (SELECT only):
-- expect 0 for the rolled-back owner/admin UUIDs; other rows (if any) remain
-- select count(*) from public.site_members sm
--   join public.sites s on s.id = sm.site_id
--  where s.site_slug = 'gosaki-piano';
-- select count(*) from public.platform_admins;
