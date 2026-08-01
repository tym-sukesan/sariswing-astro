-- =============================================================================
-- CMS Core v2 — schedules TBD date contract staging migration
-- Phase: cms-core-v2-schedule-tbd-staging-migration-final-review
-- Prior: cms-core-v2-schedule-tbd-staging-migration-gate
-- =============================================================================
--
-- DO NOT EXECUTE — SQL Editor copy/paste template only.
-- Place under scripts/supabase/ only. Do NOT move into supabase/migrations/.
--
-- Target project (staging ONLY):
--   ref: kmjqppxjdnwwrtaeqjta
--
-- STOP if project ref is production:
--   vsbvndwuajjhnzpohghh
--
-- HUMAN GATE (SQL Editor UI): before any block, confirm Dashboard project
-- name/ref is staging kmjqppxjdnwwrtaeqjta — NOT production vsbvndwuajjhnzpohghh.
-- SQL cannot read the Supabase project ref; this is a mandatory visual check.
--
-- READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true
--   (packet ready for apply-phase one-shot approval — still DO NOT EXECUTE here)
-- SQL_EXECUTED: false
-- DB_WRITE_EXECUTED: false
--
-- Goal (end state):
--   date            date NULL
--   date_status     text NOT NULL DEFAULT 'confirmed'
--   date_status ∈ ('confirmed', 'tbd')
--   confirmed → date IS NOT NULL
--   tbd       → date IS NULL
--
-- Existing rows:
--   date unchanged
--   date_status via ADD COLUMN … DEFAULT only (no UPDATE backfill)
--   row counts / published / fingerprint unchanged
--   month / source_route unchanged this phase
--
-- A → B expected counts (IMPORTANT):
--   Anon API published count (e.g. 74) is NOT the full-table SoT.
--   Run block A in SQL Editor (sees all rows). Copy A5 scalars into B
--   constants marked PASTE_FROM_A. B refuses if left at sentinel -1, or if
--   live counts under lock ≠ pasted expectations.
--
-- Forbidden in this file:
--   DROP TABLE / TRUNCATE / DELETE / UPSERT
--   broad UPDATE of site content / backfill UPDATE
--   production refs as targets
--   Mio seed INSERT
--   service_role
--
-- Blocks:
--   A) migration直前 SELECT-only preflight
--   B) forward migration transaction
--   C) migration後 SELECT-only確認
--   D) guarded rollback transaction (separate; do not auto-run)
--   E) rollback後 SELECT-only確認
--
-- Apply phase: cms-core-v2-schedule-tbd-staging-migration-apply
--   requires explicit operator approval of full SQL text.
-- =============================================================================

-- =============================================================================
-- A) migration直前 SELECT-only preflight
-- =============================================================================
-- Run in SQL Editor against staging ONLY. Record all scalar results before B.
-- No writes.
-- HUMAN: confirm SQL Editor project is staging kmjqppxjdnwwrtaeqjta
--        (NOT production vsbvndwuajjhnzpohghh).

-- A1. Project / session (operator visual check — Dashboard project = staging)
select current_database() as database_name;

-- A2. Table exists
select
  to_regclass('public.schedules') is not null as schedules_table_exists;

-- A3. date column type + nullability (expect: date, NOT NULL)
select
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'schedules'
  and c.column_name = 'date';

-- A4. date_status must NOT exist yet
select
  exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'schedules'
      and c.column_name = 'date_status'
  ) as date_status_exists_must_be_false;

-- A4b. Named CHECK constraints must NOT exist yet
select
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.schedules'::regclass
      and conname in (
        'schedules_date_status_check',
        'schedules_date_status_date_consistency_check'
      )
  ) as tbd_check_constraints_exist_must_be_false;

-- A5. Row counts (SQL Editor full table — NOT anon published-only)
select count(*)::int as schedules_total from public.schedules;

select count(*)::int as schedules_published
from public.schedules
where published is true;

select site_slug, count(*)::int as n
from public.schedules
group by site_slug
order by site_slug;

-- A5b. site_slug count fingerprint (paste into B expected_site_slug_fp)
select md5(
  coalesce(
    string_agg(site_slug || ':' || n::text, '|' order by site_slug),
    ''
  )
) as site_slug_count_fingerprint
from (
  select site_slug, count(*)::int as n
  from public.schedules
  group by site_slug
) s;

select count(*)::int as gosaki_published
from public.schedules
where site_slug = 'gosaki-piano'
  and published is true;

select count(*)::int as mio_rows_must_be_zero
from public.schedules
where site_slug = 'mio-kisaragi-jazz';

-- A6. date IS NULL must be 0 (pre-migration)
select count(*)::int as date_null_count_must_be_zero
from public.schedules
where date is null;

-- A7. legacy_id duplicates must be 0
select count(*)::int as legacy_id_duplicate_groups_must_be_zero
from (
  select legacy_id
  from public.schedules
  where legacy_id is not null
  group by legacy_id
  having count(*) > 1
) d;

