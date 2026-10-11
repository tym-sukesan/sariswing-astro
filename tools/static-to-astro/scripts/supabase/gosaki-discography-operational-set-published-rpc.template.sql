-- Gosaki Discography operational set-published RPC (TEMPLATE — DO NOT EXECUTE)
-- Phase: gosaki-discography-set-published-rpc-local
-- Project: kmjqppxjdnwwrtaeqjta only. STOP if the project is vsbvndwuajjhnzpohghh.
--
-- Adds public.gosaki_discography_operational_set_published.
-- Does not replace gosaki_discography_operational_save.
-- Does not replace gosaki_discography_operational_create.
-- Does not change Admin UI, Edge Functions, RLS, or table privileges.
-- Does not use a privileged service key.
--
-- The function owner is current_user at APPLY time. APPLY stops unless that
-- role owns public.discography. anon and authenticated must not own it.
-- search_path is fixed on the function. can_write_site reads auth.uid()
-- and takes no user id from the caller.
--
-- This function sets published from false to true on one gosaki-piano row.
-- It also sets updated_at. It does not change any other column and does not
-- write tracks. It does not set published back to false and it does not delete.
--
-- Run the PRECHECK section alone first. Run APPLY only after a separate explicit approval.

-- =============================================================================
-- PRECHECK (read-only) — run this section alone
-- =============================================================================

select current_database() as database_name;

select pg_catalog.current_user as apply_role;

select r.rolname as discography_table_owner
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
join pg_catalog.pg_roles r on r.oid = c.relowner
where n.nspname = 'public'
  and c.relname = 'discography';
-- STOP unless APPLY will be run by this owner. anon and authenticated are not acceptable.

select p.proname
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'gosaki_discography_operational_set_published',
    'gosaki_discography_operational_save',
    'gosaki_discography_operational_create',
    'can_write_site'
  )
order by p.proname;
-- Expect save and can_write_site. Expect set_published to be absent before APPLY.
-- create may be absent. This script does not create it.

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discography'
  and column_name in ('site_slug', 'legacy_id', 'published', 'updated_at')
order by column_name;
-- Expect all 4 columns.

select tgname, tgenabled
from pg_catalog.pg_trigger
where tgrelid = 'public.discography'::pg_catalog.regclass
  and not tgisinternal
  and tgname = 'discography_set_updated_at';
-- The updated_at trigger stays enabled. This script does not disable it.

-- =============================================================================
-- APPLY (write) — DO NOT RUN until a separate explicit approval
-- =============================================================================

begin;

do $set_published_owner_check$
declare
  v_owner name;
begin
  select r.rolname
  into v_owner
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  join pg_catalog.pg_roles r on r.oid = c.relowner
  where n.nspname = 'public'
    and c.relname = 'discography';

  if v_owner is null then
    raise exception 'STOP: public.discography owner is missing';
  end if;

  if pg_catalog.current_user in ('anon', 'authenticated') then
    raise exception 'STOP: anon and authenticated must not own this function';
  end if;

  if pg_catalog.current_user is distinct from v_owner then
    raise exception 'STOP: current_user must be the owner of public.discography';
  end if;
end
$set_published_owner_check$;

