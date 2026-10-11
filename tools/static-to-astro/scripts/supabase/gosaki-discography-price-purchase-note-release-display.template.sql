-- Gosaki discography public content columns (TEMPLATE — DO NOT EXECUTE)
-- Phase: gosaki-discography-sql-final-preflight
-- Project: kmjqppxjdnwwrtaeqjta only. STOP if the project is vsbvndwuajjhnzpohghh.
--
-- DDL: three nullable text columns only.
--   price, purchase_note, release_display
-- No COMMENT, no trigger change, no RLS, no privilege change, no Save RPC change.
--
-- DML: UPDATE only site_slug = gosaki-piano and legacy_id discography-001..004.
-- A non-null value that differs from the intended text aborts the transaction.
-- A row whose three values already match is not updated.
-- updated_at may advance on a real UPDATE if a BEFORE UPDATE trigger exists.
-- That trigger is left enabled.
--
-- Run PRECHECK alone first. Run APPLY only after a separate explicit approval.
-- Run POSTCHECK after a successful commit.

-- =============================================================================
-- PRECHECK (read-only) — run this section alone
-- =============================================================================

select current_database() as database_name;

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discography'
order by ordinal_position;
-- Expect the live discography columns.
-- price, purchase_note, release_display are absent before APPLY.
-- After APPLY they are text, nullable, with no default.

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography'
  and grantee in ('anon', 'authenticated', 'public')
order by grantee, privilege_type;
-- Expect anon SELECT at table level. STOP if anon has INSERT, UPDATE, or DELETE.
-- STOP if anon has no table-level SELECT.

select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'discography'
  and grantee in ('anon', 'authenticated', 'public')
order by grantee, column_name, privilege_type;
-- If this list is a subset of columns, new columns are not readable.
-- STOP and do not add a privilege change in this script.

select policyname, cmd, roles::text
from pg_policies
where schemaname = 'public'
  and tablename = 'discography'
order by policyname;
-- Record the policies. This script does not create or replace any policy.

select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.discography'::regclass
  and not tgisinternal
order by tgname;
-- Record triggers. discography_set_updated_at may be present.
-- APPLY does not disable it. A real backfill UPDATE may advance updated_at.

select legacy_id, site_slug, title, cover_image_url, updated_at
from public.discography
where legacy_id in (
  'discography-001',
  'discography-002',
  'discography-003',
  'discography-004'
)
order by legacy_id;
-- Expect exactly 4 rows. Each site_slug must be gosaki-piano.
-- Record cover_image_url and updated_at. This script does not change cover_image_url.

select count(*) as target_row_count
from public.discography
where site_slug = 'gosaki-piano'
  and legacy_id in (
    'discography-001',
    'discography-002',
    'discography-003',
    'discography-004'
  );
-- Expect 4.

select legacy_id, count(*) as copies
from public.discography
where legacy_id in (
  'discography-001',
  'discography-002',
  'discography-003',
  'discography-004'
)
group by legacy_id
having count(*) <> 1;
-- Expect 0 rows.

select legacy_id, site_slug
from public.discography
where legacy_id in (
  'discography-001',
  'discography-002',
  'discography-003',
  'discography-004'
)
  and site_slug is distinct from 'gosaki-piano';
-- Expect 0 rows. STOP if any row appears.

-- =============================================================================
-- APPLY (write) — DO NOT RUN until a separate explicit approval
-- =============================================================================

begin;

do $gosaki_discography_content_precheck$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.discography
  where site_slug = 'gosaki-piano'
    and legacy_id in (
      'discography-001',
      'discography-002',
      'discography-003',
      'discography-004'
    );
  if v_count <> 4 then
    raise exception 'PRECHECK failed: expected 4 gosaki-piano rows 001-004, found %', v_count;
  end if;

  select count(*) into v_count
  from (
    select legacy_id
    from public.discography
    where legacy_id in (
      'discography-001',
      'discography-002',
      'discography-003',
      'discography-004'
    )
    group by legacy_id
    having count(*) <> 1
  ) duplicated;
  if v_count <> 0 then
    raise exception 'PRECHECK failed: legacy_id 001-004 is not unique';
  end if;

  select count(*) into v_count
  from public.discography
  where legacy_id in (
    'discography-001',
    'discography-002',
    'discography-003',
    'discography-004'
  )
    and site_slug is distinct from 'gosaki-piano';
  if v_count <> 0 then
    raise exception 'PRECHECK failed: legacy_id 001-004 exists outside site_slug gosaki-piano';
  end if;
