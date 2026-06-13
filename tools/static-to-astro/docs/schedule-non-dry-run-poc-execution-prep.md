# Schedule Non-Dry-Run PoC Execution Prep

**Phase:** `G-6-e5-schedule-non-dry-run-poc-execution-prep`  
**Prerequisites:** [schedule-non-dry-run-poc-target-selection.md](./schedule-non-dry-run-poc-target-selection.md) (commit `e237225`)

## 1. Purpose

This document prepares the one-off execution path for the first Schedule non-dry-run PoC.

It does not invoke the write adapter.  
It does not write schedule records.  
It does not execute rollback SQL.  
It does not expose non-dry-run UI.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Current status

```txt
ScheduleWriteAdapter is implemented and verified as isolated.
authenticated UPDATE privilege is applied in staging.
The target row has been selected.
beforeSnapshot has been captured.
payload and rollback SQL are finalized.
Actual non-dry-run execution remains blocked.
```

**Staging project:** `static-to-astro-cms-staging`

## 3. First PoC target

```txt
targetId: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
targetTable: public.schedules
operation: update
fieldChange: description only
approvalId: G-6-e5-schedule-non-dry-run-poc
```

## 4. Fixed payload

```json
{
  "description": "出演： [G-6-e5 non-dry-run PoC]"
}
```

```txt
Only description may change.
No date/title/venue/published/show_on_home/sort_order/source fields may change.
No schedule_months row may be touched.
```

## 5. beforeSnapshot re-check requirement

Immediately before future execution, confirm the target row still matches the recorded beforeSnapshot.

**Manual SQL (staging only; Cursor does not execute):**

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

**Expected immediately before execution:**

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
description: 出演：
updated_at: 2026-06-05 17:39:44.140168+00
```

**Abort if:**

```txt
- no row
- multiple rows
- description already changed
- target row differs unexpectedly
- updated_at differs unexpectedly and expectedBeforeUpdatedAt guard is used
```

## 6. One-off execution path design

Recommended path: **one-off script or staging-only trigger** — not general UI.

**Future script candidate:**

```txt
tools/static-to-astro/scripts/run-schedule-non-dry-run-poc.mjs
```

**Decision for this phase:**

```txt
Recommended for this phase:
- prepare script plan and command template
- do not implement executable non-dry-run script yet unless it cannot run without explicit env gates
```

This phase documents the plan only. `run-schedule-non-dry-run-poc.mjs` is **not implemented**.

**If implemented in a future phase, required safeguards:**

```txt
- default is disabled
- exits unless all required env gates match exactly
- exits unless approval ID matches exactly
- exits unless target ID matches exactly
- exits unless payload matches exactly
- exits unless dry-run flag is explicitly false
- does not run from build
- is not imported by UI
- is not referenced from npm scripts as a default command
```

## 7. Required future env gates

```txt
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-e5-schedule-non-dry-run-poc
PUBLIC_ADMIN_WRITE_DRY_RUN=false   # future execution only — do not run in this prep phase
```

**Additional one-off script gates (recommended):**

```txt
SCHEDULE_NON_DRY_RUN_POC_TARGET_ID=aa440e29-5be8-402e-9190-0d81c48434c0
SCHEDULE_NON_DRY_RUN_POC_CONFIRM=G-6-e5-schedule-non-dry-run-poc
```

**Warning:**

```txt
Do not run with PUBLIC_ADMIN_WRITE_DRY_RUN=false in this prep phase.
Do not commit env values.
Do not add these to .env or .env.local.
Use inline env only in the future execution phase.
```

## 8. Future command template

**Future command template only. Do not run in this phase.**

```bash
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-e5-schedule-non-dry-run-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
SCHEDULE_NON_DRY_RUN_POC_TARGET_ID=aa440e29-5be8-402e-9190-0d81c48434c0 \
SCHEDULE_NON_DRY_RUN_POC_CONFIRM=G-6-e5-schedule-non-dry-run-poc \
node tools/static-to-astro/scripts/run-schedule-non-dry-run-poc.mjs
```

```txt
This is a future command template only.
Do not run it in this phase.
```

## 9. One-off script behavior plan

Future script steps (not executed in this phase):

```txt
1. Validate env gates
2. Create authenticated Supabase client using public anon key and existing user session strategy only if available
3. Refuse service_role
4. Fetch target row
5. Compare beforeSnapshot expectations
6. Build payload: description only
7. Call updateScheduleWrite exactly once
8. Print JSON result
9. Fetch/print afterSnapshot
10. Exit
```

**Note:**

```txt
If authenticated user session cannot be safely provided to a Node script, prefer a staging-shell manual trigger in a later phase instead of using service_role.
Do not use service_role to bypass RLS.
```

## 10. Auth boundary decision

```txt
The write adapter must run as an authenticated admin user.
It must not run with service_role.
If the one-off Node script cannot reliably use the admin user's authenticated session, do not execute it.
In that case, prepare a staging-only browser-triggered PoC path in a later phase, still hidden behind strict gates and without general UI exposure.
```

**Preferred execution path (safest first):**

```txt
Prefer the safest available execution path:
Option A: one-off browser-side staging trigger using existing Supabase Auth session
Option B: one-off Node script only if it can use authenticated user context without service_role
Never use service_role for this PoC.
```

`serviceRoleAllowed: false` — enforced for all phases of this PoC.

## 11. Future after verification SQL

After future execution (staging SQL Editor only):

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

**Expected after successful PoC:**

```txt
description: 出演： [G-6-e5 non-dry-run PoC]
all other selected fields unchanged
```

## 12. Rollback SQL

Prepared for future use. **Not executed in this prep phase.**

```sql
-- Rollback for G-6-e5-schedule-non-dry-run-poc
-- STAGING ONLY. Do not run against production.
update public.schedules
set
  description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

