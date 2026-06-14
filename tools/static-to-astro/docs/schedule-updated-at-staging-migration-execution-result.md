# Schedule updated_at staging migration execution result (G-6-f8)

**Phase:** `G-6-f8-schedule-updated-at-staging-migration-execution`  
**Prerequisites:** [schedule-updated-at-staging-migration-preflight.md](./schedule-updated-at-staging-migration-preflight.md)

## 1. Purpose

Record successful application of the `public.schedules` `updated_at` trigger on staging (`static-to-astro-cms-staging`).

Cursor did **not** execute SQL.  
Operator ran SQL manually in Supabase SQL Editor.  
Rollback SQL was **not** executed.  
Run buttons (G-6-e5 / G-6-f6) were **not** clicked.

## 2. Summary

```txt
Migration execution: PASS
Pre-check: PASS
Trigger apply: PASS
Post-check: PASS
Low-risk verification UPDATE: PASS
Verification SELECT: PASS
rollbackNeeded: false
rollbackExecuted: false
```

## 3. Execution context

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Target table: public.schedules only
Function: public.tg_schedules_set_updated_at()
Trigger: schedules_set_updated_at (BEFORE UPDATE FOR EACH ROW)
schedule_months: not touched; no trigger added
service_role: not used
/admin: not modified
SQL script in repo: scripts/supabase/schedules-updated-at-trigger.sql
```

## 4. Step 1 — Pre-check (user-confirmed)

```txt
created_at column: exists
updated_at column: exists
schedules existing triggers: none
function collision (tg_schedules_set_updated_at / set_updated_at): none
schedule_months triggers: none
target row: PASS (1 row)
```

**Target row baseline:**

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
venue: [CMS Kit staging] G-6-f6 venue PoC
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
baseline updated_at: 2026-06-05 17:39:44.140168+00
baseline created_at: 2026-06-05 17:39:44.140168+00
```

## 5. Step 2 — Trigger apply (user-confirmed)

```txt
Result: Success. No rows returned
```

Applied objects:

- `public.tg_schedules_set_updated_at()` — `NEW.updated_at = now()`
- `schedules_set_updated_at` on `public.schedules`

## 6. Step 3 — Post-check (user-confirmed)

```txt
function tg_schedules_set_updated_at: exists
sets_updated_at in function body: true
trigger schedules_set_updated_at on public.schedules: exists
event: UPDATE
timing: BEFORE
orientation: ROW
enabled: O
schedule_months schedules_set_updated_at: none
```

## 7. Step 4 — Low-risk verification UPDATE (user-confirmed)

```sql
update public.schedules
set description = description
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

```txt
RETURNING: 1 row
semantic data: unchanged
created_at: 2026-06-05 17:39:44.140168+00 (unchanged)
updated_at after: 2026-06-14 06:49:42.240919+00 (advanced)
```

No-op UPDATE intentionally advanced `updated_at` only — acceptable for staging trigger proof.

## 8. Step 5 — Verification SELECT (user-confirmed)

```txt
updated_at_advanced: true
venue_unchanged: true
description_unchanged: true
title_unchanged: true
published_unchanged: true
show_on_home_unchanged: true
sort_order_unchanged: true
```

## 9. Safety result

```txt
targetProject: static-to-astro-cms-staging
productionTouched: false
sariswingProductionTouched: false
serviceRoleUsed: false
adminRouteConnected: false
runButtonClicked: false
g6e5PocReused: false
g6f6PocReused: false
scheduleMonthsWritten: false
scheduleMonthsTriggerAdded: false
rollbackNeeded: false
rollbackExecuted: false
cursorExecutedSql: false
```

## 10. Rollback SQL (staging only; not executed)

Schema rollback (does not restore previous `updated_at` values on rows):

```sql
drop trigger if exists schedules_set_updated_at on public.schedules;
drop function if exists public.tg_schedules_set_updated_at();
```

Row data rollback (G-6-f6 template) — only if content restore needed; separate from schema rollback.

## 11. Gate decision

```txt
scheduleUpdatedAtStagingMigrationSucceeded: true
scheduleUpdatedAtTriggerActiveOnStaging: true
readyForOptimisticLockEnablement: true
readyForScheduleUpdatedAtStagingMigrationExecution: false
rollbackNeeded: false
```

## 12. Optimistic lock — next step

`updateScheduleWrite` already supports `expectedBeforeUpdatedAt`. After this migration:

1. General UI / next write slice passes `beforeSnapshot.updated_at` into adapter.
2. On `optimistic_lock_failed`, prompt reload.
3. Phase: `G-6-f9-schedule-optimistic-lock-enablement-planning` (or implementation).

## 13. Recommended next phases

```txt
1. G-6-f9-schedule-optimistic-lock-enablement-planning — DONE (see schedule-optimistic-lock-enablement-planning.md)
2. G-6-f10-schedule-optimistic-lock-enablement-implementation
3. G-6-g-schedule-general-edit-ui-planning
4. Per-field non-dry-run slices (title, times, price) with new G-6-g approval IDs
```

## 14. Final safety statement

The staging `updated_at` trigger is active on `public.schedules`.

`schedule_months` was not modified.  
Production was not touched.  
Rollback was not required.  
Do not re-run trigger apply unless rollback and re-apply are explicitly approved.

## Related docs

- [schedule-updated-at-staging-migration-preflight.md](./schedule-updated-at-staging-migration-preflight.md)
- [schedule-write-hardening-and-updated-at-planning.md](./schedule-write-hardening-and-updated-at-planning.md)
