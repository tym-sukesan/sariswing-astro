# Schedule Schema Read Audit

## 1. Purpose

**Phase:** `G-6-e1-schedule-schema-read-audit`

This document prepares a read-only audit of the staging schedule schema before Schedule CMS implementation.
It does not change database schema.
It does not write schedule records.
It does not implement write adapters.
It does not connect /admin.
It does not touch production data.

Cursor does not connect to Supabase or execute SQL in this phase. All audit SQL below is for **manual execution** in Supabase SQL Editor on project `static-to-astro-cms-staging` only.

Follows [schedule-cms-planning.md](./schedule-cms-planning.md) and [staging-rls-grant-cleanup-result.md](./staging-rls-grant-cleanup-result.md).

## 2. Scope

**Primary tables:**

```txt
public.schedules
public.schedule_months
```

**Related context (optional read-only checks only):**

```txt
public.admin_users
public.profile
```

Primary audit focus remains `schedules` and `schedule_months` only.

**Out of scope:**

```txt
- schema changes
- migration SQL
- INSERT / UPDATE / DELETE / UPSERT
- write adapter or UI implementation
- RLS / GRANT changes
- production project
- /admin route
```

## 3. Questions to answer

After manual SQL collection, answer:

```txt
- What columns currently exist in schedules?
- What columns currently exist in schedule_months?
- Which fields are enough for Schedule CMS MVP?
- Which planned fields are missing?
- Is schedule_months authoring data or derived/read model?
- Are RLS and GRANTs safe after cleanup?
- Can dry-run create/update/duplicate be designed without schema change?
- Is a pre-seeded row update PoC possible?
```

## 4. Known planning assumptions

From G-6-e-planning-schedule-cms:

```txt
- schedules is the primary authoring table
- schedule_months should be derived/read model where possible
- no delete in first implementation
- dry-run first
- non-dry-run requires separate approval
- production remains blocked
```

**Adapter reference** ([`cms-schema-adapters.json`](../config/schema-adapters/cms-schema-adapters.json) — not verified on staging until manual SQL):

| Table | Expected columns (adapter) |
| --- | --- |
| `schedules` | `id`, `legacy_id`, `date`, `title`, `venue`, `description`, `home_image_url`, `image_url`, `show_on_home`, `home_order`, `published`, `sort_order` |
| `schedule_months` | `id`, `legacy_id`, `year`, `month`, `label`, `sort_order` |

Staging may differ — manual SQL is authoritative.

## 5. Manual read-only audit SQL

**MANUAL READ-ONLY CHECK.** Intended project: `static-to-astro-cms-staging` only. Never run on production. Cursor does not execute these queries.

### 5.1 schedules columns

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
order by ordinal_position;
```

### 5.2 schedule_months columns

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedule_months'
order by ordinal_position;
```

### 5.3 schedules constraints

```sql
select
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
left join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
  and tc.table_schema = ccu.table_schema
where tc.table_schema = 'public'
  and tc.table_name = 'schedules'
order by tc.constraint_type, tc.constraint_name, kcu.ordinal_position;
```

### 5.4 schedule_months constraints

```sql
select
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
left join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
  and tc.table_schema = ccu.table_schema
where tc.table_schema = 'public'
  and tc.table_name = 'schedule_months'
order by tc.constraint_type, tc.constraint_name, kcu.ordinal_position;
```

### 5.5 schedules indexes

```sql
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'schedules'
order by indexname;
```

### 5.6 schedule_months indexes

```sql
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'schedule_months'
order by indexname;
```

### 5.7 schedule policies

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('schedules', 'schedule_months')
order by tablename, policyname;
```

### 5.8 schedule grants

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('schedules', 'schedule_months')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
```

**Expected after G-6-rls-grant-cleanup-result:**

```txt
TRUNCATE / TRIGGER / REFERENCES should not appear for anon/authenticated.
SELECT should remain where public read requires it.
INSERT / UPDATE grants may exist — verify RLS restricts writes to admin/editor.
```

