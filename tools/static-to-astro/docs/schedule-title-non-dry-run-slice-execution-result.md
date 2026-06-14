# Schedule title non-dry-run slice execution result (G-6-g1)

**Phase:** `G-6-g1-schedule-title-non-dry-run-slice-execution`  
**Prerequisites:** [schedule-title-non-dry-run-slice-final-preflight.md](./schedule-title-non-dry-run-slice-final-preflight.md)

## 1. Purpose

This document records the successful outcome of the first G-6-g1 product-path title non-dry-run write (`title` only on one existing staging row) via `AdminStagingScheduleGeneralEditSection`.

Cursor did **not** click the Save button.  
Cursor did **not** click any Run button.  
Playwright / Chromium auto-click was **not** used.  
Cursor did **not** execute Supabase SQL.  
Rollback SQL was **not** executed.

## 2. Summary

```txt
Execution: PASS
beforeSnapshot: PASS (user-confirmed SQL)
readSource supabase: PASS (after client data read gate fix cf24c09)
Preview: PASS (user-confirmed)
Save button clicked: yes (user manual, exactly once)
DB write performed: yes (one UPDATE on public.schedules)
title changed: yes
venue unchanged: yes
description unchanged: yes
changedFields: ["title"] only
optimistic lock: enabled; expectedBeforeUpdatedAt matched baseline
schedule_months touched: false
service_role used: false
production touched: false
/admin touched: false
rollback needed: false
rollback executed: false
```

## 3. Execution context

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/#schedule
/admin route: not used
Approval ID: G-6-g1-schedule-title-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
Target id: aa440e29-5be8-402e-9190-0d81c48434c0
Target legacy_id: schedule-2026-07-010
Payload: { "title": "[CMS Kit staging] G-6-g1 title PoC" }
Write path: executeG6G1TitleNonDryRunSave → executeScheduleGeneralUpdateWrite
Session: authenticated (staging Supabase Auth)
G-6-e5 approval reused: false
G-6-f6 approval reused: false
G-6-e5 / G-6-f6 PoC re-armed: false
Client fix required: cf24c09 — mergeStagingShellEnv for live read
```

## 4. Before snapshot (user-confirmed)

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
title: <>
venue: [CMS Kit staging] G-6-f6 venue PoC
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
published: true
show_on_home: false
sort_order: 10
created_at: 2026-06-05 17:39:44.140168+00
updated_at: 2026-06-14 06:49:42.240919+00
```

Optimistic lock baseline: `2026-06-14T06:49:42.240919+00:00`

## 5. Pre-Save UI state (user-confirmed)

```txt
Data read gate: enabled
readSource: supabase
Selected schedule: aa440e29-5be8-402e-9190-0d81c48434c0
current title: <>
venue: [CMS Kit staging] G-6-f6 venue PoC
baseline updated_at: 2026-06-14 06:49:42.240919+00
mock warning: none
Preview: executed (user-confirmed PASS criteria)
```

## 6. Result panel (user-confirmed)

```txt
Status: executed
actualWrite: true
approvalId: G-6-g1-schedule-title-non-dry-run-slice
changedFields: title
rowsAffected: 1
beforeSnapshot.title: <>
afterSnapshot.title: [CMS Kit staging] G-6-g1 title PoC
beforeSnapshot.updated_at: 2026-06-14T06:49:42.240919+00:00
afterSnapshot.updated_at: 2026-06-14T15:03:08.762993+00:00
optimisticLock: enabled
expectedBeforeUpdatedAt: 2026-06-14T06:49:42.240919+00:00
errorCode: —
errorMessage: —
serviceRoleUsed: false
schedule_months: read_only_derived (not touched)
```

### Payload

```json
{
  "title": "[CMS Kit staging] G-6-g1 title PoC"
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
select
  id,
  legacy_id,
  date,
  title,
  venue,
  description,
  published,
  show_on_home,
  sort_order,
  created_at,
  updated_at,
  (title = '[CMS Kit staging] G-6-g1 title PoC') as title_match,
  (venue = '[CMS Kit staging] G-6-f6 venue PoC') as venue_unchanged,
  (description = '出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]') as description_unchanged,
  (date = date '2026-07-19') as date_unchanged,
  (published is true) as published_unchanged,
  (show_on_home is false) as show_on_home_unchanged,
  (sort_order = 10) as sort_order_unchanged
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

**Result:**

```txt
row count: 1
title: [CMS Kit staging] G-6-g1 title PoC
venue: [CMS Kit staging] G-6-f6 venue PoC
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
title_match: true
venue_unchanged: true
description_unchanged: true
date_unchanged: true
published_unchanged: true
show_on_home_unchanged: true
sort_order_unchanged: true
created_at: 2026-06-05 17:39:44.140168+00 (unchanged)
updated_at: 2026-06-14 15:03:08.762993+00 (advanced)
```

## 8. Rollback SQL (retained — not executed)

```sql
-- G-6-g1 rollback — staging only; execute only if explicitly approved
update public.schedules
set title = '<>'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

Note: rollback UPDATE would advance `updated_at` via trigger. Not needed (`rollbackNeeded: false`).

## 9. Gate decision

```txt
scheduleTitleNonDryRunSliceExecutionSucceeded: true
nonDryRunSaveExecuted: true
rollbackNeeded: false
rollbackExecuted: false
dbWriteInG6G1Execution: true (user manual Save once only)
cursorClickedSave: false
cursorClickedRun: false
cursorExecutedSql: false
```

## 10. Post-execution staging row state

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
title: [CMS Kit staging] G-6-g1 title PoC
venue: [CMS Kit staging] G-6-f6 venue PoC (unchanged)
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test] (unchanged)
updated_at: 2026-06-14 15:03:08.762993+00
```

## 11. Recommended operator follow-up

```txt
Restart dev with PUBLIC_ADMIN_WRITE_DRY_RUN=true for routine work.
Do not re-click G-6-g1 Save without new approval ID / phase.
Do not re-arm G-6-e5 / G-6-f6 PoCs.
```

## 12. Related docs

- [schedule-title-non-dry-run-slice-preflight.md](./schedule-title-non-dry-run-slice-preflight.md)
- [schedule-title-non-dry-run-slice-implementation.md](./schedule-title-non-dry-run-slice-implementation.md)
- [schedule-title-non-dry-run-slice-final-preflight.md](./schedule-title-non-dry-run-slice-final-preflight.md)
- [schedule-general-edit-ui-planning.md](./schedule-general-edit-ui-planning.md)
