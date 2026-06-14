Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g2-schedule-time-fields-non-dry-run-slice-implementation (completed — implementation only)
Latest completed phase: G-6-g2-schedule-time-fields-non-dry-run-slice-implementation
Latest commit: e5fa9ba — Prepare G-6-g2 schedule time-fields non-dry-run preflight.
Recommended next phase: G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight
```

---

## 3. Current state summary

G-6-g2 time fields slice implemented on staging shell. `assertG6G2TimeFieldsPayloadOnly`, approval ID, env arm, dry-run, trigger, and UI extension complete. G-6-g1 and G-6-g2 mutually exclusive when armed. Save/Preview not executed. G-6-g1 execution success preserved.

---

## 4. G-6-g2 implementation highlights

```txt
Fields: open_time, start_time
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
Trigger: executeG6G2TimeFieldsNonDryRunSave → executeScheduleGeneralUpdateWrite
UI: AdminStagingScheduleGeneralEditSection extended (G-6-g2 field group)
Verify: verify-schedule-g6g2-time-fields-guard.mjs
```

---

## 5. Gate state

```txt
scheduleTimeFieldsNonDryRunSliceImplementationComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceFinalPreflight: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
rollbackNeeded: false
dbWriteInLatestPhase: false
nonDryRunSaveExecuted: true (G-6-g1 only)
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-implementation.md
tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-preflight.md
src/lib/admin/staging-write/schedule-g6g2-time-fields-non-dry-run-trigger.ts
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