create or replace function public.gosaki_discography_operational_set_published(
  p_site_slug text,
  p_legacy_id text,
  p_expected_before_updated_at timestamptz,
  p_published boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $gosaki_discography_operational_set_published$
declare
  v_site_id uuid;
  v_site_count integer;
  v_site_status text;
  v_can_write boolean;
  v_site_slug text;
  v_legacy_id text;
  v_published boolean;
  v_updated_at timestamptz;
  v_next_updated_at timestamptz;
begin
  v_site_slug := btrim(coalesce(p_site_slug, ''));
  if v_site_slug = '' then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'site_slug_required',
      'message', 'p_site_slug must not be empty',
      'http_status', 400
    );
  end if;

  if v_site_slug <> 'gosaki-piano' then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'site_mismatch',
      'message', 'siteSlug must be gosaki-piano',
      'http_status', 400
    );
  end if;

  select count(*)::integer
  into v_site_count
  from public.sites s
  where s.site_slug = v_site_slug;

  if v_site_count is distinct from 1 then
    return jsonb_build_object(
      'ok', false,
      'reason_code', case
        when coalesce(v_site_count, 0) = 0 then 'site_resolve_failed'
        else 'site_resolve_ambiguous'
      end,
      'message', 'sites.site_slug must resolve to exactly one row',
      'http_status', case when coalesce(v_site_count, 0) = 0 then 503 else 409 end
    );
  end if;

  select s.id, s.status
  into v_site_id, v_site_status
  from public.sites s
  where s.site_slug = v_site_slug;

  if v_site_id is null then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'site_resolve_failed',
      'message', 'sites.id missing after resolve',
      'http_status', 503
    );
  end if;

  if v_site_status is distinct from 'active' then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'site_suspended',
      'message', 'site is not active',
      'http_status', 403
    );
  end if;

  begin
    v_can_write := public.can_write_site(v_site_id);
  exception
    when others then
      return jsonb_build_object(
        'ok', false,
        'reason_code', 'can_write_site_probe_failed',
        'message', 'can_write_site probe failed',
        'http_status', 403
      );
  end;

  if v_can_write is distinct from true then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'can_write_site_denied',
      'message', 'can_write_site(site_id) must be true',
      'http_status', 403
    );
  end if;

  if p_published is distinct from true then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'publish_only',
      'message', 'only published=true is accepted',
      'http_status', 400
    );
  end if;

  v_legacy_id := btrim(coalesce(p_legacy_id, ''));
  if v_legacy_id = '' then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'legacy_id_required',
      'message', 'legacyId is required',
      'http_status', 400
    );
  end if;

  if v_legacy_id !~ '^discography-[0-9]{3}$' then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'legacy_id_mismatch',
      'message', 'legacyId must match discography-NNN',
      'http_status', 400
    );
  end if;

  if p_expected_before_updated_at is null then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'optimistic_lock_missing',
      'message', 'expectedBeforeUpdatedAt is required',
      'http_status', 400
    );
  end if;

  select d.published, d.updated_at
  into v_published, v_updated_at
  from public.discography d
  where d.site_slug = v_site_slug
    and d.legacy_id = v_legacy_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'release_not_found',
      'message', 'discography row was not found',
      'http_status', 404
    );
  end if;

  if v_updated_at is distinct from p_expected_before_updated_at then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'optimistic_lock_conflict',
      'message', 'expectedBeforeUpdatedAt does not match current updated_at',
      'http_status', 409
    );
  end if;

  if v_published is true then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'already_published',
      'message', 'published row was not changed',
      'legacy_id', v_legacy_id,
      'published', true,
      'http_status', 422
    );
  end if;

  if v_published is distinct from false then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'published_state_invalid',
      'message', 'published must be false before publish',
      'http_status', 422
    );
  end if;

  update public.discography d
  set
    published = true,
    updated_at = now()
  where d.site_slug = v_site_slug
    and d.legacy_id = v_legacy_id
    and d.published is false
    and d.updated_at = p_expected_before_updated_at
  returning d.updated_at into v_next_updated_at;

  if v_next_updated_at is null then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'optimistic_lock_conflict',
      'message', 'UPDATE matched 0 rows',
      'http_status', 409
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'reason_code', 'ok',
    'legacy_id', v_legacy_id,
    'published', true,
    'updated_at', v_next_updated_at,
    'http_status', 200
  );
end;
$gosaki_discography_operational_set_published$;

comment on function public.gosaki_discography_operational_set_published(
  text, text, timestamptz, boolean
) is
  'Gosaki publish RPC. SECURITY DEFINER; owner is the discography table owner; requires can_write_site; false to true only; no table grants.';

revoke all on function public.gosaki_discography_operational_set_published(
  text, text, timestamptz, boolean
) from public;

revoke all on function public.gosaki_discography_operational_set_published(
  text, text, timestamptz, boolean
) from anon;

grant execute on function public.gosaki_discography_operational_set_published(
  text, text, timestamptz, boolean
) to authenticated;

commit;

-- =============================================================================
-- POSTCHECK (read-only) — run after APPLY commits
-- =============================================================================

select p.proname,
       p.prosecdef as security_definer,
       r.rolname as function_owner,
       p.proconfig
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
join pg_catalog.pg_roles r on r.oid = p.proowner
where n.nspname = 'public'
  and p.proname = 'gosaki_discography_operational_set_published';
-- Expect security_definer true, function_owner equal to the discography table owner,
-- and proconfig containing search_path=pg_catalog, public.

-- This template does not add table write privileges.
-- anon stays without EXECUTE. RLS policies are unchanged.
-- Tracks are not written. Other discography columns are not assigned.
