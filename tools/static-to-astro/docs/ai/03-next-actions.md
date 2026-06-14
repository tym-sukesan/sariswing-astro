Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight`

G-6-g2 final preflight complete. beforeSnapshot / afterVerification / rollback SQL, dev command, UI procedure, Save checklist documented. No DB write / Preview / Save in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-final-preflight.md`

**Recommended next phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-execution` (user manual Preview + Save once)

## 2. Staging DB state

```txt
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: [CMS Kit staging] G-6-g1 title PoC
  open_time: null
  start_time: null
  updated_at: 2026-06-14 15:03:08.762993+00 (lock baseline — confirm via SQL)
scheduleTimeFieldsNonDryRunSliceFinalPreflightComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: true
rollbackNeeded: false
```

## 3. Execution arm stack (reference)

```bash
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g2-schedule-time-fields-non-dry-run-slice
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED must be OFF
```

## 4. Dry-run default (routine work)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

Do not re-arm G-6-g1 / G-6-e5 / G-6-f6 for G-6-g2 execution.

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-g2 implementation | **DONE** (`e461155`) |
| G-6-g2 final-preflight | **DONE** |
| G-6-g2 execution | **Next** (user manual Save once) |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
