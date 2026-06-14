Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g2-schedule-time-fields-non-dry-run-slice-preflight (completed — preflight only)
Latest completed phase: G-6-g2-schedule-time-fields-non-dry-run-slice-preflight
Latest commit: b3cd295 — Plan G-6-g2 schedule time-fields as next general edit slice.
Recommended next phase: G-6-g2-schedule-time-fields-non-dry-run-slice-implementation
```

---

## 3. Current state summary

G-6-g2 preflight documents time-fields-only non-dry-run on staging row `aa440e29-5be8-402e-9190-0d81c48434c0`. Payload markers, approval ID, env arm, rollback SQL, and afterVerification templates ready. Implementation not started. G-6-g1 / G-6-e5 / G-6-f6 frozen.

---

## 4. G-6-g2 preflight highlights

```txt
Fields: open_time, start_time
Payload: [CMS Kit staging] G-6-g2 open PoC / start PoC
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
Guard: assertG6G2TimeFieldsPayloadOnly
Lock baseline: 2026-06-14T15:03:08.762993+00
title / venue / description: must remain unchanged
```

---

## 5. Gate state

```txt
scheduleTimeFieldsNonDryRunSlicePreflightComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceImplementation: true
scheduleGeneralEditNextSlicePlanningComplete: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
rollbackNeeded: false
dbWriteInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-preflight.md
tools/static-to-astro/docs/schedule-general-edit-next-slice-planning.md
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-execution-result.md
src/lib/admin/staging-write/schedule-g6g1-title-non-dry-run-trigger.ts
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