```txt
Rollback SQL is not executed in this prep phase.
Rollback should only be executed after future PoC if reverting is required.
```

## 13. Future execution abort conditions

```txt
Abort execution if:
- staging project is not confirmed
- target row cannot be fetched
- description is not exactly 出演： before execution
- payload would change anything other than description
- approval ID does not match
- env gates are missing or mismatched
- authenticated admin session is unavailable
- implementation attempts to use service_role
- UI exposure is required
- production credentials/project appear anywhere
```

## 14. Result recording template

For use after future execution (not this phase):

```txt
G-6-e5-schedule-non-dry-run-poc execution result

Project:
- staging confirmed: yes/no

Execution path:
- one-off script / staging browser trigger:
- service_role used: yes/no
- authenticated admin user used: yes/no

Target:
- id:
- legacy_id:
- description before:

Payload:
- description after:

Execution:
- updateScheduleWrite invoked: yes/no
- approval ID:
- actualWrite:
- rowsAffected:
- result type:
- errorCode if any:

After verification:
- afterSnapshot captured: yes/no
- description after:
- changedFields:
- only description changed: yes/no
- schedule_months touched: yes/no
- non-dry-run UI exposed: yes/no
- production touched: yes/no

Rollback:
- rollback executed: yes/no
- reason:
- rollback verified: yes/no

Final:
- PoC status: pass/fail/rolled_back/manual_review_required
```

## 15. Gate decision

```txt
executionPrepCreated: true
executionScriptImplemented: false
executionScriptInvoked: false
writeAdapterInvoked: false
dbWritesPerformed: false
scheduleRecordsUpdated: false
rollbackExecuted: false
readyForG6E5ScheduleNonDryRunPocExecutionPathImplementation: true
readyForG6E5ScheduleNonDryRunPoc: false
readyForNonDryRunSchedulePoC: false
```

## 16. Recommended next phase

```txt
Recommended next:
G-6-e5-schedule-non-dry-run-poc-execution-path-implementation — DONE (see schedule-non-dry-run-poc-execution-path-implementation.md)
G-6-e5-schedule-non-dry-run-poc-execution-path-verification — DONE (see schedule-non-dry-run-poc-execution-path-verification.md)
G-6-e5-schedule-non-dry-run-poc-execution-path-verification-result — DONE (see schedule-non-dry-run-poc-execution-path-verification-result.md)
G-6-e5-schedule-non-dry-run-poc-final-preflight — DONE (see schedule-non-dry-run-poc-final-preflight.md)
G-6-e5-schedule-non-dry-run-poc-final-preflight-result — DONE (see schedule-non-dry-run-poc-final-preflight-result.md)
Next: G-6-e5-schedule-non-dry-run-poc-execution
```

**G-6-e5-schedule-non-dry-run-poc-execution-path-implementation（完了）:** [schedule-non-dry-run-poc-execution-path-implementation.md](./schedule-non-dry-run-poc-execution-path-implementation.md) — hidden staging browser trigger implemented; default hidden; trigger was not invoked; no DB write.

**G-6-e5-schedule-non-dry-run-poc-execution-path-verification（完了）:** [schedule-non-dry-run-poc-execution-path-verification.md](./schedule-non-dry-run-poc-execution-path-verification.md) — normal dev hidden verified; env-gated/manual confirm verified; trigger not clicked.

**G-6-e5-schedule-non-dry-run-poc-execution-path-verification-result（完了）:** [schedule-non-dry-run-poc-execution-path-verification-result.md](./schedule-non-dry-run-poc-execution-path-verification-result.md) — env-gated Danger Zone display verified; manual confirm gate verified; Run button not clicked; DB unchanged.

**G-6-e5-schedule-non-dry-run-poc-final-preflight-result（完了）:** [schedule-non-dry-run-poc-final-preflight-result.md](./schedule-non-dry-run-poc-final-preflight-result.md) — final staging project confirmed; final beforeSnapshot confirmed; rollback SQL available; after verification SQL available; ready for explicit one-off execution phase; Run button still not clicked.

**Conditions:**

```txt
Implement the safest one-off execution path without invoking it.
Do not use service_role.
Do not expose general UI.
Do not run the PoC yet.
```

## 17. Final safety statement

This phase prepares the execution path only.

No write adapter is invoked.  
No schedule record is updated.  
No rollback SQL is executed.  
No non-dry-run UI is exposed.

Actual non-dry-run execution remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-non-dry-run-poc-execution-prep.mjs \
  --out-dir tools/static-to-astro/output/schedule-non-dry-run-poc-execution-prep/gosaki
```