end
$gosaki_discography_content_precheck$;

alter table public.discography
  add column if not exists price text,
  add column if not exists purchase_note text,
  add column if not exists release_display text;

do $gosaki_discography_content_backfill$
declare
  v_count integer;
  v_id uuid;
  v_price text;
  v_note text;
  v_display text;
  v_updated timestamptz;
  v_expected record;
  v_target jsonb;
  v_outside jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
    into v_target
  from (
    select
      id,
      legacy_id,
      site_slug,
      title,
      artist,
      label,
      catalog_number,
      description,
      cover_image_url,
      purchase_url,
      streaming_url,
      release_date,
      sort_order,
      published
    from public.discography
    where site_slug = 'gosaki-piano'
      and legacy_id in (
        'discography-001',
        'discography-002',
        'discography-003',
        'discography-004'
      )
  ) s;

  if jsonb_array_length(v_target) <> 4 then
    raise exception 'PRECHECK failed: snapshot does not contain 4 target rows';
  end if;

  select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
    into v_outside
  from (
    select
      id,
      legacy_id,
      site_slug,
      title,
      cover_image_url,
      price,
      purchase_note,
      release_display,
      updated_at
    from public.discography
    where not (
      site_slug = 'gosaki-piano'
      and legacy_id in (
        'discography-001',
        'discography-002',
        'discography-003',
        'discography-004'
      )
    )
  ) s;

  for v_expected in
    select *
    from (
      values
        (
          'discography-001'::text,
          '3,500 (tax in)'::text,
          'オンラインショップからご購入いただけます'::text,
          'Release 2023.7.26'::text
        ),
        (
          'discography-002',
          '2,000 (tax in)',
          'オンラインショップからご購入いただけます',
          'Release 2023.4.26'
        ),
        (
          'discography-003',
          '2,500(tax in)',
          E'Thank you SOLD OUT!\n各種サブスクにてお聴きいただけます',
          'Release 2019.01.11'
        ),
        (
          'discography-004',
          '2,000 (tax in)',
          'ライブ会場でご購入いただけます',
          'Release 2015.03.21'
        )
    ) as expected(legacy_id, price, purchase_note, release_display)
  loop
    select id, price, purchase_note, release_display, updated_at
      into v_id, v_price, v_note, v_display, v_updated
    from public.discography
    where site_slug = 'gosaki-piano'
      and legacy_id = v_expected.legacy_id
    for update;

    if not found then
      raise exception 'PRECHECK failed: missing %', v_expected.legacy_id;
    end if;

    if v_price is not null and v_price is distinct from v_expected.price then
      raise exception 'REFUSING overwrite of price on %', v_expected.legacy_id;
    end if;
    if v_note is not null and v_note is distinct from v_expected.purchase_note then
      raise exception 'REFUSING overwrite of purchase_note on %', v_expected.legacy_id;
    end if;
    if v_display is not null and v_display is distinct from v_expected.release_display then
      raise exception 'REFUSING overwrite of release_display on %', v_expected.legacy_id;
    end if;

    if v_price is not distinct from v_expected.price
       and v_note is not distinct from v_expected.purchase_note
       and v_display is not distinct from v_expected.release_display then
      continue;
    end if;

    update public.discography
    set
      price = v_expected.price,
      purchase_note = v_expected.purchase_note,
      release_display = v_expected.release_display
    where id = v_id
      and site_slug = 'gosaki-piano'
      and legacy_id = v_expected.legacy_id
      and updated_at is not distinct from v_updated;

    if not found then
      raise exception 'UPDATE matched 0 rows for %', v_expected.legacy_id;
    end if;
  end loop;

  select count(*) into v_count
  from public.discography d
  join lateral jsonb_array_elements(v_target) b on (b->>'id')::uuid = d.id
  where d.site_slug = 'gosaki-piano'
    and d.legacy_id = b->>'legacy_id'
    and d.title is not distinct from b->>'title'
    and d.artist is not distinct from b->>'artist'
    and d.label is not distinct from b->>'label'
    and d.catalog_number is not distinct from b->>'catalog_number'
    and d.description is not distinct from b->>'description'
    and d.cover_image_url is not distinct from b->>'cover_image_url'
    and d.purchase_url is not distinct from b->>'purchase_url'
    and d.streaming_url is not distinct from b->>'streaming_url'
    and d.release_date is not distinct from (b->>'release_date')::date
    and d.sort_order is not distinct from (b->>'sort_order')::integer
    and d.published is not distinct from (b->>'published')::boolean;
  if v_count <> 4 then
    raise exception 'POSTCHECK failed: a non-content column on a target row changed';
  end if;

  select count(*) into v_count
  from public.discography d
  join (
    values
      ('discography-001', '3,500 (tax in)', 'オンラインショップからご購入いただけます', 'Release 2023.7.26'),
      ('discography-002', '2,000 (tax in)', 'オンラインショップからご購入いただけます', 'Release 2023.4.26'),
      ('discography-003', '2,500(tax in)', E'Thank you SOLD OUT!\n各種サブスクにてお聴きいただけます', 'Release 2019.01.11'),
      ('discography-004', '2,000 (tax in)', 'ライブ会場でご購入いただけます', 'Release 2015.03.21')
  ) as expected(legacy_id, price, purchase_note, release_display)
    on expected.legacy_id = d.legacy_id
  where d.site_slug = 'gosaki-piano'
    and d.price = expected.price
    and d.purchase_note = expected.purchase_note
    and d.release_display = expected.release_display;
  if v_count <> 4 then
    raise exception 'POSTCHECK failed: target display text does not match';
  end if;

  select count(*) into v_count
  from public.discography
  where not (
    site_slug = 'gosaki-piano'
    and legacy_id in (
      'discography-001',
      'discography-002',
      'discography-003',
      'discography-004'
    )
  );
  if v_count <> jsonb_array_length(v_outside) then
    raise exception 'POSTCHECK failed: outside row count changed';
  end if;

  select count(*) into v_count
  from jsonb_array_elements(v_outside) b
  where not exists (
    select 1
    from public.discography d
    where d.id = (b->>'id')::uuid
  );
  if v_count <> 0 then
    raise exception 'POSTCHECK failed: an outside snapshot row is missing';
  end if;

  select count(*) into v_count
  from public.discography d
  join lateral jsonb_array_elements(v_outside) b on (b->>'id')::uuid = d.id
  where d.price is distinct from b->>'price'
     or d.purchase_note is distinct from b->>'purchase_note'
     or d.release_display is distinct from b->>'release_display'
     or d.updated_at is distinct from (b->>'updated_at')::timestamptz
     or d.title is distinct from b->>'title'
     or d.cover_image_url is distinct from b->>'cover_image_url'
     or d.site_slug is distinct from b->>'site_slug'
     or d.legacy_id is distinct from b->>'legacy_id';
  if v_count <> 0 then
    raise exception 'POSTCHECK failed: a row outside 001-004 changed';
  end if;
