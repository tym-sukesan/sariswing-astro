# Schedule Non-Dry-Run PoC Prep

**Phase:** `G-6-e5-schedule-non-dry-run-poc-prep`  
**Prerequisites:** [schedule-write-adapter-verification.md](./schedule-write-adapter-verification.md) (commit `f60b50e`), [schedule-write-adapter-implementation.md](./schedule-write-adapter-implementation.md) (commit `52b7349`)

## 1. Purpose

This document prepares the first Schedule non-dry-run PoC.

It does not invoke the write adapter.  
It does not write schedule records.  
It does not expose non-dry-run UI.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Current status

```txt
Schedule UPDATE privilege has been applied in staging (`authenticated UPDATE` on `public.schedules`).
Guarded ScheduleWriteAdapter has been implemented and verified as isolated.
The adapter has not been invoked.
No schedule records have been updated.
This phase prepares one controlled non-dry-run update PoC.
```

**Staging project:** `static-to-astro-cms-staging`

**Table privileges on `public.schedules`:** `anon SELECT`, `authenticated SELECT`, `authenticated UPDATE` (INSERT/DELETE/TRUNCATE/TRIGGER/REFERENCES absent)

**RLS:** `schedules_admin_all` via `is_admin()`; admin user confirmed.

## 3. First PoC scope

```txt
First Schedule non-dry-run PoC scope:
- staging only
- public.schedules only
- one existing row only
- update operation only
- no insert
- no duplicate
- no delete
- no schedule_months write
- no publish/deploy trigger
- no UI non-dry-run button
```

## 4. Target row selection criteria

**Recommended criteria:**

```txt
- existing row in public.schedules
- preferably unpublished or clearly safe test/demo row
- not a real client/customer production row
- not shown on homepage if avoidable
- not schedule_months-dependent beyond existing month grouping
- can be restored by rollback SQL
```

**Priority candidate (from prior dry-run UI):**

```txt
Draft upcoming (unpublished)
venue: Mock Studio
published: false
description: Unpublished mock row for admin read preview.
```

Whether this row exists in staging must be confirmed with read-only SQL below. Cursor does not execute SQL.

## 5. Manual read-only SQL: find target candidates

Run in Supabase SQL Editor on **staging only**. Cursor does not execute this.

```sql
select
  id,
  legacy_id,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  published,
  show_on_home,
  home_order,
  sort_order,
  updated_at
from public.schedules
where
  published = false
  or title ilike '%draft%'
  or title ilike '%test%'
  or venue ilike '%mock%'
order by date desc, sort_order asc
limit 10;
```

**Fallback if no candidates:**

```sql
select
  id,
  legacy_id,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  published,
  show_on_home,
  home_order,
  sort_order,
  updated_at
from public.schedules
order by date desc, sort_order asc
limit 10;
```

**Important:**

```txt
Do not update any row until one target row is explicitly chosen and beforeSnapshot is recorded.
```

## 6. Target row manual recording template

After manual selection, record the chosen row:

```txt
Selected target row:

id:
legacy_id:
date:
title:
venue:
open_time:
start_time:
price:
description:
published:
show_on_home:
home_order:
sort_order:
updated_at:
```

## 7. beforeSnapshot SQL

Replace `<target-schedule-id>` with the chosen UUID. Run on **staging only**.

```sql
select
  id,
  legacy_id,
  date,
  year,
  month,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  image_url,
  home_image_url,
  source_file,
  source_route,
  show_on_home,
  home_order,
  published,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = '<target-schedule-id>';
```

**Expected:**

```txt
one row only
```

**Abort if:**

```txt
no row
multiple rows
unexpected row
row is not safe for PoC
```

## 8. Proposed minimal payload

First PoC payload: **change `description` only** with a small suffix.

**Payload:**

```json
{
  "description": "<before description> [G-6-e5 non-dry-run PoC]"
}
```

**Rationale:**

```txt
- dateを変えないため月別/未来過去/route影響が少ない
- titleを変えないため一覧表示への影響が少ない
- venueを変えないため意味変更が小さい
- publishedを変えないため公開状態が変わらない
- schedule_months countやrouteに影響しない
```

If `description` is too long or unsuitable, do not switch to `price` or `open_time` without review. Consult before choosing another field.

## 9. expectedAfter

```txt
Expected after update:
- id: unchanged
- legacy_id: unchanged
- date: unchanged
- title: unchanged
- venue: unchanged
- published: unchanged
- show_on_home: unchanged
- home_order: unchanged
- sort_order: unchanged
- description: before description + " [G-6-e5 non-dry-run PoC]"
- updated_at: may change if payload includes updated_at or DB behavior changes it
```

**`updated_at` policy:**

```txt
Do not include updated_at in the first PoC payload unless the existing adapter requires it.
Keep payload minimal: description only.
```

The current `updateScheduleWrite` adapter accepts only allowed payload columns; `updated_at` is not in the minimal PoC payload. DB may still bump `updated_at` via trigger or default — record actual value in afterSnapshot.

## 10. rollback SQL template

Prepared for future use. **Not executed in this prep phase.**

```sql
-- Rollback for G-6-e5-schedule-non-dry-run-poc
-- STAGING ONLY. Do not run against production.
update public.schedules
set
  description = '<before-description>'
where id = '<target-schedule-id>';
```

**Full rollback template (if needed):**

