# Schedule Schema Read Audit Result

## 1. Purpose

**Phase:** `G-6-e1-schedule-schema-read-audit-result`

This document records the manual read-only schedule schema audit result.
It does not change database schema.
It does not write schedule records.
It does not implement write adapters.
It does not connect /admin.
It does not touch production data.

The user ran read-only audit SQL manually in Supabase SQL Editor on project `static-to-astro-cms-staging`. Cursor did not execute SQL.

Follows [schedule-schema-read-audit.md](./schedule-schema-read-audit.md) and [schedule-cms-planning.md](./schedule-cms-planning.md).

## 2. Summary

```txt
targetProject: static-to-astro-cms-staging
auditStatus: manual_sql_collected
schemaStatus: schema_compatible_for_mvp
scheduleMonthsDecision: derived_read_model_for_mvp
schemaMigrationRequiredBeforeDryRun: false
futurePastGroupingSupported: true
futureCount: 19
pastCount: 41
scheduleRows: 60
scheduleMonthRows: 5
readyForG6E2ScheduleDryRunUiPlanning: true
readyForG6EImplementation: false
recommendedNextPhase: G-6-e2-schedule-dry-run-ui-planning
```

**Conclusion:**

```txt
schedules schema: schema_compatible
schedule_months: derived/read model として扱える可能性が高い
RLS/GRANT: cleanup後の期待どおり
future/past grouping: dateカラムで可能
schema migration before dry-run UI: not required for MVP
```

G-6-e implementation remains blocked. Next: dry-run UI planning or scaffold planning — not direct implementation.

## 3. schedules schema result

### Columns (§5.1)

```txt
id: uuid, not null, default gen_random_uuid()
legacy_id: text, nullable
date: date, not null
year: integer, nullable
month: text, nullable
title: text, nullable
venue: text, nullable
open_time: text, nullable
start_time: text, nullable
price: text, nullable
description: text, nullable
image_url: text, nullable
home_image_url: text, nullable
source_file: text, nullable
source_route: text, nullable
show_on_home: boolean, nullable, default false
home_order: integer, nullable
published: boolean, nullable, default true
sort_order: integer, nullable, default 0
created_at: timestamptz, nullable, default now()
updated_at: timestamptz, nullable, default now()
```

**Evaluation:**

```txt
Schedule CMS MVPに必要な主要fieldは既に存在する。
date / title / venue / open_time / start_time / price / description / published / sort_order が利用可能。
```

### Constraints (§5.3)

```txt
CHECK:
- 2200_17575_1_not_null
- 2200_17575_3_not_null

PRIMARY KEY:
- schedules_pkey on id

UNIQUE:
- schedules_legacy_id_key on legacy_id
```

**Evaluation:** `id` PK and `legacy_id` UNIQUE support import/migration deduplication.

### Indexes (§5.5)

```txt
schedules_date_idx on date
schedules_legacy_id_key on legacy_id
schedules_month_idx on month
schedules_pkey on id
schedules_show_on_home_idx on show_on_home where show_on_home = true
```

**Evaluation:** Indexes support date sorting, month grouping, home featured display, and legacy_id lookup.

## 4. schedule_months schema result

### Columns (§5.2)

```txt
id: uuid, not null, default gen_random_uuid()
month: text, not null
label: text, not null
route: text, not null
count: integer, nullable, default 0
sort_order: integer, nullable, default 0
published: boolean, nullable, default true
created_at: timestamptz, nullable, default now()
updated_at: timestamptz, nullable, default now()
```

**Evaluation:** Month/label/route/count metadata — natural fit for derived/read model, not primary authoring.

### Constraints (§5.4)

```txt
CHECK: not null checks
PRIMARY KEY: schedule_months_pkey on id
UNIQUE: schedule_months_month_key on month
```

**Evaluation:** `month` UNIQUE supports month-level read/navigation model.

### Indexes (§5.6)

```txt
schedule_months_month_key on month
schedule_months_pkey on id
```

**Evaluation:** Month lookup supported.