-- A8. invalid month/date alignment (YYYY-MM vs date) — expect 0
select count(*)::int as invalid_month_date_alignment_must_be_zero
from public.schedules s
where s.date is not null
  and (
    s.month is null
    or s.month !~ '^\d{4}-\d{2}$'
    or to_char(s.date, 'YYYY-MM') is distinct from s.month
  );

-- A9. Indexes / constraints / triggers (inventory — expect schedules_set_updated_at)
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'schedules'
order by indexname;

select conname, contype, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.schedules'::regclass
order by conname;

select tgname, tgenabled, pg_get_triggerdef(oid) as def
from pg_trigger
where tgrelid = 'public.schedules'::regclass
  and not tgisinternal
order by tgname;

-- A10. Deterministic row fingerprint (no UUID / PII columns)
-- columns: legacy_id|site_slug|date|month|published|sort_order|updated_at(epoch UTC instant)
select md5(
  coalesce(
    string_agg(
      concat_ws(
        '|',
        coalesce(legacy_id, ''),
        coalesce(site_slug, ''),
        coalesce(date::text, ''),
        coalesce(month, ''),
        coalesce(published::text, ''),
        coalesce(sort_order::text, ''),
        coalesce(extract(epoch from updated_at)::text, '')
      ),
      E'\n'
      order by
        legacy_id nulls last,
        site_slug,
        date nulls last,
        month nulls last,
        published,
        sort_order nulls last,
        updated_at nulls last
    ),
    ''
  )
) as data_fingerprint_md5;

select
  count(*)::int as row_count,
  count(updated_at)::int as updated_at_nonnull,
  min(updated_at) as updated_at_min,
  max(updated_at) as updated_at_max
from public.schedules;

-- A11. RLS policies present (inventory — do not change in B)
select pol.polname, pol.polcmd
from pg_policy pol
join pg_class cls on cls.oid = pol.polrelid
join pg_namespace nsp on nsp.oid = cls.relnamespace
where nsp.nspname = 'public'
  and cls.relname = 'schedules'
order by pol.polname;

-- A12. Catalog definition fingerprints (must match after B)
select md5(
  coalesce(
    string_agg(indexname || E'\n' || indexdef, E'\n\n' order by indexname),
    ''
  )
) as index_def_fingerprint
from pg_indexes
where schemaname = 'public'
  and tablename = 'schedules';

select md5(
  coalesce(
    string_agg(
      tgname || '|' || tgenabled::text || E'\n' || pg_get_triggerdef(oid),
      E'\n\n'
      order by tgname
    ),
    ''
  )
) as trigger_def_fingerprint
from pg_trigger
where tgrelid = 'public.schedules'::regclass
  and not tgisinternal;

select md5(
  coalesce(
    (
      select cls.relrowsecurity::text || '|' || cls.relforcerowsecurity::text
      from pg_class cls
      join pg_namespace nsp on nsp.oid = cls.relnamespace
      where nsp.nspname = 'public'
        and cls.relname = 'schedules'
    )
    || E'\n'
    || coalesce(
      (
        select string_agg(
          pol.polname
            || '|' || pol.polcmd::text
            || '|' || coalesce(
              (
                select string_agg(r.rolname, ',' order by r.rolname)
                from pg_roles r
                where r.oid = any (pol.polroles)
              ),
              case when cardinality(pol.polroles) = 0 then 'PUBLIC' else '' end
            )
            || '|' || coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
            || '|' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), ''),
          E'\n'
          order by pol.polname
        )
        from pg_policy pol
        join pg_class cls on cls.oid = pol.polrelid
        join pg_namespace nsp on nsp.oid = cls.relnamespace
        where nsp.nspname = 'public'
          and cls.relname = 'schedules'
      ),
      ''
    ),
    ''
  )
) as rls_policy_def_fingerprint;

-- STOP before B if any of:
--   schedules missing, date not date/NOT NULL, date_status exists,
--   TBD CHECK names already exist, date_null > 0, legacy_id duplicates > 0,
--   month/date invalid > 0, mio_rows <> 0,
--   Dashboard project is production.


-- =============================================================================
-- B) forward migration transaction
-- =============================================================================
-- DO NOT EXECUTE until apply phase + explicit approval.
-- Paste as one block. On any exception → transaction aborts (no partial commit).
--
-- Before paste: fill PASTE_FROM_A constants from block A (SQL Editor full table).
-- Do NOT paste anon published-only counts as schedules_total.
--
-- updated_at strategy:
--   ADD COLUMN date_status text NOT NULL DEFAULT 'confirmed'
--   PostgreSQL 11+ constant DEFAULT → no row UPDATE → trigger does not fire.
--   backfill UPDATE is forbidden.

begin;

-- B0. Session locks / timeouts BEFORE any schema or data assert
set local lock_timeout = '5s';
set local statement_timeout = '120s';

-- Fail immediately if another session holds a conflicting lock (e.g. Save).
-- NOWAIT → no wait queue; migration does not proceed under concurrent writers.
lock table public.schedules in access exclusive mode nowait;

