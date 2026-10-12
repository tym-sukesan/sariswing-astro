-- Gosaki Discography operational extra-fields RPC (TEMPLATE — DO NOT EXECUTE)
-- Phase: gosaki-discography-extra-fields-edit-local
-- Project: kmjqppxjdnwwrtaeqjta only. STOP if the project is vsbvndwuajjhnzpohghh.
--
-- Adds public.gosaki_discography_operational_save_extra_fields.
-- Does not replace gosaki_discography_operational_save.
-- Does not replace gosaki_discography_operational_create.
-- Does not replace gosaki_discography_operational_set_published.
-- Does not change RLS or table privileges.
-- Does not use a privileged service key.
--
-- The function owner is current_user at APPLY time. APPLY stops unless that
-- role owns public.discography. anon and authenticated must not own it.
-- search_path is fixed on the function. can_write_site reads auth.uid()
-- and takes no user id from the caller.
--
-- This function updates only price, purchase_note, release_display,
-- catalog_number, streaming_url, cover_image_url, and updated_at
-- on one gosaki-piano row. It does not change published, tracks, sort_order,
-- or the columns written by gosaki_discography_operational_save.
--
-- Run the PRECHECK section alone first. Run APPLY only after a separate explicit approval.

-- =============================================================================
-- PRECHECK (read-only) — run this section alone
-- =============================================================================

select current_database() as database_name;

select current_user as apply_role;

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
    'gosaki_discography_operational_save_extra_fields',
    'gosaki_discography_operational_save',
    'gosaki_discography_operational_create',
    'gosaki_discography_operational_set_published',
    'can_write_site'
  )
order by p.proname;
-- Expect save and can_write_site. Expect save_extra_fields to be absent before APPLY.
-- create and set_published may be absent. This script does not create them.

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discography'
  and column_name in (
    'site_slug',
    'legacy_id',
    'updated_at',
    'price',
    'purchase_note',
    'release_display',
    'catalog_number',
    'streaming_url',
    'cover_image_url'
  )
order by column_name;
-- Expect all 9 columns.

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

do $save_extra_fields_owner_check$
declare
  v_owner name;
begin
  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'gosaki_discography_operational_save_extra_fields'
  ) then
    raise exception 'STOP: public.gosaki_discography_operational_save_extra_fields already exists';
  end if;

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

  if current_user in ('anon', 'authenticated') then
    raise exception 'STOP: anon and authenticated must not own this function';
  end if;

  if current_user is distinct from v_owner then
    raise exception 'STOP: current_user must be the owner of public.discography';
  end if;
end
$save_extra_fields_owner_check$;

create function public.gosaki_discography_operational_save_extra_fields(
  p_site_slug text,
  p_legacy_id text,
  p_expected_before_updated_at timestamptz,
  p_price text,
  p_purchase_note text,
  p_release_display text,
  p_catalog_number text,
  p_streaming_url text,
  p_cover_image_url text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $gosaki_discography_operational_save_extra_fields$
declare
  v_site_id uuid;
  v_site_count integer;
  v_site_status text;
  v_can_write boolean;
  v_site_slug text;
  v_legacy_id text;
  v_updated_at timestamptz;
  v_next_updated_at timestamptz;
  v_price text;
  v_purchase_note text;
  v_release_display text;
  v_catalog_number text;
  v_streaming_url text;
  v_cover_image_url text;
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

  v_price := nullif(btrim(coalesce(p_price, '')), '');
  v_purchase_note := nullif(btrim(coalesce(p_purchase_note, '')), '');
  v_release_display := nullif(btrim(coalesce(p_release_display, '')), '');
  v_catalog_number := nullif(btrim(coalesce(p_catalog_number, '')), '');
  v_streaming_url := nullif(btrim(coalesce(p_streaming_url, '')), '');
  v_cover_image_url := nullif(btrim(coalesce(p_cover_image_url, '')), '');

  if v_price is not null and (char_length(v_price) > 200 or v_price ~ '[<>]') then
    return jsonb_build_object('ok', false, 'reason_code', 'field_validation_failed', 'message', 'invalid price', 'http_status', 400);
  end if;
  if v_release_display is not null and (char_length(v_release_display) > 200 or v_release_display ~ '[<>]') then
    return jsonb_build_object('ok', false, 'reason_code', 'field_validation_failed', 'message', 'invalid release_display', 'http_status', 400);
  end if;
  if v_catalog_number is not null and (char_length(v_catalog_number) > 200 or v_catalog_number ~ '[<>]') then
    return jsonb_build_object('ok', false, 'reason_code', 'field_validation_failed', 'message', 'invalid catalog_number', 'http_status', 400);
  end if;
  if v_purchase_note is not null and (char_length(v_purchase_note) > 5000 or v_purchase_note ~ '[<>]') then
    return jsonb_build_object('ok', false, 'reason_code', 'field_validation_failed', 'message', 'invalid purchase_note', 'http_status', 400);
  end if;
  if v_streaming_url is not null and (
    char_length(v_streaming_url) > 2000
    or v_streaming_url ~ '[<>]'
    or v_streaming_url ~* '^javascript:'
    or v_streaming_url !~* '^https?://'
  ) then
    return jsonb_build_object('ok', false, 'reason_code', 'field_validation_failed', 'message', 'invalid streaming_url', 'http_status', 400);
  end if;
  if v_cover_image_url is not null and (
    char_length(v_cover_image_url) > 2000
    or v_cover_image_url ~ '[<>]'
    or v_cover_image_url ~* '^javascript:'
    or v_cover_image_url !~* '^https?://'
  ) then
    return jsonb_build_object('ok', false, 'reason_code', 'field_validation_failed', 'message', 'invalid cover_image_url', 'http_status', 400);
  end if;

  select d.updated_at
  into v_updated_at
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

  update public.discography d
  set
    price = v_price,
    purchase_note = v_purchase_note,
    release_display = v_release_display,
    catalog_number = v_catalog_number,
    streaming_url = v_streaming_url,
    cover_image_url = v_cover_image_url,
    updated_at = now()
  where d.site_slug = v_site_slug
    and d.legacy_id = v_legacy_id
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
    'updated_at', v_next_updated_at,
    'price', v_price,
    'purchase_note', v_purchase_note,
    'release_display', v_release_display,
    'catalog_number', v_catalog_number,
    'streaming_url', v_streaming_url,
    'cover_image_url', v_cover_image_url,
    'http_status', 200
  );
end;
$gosaki_discography_operational_save_extra_fields$;

comment on function public.gosaki_discography_operational_save_extra_fields(
  text, text, timestamptz, text, text, text, text, text, text
) is
  'Gosaki extra-fields RPC. SECURITY DEFINER; owner is the discography table owner; requires can_write_site; six columns and updated_at only; no table grants.';

revoke all on function public.gosaki_discography_operational_save_extra_fields(
  text, text, timestamptz, text, text, text, text, text, text
) from public;

revoke all on function public.gosaki_discography_operational_save_extra_fields(
  text, text, timestamptz, text, text, text, text, text, text
) from anon;

grant execute on function public.gosaki_discography_operational_save_extra_fields(
  text, text, timestamptz, text, text, text, text, text, text
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
  and p.proname = 'gosaki_discography_operational_save_extra_fields';
-- Expect security_definer true, function_owner equal to the discography table owner,
-- and proconfig containing search_path=pg_catalog, public.

-- This template does not add table write privileges.
-- anon stays without EXECUTE. RLS policies are unchanged.
