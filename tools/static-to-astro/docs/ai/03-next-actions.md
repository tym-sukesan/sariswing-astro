Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g2-schedule-general-edit-next-slice-planning`

G-6-g2 next slice planning complete. Recommended implementation slice: **time fields** (`open_time` + `start_time`). Same target row reuse. No DB write / Save in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-general-edit-next-slice-planning.md`

**Recommended next phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-preflight`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: [CMS Kit staging] G-6-g1 title PoC
  venue: [CMS Kit staging] G-6-f6 venue PoC
  description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
  open_time: null
  start_time: null
  price: null
  updated_at: 2026-06-14 15:03:08.762993+00 (G-6-g2 lock baseline)
nonDryRunSaveExecuted: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
scheduleGeneralEditNextSlicePlanningComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSlicePreflight: true
rollbackNeeded: false
```

## 3. G-6-g2 recommended slice

```txt
Phase: G-6-g2-schedule-time-fields-non-dry-run-slice
Fields: open_time, start_time
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
Guard: assertG6G2TimeFieldsPayloadOnly
Deferred: price (G-6-g3), venue/description general UI (G-6-g4)
```

## 4. Dry-run default (routine work)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
```

Do not re-click G-6-g1 Save. Do not re-arm G-6-e5 / G-6-f6 / G-6-g1 PoCs.

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-g1 execution | **DONE** (`cce3f97`) |
| G-6-g2 next slice planning | **DONE** |
| G-6-g2 time-fields preflight | **Next** |
| G-6-g2 implementation | Pending |
| G-6-g2 final-preflight | Pending |
| G-6-g2 execution | Pending (user manual Save once) |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