-- B1. Schema / collision asserts (after lock)
do $$
declare
  -- === PASTE_FROM_A (SQL Editor full-table scalars) ===
  -- Sentinel -1 / empty md5 means "not filled" → refuse.
  -- Replace with A5 / A5b / A10 / A12 results from the same staging Editor session.
  expected_total int := -1;
  expected_published int := -1;
  expected_gosaki_published int := -1;
  expected_mio int := 0;
  expected_site_slug_fp text := '';
  expected_data_fp text := '';
  expected_index_fp text := '';
  expected_trigger_fp text := '';
  expected_rls_fp text := '';
  -- === end PASTE_FROM_A ===

  v_date_type text;
  v_date_nullable text;
  v_date_status_exists boolean;
  v_check_exists boolean;
  v_null_date int;
  v_dup_legacy int;
  v_bad_month int;
  v_mio int;
  v_total int;
  v_pub int;
  v_gosaki_pub int;
  v_site_slug_fp text;
  v_data_fp text;
  v_index_fp text;
  v_trigger_fp text;
  v_rls_fp text;
begin
  if expected_total < 0
     or expected_published < 0
     or expected_gosaki_published < 0
     or expected_site_slug_fp is null
     or length(expected_site_slug_fp) <> 32
     or expected_data_fp is null
     or length(expected_data_fp) <> 32
     or expected_index_fp is null
     or length(expected_index_fp) <> 32
     or expected_trigger_fp is null
     or length(expected_trigger_fp) <> 32
     or expected_rls_fp is null
     or length(expected_rls_fp) <> 32 then
    raise exception
      'STOP: PASTE_FROM_A incomplete — fill expected_* from SQL Editor block A (not anon counts)';
  end if;

  if expected_mio <> 0 then
    raise exception 'STOP: expected_mio must be 0 (got %)', expected_mio;
  end if;

  if to_regclass('public.schedules') is null then
    raise exception 'STOP: public.schedules missing';
  end if;

  select c.data_type, c.is_nullable
    into v_date_type, v_date_nullable
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'schedules'
    and c.column_name = 'date';

  if v_date_type is distinct from 'date' then
    raise exception 'STOP: schedules.date type unexpected: %', v_date_type;
  end if;
  if v_date_nullable is distinct from 'NO' then
    raise exception 'STOP: schedules.date must be NOT NULL before migration (is_nullable=%)', v_date_nullable;
  end if;

  select exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'schedules'
      and c.column_name = 'date_status'
  ) into v_date_status_exists;

  if v_date_status_exists then
    raise exception 'STOP: date_status already exists — refuse forward migration';
  end if;

  select exists (
    select 1
    from pg_constraint
    where conrelid = 'public.schedules'::regclass
      and conname in (
        'schedules_date_status_check',
        'schedules_date_status_date_consistency_check'
      )
  ) into v_check_exists;

  if v_check_exists then
    raise exception 'STOP: TBD CHECK constraint name already present — refuse';
  end if;

  select count(*) into v_null_date from public.schedules where date is null;
  if v_null_date <> 0 then
    raise exception 'STOP: date IS NULL rows exist (%) — refuse', v_null_date;
  end if;

  select count(*) into v_dup_legacy
  from (
    select legacy_id
    from public.schedules
    where legacy_id is not null
    group by legacy_id
    having count(*) > 1
  ) d;
  if v_dup_legacy <> 0 then
    raise exception 'STOP: legacy_id duplicate groups (%)', v_dup_legacy;
  end if;

  select count(*) into v_bad_month
  from public.schedules s
  where s.date is not null
    and (
      s.month is null
      or s.month !~ '^\d{4}-\d{2}$'
      or to_char(s.date, 'YYYY-MM') is distinct from s.month
    );
  if v_bad_month <> 0 then
    raise exception 'STOP: invalid month/date alignment rows (%)', v_bad_month;
  end if;

  select count(*) into v_mio
  from public.schedules
  where site_slug = 'mio-kisaragi-jazz';
  if v_mio <> 0 then
    raise exception 'STOP: unexpected mio-kisaragi-jazz rows (%) before migration', v_mio;
  end if;

  select count(*) into v_total from public.schedules;
  select count(*) into v_pub from public.schedules where published is true;
  select count(*) into v_gosaki_pub
  from public.schedules
  where site_slug = 'gosaki-piano' and published is true;

  select md5(
    coalesce(
      string_agg(site_slug || ':' || n::text, '|' order by site_slug),
      ''
    )
  ) into v_site_slug_fp
  from (
    select site_slug, count(*)::int as n
    from public.schedules
    group by site_slug
  ) s;

  select md5(
    coalesce(
      string_agg(
        concat_ws(
          '|',
          coalesce(legacy_id, ''),
          coalesce(site_slug, ''),
          coalesce(date::text, ''),
          coalesce(month, ''),
          coalesce(published::text, ''),
          coalesce(sort_order::text, ''),
          coalesce(extract(epoch from updated_at)::text, '')
        ),
        E'\n'
        order by
          legacy_id nulls last,
          site_slug,
          date nulls last,
          month nulls last,
          published,
          sort_order nulls last,
          updated_at nulls last
      ),
      ''
    )
  ) into v_data_fp
  from public.schedules;

  select md5(
    coalesce(
      string_agg(indexname || E'\n' || indexdef, E'\n\n' order by indexname),
      ''
    )
  ) into v_index_fp
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'schedules';

  select md5(
    coalesce(
      string_agg(
        tgname || '|' || tgenabled::text || E'\n' || pg_get_triggerdef(oid),
        E'\n\n'
        order by tgname
      ),
      ''
    )
  ) into v_trigger_fp
  from pg_trigger
  where tgrelid = 'public.schedules'::regclass
    and not tgisinternal;

  select md5(
    coalesce(
      (
        select cls.relrowsecurity::text || '|' || cls.relforcerowsecurity::text
        from pg_class cls
        join pg_namespace nsp on nsp.oid = cls.relnamespace
        where nsp.nspname = 'public'
          and cls.relname = 'schedules'
      )
      || E'\n'
      || coalesce(
        (
          select string_agg(
            pol.polname
              || '|' || pol.polcmd::text
              || '|' || coalesce(
                (
                  select string_agg(r.rolname, ',' order by r.rolname)
                  from pg_roles r
                  where r.oid = any (pol.polroles)
                ),
                case when cardinality(pol.polroles) = 0 then 'PUBLIC' else '' end
              )
              || '|' || coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
              || '|' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), ''),
            E'\n'
            order by pol.polname
          )
          from pg_policy pol
          join pg_class cls on cls.oid = pol.polrelid
          join pg_namespace nsp on nsp.oid = cls.relnamespace
          where nsp.nspname = 'public'
            and cls.relname = 'schedules'
        ),
        ''
      ),
      ''
    )
  ) into v_rls_fp;

  if v_total <> expected_total then
    raise exception 'STOP: live total % <> PASTE_FROM_A expected_total %', v_total, expected_total;
  end if;
  if v_pub <> expected_published then
    raise exception 'STOP: live published % <> PASTE_FROM_A expected_published %', v_pub, expected_published;
  end if;
  if v_gosaki_pub <> expected_gosaki_published then
    raise exception 'STOP: live gosaki_published % <> PASTE_FROM_A %', v_gosaki_pub, expected_gosaki_published;
  end if;
  if v_mio <> expected_mio then
    raise exception 'STOP: live mio % <> PASTE_FROM_A expected_mio %', v_mio, expected_mio;
  end if;
  if v_site_slug_fp is distinct from expected_site_slug_fp then
    raise exception 'STOP: site_slug count fingerprint drifted vs PASTE_FROM_A';
  end if;
  if v_data_fp is distinct from expected_data_fp then
    raise exception 'STOP: data fingerprint drifted vs PASTE_FROM_A (re-run A)';
  end if;
  if v_index_fp is distinct from expected_index_fp then
    raise exception 'STOP: index fingerprint drifted vs PASTE_FROM_A';
  end if;
  if v_trigger_fp is distinct from expected_trigger_fp then
    raise exception 'STOP: trigger fingerprint drifted vs PASTE_FROM_A';
  end if;
  if v_rls_fp is distinct from expected_rls_fp then
    raise exception 'STOP: RLS fingerprint drifted vs PASTE_FROM_A';
  end if;

  -- Fail-closed: same-name temp table already present → CREATE fails (no IF NOT EXISTS / no DELETE).
  create temporary table _cms_core_v2_tbd_mig_baseline (
    total int not null,
    published int not null,
    gosaki_published int not null,
    mio int not null,
    site_slug_fp text not null,
    data_fp text not null,
    index_fp text not null,
    trigger_fp text not null,
    rls_fp text not null
  ) on commit drop;

  insert into _cms_core_v2_tbd_mig_baseline (
    total, published, gosaki_published, mio,
    site_slug_fp, data_fp, index_fp, trigger_fp, rls_fp
  ) values (
    v_total, v_pub, v_gosaki_pub, v_mio,
    v_site_slug_fp, v_data_fp, v_index_fp, v_trigger_fp, v_rls_fp
  );

  raise notice 'baseline total=% published=% gosaki_pub=% mio=% (fingerprints stored; not printed)',
    v_total, v_pub, v_gosaki_pub, v_mio;