### 5.9 schedule row counts

```sql
select 'schedules' as table_name, count(*) as row_count
from public.schedules
union all
select 'schedule_months' as table_name, count(*) as row_count
from public.schedule_months;
```

### 5.10 schedules sample rows

Sanitize URLs or personal data before sharing results externally.

```sql
select *
from public.schedules
order by created_at desc nulls last
limit 5;
```

**Alternative if `created_at` does not exist:**

```sql
select *
from public.schedules
limit 5;
```

### 5.11 schedule_months sample rows

```sql
select *
from public.schedule_months
order by created_at desc nulls last
limit 5;
```

**Alternative if `created_at` does not exist:**

```sql
select *
from public.schedule_months
limit 5;
```

### 5.12 future/past grouping feasibility

**TEMPLATE ONLY.** Replace `event_date` with the actual date column name after §5.1 results (likely `date` per adapter).

```sql
-- TEMPLATE ONLY. Replace event_date with the actual date column after schema audit.
select
  case
    when event_date >= current_date then 'future'
    else 'past'
  end as schedule_group,
  count(*) as count
from public.schedules
group by 1
order by 1;
```

**Adapter expectation:** column may be named `date` rather than `event_date`.

## 6. Field mapping checklist

Fill **Existing column** and **Exists now?** after manual SQL (§5.1–5.2).

| Planned field | Existing column | Exists now? | Required for MVP? | Need schema change? | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | _to be filled_ | _TBD_ | yes (system) | no | uuid PK |
| `title` | _to be filled_ | _TBD_ | yes | no if `title` exists | |
| `event_date` | _to be filled_ | _TBD_ | yes | no if `date` exists | maps to `date` in adapter |
| `start_time` | _to be filled_ | _TBD_ | optional | likely yes | not in adapter |
| `open_time` | _to be filled_ | _TBD_ | optional | likely yes | deferred |
| `venue_name` | _to be filled_ | _TBD_ | yes | no if `venue` exists | maps to `venue` |
| `venue_area` | _to be filled_ | _TBD_ | optional | likely yes | |
| `venue_address` | _to be filled_ | _TBD_ | optional | deferred | |
| `venue_url` | _to be filled_ | _TBD_ | optional | likely yes | |
| `reservation_url` | _to be filled_ | _TBD_ | optional | likely yes | |
| `performers` | _to be filled_ | _TBD_ | optional | likely yes | |
| `description` | _to be filled_ | _TBD_ | optional | no if column exists | |
| `price_text` | _to be filled_ | _TBD_ | optional | likely yes | |
| `is_published` | _to be filled_ | _TBD_ | yes | no if `published` exists | |
| `is_featured` | _to be filled_ | _TBD_ | optional | no if `show_on_home` | Sariswing-specific; defer MVP |
| `sort_order` | _to be filled_ | _TBD_ | optional | no if column exists | |
| `source_url` | _to be filled_ | _TBD_ | optional | likely yes | import provenance |
| `created_at` | _to be filled_ | _TBD_ | system | TBD | |
| `updated_at` | _to be filled_ | _TBD_ | system | TBD | |
| `updated_by` | _to be filled_ | _TBD_ | system | TBD | prefer trigger later |
| `legacy_id` | _to be filled_ | _TBD_ | yes (import) | no if column exists | adapter uses `legacy_id` |

**MVP minimum without schema change (hypothesis):** `title`, `date`, `venue`, `published`, `description`, `legacy_id` — confirm in G-6-e1-schedule-schema-read-audit-result.

## 7. schedule_months decision criteria

**Derived/read model is preferred if:**

```txt
- schedules has reliable event date column
- month grouping can be generated in code from event_date
- schedule_months only stores year/month labels or static page metadata
- no manual monthly description authoring required in MVP
```

**Authoring model may be needed if:**

```txt
- schedule_months contains manually edited monthly descriptions
- schedule_months controls public route metadata not derivable from schedules
- schedule records depend on schedule_month_id FK and break without month rows
```

