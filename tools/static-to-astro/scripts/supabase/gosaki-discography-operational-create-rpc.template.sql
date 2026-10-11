-- Gosaki Discography operational create RPC (TEMPLATE — DO NOT EXECUTE)
-- Phase: gosaki-discography-create-rpc-local
-- Project: kmjqppxjdnwwrtaeqjta only. STOP if the project is vsbvndwuajjhnzpohghh.
--
-- Adds public.gosaki_discography_operational_create.
-- Does not replace gosaki_discography_operational_save.
-- Does not change Admin UI, Edge Functions, RLS, or table privileges.
-- Does not use a privileged service key.
--
-- The function owner is the role that runs this script. That role must own
-- the discography tables. anon and authenticated must not own it.
-- search_path is fixed on the function. can_write_site reads auth.uid()
-- and takes no user id from the caller.
--
-- Run the PRECHECK section alone first. Run APPLY only after a separate explicit approval.

-- =============================================================================
-- PRECHECK (read-only) — run this section alone
-- =============================================================================

select current_database() as database_name;

select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'gosaki_discography_operational_create',
    'gosaki_discography_operational_save',
    'can_write_site'
  )
order by p.proname;
-- Expect save and can_write_site. Expect create to be absent before APPLY.

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'discography'
  and indexdef ilike '%legacy_id%';
-- STOP unless legacy_id has a global UNIQUE index or constraint.

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discography'
  and column_name in (
    'site_slug',
    'legacy_id',
    'title',
    'artist',
    'release_date',
    'release_display',
    'label',
    'catalog_number',
    'description',
    'price',
    'purchase_note',
    'purchase_url',
    'streaming_url',
    'cover_image_url',
    'sort_order',
    'published'
  )
order by column_name;
-- Expect all 17 columns.

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discography_tracks'
  and column_name in (
    'site_slug',
    'discography_legacy_id',
    'track_number',
    'sort_order',
    'title'
  )
order by column_name;
-- Expect all 5 columns.

select coalesce(max((substring(legacy_id from '^discography-([0-9]{3})$'))::integer), 0) as max_legacy_number
from public.discography
where legacy_id ~ '^discography-[0-9]{3}$';
-- STOP if this value is >= 999.

-- =============================================================================
-- APPLY (write) — DO NOT RUN until a separate explicit approval
-- =============================================================================

begin;