end $$;

-- B2. Add date_status with NOT NULL DEFAULT (no UPDATE backfill)
alter table public.schedules
  add column date_status text not null default 'confirmed';

comment on column public.schedules.date_status is
  'CMS Core v2 TBD contract: confirmed|tbd. Staging migration template.';

-- B3. Assert backfill via default (all rows confirmed; zero null status)
do $$
declare
  v_total int;
  v_confirmed int;
  v_null_status int;
  v_other int;
begin
  select count(*) into v_total from public.schedules;
  select count(*) into v_confirmed
  from public.schedules
  where date_status = 'confirmed';
  select count(*) into v_null_status
  from public.schedules
  where date_status is null;
  select count(*) into v_other
  from public.schedules
  where date_status is distinct from 'confirmed';

  if v_null_status <> 0 then
    raise exception 'STOP: date_status null after ADD COLUMN (%)', v_null_status;
  end if;
  if v_confirmed <> v_total then
    raise exception 'STOP: confirmed backfill mismatch confirmed=% total=%', v_confirmed, v_total;
  end if;
  if v_other <> 0 then
    raise exception 'STOP: non-confirmed date_status rows (%)', v_other;
  end if;
end $$;

-- B4. Status value CHECK (NOT VALID → VALIDATE)
alter table public.schedules
  add constraint schedules_date_status_check
  check (date_status in ('confirmed', 'tbd'))
  not valid;

