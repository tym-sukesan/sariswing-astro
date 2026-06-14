Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-implementation`

G-6-g2 time fields slice implementation complete. Guard, approval ID, config, dry-run, trigger, and UI extension wired. No DB write / Save / Preview in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-implementation.md`

**Recommended next phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight`

## 2. Staging DB state

```txt
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: [CMS Kit staging] G-6-g1 title PoC
  open_time: null
  start_time: null
  updated_at: 2026-06-14 15:03:08.762993+00 (G-6-g2 lock baseline)
scheduleTimeFieldsNonDryRunSliceImplementationComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceFinalPreflight: true
rollbackNeeded: false
```

## 3. G-6-g2 implementation highlights

```txt
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
Guard: assertG6G2TimeFieldsPayloadOnly
Trigger: executeG6G2TimeFieldsNonDryRunSave
Single-arm: G-6-g1 and G-6-g2 cannot both be armed
```

## 4. Dry-run default (routine work)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
```

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-g2 preflight | **DONE** (`e5fa9ba`) |
| G-6-g2 implementation | **DONE** |
| G-6-g2 final-preflight | **Next** |
| G-6-g2 execution | Pending (user manual Save once) |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
