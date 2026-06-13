# Schedule Non-Dry-Run PoC Final Preflight

**Phase:** `G-6-e5-schedule-non-dry-run-poc-final-preflight`  
**Prerequisites:** [schedule-non-dry-run-poc-execution-path-verification-result.md](./schedule-non-dry-run-poc-execution-path-verification-result.md) (commit `efd15db`)

## 1. Purpose

This document records the final preflight before the first one-off Schedule non-dry-run PoC execution.

It does not click the trigger.  
It does not invoke the write adapter.  
It does not write schedule records.  
It does not execute rollback SQL.  
It does not expose `/admin`.  
It does not touch production data.

## 2. Current status

```txt
Hidden staging browser trigger has been implemented.
Normal hidden verification passed.
Env-gated display verification passed.
Manual confirm verification passed.
DB unchanged verification passed.
Run button has not been clicked.
Actual non-dry-run execution remains blocked.
```

## 3. Final staging confirmation

Before execution, user must confirm:

```txt
- Supabase project is static-to-astro-cms-staging
- Browser route is /__admin-staging-shell/musician-basic/
- /admin route is not used
- Production project is not open
- No service_role key is used
- The running dev server was started with explicit env gates only
```

**Final staging confirmation:**

```txt
- project confirmed: pass (static-to-astro-cms-staging)
- route confirmed: pass (/__admin-staging-shell/musician-basic/)
- production avoided: pass
```

Manual confirmation recorded in [schedule-non-dry-run-poc-final-preflight-result.md](./schedule-non-dry-run-poc-final-preflight-result.md).

## 4. Final beforeSnapshot SQL

**Read-only SQL (staging Supabase SQL Editor; run immediately before future execution):**

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
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

**Expected result:**

```txt
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

**Final beforeSnapshot check:**

```txt
- result: pass
- row count: 1
- description unchanged: yes (出演：)
- updated_at unchanged: yes (2026-06-05 17:39:44.140168+00)
```

## 5. Final payload confirmation

```json
{
  "description": "出演： [G-6-e5 non-dry-run PoC]"
}
```

```txt
Only description may change.
No other schedule field may change.
No schedule_months row may be touched.
```

**Approval ID:** `G-6-e5-schedule-non-dry-run-poc`

## 6. Final env-gated launch command

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-e5-schedule-non-dry-run-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER=true \
PUBLIC_ADMIN_NON_DRY_RUN_POC_TARGET_ID=aa440e29-5be8-402e-9190-0d81c48434c0 \
npm run dev
```

**Warning:**

```txt
This command arms the hidden staging trigger.
Do not run the PoC until final user confirmation.
Do not commit these env values.
```

## 7. Final browser action plan

```txt
1. Open /__admin-staging-shell/musician-basic/
2. Confirm Danger Zone is visible
3. Confirm Target ID is aa440e29-5be8-402e-9190-0d81c48434c0
4. Confirm Target is schedule-2026-07-010
5. Confirm Before is 出演：
6. Confirm After is 出演： [G-6-e5 non-dry-run PoC]
7. Type exact approval ID:
   G-6-e5-schedule-non-dry-run-poc
8. Confirm the button becomes enabled
9. In the future execution phase only, click:
   Run one-off staging schedule update
```

**Important:**

```txt
This document does not authorize clicking the button.
Button click is reserved for the next explicit phase.
```

## 8. After verification SQL

**Post-execution read-only SQL (for future execution phase):**

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
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

**Expected after successful execution:**

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
description: 出演： [G-6-e5 non-dry-run PoC]
published: true
show_on_home: false
sort_order: 10
```

**Note:**

```txt
updated_at may remain unchanged unless database behavior updates it.
The critical success condition is description-only change.
```

## 9. Rollback SQL

```sql
-- Rollback for G-6-e5-schedule-non-dry-run-poc
-- STAGING ONLY. Do not run against production.
update public.schedules
set
  description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

**Note:**

```txt
Rollback SQL is prepared but not executed in this phase.
Rollback should only be executed if future PoC result must be reverted.
```

## 10. Final abort conditions

Abort execution if:

```txt
- Supabase project is not confirmed as static-to-astro-cms-staging
- production project is open or unclear
- route is not /__admin-staging-shell/musician-basic/
- /admin route is involved
- service_role appears anywhere
- target row count is not exactly 1
- target id differs
- legacy_id differs
- description is not exactly 出演：
- payload differs from finalized payload
- approval ID differs
- Run button is not the expected one-off staging button
- any unexpected DB write has already occurred
- rollback SQL is unavailable
```

## 11. Result capture template for next phase

```txt
G-6-e5-schedule-non-dry-run-poc execution result

Preflight:
- staging project confirmed:
- route confirmed:
- beforeSnapshot row count:
- before description:
- rollback SQL available:

Browser action:
- approval ID typed:
- button clicked:
- time clicked:

Trigger result panel:
- actualWrite:
- operation:
- targetTable:
- targetId:
- changedFields:
- before description:
- after description:
- rollbackHint:
- errorCode:
- errorMessage:

After verification SQL:
- description after:
- updated_at after:
- only description changed:
- schedule_months touched:
- production touched:

Final:
- PoC status:
- rollback needed:
```

## 12. Gate decision

```txt
finalPreflightPrepared: true
finalBeforeSnapshotConfirmed: true
finalStagingProjectConfirmed: true
rollbackSqlAvailable: true
afterVerificationSqlAvailable: true
executionResultTemplatePrepared: true
triggerClicked: false
executionPathInvoked: false
writeAdapterInvoked: false
dbWritesPerformed: false
scheduleRecordsUpdated: false
readyForManualFinalBeforeSnapshotCheck: false
readyForG6E5ScheduleNonDryRunPocExecution: true
readyForG6E5ScheduleNonDryRunPoc: false
readyForNonDryRunSchedulePoC: false
```

Manual final beforeSnapshot check recorded in [schedule-non-dry-run-poc-final-preflight-result.md](./schedule-non-dry-run-poc-final-preflight-result.md).

## 13. Recommended next phase

```txt
Recommended next:
G-6-e5-schedule-non-dry-run-poc-final-preflight-result — DONE (see schedule-non-dry-run-poc-final-preflight-result.md)
Next: G-6-e5-schedule-non-dry-run-poc-execution
```

## 14. Final safety statement

This final preflight document prepares the last checks before execution.

It does not authorize execution.  
The Run button must not be clicked in this phase.  
No write adapter was invoked.  
No schedule record was updated.

Actual non-dry-run execution remains blocked until the final beforeSnapshot result is recorded.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-non-dry-run-poc-final-preflight.mjs \
  --out-dir tools/static-to-astro/output/schedule-non-dry-run-poc-final-preflight/gosaki
```