end
$gosaki_discography_content_backfill$;

commit;

-- =============================================================================
-- POSTCHECK (read-only) — run after commit
-- =============================================================================

select
  d.legacy_id,
  d.price,
  d.purchase_note,
  d.release_display,
  d.cover_image_url,
  d.updated_at
from public.discography d
where d.site_slug = 'gosaki-piano'
  and d.legacy_id in (
    'discography-001',
    'discography-002',
    'discography-003',
    'discography-004'
  )
order by d.legacy_id;
-- Expect the four display strings from APPLY.
-- updated_at may be newer than PRECHECK when a row was actually updated.
-- cover_image_url must match PRECHECK.

select count(*) as target_text_matches
from public.discography d
join (
  values
    ('discography-001', '3,500 (tax in)', 'オンラインショップからご購入いただけます', 'Release 2023.7.26'),
    ('discography-002', '2,000 (tax in)', 'オンラインショップからご購入いただけます', 'Release 2023.4.26'),
    ('discography-003', '2,500(tax in)', E'Thank you SOLD OUT!\n各種サブスクにてお聴きいただけます', 'Release 2019.01.11'),
    ('discography-004', '2,000 (tax in)', 'ライブ会場でご購入いただけます', 'Release 2015.03.21')
) as expected(legacy_id, price, purchase_note, release_display)
  on expected.legacy_id = d.legacy_id
where d.site_slug = 'gosaki-piano'
  and d.price = expected.price
  and d.purchase_note = expected.purchase_note
  and d.release_display = expected.release_display;
-- Expect 4.