alter table public.schedules
  validate constraint schedules_date_status_check;

-- B5. confirmed/date · tbd/date consistency CHECK
alter table public.schedules
  add constraint schedules_date_status_date_consistency_check
  check (
    (date_status = 'confirmed' and date is not null)
    or
    (date_status = 'tbd' and date is null)
  )
  not valid;

alter table public.schedules
  validate constraint schedules_date_status_date_consistency_check;

-- B6. Allow TBD: date DROP NOT NULL (after consistency CHECK is validated)
alter table public.schedules
  alter column date drop not null;

-- B7. Final in-transaction asserts (counts + fingerprints + catalog + schema)
do $$
declare
  b record;
  v_total int;
  v_pub int;
  v_gosaki_pub int;
  v_mio int;
  v_null_date int;
  v_tbd int;
  v_unknown int;
  v_viol int;
  v_date_nullable text;
  v_status_nullable text;
  v_status_default text;
  v_site_slug_fp text;
  v_data_fp text;
  v_index_fp text;
  v_trigger_fp text;
  v_rls_fp text;
  v_trigger_ok boolean;
begin
  select * into strict b from _cms_core_v2_tbd_mig_baseline;

  select count(*) into v_total from public.schedules;
  select count(*) into v_pub from public.schedules where published is true;
  select count(*) into v_gosaki_pub
  from public.schedules
  where site_slug = 'gosaki-piano' and published is true;
  select count(*) into v_mio
  from public.schedules
  where site_slug = 'mio-kisaragi-jazz';
  select count(*) into v_null_date from public.schedules where date is null;
  select count(*) into v_tbd from public.schedules where date_status = 'tbd';
  select count(*) into v_unknown
  from public.schedules
  where date_status not in ('confirmed', 'tbd');
  select count(*) into v_viol
  from public.schedules
  where not (
    (date_status = 'confirmed' and date is not null)
    or
    (date_status = 'tbd' and date is null)
  );

  if v_total <> b.total then
    raise exception 'STOP: total row count changed % → %', b.total, v_total;
  end if;
  if v_pub <> b.published then
    raise exception 'STOP: published count changed % → %', b.published, v_pub;
  end if;
  if v_gosaki_pub <> b.gosaki_published then
    raise exception 'STOP: gosaki published count changed % → %', b.gosaki_published, v_gosaki_pub;
  end if;
  if v_mio <> b.mio then
    raise exception 'STOP: mio count changed % → %', b.mio, v_mio;
  end if;
  if v_null_date <> 0 then
    raise exception 'STOP: unexpected date null after forward (%)', v_null_date;
  end if;
  if v_tbd <> 0 then
    raise exception 'STOP: unexpected tbd rows after forward (%)', v_tbd;
  end if;
  if v_unknown <> 0 then
    raise exception 'STOP: unknown date_status (%)', v_unknown;
  end if;
  if v_viol <> 0 then
    raise exception 'STOP: contract violations (%)', v_viol;
  end if;

  select md5(
    coalesce(
      string_agg(site_slug || ':' || n::text, '|' order by site_slug),
      ''
    )
  ) into v_site_slug_fp
  from (
    select site_slug, count(*)::int as n
    from public.schedules
    group by site_slug
  ) s;

  select md5(
    coalesce(
      string_agg(
        concat_ws(
          '|',
          coalesce(legacy_id, ''),
          coalesce(site_slug, ''),
          coalesce(date::text, ''),
          coalesce(month, ''),
          coalesce(published::text, ''),
          coalesce(sort_order::text, ''),
          coalesce(extract(epoch from updated_at)::text, '')
        ),
        E'\n'
        order by
          legacy_id nulls last,
          site_slug,
          date nulls last,
          month nulls last,
          published,
          sort_order nulls last,
          updated_at nulls last
      ),
      ''
    )
  ) into v_data_fp
  from public.schedules;

  select md5(
    coalesce(
      string_agg(indexname || E'\n' || indexdef, E'\n\n' order by indexname),
      ''
    )
  ) into v_index_fp
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'schedules';

  select md5(
    coalesce(
      string_agg(
        tgname || '|' || tgenabled::text || E'\n' || pg_get_triggerdef(oid),
        E'\n\n'
        order by tgname
      ),
      ''
    )
  ) into v_trigger_fp
  from pg_trigger
  where tgrelid = 'public.schedules'::regclass
    and not tgisinternal;

  select md5(
    coalesce(
      (
        select cls.relrowsecurity::text || '|' || cls.relforcerowsecurity::text
        from pg_class cls
        join pg_namespace nsp on nsp.oid = cls.relnamespace
        where nsp.nspname = 'public'
          and cls.relname = 'schedules'
      )
      || E'\n'
      || coalesce(
        (
          select string_agg(
            pol.polname
              || '|' || pol.polcmd::text
              || '|' || coalesce(
                (
                  select string_agg(r.rolname, ',' order by r.rolname)
                  from pg_roles r
                  where r.oid = any (pol.polroles)
                ),
                case when cardinality(pol.polroles) = 0 then 'PUBLIC' else '' end
              )
              || '|' || coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
              || '|' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), ''),
            E'\n'
            order by pol.polname
          )
          from pg_policy pol
          join pg_class cls on cls.oid = pol.polrelid
          join pg_namespace nsp on nsp.oid = cls.relnamespace
          where nsp.nspname = 'public'
            and cls.relname = 'schedules'
        ),
        ''
      ),
      ''
    )
  ) into v_rls_fp;

  if v_site_slug_fp is distinct from b.site_slug_fp then
    raise exception 'STOP: site_slug count fingerprint changed after DDL';
  end if;
  if v_data_fp is distinct from b.data_fp then
    raise exception 'STOP: data fingerprint changed after DDL (row content mutated)';
  end if;
  if v_index_fp is distinct from b.index_fp then
    raise exception 'STOP: index fingerprint changed after DDL';
  end if;
  if v_trigger_fp is distinct from b.trigger_fp then
    raise exception 'STOP: trigger fingerprint changed after DDL';
  end if;
  if v_rls_fp is distinct from b.rls_fp then
    raise exception 'STOP: RLS fingerprint changed after DDL';
  end if;

  select c.is_nullable, c.column_default
    into v_status_nullable, v_status_default
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'schedules'
    and c.column_name = 'date_status';

  if v_status_nullable is distinct from 'NO' then
    raise exception 'STOP: date_status must be NOT NULL';
  end if;
  if v_status_default is null or position('confirmed' in v_status_default) = 0 then
    raise exception 'STOP: date_status DEFAULT must include confirmed (got %)', v_status_default;
  end if;

  select c.is_nullable into v_date_nullable
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'schedules'
    and c.column_name = 'date';

  if v_date_nullable is distinct from 'YES' then
    raise exception 'STOP: date must be nullable after migration (is_nullable=%)', v_date_nullable;
  end if;

  select exists (
    select 1 from pg_trigger
    where tgrelid = 'public.schedules'::regclass
      and not tgisinternal
      and tgname = 'schedules_set_updated_at'
  ) into v_trigger_ok;
  if not v_trigger_ok then
    raise exception 'STOP: schedules_set_updated_at trigger missing after DDL';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.schedules'::regclass
      and conname = 'schedules_date_status_check'
  ) then
    raise exception 'STOP: schedules_date_status_check missing';
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.schedules'::regclass
      and conname = 'schedules_date_status_date_consistency_check'
  ) then
    raise exception 'STOP: schedules_date_status_date_consistency_check missing';
  end if;
