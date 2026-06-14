Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight (completed — final-preflight only)
Latest completed phase: G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight
Latest commit: e461155 — Implement G-6-g2 schedule time-fields non-dry-run slice.
Recommended next phase: G-6-g2-schedule-time-fields-non-dry-run-slice-execution
```

---

## 3. Current state summary

G-6-g2 final preflight documents beforeSnapshot / afterVerification / rollback SQL, G-6-g2 dev arm command (G-6-g1 arm off), UI procedure, and Save enable checklist. Single-arm rule enforced. Preview/Save not executed. Ready for user manual execution.

---

## 4. G-6-g2 execution prep highlights

```txt
Payload: open_time + start_time marker values
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
Env: PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true (G-6-g1 arm OFF)
Lock baseline: updated_at from beforeSnapshot SQL (expect 2026-06-14T15:03:08.762993+00)
changedFields target: ["open_time", "start_time"]
```

---

## 5. Gate state

```txt
scheduleTimeFieldsNonDryRunSliceFinalPreflightComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
rollbackNeeded: false
dbWriteInLatestPhase: false
G-6-g2 nonDryRunSaveExecuted: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-final-preflight.md
tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-implementation.md
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-execution-result.md
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
