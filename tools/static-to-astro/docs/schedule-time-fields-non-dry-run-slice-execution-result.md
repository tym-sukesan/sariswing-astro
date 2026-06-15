# Schedule time fields non-dry-run slice execution result (G-6-g2)

**Phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-execution`  
**Prerequisites:** [schedule-time-fields-non-dry-run-slice-final-preflight.md](./schedule-time-fields-non-dry-run-slice-final-preflight.md)

## 1. Purpose

This document records the successful outcome of the first G-6-g2 product-path time-fields non-dry-run write (`open_time` + `start_time` only on one existing staging row) via `AdminStagingScheduleGeneralEditSection`.

Cursor did **not** click the Save button.  
Cursor did **not** click the Preview button.  
Cursor did **not** click any Run button.  
Playwright / Chromium auto-click was **not** used.  
Cursor did **not** execute Supabase SQL.  
Rollback SQL was **not** executed.  
G-6-g1 Save was **not** re-executed.

## 2. Summary

```txt
Execution: PASS
beforeSnapshot: PASS (user-confirmed SQL)
Preview: PASS (user-confirmed dry-run)
Save button clicked: yes (user manual, exactly once)
DB write performed: yes (one UPDATE on public.schedules)
open_time changed: null → [CMS Kit staging] G-6-g2 open PoC
start_time changed: null → [CMS Kit staging] G-6-g2 start PoC
title unchanged: yes (G-6-g1 value preserved)
venue unchanged: yes
description unchanged: yes
date unchanged: yes
price unchanged: yes (null)
published / show_on_home / sort_order unchanged: yes
created_at unchanged: yes
changedFields: ["open_time", "start_time"] only
optimistic lock: enabled; expectedBeforeUpdatedAt matched baseline
no optimistic_lock_failed: yes
schedule_months touched: false
service_role used: false
production touched: false
/admin touched: false
G-6-e5 / G-6-f6 PoC reused: false
G-6-g1 Save re-executed: false
rollback needed: false
rollback executed: false
```

## 3. Execution context

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/#schedule
/admin route: not used
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
G-6-g1 arm: OFF (single-arm rule)
Target id: aa440e29-5be8-402e-9190-0d81c48434c0
Target legacy_id: schedule-2026-07-010
Payload: { "open_time": "[CMS Kit staging] G-6-g2 open PoC", "start_time": "[CMS Kit staging] G-6-g2 start PoC" }
Write path: executeG6G2TimeFieldsNonDryRunSave → executeScheduleGeneralUpdateWrite
Session: authenticated (staging Supabase Auth)
readSource: supabase
G-6-e5 approval reused: false
G-6-f6 approval reused: false
G-6-e5 / G-6-f6 PoC re-armed: false
```

## 4. Before snapshot (user-confirmed)

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
title: [CMS Kit staging] G-6-g1 title PoC
venue: [CMS Kit staging] G-6-f6 venue PoC
open_time: null
start_time: null
price: null
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
published: true
show_on_home: false
sort_order: 10
created_at: 2026-06-05 17:39:44.140168+00
updated_at: 2026-06-14 15:03:08.762993+00
```

Optimistic lock baseline: `2026-06-14T15:03:08.762993+00:00`

## 5. Pre-Save UI state (user-confirmed)

```txt
Data read gate: enabled
readSource: supabase
Selected schedule: aa440e29-5be8-402e-9190-0d81c48434c0
G-6-g1 gate: not armed (title read-only)
G-6-g2 gate: armed
current open_time: null
current start_time: null
baseline updated_at: 2026-06-14 15:03:08.762993+00
staleDetected: false
Preview: executed (user-confirmed PASS criteria)
```

### Preview result (user-confirmed)

```txt
wouldWrite: true
actualWrite: false
changedFields: open_time, start_time
readSource: supabase
staleDetected: false
baselineUpdatedAt: 2026-06-14T15:03:08.762993+00:00
currentUpdatedAt: 2026-06-14T15:03:08.762993+00:00
writeAdapterUsed: false
supabaseWriteCalled: false
```

## 6. Result panel (user-confirmed)

```txt
Status: executed
actualWrite: true
approvalId: G-6-g2-schedule-time-fields-non-dry-run-slice
changedFields: open_time, start_time
rowsAffected: 1
beforeSnapshot.open_time: null
afterSnapshot.open_time: [CMS Kit staging] G-6-g2 open PoC
beforeSnapshot.start_time: null
afterSnapshot.start_time: [CMS Kit staging] G-6-g2 start PoC
beforeSnapshot.updated_at: 2026-06-14T15:03:08.762993+00:00
afterSnapshot.updated_at: 2026-06-15T01:02:22.949565+00:00
optimisticLock: enabled
expectedBeforeUpdatedAt: 2026-06-14T15:03:08.762993+00:00
errorCode: —
errorMessage: —
serviceRoleUsed: false
schedule_months: read_only_derived (not touched)
```

### Payload

```json
{
  "open_time": "[CMS Kit staging] G-6-g2 open PoC",
  "start_time": "[CMS Kit staging] G-6-g2 start PoC"
}
```

### Safety flags

```json
{
  "stagingOnly": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "scheduleMonthsTouched": false,
  "deleteEnabled": false,
  "publishTriggered": false
}
```

## 7. After verification SQL (user-confirmed)

```sql
-- G-6-g2 afterVerification — SELECT only; staging project only
select
  id,
  legacy_id,
  open_time,
  start_time,
  title,
  venue,
  description,
  date,
  price,
  published,
  show_on_home,
  sort_order,
  created_at,
  updated_at,
  open_time = '[CMS Kit staging] G-6-g2 open PoC' as open_time_match,
  start_time = '[CMS Kit staging] G-6-g2 start PoC' as start_time_match,
  title = '[CMS Kit staging] G-6-g1 title PoC' as title_unchanged,
  venue = '[CMS Kit staging] G-6-f6 venue PoC' as venue_unchanged,
  description = '出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]' as description_unchanged,
  date = '2026-07-19' as date_unchanged,
  price is null as price_unchanged,
  published is true as published_unchanged,
  show_on_home is false as show_on_home_unchanged,
  sort_order = 10 as sort_order_unchanged
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