end $$;

commit;

-- =============================================================================
-- C) migration後 SELECT-only確認
-- =============================================================================
-- Run after successful B. Compare to A baselines (counts + fingerprints).
-- HUMAN: confirm SQL Editor project is still staging.

select
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'schedules'
  and c.column_name in ('date', 'date_status')
order by c.column_name;

select conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.schedules'::regclass
  and conname in (
    'schedules_date_status_check',
    'schedules_date_status_date_consistency_check'
  )
order by conname;

select count(*)::int as schedules_total from public.schedules;
select count(*)::int as schedules_published
from public.schedules where published is true;

select site_slug, count(*)::int as n
from public.schedules
group by site_slug
order by site_slug;

select md5(
  coalesce(
    string_agg(site_slug || ':' || n::text, '|' order by site_slug),
    ''
  )
) as site_slug_count_fingerprint
from (
  select site_slug, count(*)::int as n
  from public.schedules
  group by site_slug
) s;

select count(*)::int as confirmed_count
from public.schedules where date_status = 'confirmed';

select count(*)::int as tbd_count_must_be_zero
from public.schedules where date_status = 'tbd';

select count(*)::int as unknown_status_must_be_zero
from public.schedules
where date_status not in ('confirmed', 'tbd');

select count(*)::int as date_null_must_be_zero
from public.schedules where date is null;

select count(*)::int as contract_violations_must_be_zero
from public.schedules
where not (
  (date_status = 'confirmed' and date is not null)
  or
  (date_status = 'tbd' and date is null)
);

select count(*)::int as mio_rows_must_be_zero
from public.schedules
where site_slug = 'mio-kisaragi-jazz';

select count(*)::int as gosaki_published
from public.schedules
where site_slug = 'gosaki-piano' and published is true;

