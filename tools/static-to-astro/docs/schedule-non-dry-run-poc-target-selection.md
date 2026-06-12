# Schedule Non-Dry-Run PoC Target Selection

**Phase:** `G-6-e5-schedule-non-dry-run-poc-target-selection`  
**Prerequisites:** [schedule-non-dry-run-poc-prep.md](./schedule-non-dry-run-poc-prep.md) (commit `ce3793c`)

## 1. Purpose

This document records the selected target row and beforeSnapshot for the first Schedule non-dry-run PoC.

It does not invoke the write adapter.  
It does not write schedule records.  
It does not execute rollback SQL.  
It does not expose non-dry-run UI.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Current status

```txt
ScheduleWriteAdapter is implemented and verified as isolated.
authenticated UPDATE privilege on public.schedules is applied in staging.
The first non-dry-run PoC prep is complete.
A target row has now been selected manually using read-only SQL.
```

**Staging project:** `static-to-astro-cms-staging`

## 3. Candidate search result

**Primary candidate search:**

```txt
- unpublished / draft / test / mock query
- result: no rows
```

**Fallback candidate search:**

```txt
- latest schedules ordered by date desc, sort_order asc
- result: multiple rows
```

User executed read-only SQL in Supabase SQL Editor (staging only). Cursor did not execute SQL.

## 4. Selected target row

```txt
Selected target row:
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
title: <>
venue:
description: 出演：
published: true
show_on_home: false
sort_order: 10
updated_at: 2026-06-05 17:39:44.140168+00
```

## 5. Selection rationale

```txt
This row is suitable for the first PoC because:
- it appears to be a placeholder-like row
- title is empty-like: <>
- venue is empty
- description is minimal: 出演：
- show_on_home is false
- changing description only has low structural risk
- no schedule_months update is required
```

**Caveat:**

```txt
published is true, so this is technically public schedule data.
However, because the row is placeholder-like and the planned change is description-only, it is acceptable for a tightly controlled staging PoC.
```

## 6. beforeSnapshot

Captured via read-only SQL on staging (`where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'`). One row returned.

```txt
beforeSnapshot:
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
year: 2026
month: 2026-07
title: <>
venue:
open_time: null
start_time: null
price: null
description: 出演：
image_url: null
home_image_url: null
source_file: schedule-2026-07.html
source_route: /schedule-2026-07/
show_on_home: false
home_order: null
published: true
sort_order: 10
created_at: 2026-06-05 17:39:44.140168+00
updated_at: 2026-06-05 17:39:44.140168+00
```

## 7. Final PoC payload

```json
{
  "description": "出演： [G-6-e5 non-dry-run PoC]"
}
```

```txt
Only description will be changed.
No date/title/venue/published/show_on_home/sort_order fields will be changed.
No updated_at field will be included in the payload.
```

**Adapter input shape (future execution):**

```txt
targetId: aa440e29-5be8-402e-9190-0d81c48434c0
approvalId: G-6-e5-schedule-non-dry-run-poc
beforeSnapshot: (section 6 above)
payload: { "description": "出演： [G-6-e5 non-dry-run PoC]" }
```

## 8. Expected after state

```txt
Expected after update:
id: unchanged
legacy_id: unchanged
date: unchanged
year: unchanged
month: unchanged
title: unchanged
venue: unchanged
open_time: unchanged
start_time: unchanged
price: unchanged
description: 出演： [G-6-e5 non-dry-run PoC]
published: unchanged
show_on_home: unchanged
home_order: unchanged
sort_order: unchanged
source_file/source_route: unchanged
updated_at: may remain unchanged unless database behavior changes it
```

## 9. Final rollback SQL

Prepared for future use. **Not executed in this phase.**

```sql
-- Rollback for G-6-e5-schedule-non-dry-run-poc
-- STAGING ONLY. Do not run against production.
update public.schedules
set
  description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

```txt
Rollback SQL is prepared but not executed in this phase.
Rollback is only needed if the future PoC must be reverted.
```

## 10. Approval ID

```txt
Required approval ID:
G-6-e5-schedule-non-dry-run-poc
```

## 11. Future execution conditions

```txt
Future non-dry-run execution remains blocked until:
- a dedicated one-off execution path is prepared
- environment/gate flags are explicitly set
- user confirms final execution
- rollback SQL is available
- staging project is confirmed again
```

## 12. Abort conditions

```txt
Abort future PoC if:
- target row differs from selected beforeSnapshot
- beforeSnapshot cannot be confirmed immediately before execution
- payload would modify fields other than description
- rollback SQL is missing
- staging project is unclear
- user is not authenticated as admin
- non-dry-run UI would be exposed
- production credentials/project appear anywhere
```

## 13. Gate decision

```txt
targetRowSelected: true
beforeSnapshotCaptured: true
payloadFinalized: true
expectedAfterDocumented: true
rollbackSqlFinalized: true
writeAdapterInvoked: false
dbWritesPerformed: false
scheduleRecordsUpdated: false
readyForG6E5ScheduleNonDryRunPocExecutionPrep: true
readyForG6E5ScheduleNonDryRunPoc: false
readyForNonDryRunSchedulePoC: false
```

`readyForG6E5ScheduleNonDryRunPocExecutionPrep: true` — one-off execution path may be prepared next.

`readyForG6E5ScheduleNonDryRunPoc` and `readyForNonDryRunSchedulePoC` remain **false** until execution prep and explicit user approval.

## 14. Recommended next phase

```txt
Recommended next:
G-6-e5-schedule-non-dry-run-poc-execution-prep — DONE (see schedule-non-dry-run-poc-execution-prep.md)
G-6-e5-schedule-non-dry-run-poc-execution-path-implementation — DONE (see schedule-non-dry-run-poc-execution-path-implementation.md)
G-6-e5-schedule-non-dry-run-poc-execution-path-verification — DONE (see schedule-non-dry-run-poc-execution-path-verification.md)
Next: G-6-e5-schedule-non-dry-run-poc-execution-path-verification-result
```

**G-6-e5-schedule-non-dry-run-poc-execution-prep（完了）:** [schedule-non-dry-run-poc-execution-prep.md](./schedule-non-dry-run-poc-execution-prep.md) — execution path planning prepared; one-off execution path required; service_role prohibited; authenticated admin user required; no execution script invoked; actual non-dry-run execution remains blocked.

**G-6-e5-schedule-non-dry-run-poc-execution-path-implementation（完了）:** [schedule-non-dry-run-poc-execution-path-implementation.md](./schedule-non-dry-run-poc-execution-path-implementation.md) — hidden staging browser trigger implemented; default hidden; trigger was not invoked; no DB write occurred.

**G-6-e5-schedule-non-dry-run-poc-execution-path-verification（完了）:** [schedule-non-dry-run-poc-execution-path-verification.md](./schedule-non-dry-run-poc-execution-path-verification.md) — normal dev hidden verified; env-gated verification pending; trigger not clicked.

## 15. Final safety statement

The target row and beforeSnapshot are selected and recorded.

The payload and rollback SQL are finalized.  
No write adapter has been invoked.  
No schedule record has been updated.  
No rollback SQL has been executed.  
No non-dry-run UI has been exposed.

Actual non-dry-run execution remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-non-dry-run-poc-target-selection.mjs \
  --out-dir tools/static-to-astro/output/schedule-non-dry-run-poc-target-selection/gosaki
```