### Sample rows (§5.11)

```txt
2026-07 / label 2026.07 / route /schedule-2026-07/ / count 14 / sort_order 1
2026-06 / label 2026.06 / route /schedule-2026-06/ / count 11 / sort_order 2
2026-05 / label 2026.05 / route /schedule-2026-05/ / count 12 / sort_order 3
2026-04 / label 2026.04 / route /schedule-2026-04/ / count 10 / sort_order 4
2026-03 / label 2026.03 / route /schedule-2026-03/ / count 13 / sort_order 5
```

**Evaluation:** `count` appears derivable from `schedules` rows; suitable for read/navigation layer.

## 5. RLS and GRANT result

### Policies (§5.7)

**schedule_months:**

```txt
schedule_months_admin_all
  roles: authenticated
  cmd: ALL
  qual: is_admin()
  with_check: is_admin()

schedule_months_public_select
  roles: anon, authenticated
  cmd: SELECT
  qual: published = true
```

**schedules:**

```txt
schedules_admin_all
  roles: authenticated
  cmd: ALL
  qual: is_admin()
  with_check: is_admin()

schedules_public_select
  roles: anon, authenticated
  cmd: SELECT
  qual: published = true
```

**Evaluation:**

```txt
Public read limited to published = true.
Admin writes restricted by is_admin().
Editor role not yet separated — acceptable for initial MVP; review later.
```

### Grants (§5.8)

```txt
schedule_months:
- anon SELECT
- authenticated SELECT

schedules:
- anon SELECT
- authenticated SELECT
```

**Evaluation:**

```txt
TRUNCATE / TRIGGER / REFERENCES no longer appear for schedules or schedule_months.
Matches G-6-rls-grant-cleanup-result expectations.
Non-dry-run write may require authenticated INSERT/UPDATE grants later — not blocking dry-run UI.
```

## 6. Data sample and row count

### Row counts (§5.9)

```txt
schedules: 60
schedule_months: 5
```

Sufficient sample data for list/read UI design.

### schedules sample (§5.10)

**Sample month:** 2026-07

**Fields present in samples:** `date`, `year`, `month`, `title`, `venue`, `open_time`, `start_time`, `price`, `description`, `source_file`, `source_route`, `published`, `sort_order`

**Examples (sanitized titles/venues):**

```txt
2026-07-07 / <Duo> / 広尾 Barおくむら
2026-07-09 / Leader LIVE / 赤坂 Jazz Dining B-flat
2026-07-11 / <出口優日カルテット> / 入間市 新しきを知る公園野外ステージ
2026-07-12 / <楽屋30周年記念ライブ 2日目> / 中目黒 楽屋
2026-07-03 / <Awesome Songbook> / 用賀 キンのツボ
```

**Evaluation:** Real data sufficient for MVP UI. Performers and venue URLs often embedded in `description` — free-text description is safe for initial MVP.

## 7. Future/past grouping

Executed with actual column `date` (not planning name `event_date`):

```txt
future: 19
past: 41
```

**Evaluation:** `schedules.date` alone supports future/past separation for Schedule CMS MVP.

## 8. Field mapping

| Planned field | Existing column | Exists? | MVP | Schema change? | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `schedules.id` | yes | required | no | uuid PK |
| `title` | `schedules.title` | yes | required | no | |
| `event_date` | `schedules.date` | yes | required | no | column name is `date` |
| `start_time` | `schedules.start_time` | yes | useful | no | |
| `open_time` | `schedules.open_time` | yes | useful | no | |
| `venue_name` | `schedules.venue` | yes | required | no | |
| `venue_area` | — | no | optional | later | |
| `venue_address` | — | no | optional | later | |
| `venue_url` | in `description` | partial | optional | later | unstructured |
| `reservation_url` | — | no | optional | later | |
| `performers` | in `description` | partial | optional | later | unstructured |
| `description` | `schedules.description` | yes | required | no | |
| `price_text` | `schedules.price` | yes | useful | no | |
| `is_published` | `schedules.published` | yes | required | no | |
| `is_featured` | `schedules.show_on_home` | partial | optional | no | Sariswing home module |
| `sort_order` | `schedules.sort_order` | yes | useful | no | |
| `source_url` | `source_file`, `source_route` | partial | migration | no | import provenance |
| `created_at` | `schedules.created_at` | yes | system | no | |
| `updated_at` | `schedules.updated_at` | yes | system | no | |
| `updated_by` | — | no | later | later | trigger phase |