```sql
-- Full rollback template if needed:
-- update public.schedules
-- set
--   date = '<before-date>',
--   title = '<before-title>',
--   venue = '<before-venue>',
--   open_time = '<before-open-time>',
--   start_time = '<before-start-time>',
--   price = '<before-price>',
--   description = '<before-description>',
--   published = <before-published>,
--   show_on_home = <before-show-on-home>,
--   home_order = <before-home-order>,
--   sort_order = <before-sort-order>
-- where id = '<target-schedule-id>';
```

**Note:**

```txt
Rollback SQL is prepared but not executed in this prep phase.
```

`readyForRollbackSqlFinalization: false` until a target row is selected and `<before-description>` / `<target-schedule-id>` are filled from beforeSnapshot.

## 11. Approval ID

```txt
Required approval ID:
G-6-e5-schedule-non-dry-run-poc
```

```txt
The adapter must reject any other approval ID.
```

Constant in code: `SCHEDULE_WRITE_APPROVAL_ID` in `schedule-write-types.ts`.

## 12. Future execution mode

Planned for a future phase only. **Not implemented or executed in this prep phase.**

**Recommended:**

```txt
Use a dedicated one-off script or staging-only manual trigger.
Do not expose a UI button.
Do not connect to /admin.
Do not run automatically on build.
```

**Future script candidate (not created in this phase):**

```txt
tools/static-to-astro/scripts/run-schedule-non-dry-run-poc.mjs
```

**Future execution env (reference only — do not apply in prep):**

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-e5-schedule-non-dry-run-poc
PUBLIC_ADMIN_WRITE_DRY_RUN=false
```

**Warning:**

```txt
Do not run with PUBLIC_ADMIN_WRITE_DRY_RUN=false in this prep phase.
```

## 13. Future execution checklist

```txt
Before future non-dry-run execution:

[ ] target row selected
[ ] beforeSnapshot captured
[ ] payload reviewed
[ ] expectedAfter documented
[ ] rollback SQL prepared
[ ] approval ID confirmed
[ ] staging project confirmed
[ ] user is authenticated as admin
[ ] no UI non-dry-run button added
[ ] script/manual trigger is one-off
[ ] dry-run smoke test still passes
```

## 14. Abort conditions

```txt
Abort PoC if:

- target row is uncertain
- beforeSnapshot is missing
- rollback SQL is missing
- payload changes date/title/published unexpectedly
- payload touches legacy_id/year/month/source/image fields
- schedule_months would need update
- user is not admin
- staging project is not clearly confirmed
- non-dry-run UI would be exposed
- production credentials/project appear anywhere
```

## 15. Result recording template

For use after future execution (not this phase):

```txt
G-6-e5-schedule-non-dry-run-poc result

Project:
- staging confirmed: yes/no

Target:
- id:
- title:
- date:
- published:

Before snapshot:
- captured: yes/no
- description before:

Payload:
- description after:

Execution:
- approval ID:
- updateScheduleWrite invoked: yes/no
- actualWrite: true/false
- rowsAffected:
- errorCode if any:

After snapshot:
- captured: yes/no
- description after:
- changedFields:

Verification:
- only description changed: yes/no
- schedule_months touched: yes/no
- non-dry-run UI exposed: yes/no
- production touched: yes/no

Rollback:
- rollback executed: yes/no
- rollback reason:
- rollback verified: yes/no

Final:
- PoC status: pass/fail/rolled_back
```

## 16. Gate decision

```txt
readyForTargetRowManualSelection: true
readyForBeforeSnapshotCapture: true
readyForRollbackSqlFinalization: false
readyForG6E5ScheduleNonDryRunPoc: false
readyForNonDryRunSchedulePoC: false
```

**Explanation:**

```txt
Target row and beforeSnapshot must be manually selected/captured before actual PoC execution.
```

| Flag | Value | Meaning |
|------|-------|---------|
| `targetRowSelected` | `false` | No row chosen yet |
| `beforeSnapshotCaptured` | `false` | beforeSnapshot SQL not run for a chosen id |
| `rollbackSqlPrepared` | `true` | Template documented; placeholders unfilled |
| `payloadFinalized` | `false` | Requires beforeSnapshot text for description |

## 17. Recommended next phase

```txt
Recommended next:
G-6-e5-schedule-non-dry-run-poc-target-selection — DONE (see schedule-non-dry-run-poc-target-selection.md)
G-6-e5-schedule-non-dry-run-poc-execution-prep — DONE (see schedule-non-dry-run-poc-execution-prep.md)
Next: G-6-e5-schedule-non-dry-run-poc-execution-path-implementation
```

**G-6-e5-schedule-non-dry-run-poc-target-selection（完了）:** [schedule-non-dry-run-poc-target-selection.md](./schedule-non-dry-run-poc-target-selection.md) — selected target row `schedule-2026-07-010`; beforeSnapshot captured; final payload description only; rollback SQL finalized; ready for execution prep; actual non-dry-run execution remains blocked.

**G-6-e5-schedule-non-dry-run-poc-execution-prep（完了）:** [schedule-non-dry-run-poc-execution-prep.md](./schedule-non-dry-run-poc-execution-prep.md) — execution path planning prepared; one-off execution path required; service_role prohibited; authenticated admin user required; no execution script invoked; actual non-dry-run execution remains blocked.

## 18. Final safety statement

This phase prepares the first non-dry-run PoC only.

No write adapter is invoked.  
No schedule records are updated.  
No rollback SQL is executed.  
No non-dry-run UI is exposed.

Actual non-dry-run execution remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-non-dry-run-poc-prep.mjs \
  --out-dir tools/static-to-astro/output/schedule-non-dry-run-poc-prep/gosaki
```