**Result:**

```txt
row count: 1
open_time: [CMS Kit staging] G-6-g2 open PoC
start_time: [CMS Kit staging] G-6-g2 start PoC
title: [CMS Kit staging] G-6-g1 title PoC
venue: [CMS Kit staging] G-6-f6 venue PoC
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
price: null
open_time_match: true
start_time_match: true
title_unchanged: true
venue_unchanged: true
description_unchanged: true
date_unchanged: true
price_unchanged: true
published_unchanged: true
show_on_home_unchanged: true
sort_order_unchanged: true
created_at: 2026-06-05 17:39:44.140168+00 (unchanged)
updated_at: 2026-06-15 01:02:22.949565+00 (advanced; matches UI afterSnapshot)
```

## 8. Rollback SQL (retained — not executed)

```sql
-- G-6-g2 rollback — staging only; execute only if explicitly approved
update public.schedules
set
  open_time = null,
  start_time = null
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

Note: rollback UPDATE would advance `updated_at` via trigger. Not needed (`rollbackNeeded: false`).

## 9. Gate decision

```txt
scheduleTimeFieldsNonDryRunSliceExecutionSucceeded: true
G-6-g2 nonDryRunSaveExecuted: true
rollbackNeeded: false
rollbackExecuted: false
dbWriteInG6G2Execution: true (user manual Save once only)
cursorClickedSave: false
cursorClickedPreview: false
cursorClickedRun: false
cursorExecutedSql: false
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: false
```

## 10. Post-execution staging row state

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
title: [CMS Kit staging] G-6-g1 title PoC (unchanged)
venue: [CMS Kit staging] G-6-f6 venue PoC (unchanged)
open_time: [CMS Kit staging] G-6-g2 open PoC
start_time: [CMS Kit staging] G-6-g2 start PoC
price: null (unchanged)
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test] (unchanged)
published: true
show_on_home: false
sort_order: 10
created_at: 2026-06-05 17:39:44.140168+00 (unchanged)
updated_at: 2026-06-15 01:02:22.949565+00
```

## 11. Recommended operator follow-up

```txt
Restart dev with PUBLIC_ADMIN_WRITE_DRY_RUN=true for routine work.
Do not re-click G-6-g2 Save without new approval ID / phase.
Do not re-click G-6-g1 Save.
Do not re-arm G-6-e5 / G-6-f6 PoCs.
```

## 12. Related docs

- [schedule-time-fields-non-dry-run-slice-preflight.md](./schedule-time-fields-non-dry-run-slice-preflight.md)
- [schedule-time-fields-non-dry-run-slice-implementation.md](./schedule-time-fields-non-dry-run-slice-implementation.md)
- [schedule-time-fields-non-dry-run-slice-final-preflight.md](./schedule-time-fields-non-dry-run-slice-final-preflight.md)
- [schedule-title-non-dry-run-slice-execution-result.md](./schedule-title-non-dry-run-slice-execution-result.md)
- [schedule-general-edit-next-slice-planning.md](./schedule-general-edit-next-slice-planning.md)