**Conclusion:**

```txt
MVP does not require immediate schema migration.
Some richer fields can be deferred.
```

## 9. schedule_months decision

```txt
Decision: Treat schedule_months as derived/read model for MVP.
```

**Reason:**

```txt
- schedules has date and month columns
- schedule_months stores month / label / route / count / sort_order / published
- month grouping can be generated from schedules.date or schedules.month
- count appears derivable from schedules row counts
```

**Constraint for first dry-run implementation:**

```txt
Do not write schedule_months in first Schedule CMS dry-run implementation unless a later audit proves it is required.
```

## 10. Implementation impact

```txt
Can G-6-e2 dry-run UI use existing columns?
Yes.

Is schema migration required before dry-run UI?
No, not for MVP.

Should first implementation support create or update only?
Prefer update + duplicate dry-run first, then create dry-run.

Is duplicate possible without schema change?
Yes, using existing fields; legacy_id uniqueness must be handled carefully in actual write phase.

Is a pre-seeded test row available?
Existing rows exist (60 schedules). A dedicated test row may be safer before non-dry-run.

Does schedule_months require writes?
Not for first MVP dry-run implementation.
```

## 11. Remaining gaps

```txt
- reservation_url missing
- venue_area missing
- venue_address missing
- venue_url missing as structured field
- performers missing as structured field
- updated_by missing
- editor role not yet separated from admin
- authenticated INSERT/UPDATE grants not present yet (needed only for future non-dry-run)
```

**G-6-e4-schedule-update-grant-prep（完了）:** [schedule-update-grant-prep.md](./schedule-update-grant-prep.md) — `authenticated UPDATE` on `public.schedules` may be required for future real update; manual GRANT/rollback SQL prepared; GRANT not executed; is_admin() review required before apply.

**These gaps do not block MVP dry-run UI.**

## 12. Recommended next phase

```txt
Recommended next: G-6-e2-schedule-dry-run-ui-planning — DONE (see schedule-dry-run-ui-planning.md)
```

**G-6-e2-schedule-dry-run-ui-planning（完了）:** [schedule-dry-run-ui-planning.md](./schedule-dry-run-ui-planning.md) — update + duplicate dry-run first; delete excluded; `schedule_months` read-only; SELECT-only grants sufficient.

**G-6-e2-schedule-dry-run-ui-scaffold（完了）:** [schedule-dry-run-ui-scaffold.md](./schedule-dry-run-ui-scaffold.md) — Schedule dry-run UI in staging shell; update + duplicate dry-run only; no DB write.

**G-6-e2-schedule-dry-run-ui-verification-result（完了）:** [schedule-dry-run-ui-verification-result.md](./schedule-dry-run-ui-verification-result.md) — Manual browser verification passed; port `4322`.

**G-6-e3-schedule-dry-run-adapter-planning（完了）:** [schedule-dry-run-adapter-planning.md](./schedule-dry-run-adapter-planning.md) — Dry-run adapter boundary; pure functions; next: G-6-e3-schedule-dry-run-adapter-implementation.

G-6-e write implementation remains blocked until adapter implementation and separate approval.

## 13. Final safety statement

```txt
The schedule schema audit was read-only.
No database schema was changed.
No schedule records were written.
No production data was touched.
No /admin route was connected.
G-6-e implementation remains blocked until a separate approved dry-run UI phase.
```

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-schema-read-audit-result.mjs \
  --out-dir tools/static-to-astro/output/schedule-schema-read-audit-result/gosaki
```