**Audit action:** Compare §5.3–5.4 FK constraints and §5.11 sample rows to decide.

## 8. RLS/GRANT criteria

**schedules:**

```txt
- anon SELECT published records only
- authenticated SELECT all records if needed for admin read
- authenticated INSERT/UPDATE only through admin/editor RLS
- DELETE disabled initially
```

**schedule_months:**

```txt
- anon SELECT public month data only
- authenticated SELECT for admin read
- INSERT/UPDATE only if schedule_months remains authoring model
- no TRUNCATE/TRIGGER/REFERENCES grants (removed in G-6-rls-grant-cleanup-result)
```

**From G-6-rls-audit-result (secondary context):**

```txt
- schedules: *_admin_all, *_public_select policy pattern
- schedule_months: *_admin_all, *_public_select policy pattern
- verify INSERT/UPDATE policies exist before non-dry-run — may need dedicated review in result doc
```

## 9. Implementation impact analysis

Decide after manual SQL results:

```txt
- Can G-6-e2 dry-run UI use existing columns?
- Is schema migration required before dry-run UI?
- Should first implementation support create or update only?
- Is duplicate possible without schema change?
- Is a pre-seeded test row available?
- Does schedule_months require writes?
```

**Planning bias (from schedule-cms-planning):**

```txt
- First non-dry-run PoC: update pre-seeded row (safer than create)
- First dry-run scope: update + duplicate preview; create if legacy_id rules clear
- schedule_months: read-only in first write phases if derived model confirmed
```

## 10. Expected audit status values

```txt
not_run
manual_sql_collected
schema_compatible
schema_migration_required
rls_review_required
blocked
```

**Initial value (this phase):**

```txt
auditStatus: not_run
```

## 11. G-6-e implementation gate

```txt
readyForG6EPlanning: true
readyForG6EImplementation: false until:
- manual SQL results are collected (G-6-e1-schedule-schema-read-audit-result)
- schedules schema is reviewed
- schedule_months role is decided
- required MVP fields are mapped
- RLS/GRANT status is reviewed
- dry-run operation scope is selected
- rollback plan is drafted
```

**G-6-e2+ gate (after audit result):**

```txt
readyForG6E2DryRunUi: false until audit result confirms schema_compatible or migration plan approved
```

## 12. Recommended next step

```txt
~~User runs manual read-only SQL~~ — DONE (see schedule-schema-read-audit-result.md)
Recommended next: G-6-e2-schedule-dry-run-ui-planning
```

**G-6-e1-schedule-schema-read-audit-result（完了）:** [schedule-schema-read-audit-result.md](./schedule-schema-read-audit-result.md) — `schemaStatus: schema_compatible_for_mvp`; `scheduleMonthsDecision: derived_read_model_for_mvp`; no schema migration before dry-run UI; `readyForG6E2ScheduleDryRunUiPlanning: true`.

**Recommended next phase:** ~~G-6-e1-schedule-schema-read-audit-result~~ — DONE

## 13. Final safety statement

```txt
This audit phase is read-only.
No schedule schema is changed.
No schedule records are written.
No production data is touched.
No /admin route is connected.
G-6-e implementation remains blocked.
```

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-schema-read-audit.mjs \
  --out-dir tools/static-to-astro/output/schedule-schema-read-audit/gosaki
```

## Result recording template (for G-6-e1-schedule-schema-read-audit-result)

```txt
targetProject: static-to-astro-cms-staging
auditStatus: manual_sql_collected | schema_compatible | schema_migration_required | ...
schedulesColumnCount:
scheduleMonthsColumnCount:
scheduleMonthsRole: derived | authoring | mixed
mvpFieldsWithoutSchemaChange:
missingFieldsForMvp:
preSeededTestRowAvailable: true | false
rlsReviewRequired: true | false
grantReviewRequired: true | false
readyForG6E2DryRunUi: true | false
readyForG6EImplementation: false
notes:
```
