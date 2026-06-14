# Schedule optimistic lock enablement implementation (G-6-f10)

**Phase:** `G-6-f10-schedule-optimistic-lock-enablement-implementation`  
**Prerequisites:** [schedule-optimistic-lock-enablement-planning.md](./schedule-optimistic-lock-enablement-planning.md)

## 1. Purpose

Wire `expectedBeforeUpdatedAt` into the general / next-slice Schedule write path and add dry-run stale detection UX. No DB writes, no Run clicks, no PoC changes in this phase.

## 2. Summary

```txt
optimisticLockWiredInProductPath: true
G-6-e5 / G-6-f6 PoC triggers: unchanged (frozen)
non-dry-run Save UI: not added
dry-run stale check: SELECT only on preview
DB write / SQL / Run click: none
```

## 3. Implemented files

| File | Role |
| --- | --- |
| `schedule-write-utils.ts` | `normalizeScheduleUpdatedAt`, `scheduleUpdatedAtEquals`, `resolveExpectedBeforeUpdatedAt`, `evaluateScheduleStaleState`, user messages |
| `schedule-optimistic-lock-types.ts` | `ScheduleEditSessionBaseline`, `ScheduleOptimisticLockDryRunState` |
| `schedule-optimistic-lock-config.ts` | `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` (default true) |
| `schedule-optimistic-lock-stale-check.ts` | `fetchScheduleRowUpdatedAt`, `checkScheduleRowStale` (SELECT only) |
| `schedule-optimistic-lock-dry-run.ts` | Dry-run stale helpers + result panel HTML |
| `schedule-general-update-trigger.ts` | `buildScheduleLockedWriteRequest`, `executeScheduleGeneralUpdateWrite` |
| `schedule-write-adapter.ts` | Uses `scheduleUpdatedAtEquals` for lock compare |
| `schedule-safe-fields-dry-run.ts` | Optional `optimisticLock` on dry-run result |
| `schedule-description-dry-run.ts` | Optional `optimisticLock` on dry-run result |
| `staging-schedule-safe-fields-dry-run-ui.ts` | baseline `updated_at`, stale banner, reload |
| `staging-schedule-description-dry-run-ui.ts` | baseline `updated_at`, stale banner, reload |
| `AdminStagingScheduleSafeFieldsDryRunSection.astro` | UI elements for lock / reload |
| `AdminStagingScheduleDescriptionDryRunSection.astro` | UI elements for lock / reload |

**Unchanged (frozen):** `schedule-non-dry-run-poc-trigger.ts`, `schedule-safe-fields-non-dry-run-poc-trigger.ts`, PoC Astro sections.

## 4. Product write path wiring

`buildScheduleLockedWriteRequest` always sets:

```txt
expectedBeforeUpdatedAt = resolveExpectedBeforeUpdatedAt(beforeSnapshot)
```

when `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` is not `false`.

`executeScheduleGeneralUpdateWrite` is the browser entry for future G-6-g field slices. It is **not** connected to a Save button in G-6-f10. Approval IDs remain G-6-e5 / G-6-f6 only until G-6-g registers new IDs.

## 5. Dry-run stale check

On **Preview dry-run** when `readSource === "supabase"`:

1. `fetchScheduleRowUpdatedAt` — SELECT `updated_at` only
2. Compare to `baselineUpdatedAt` captured at row select
3. If mismatch → stale banner + `optimisticLock.staleDetected: true` in result
4. `actualWrite` remains `false`; no `updateScheduleWrite` call

**Reload rows** re-SELECTs via `loadSchedulesForDryRunUi` and refreshes baseline.

## 6. Error codes (write path — existing)

| errorCode | User message (JA) |
| --- | --- |
| `optimistic_lock_failed` | 別の編集が入った可能性があるため、再読み込みしてから再試行してください。 |
| `optimistic_lock_select_failed` | 保存前の確認に失敗しました。接続とログイン状態を確認し、再読み込みしてください。 |

## 7. Verification (no DB)

```bash
node --experimental-strip-types tools/static-to-astro/scripts/verify-schedule-optimistic-lock-utils.mjs
npm run build
```

## 8. Gate state

```txt
scheduleOptimisticLockImplementationComplete: true
optimisticLockWiredInProductPath: true
readyForScheduleGeneralEditUiPlanning: true
nonDryRunSaveUiExposed: false
```

## 9. Prerequisites before field slices (title, times, price)

| # | Requirement | Status |
| --- | --- | --- |
| 1 | G-6-f8 `updated_at` trigger | Done |
| 2 | G-6-f10 lock wiring | **Done** |
| 3 | G-6-g general edit UI planning | Next |
| 4 | New G-6-g approval IDs in guards | Not yet |
| 5 | Per-slice preflight + rollback SQL | Per slice |

## 10. Recommended next phases

```txt
1. G-6-g-schedule-general-edit-ui-planning
2. G-6-g1-schedule-title-non-dry-run-slice (first slice using executeScheduleGeneralUpdateWrite)
```

## 11. G-6-f10 safety statement

```txt
DB write: none
Supabase SQL executed: none
Run button click: none
G-6-e5 / G-6-f6 PoC re-click: none
/admin: not modified
schedule_months: read-only / derived (not touched)
service_role: not used
```

## Related docs

- [schedule-optimistic-lock-enablement-planning.md](./schedule-optimistic-lock-enablement-planning.md)
- [schedule-updated-at-staging-migration-execution-result.md](./schedule-updated-at-staging-migration-execution-result.md)