select md5(
  coalesce(
    string_agg(
      concat_ws(
        '|',
        coalesce(legacy_id, ''),
        coalesce(site_slug, ''),
        coalesce(date::text, ''),
        coalesce(month, ''),
        coalesce(published::text, ''),
        coalesce(sort_order::text, ''),
        coalesce(extract(epoch from updated_at)::text, '')
      ),
      E'\n'
      order by
        legacy_id nulls last,
        site_slug,
        date nulls last,
        month nulls last,
        published,
        sort_order nulls last,
        updated_at nulls last
    ),
    ''
  )
) as data_fingerprint_md5;

select
  count(*)::int as row_count,
  min(updated_at) as updated_at_min,
  max(updated_at) as updated_at_max
from public.schedules;

select md5(
  coalesce(
    string_agg(indexname || E'\n' || indexdef, E'\n\n' order by indexname),
    ''
  )
) as index_def_fingerprint
from pg_indexes
where schemaname = 'public'
  and tablename = 'schedules';

select md5(
  coalesce(
    string_agg(
      tgname || '|' || tgenabled::text || E'\n' || pg_get_triggerdef(oid),
      E'\n\n'
      order by tgname
    ),
    ''
  )
) as trigger_def_fingerprint
from pg_trigger
where tgrelid = 'public.schedules'::regclass
  and not tgisinternal;

select md5(
  coalesce(
    (
      select cls.relrowsecurity::text || '|' || cls.relforcerowsecurity::text
      from pg_class cls
      join pg_namespace nsp on nsp.oid = cls.relnamespace
      where nsp.nspname = 'public'
        and cls.relname = 'schedules'
    )
    || E'\n'
    || coalesce(
      (
        select string_agg(
          pol.polname
            || '|' || pol.polcmd::text
            || '|' || coalesce(
              (
                select string_agg(r.rolname, ',' order by r.rolname)
                from pg_roles r
                where r.oid = any (pol.polroles)
              ),
              case when cardinality(pol.polroles) = 0 then 'PUBLIC' else '' end
            )
            || '|' || coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
            || '|' || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), ''),
          E'\n'
          order by pol.polname
        )
        from pg_policy pol
        join pg_class cls on cls.oid = pol.polrelid
        join pg_namespace nsp on nsp.oid = cls.relnamespace
        where nsp.nspname = 'public'
          and cls.relname = 'schedules'
      ),
      ''
    ),
    ''
  )
) as rls_policy_def_fingerprint;

-- Expect trigger still present
select tgname
from pg_trigger
where tgrelid = 'public.schedules'::regclass
  and not tgisinternal
  and tgname = 'schedules_set_updated_at';


-- =============================================================================
-- D) guarded rollback transaction (SEPARATE — do not auto-run after B)
-- =============================================================================
-- DO NOT EXECUTE unless rolling back a successful B on staging.
-- Refuses if any TBD or null date exists (cannot restore NOT NULL safely).
-- HUMAN: confirm SQL Editor project is staging.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

lock table public.schedules in access exclusive mode nowait;

do $$
declare
  v_tbd int;
  v_null_date int;
  v_unknown int;
  v_viol int;
  v_status_type text;
  v_status_nullable text;
  v_status_default text;
  v_date_nullable text;
  v_status_check_def text;
  v_consistency_def text;
  v_status_check_validated boolean;
  v_consistency_validated boolean;
