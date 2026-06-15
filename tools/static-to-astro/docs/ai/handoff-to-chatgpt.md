Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g2-schedule-time-fields-non-dry-run-slice-execution (completed — execution succeeded)
Latest completed phase: G-6-g2-schedule-time-fields-non-dry-run-slice-execution
Latest commit: 499aa37 — Document G-6-g2 schedule time-fields final preflight.
Recommended next phase: G-6-g3-schedule-price-non-dry-run-slice-preflight (planning)
```

---

## 3. Current state summary

G-6-g2 time fields slice execution succeeded on staging. User manual Preview + Save once. `open_time` + `start_time` only changed. Title / venue / description preserved. Optimistic lock OK. `rollbackNeeded: false`. Cursor did not click Save / Preview / Run or execute SQL.

---

## 4. G-6-g2 execution outcome

```txt
Target: aa440e29-5be8-402e-9190-0d81c48434c0
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
changedFields: ["open_time", "start_time"]
open_time: null → [CMS Kit staging] G-6-g2 open PoC
start_time: null → [CMS Kit staging] G-6-g2 start PoC
beforeSnapshot.updated_at: 2026-06-14T15:03:08.762993+00:00
afterSnapshot.updated_at: 2026-06-15T01:02:22.949565+00:00
rowsAffected: 1
```

---

## 5. Gate state

```txt
scheduleTimeFieldsNonDryRunSliceExecutionSucceeded: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
G-6-g2 nonDryRunSaveExecuted: true
rollbackNeeded: false
rollbackExecuted: false
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: false
dbWriteInLatestPhase: true (G-6-g2 user manual Save once)
cursorClickedSave: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-execution-result.md
tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-final-preflight.md
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-execution-result.md
tools/static-to-astro/docs/schedule-general-edit-next-slice-planning.md
tools/static-to-astro/docs/ai/00-current-state.md
```
