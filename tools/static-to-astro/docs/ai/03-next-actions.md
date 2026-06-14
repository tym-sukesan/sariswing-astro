Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-preflight`

G-6-g2 time fields preflight complete. `open_time` + `start_time` only on proven staging row. Payload, approval ID, env arm, rollback, and afterVerification documented. No DB write / Save in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-preflight.md`

**Recommended next phase:** `G-6-g2-schedule-time-fields-non-dry-run-slice-implementation`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: [CMS Kit staging] G-6-g1 title PoC
  venue: [CMS Kit staging] G-6-f6 venue PoC
  open_time: null
  start_time: null
  updated_at: 2026-06-14 15:03:08.762993+00 (G-6-g2 lock baseline)
scheduleTimeFieldsNonDryRunSlicePreflightComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceImplementation: true
rollbackNeeded: false
```

## 3. G-6-g2 preflight payload (Option A)

```json
{
  "open_time": "[CMS Kit staging] G-6-g2 open PoC",
  "start_time": "[CMS Kit staging] G-6-g2 start PoC"
}
```

Approval ID: `G-6-g2-schedule-time-fields-non-dry-run-slice`  
Env arm: `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true`  
Guard: `assertG6G2TimeFieldsPayloadOnly`

## 4. Dry-run default (routine work)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
```

Do not re-arm G-6-g1 / G-6-e5 / G-6-f6. Only one slice arm at a time.

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-g2 planning | **DONE** (`b3cd295`) |
| G-6-g2 preflight | **DONE** |
| G-6-g2 implementation | **Next** |
| G-6-g2 final-preflight | Pending |
| G-6-g2 execution | Pending (user manual Save once) |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