begin
  -- Schema guards (expected post-forward shape) before any rollback DDL
  select c.data_type, c.is_nullable, c.column_default
    into v_status_type, v_status_nullable, v_status_default
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'schedules'
    and c.column_name = 'date_status';

  if v_status_type is null then
    raise exception 'STOP rollback: date_status missing — nothing to roll back';
  end if;
  if v_status_type is distinct from 'text' then
    raise exception 'STOP rollback: date_status type unexpected (%)', v_status_type;
  end if;
  if v_status_nullable is distinct from 'NO' then
    raise exception 'STOP rollback: date_status must be NOT NULL';
  end if;
  if v_status_default is null or position('confirmed' in v_status_default) = 0 then
    raise exception 'STOP rollback: date_status DEFAULT must include confirmed (got %)', v_status_default;
  end if;

  select c.is_nullable into v_date_nullable
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'schedules'
    and c.column_name = 'date';

  if v_date_nullable is distinct from 'YES' then
    raise exception 'STOP rollback: expected date nullable before restore (got %)', v_date_nullable;
  end if;

  select convalidated, pg_get_constraintdef(oid)
    into v_status_check_validated, v_status_check_def
  from pg_constraint
  where conrelid = 'public.schedules'::regclass
    and conname = 'schedules_date_status_check';

  if v_status_check_def is null then
    raise exception 'STOP rollback: schedules_date_status_check missing';
  end if;
  if v_status_check_validated is not true then
    raise exception 'STOP rollback: schedules_date_status_check not validated';
  end if;
  if position('confirmed' in v_status_check_def) = 0
     or position('tbd' in v_status_check_def) = 0 then
    raise exception 'STOP rollback: schedules_date_status_check def mismatch (%)', v_status_check_def;
  end if;

  select convalidated, pg_get_constraintdef(oid)
    into v_consistency_validated, v_consistency_def
  from pg_constraint
  where conrelid = 'public.schedules'::regclass
    and conname = 'schedules_date_status_date_consistency_check';

  if v_consistency_def is null then
    raise exception 'STOP rollback: schedules_date_status_date_consistency_check missing';
  end if;
  if v_consistency_validated is not true then
    raise exception 'STOP rollback: schedules_date_status_date_consistency_check not validated';
  end if;
  if position('confirmed' in v_consistency_def) = 0
     or position('tbd' in v_consistency_def) = 0
     or position('IS NOT NULL' in v_consistency_def) = 0
     or position('IS NULL' in v_consistency_def) = 0 then
    raise exception 'STOP rollback: consistency CHECK def mismatch (%)', v_consistency_def;
  end if;

  select count(*) into v_tbd from public.schedules where date_status = 'tbd';
  if v_tbd <> 0 then
    raise exception 'STOP rollback: date_status=tbd rows exist (%) — refuse', v_tbd;
  end if;

  select count(*) into v_null_date from public.schedules where date is null;
  if v_null_date <> 0 then
    raise exception 'STOP rollback: date IS NULL rows exist (%) — refuse', v_null_date;
  end if;

  select count(*) into v_unknown
  from public.schedules
  where date_status is null
     or date_status not in ('confirmed', 'tbd');
  if v_unknown <> 0 then
    raise exception 'STOP rollback: null/unknown date_status (%) — refuse', v_unknown;
  end if;

  select count(*) into v_viol
  from public.schedules
  where not (
    (date_status = 'confirmed' and date is not null)
    or
    (date_status = 'tbd' and date is null)
  );
  if v_viol <> 0 then
    raise exception 'STOP rollback: contract violations (%) — refuse', v_viol;
  end if;
end $$;

-- D1. Restore date NOT NULL (fails if any null — guarded above)
alter table public.schedules
  alter column date set not null;

-- D2. Drop new CHECKs (no IF EXISTS — unexpected schema already stopped above)
alter table public.schedules
  drop constraint schedules_date_status_date_consistency_check;

alter table public.schedules
  drop constraint schedules_date_status_check;


-- D3. Drop date_status column
alter table public.schedules
  drop column date_status;

-- D4. Assert pre-migration-like schema
do $$
declare
  v_date_nullable text;
  v_status_exists boolean;
  v_null_date int;
  v_check_exists boolean;
begin
  select c.is_nullable into v_date_nullable
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'schedules'
    and c.column_name = 'date';

  if v_date_nullable is distinct from 'NO' then
    raise exception 'STOP rollback assert: date must be NOT NULL again';
  end if;

  select exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'schedules'
      and c.column_name = 'date_status'
  ) into v_status_exists;

  if v_status_exists then
    raise exception 'STOP rollback assert: date_status still present';
  end if;

  select exists (
    select 1
    from pg_constraint
    where conrelid = 'public.schedules'::regclass
      and conname in (
        'schedules_date_status_check',
        'schedules_date_status_date_consistency_check'
      )
  ) into v_check_exists;

  if v_check_exists then
    raise exception 'STOP rollback assert: TBD CHECK still present';
  end if;

  select count(*) into v_null_date from public.schedules where date is null;
  if v_null_date <> 0 then
    raise exception 'STOP rollback assert: date null (%)', v_null_date;
  end if;
end $$;

commit;


-- =============================================================================
-- E) rollback後 SELECT-only確認
-- =============================================================================
-- HUMAN: confirm SQL Editor project is staging.

select
  c.column_name,
  c.data_type,
  c.is_nullable
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'schedules'
  and c.column_name in ('date', 'date_status')
order by c.column_name;

select count(*)::int as schedules_total from public.schedules;
select count(*)::int as date_null_must_be_zero
from public.schedules where date is null;

select count(*)::int as mio_rows_must_be_zero
from public.schedules
where site_slug = 'mio-kisaragi-jazz';

select conname
from pg_constraint
where conrelid = 'public.schedules'::regclass
  and conname in (
    'schedules_date_status_check',
    'schedules_date_status_date_consistency_check'
  );
-- expect 0 rows

select md5(
  coalesce(
    string_agg(
      concat_ws(
        '|',
        coalesce(legacy_id, ''),
        coalesce(site_slug, ''),
        coalesce(date::text, ''),
        coalesce(month, ''),
        coalesce(published::text, ''),
        coalesce(sort_order::text, ''),
        coalesce(extract(epoch from updated_at)::text, '')
      ),
      E'\n'
      order by
        legacy_id nulls last,
        site_slug,
        date nulls last,
        month nulls last,
        published,
        sort_order nulls last,
        updated_at nulls last
    ),
    ''
  )
) as data_fingerprint_md5;

-- =============================================================================
-- END — DO NOT EXECUTE without apply-phase one-shot approval
-- READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true
-- SQL_EXECUTED: false
-- =============================================================================
