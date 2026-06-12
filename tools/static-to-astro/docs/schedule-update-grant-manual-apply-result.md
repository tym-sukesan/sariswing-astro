# Schedule UPDATE Grant Manual Apply Result

**Phase:** `G-6-e4-schedule-update-grant-manual-apply-result`  
**Prerequisites:** [schedule-update-grant-manual-apply-prep.md](./schedule-update-grant-manual-apply-prep.md), [schedule-update-grant-prep.md](./schedule-update-grant-prep.md)

## 1. Purpose

This document records the result of manually applying authenticated UPDATE grant on `public.schedules` in the staging Supabase project.

It does not execute SQL.  
It does not write schedule records.  
It does not change RLS policies.  
It does not implement the write adapter.  
It does not connect `/admin`.  
It does not touch production data.

Cursor did not execute SQL. The user ran GRANT manually in Supabase SQL Editor on `static-to-astro-cms-staging`.

## 2. Manual apply summary

```txt
Project: static-to-astro-cms-staging
Manual SQL executed by user: yes
SQL executed:
grant update on table public.schedules to authenticated;

Execution result:
Success. No rows returned
```

## 3. Pre-check summary

```txt
Pre-check grants:
- anon SELECT: confirmed
- authenticated SELECT: confirmed
- authenticated UPDATE before apply: absent

RLS:
- public.schedules rowsecurity: true

Policies:
- schedules_public_select present: confirmed
- schedules_admin_all present: confirmed
- schedules_admin_all uses is_admin(): confirmed

is_admin():
- function present: confirmed
- references admin_users / auth.uid() / role='admin': confirmed by manual review

Admin user:
- user email: ysktoyamax@gmail.com
- role: admin
- confirmed by manual SQL result
```

## 4. Grant result

```txt
GRANT UPDATE executed: yes
SQL success: yes
Rollback executed: no
Rollback required: no
```

## 5. After verification result

```txt
After verification grants:
- anon SELECT: confirmed
- authenticated SELECT: confirmed
- authenticated UPDATE: confirmed
```

## 6. Broad grants verification

```txt
Broad grants check:
- INSERT: absent
- DELETE: absent
- TRUNCATE: absent
- TRIGGER: absent
- REFERENCES: absent

Result:
pass
```

## 7. Smoke test result

```txt
Staging shell smoke test:
- staging shell loaded: confirmed
- Schedule section loaded: confirmed
- Update dry-run result shown: confirmed
- actualWrite:false shown: confirmed
- "no Supabase schedule update was called" shown: confirmed
- Duplicate dry-run remains dry-run-only: visually confirmed
- non-dry-run UI absent: visually confirmed
```

**Dry-run result panel (user verification):**

```txt
Dry-run complete — no Supabase schedule update was called.
module: schedule
operation: update
targetTable: schedules
dryRun: true
wouldWrite: true
actualWrite: false
validation: pass
```

**Additional confirmations:**

```txt
Applying UPDATE grant did not expose a non-dry-run UI.
Applying UPDATE grant did not cause a schedule DB update.
```

Screenshot provided by user for visual confirmation.

## 8. Safety result

```txt
productionDataTouched: false
adminRouteConnected: false
writeAdapterImplemented: false
dbWritesPerformed: false
scheduleRecordsUpdated: false
scheduleMonthsTouched: false
nonDryRunEnabled: false
storageTouched: false
publishTriggered: false
ftpDeployTriggered: false
githubDispatchTriggered: false
```

## 9. What changed

```txt
Only table-level UPDATE grant on public.schedules for authenticated was added in staging.
```

## 10. What did not change

```txt
No RLS policy was changed.
No schema was changed.
No schedule rows were updated.
No schedule_months rows were touched.
No write adapter was implemented.
No UI non-dry-run control was added.
No production project was touched.
```

## 11. Current permission model after grant

```txt
public.schedules:
- anon can SELECT rows allowed by RLS
- authenticated can SELECT rows allowed by RLS
- authenticated has table-level UPDATE grant
- actual UPDATE is still constrained by RLS schedules_admin_all using is_admin()
```

**Note:**

```txt
This grant enables future admin-only update PoC, but does not by itself execute any update.
```

**G-6-e4-schedule-write-adapter-implementation（完了）:** [schedule-write-adapter-implementation.md](./schedule-write-adapter-implementation.md) — guarded `updateScheduleWrite` implemented; not invoked; no schedule DB write in implementation phase.

**G-6-e4-schedule-write-adapter-verification（完了）:** [schedule-write-adapter-verification.md](./schedule-write-adapter-verification.md) — guarded ScheduleWriteAdapter verified as isolated; `.update()` location verified; write adapter not invoked; UI not connected; no DB write; `readyForG6E5ScheduleNonDryRunPocPrep: true`; actual non-dry-run PoC remains blocked.

## 12. Gate decision

```txt
grantExecuted: true
grantChangesPerformed: true
grantManualApplyStatus: pass
rollbackExecuted: false
rollbackRequired: false
writeAdapterImplemented: false
dbWritesPerformed: false
scheduleRecordsUpdated: false
readyForG6E4ScheduleWriteAdapterImplementation: true
readyForG6EWriteImplementation: false
readyForNonDryRunSchedulePoC: false
```

`readyForG6E4ScheduleWriteAdapterImplementation: true` because the minimum staging UPDATE grant is in place and the next safe step is guarded write adapter implementation (no non-dry-run execution yet).

`readyForNonDryRunSchedulePoC` remains **false** until write adapter implementation, guards, and separate G-6-e5 approval.

## 13. Recommended next phase

```txt
Recommended next:
G-6-e4-schedule-write-adapter-implementation — DONE (see schedule-write-adapter-implementation.md)
G-6-e4-schedule-write-adapter-verification — DONE (see schedule-write-adapter-verification.md)
Next: G-6-e5-schedule-non-dry-run-poc-prep
```

**G-6-e4-schedule-write-adapter-implementation（完了）:** Guarded update-only write adapter code added; not invoked; no UI connection; no schedule DB write in this phase.

**G-6-e4-schedule-write-adapter-verification（完了）:** Static isolation checks pass; write adapter verified; no schedule DB write; non-dry-run PoC remains blocked.

## 14. Final safety statement

The manual UPDATE grant has been applied successfully in staging.

No schedule records have been updated.  
No write adapter has been implemented yet.  
No non-dry-run UI has been exposed.  
No production data has been touched.

The next implementation phase must remain guarded and must not run non-dry-run PoC yet.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-update-grant-manual-apply-result.mjs \
  --out-dir tools/static-to-astro/output/schedule-update-grant-manual-apply-result/gosaki
```