create or replace function public.gosaki_discography_operational_create(
  p_site_slug text,
  p_title text,
  p_artist text,
  p_release_date date,
  p_release_display text,
  p_label text,
  p_catalog_number text,
  p_description text,
  p_price text,
  p_purchase_note text,
  p_purchase_url text,
  p_streaming_url text,
  p_cover_image_url text,
  p_track_titles text[]
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $gosaki_discography_operational_create$
declare
  v_site_id uuid;
  v_site_count integer;
  v_site_status text;
  v_can_write boolean;
  v_site_slug text;
  v_title text;
  v_artist text;
  v_release_date date;
  v_release_display text;
  v_label text;
  v_catalog_number text;
  v_description text;
  v_price text;
  v_purchase_note text;
  v_purchase_url text;
  v_streaming_url text;
  v_cover_image_url text;
  v_track_titles text[] := array[]::text[];
  v_i integer;
  v_line text;
  v_max_legacy integer;
  v_next_legacy integer;
  v_legacy_id text;
  v_sort_order integer;
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

  v_title := btrim(coalesce(p_title, ''));
  if v_title = '' or char_length(v_title) > 200 or v_title ~ '[<>]' then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid title',
      'http_status', 400
    );
  end if;

  v_artist := nullif(btrim(coalesce(p_artist, '')), '');
  if v_artist is not null and (char_length(v_artist) > 200 or v_artist ~ '[<>]') then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid artist',
      'http_status', 400
    );
  end if;

  v_release_date := p_release_date;

  v_release_display := nullif(btrim(coalesce(p_release_display, '')), '');
  if v_release_display is not null and (char_length(v_release_display) > 200 or v_release_display ~ '[<>]') then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid release_display',
      'http_status', 400
    );
  end if;

  v_label := nullif(btrim(coalesce(p_label, '')), '');
  if v_label is not null and (char_length(v_label) > 200 or v_label ~ '[<>]') then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid label',
      'http_status', 400
    );
  end if;

  v_catalog_number := nullif(btrim(coalesce(p_catalog_number, '')), '');
  if v_catalog_number is not null and (char_length(v_catalog_number) > 200 or v_catalog_number ~ '[<>]') then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid catalog_number',
      'http_status', 400
    );
  end if;

  v_description := nullif(btrim(coalesce(p_description, '')), '');
  if v_description is not null and (char_length(v_description) > 5000 or v_description ~ '[<>]') then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid description',
      'http_status', 400
    );
  end if;

  v_price := nullif(btrim(coalesce(p_price, '')), '');
  if v_price is not null and (char_length(v_price) > 200 or v_price ~ '[<>]') then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid price',
      'http_status', 400
    );
  end if;

  v_purchase_note := nullif(btrim(coalesce(p_purchase_note, '')), '');
  if v_purchase_note is not null and (char_length(v_purchase_note) > 5000 or v_purchase_note ~ '[<>]') then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid purchase_note',
      'http_status', 400
    );
  end if;

  v_purchase_url := nullif(btrim(coalesce(p_purchase_url, '')), '');
  if v_purchase_url is not null then
    if char_length(v_purchase_url) > 2000
       or lower(v_purchase_url) like 'javascript:%'
       or v_purchase_url !~* '^https?://'
       or v_purchase_url ~ '[<>]' then
      return jsonb_build_object(
        'ok', false,
        'reason_code', 'field_validation_failed',
        'message', 'invalid purchase_url',
        'http_status', 400
      );
    end if;
  end if;

  v_streaming_url := nullif(btrim(coalesce(p_streaming_url, '')), '');
  if v_streaming_url is not null then
    if char_length(v_streaming_url) > 2000
       or lower(v_streaming_url) like 'javascript:%'
       or v_streaming_url !~* '^https?://'
       or v_streaming_url ~ '[<>]' then
      return jsonb_build_object(
        'ok', false,
        'reason_code', 'field_validation_failed',
        'message', 'invalid streaming_url',
        'http_status', 400
      );
    end if;
  end if;

  v_cover_image_url := nullif(btrim(coalesce(p_cover_image_url, '')), '');
  if v_cover_image_url is not null then
    if char_length(v_cover_image_url) > 2000
       or lower(v_cover_image_url) like 'javascript:%'
       or v_cover_image_url !~* '^https?://'
       or v_cover_image_url ~ '[<>]' then
      return jsonb_build_object(
        'ok', false,
        'reason_code', 'field_validation_failed',
        'message', 'invalid cover_image_url',
        'http_status', 400
      );
    end if;
  end if;

  if p_track_titles is null then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'tracks_required',
      'message', 'track titles array is required',
      'http_status', 400
    );
  end if;

  if coalesce(array_length(p_track_titles, 1), 0) > 100 then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'tracks_validation_failed',
      'message', 'too many tracks',
      'http_status', 400
    );
  end if;

  for v_i in 1 .. coalesce(array_length(p_track_titles, 1), 0) loop
    v_line := btrim(coalesce(p_track_titles[v_i], ''));
    if v_line = '' then
      continue;
    end if;
    if char_length(v_line) > 200 or v_line ~ '[<>]' then
      return jsonb_build_object(
        'ok', false,
        'reason_code', 'tracks_validation_failed',
        'message', 'invalid track title',
        'http_status', 400
      );
    end if;
    v_track_titles := array_append(v_track_titles, v_line);
  end loop;

  -- Serialize this RPC only. Do not lock existing albums.
  -- A writer outside this RPC can still insert an id; the global UNIQUE
  -- then rolls this album and its tracks back together.
  perform pg_advisory_xact_lock(
    hashtext('public.gosaki_discography_operational_create'),
    hashtext('legacy_id')
  );

  select coalesce(max((substring(d.legacy_id from '^discography-([0-9]{3})$'))::integer), 0)
  into v_max_legacy
  from public.discography d
  where d.legacy_id ~ '^discography-[0-9]{3}$';

  if v_max_legacy >= 999 then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'legacy_id_exhausted',
      'message', 'discography-999 is the last id',
      'http_status', 409
    );
  end if;

  v_next_legacy := v_max_legacy + 1;
  v_legacy_id := 'discography-' || lpad(v_next_legacy::text, 3, '0');
  if v_legacy_id !~ '^discography-[0-9]{3}$' then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'legacy_id_allocation_failed',
      'message', 'allocated legacy_id is not discography-NNN',
      'http_status', 500
    );
  end if;

  select coalesce(max(d.sort_order), 0) + 1
  into v_sort_order
  from public.discography d
  where d.site_slug = v_site_slug;

  if v_sort_order is null or v_sort_order < 1 or v_sort_order > 1000000 then
    return jsonb_build_object(
      'ok', false,
      'reason_code', 'sort_order_exhausted',
      'message', 'next sort_order is outside 1..1000000',
      'http_status', 409
    );
  end if;

  begin
    insert into public.discography (
      site_slug,
      legacy_id,
      title,
      artist,
      release_date,
      release_display,
      label,
      catalog_number,
      description,
      price,
      purchase_note,
      purchase_url,
      streaming_url,
      cover_image_url,
      sort_order,
      published,
      created_at,
      updated_at
    ) values (
      v_site_slug,
      v_legacy_id,
      v_title,
      v_artist,
      v_release_date,
      v_release_display,
      v_label,
      v_catalog_number,
      v_description,
      v_price,
      v_purchase_note,
      v_purchase_url,
      v_streaming_url,
      v_cover_image_url,
      v_sort_order,
      false,
      now(),
      now()
    );

    if coalesce(array_length(v_track_titles, 1), 0) > 0 then
      insert into public.discography_tracks (
        site_slug,
        discography_legacy_id,
        track_number,
        sort_order,
        title
      )
      select
        v_site_slug,
        v_legacy_id,
        gs.ordinality::integer,
        gs.ordinality::integer,
        gs.title
      from unnest(v_track_titles) with ordinality as gs(title, ordinality);
    end if;
  exception
    when unique_violation then
      return jsonb_build_object(
        'ok', false,
        'reason_code', 'legacy_id_conflict',
        'message', 'allocated legacy_id collided; album and tracks were rolled back',
        'http_status', 409
      );
    when others then
      return jsonb_build_object(
        'ok', false,
        'reason_code', 'create_failed',
        'message', 'create rolled back',
        'http_status', 500
      );
  end;

  return jsonb_build_object(
    'ok', true,
    'reason_code', 'ok',
    'legacy_id', v_legacy_id,
    'site_slug', v_site_slug,
    'sort_order', v_sort_order,
    'published', false,
    'track_count', coalesce(array_length(v_track_titles, 1), 0),
    'http_status', 200
  );
end;
$gosaki_discography_operational_create$;

comment on function public.gosaki_discography_operational_create(
  text, text, text, date, text, text, text, text, text, text, text, text, text, text[]
) is
  'Gosaki create RPC. SECURITY DEFINER; requires can_write_site; published stays false; no table grants.';

revoke all on function public.gosaki_discography_operational_create(
  text, text, text, date, text, text, text, text, text, text, text, text, text, text[]
) from public;

revoke all on function public.gosaki_discography_operational_create(
  text, text, text, date, text, text, text, text, text, text, text, text, text, text[]
) from anon;

grant execute on function public.gosaki_discography_operational_create(
  text, text, text, date, text, text, text, text, text, text, text, text, text, text[]
) to authenticated;

commit;

-- This template does not add table write privileges.
-- anon stays without EXECUTE. RLS policies are unchanged.
-- Existing discography rows are not updated.
