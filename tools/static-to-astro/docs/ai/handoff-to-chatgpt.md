Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g2-schedule-general-edit-next-slice-planning (completed — planning only)
Latest completed phase: G-6-g2-schedule-general-edit-next-slice-planning
Latest commit: cce3f97 — Record G-6-g1 schedule title non-dry-run execution success.
Recommended next phase: G-6-g2-schedule-time-fields-non-dry-run-slice-preflight
```

---

## 3. Current state summary

G-6-g1 title slice succeeded on staging (`cce3f97`). G-6-g2 planning selects **open_time + start_time** as the next product-path slice on the same target row. Approval ID `G-6-g2-schedule-time-fields-non-dry-run-slice` and env `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED` designed but not implemented. G-6-g1 / G-6-e5 / G-6-f6 frozen.

---

## 4. G-6-g2 planning highlights

```txt
Recommended slice: G-6-g2-schedule-time-fields-non-dry-run-slice
Fields: open_time, start_time
Target row: aa440e29-5be8-402e-9190-0d81c48434c0 (reuse)
Lock baseline updated_at: 2026-06-14T15:03:08.762993+00
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
Guard: assertG6G2TimeFieldsPayloadOnly
UI: extend AdminStagingScheduleGeneralEditSection (time field group)
Deferred: price (G-6-g3), venue/description (G-6-g4)
```

---

## 5. Gate state

```txt
scheduleTitleNonDryRunSliceExecutionSucceeded: true
scheduleGeneralEditNextSlicePlanningComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSlicePreflight: true
nonDryRunSaveExecuted: true
rollbackNeeded: false
optimisticLockWiredInProductPath: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: false
dbWriteInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-general-edit-next-slice-planning.md
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-execution-result.md
tools/static-to-astro/docs/schedule-general-edit-ui-planning.md
src/lib/admin/staging-write/schedule-general-edit-config.ts
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
