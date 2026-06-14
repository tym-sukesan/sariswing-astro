# Schedule time fields non-dry-run slice implementation (G-6-g2)

Last updated: 2026-06-14  
Phase: `G-6-g2-schedule-time-fields-non-dry-run-slice-implementation`  
Type: **implementation only** — no DB write, no Supabase SQL, no Save click, no Preview click

## Purpose

Implement G-6-g2 `open_time` + `start_time` non-dry-run slice UI and product write path on staging shell, per preflight doc. Save and Preview buttons wired but **not executed** in this phase.

**This phase performed:** guards, approval ID, config, dry-run, trigger, UI extension, verify script, build.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL, non-dry-run execution, Save/Preview/Run click, PoC re-arm, G-6-g1 Save re-execution, `/admin` changes.

## Implementation summary

| Area | Deliverable |
| --- | --- |
| Approval ID | `G-6-g2-schedule-time-fields-non-dry-run-slice` in `schedule-write-types.ts` |
| Guard | `assertG6G2TimeFieldsPayloadOnly` in `schedule-write-guards.ts` |
| Config | `getScheduleG6G2TimeFieldsEditConfig` — env `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED` |
| Dry-run | `schedule-time-fields-dry-run.ts` |
| Save trigger | `schedule-g6g2-time-fields-non-dry-run-trigger.ts` → `executeScheduleGeneralUpdateWrite` |
| UI | Extended `AdminStagingScheduleGeneralEditSection.astro` + `staging-schedule-general-edit-ui.ts` |
| Single-arm rule | G-6-g1 and G-6-g2 cannot both be armed |

## Changed / new files

```txt
src/lib/admin/staging-write/schedule-write-types.ts
src/lib/admin/staging-write/schedule-write-guards.ts
src/lib/admin/staging-write/schedule-general-edit-config.ts
src/lib/admin/staging-write/schedule-time-fields-dry-run.ts (new)
src/lib/admin/staging-write/schedule-g6g2-time-fields-non-dry-run-trigger.ts (new)
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts
tools/static-to-astro/config/admin/schedule-general-edit-g6g2.json (new)
tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleGeneralEditSection.astro
tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro
tools/static-to-astro/scripts/verify-schedule-g6g2-time-fields-guard.mjs (new)
```

## Safety result

```txt
DB write: none
Supabase SQL executed: none
Save button click: none
Preview button click: none
Run button click: none
G-6-g1 Save re-execution: none
G-6-e5 / G-6-f6 PoC: unchanged, not re-armed
/admin: not modified
schedule_months: read-only / derived (not touched)
service_role: not used
```

## Approval ID

```txt
G-6-g2-schedule-time-fields-non-dry-run-slice
```

Registered in `SCHEDULE_WRITE_APPROVAL_IDS`. G-6-e5 / G-6-f6 / G-6-g1 IDs unchanged.

## Env gate

```txt
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
```

Mutually exclusive with `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED`. Separated from G-6-e5 / G-6-f6 PoC env.

## Time-fields-only guard

`assertG6G2TimeFieldsPayloadOnly` — allows `open_time` and `start_time` only; both keys required.

## Optimistic lock path

```txt
Save → executeG6G2TimeFieldsNonDryRunSave
     → executeScheduleGeneralUpdateWrite
     → buildScheduleLockedWriteRequest
     → expectedBeforeUpdatedAt from beforeSnapshot.updated_at
```

## Dry-run first

G-6-g2 Save requires successful preview with `changedFields: ["open_time", "start_time"]`, `readSource: supabase`, `staleDetected: false`.

## Payload (default form values)

```json
{
  "open_time": "[CMS Kit staging] G-6-g2 open PoC",
  "start_time": "[CMS Kit staging] G-6-g2 start PoC"
}
```

## Verification (no DB)

```bash
node --experimental-strip-types tools/static-to-astro/scripts/verify-schedule-g6g2-time-fields-guard.mjs
node --experimental-strip-types tools/static-to-astro/scripts/verify-schedule-g6g1-title-guard.mjs
npm run build
```

## Next phase: final preflight

Before execution, operator should:

1. Run beforeSnapshot SQL on staging (`schedule-time-fields-non-dry-run-slice-preflight.md` §8)
2. Confirm title = G-6-g1 post-value; open_time / start_time = null
3. Record exact `updated_at` baseline
4. Arm dev with G-6-g2 env stack (G-6-g1 arm off)
5. Verify UI: Preview → gates → manual Save once (execution phase only)

## Gate decision

```txt
scheduleTimeFieldsNonDryRunSliceImplementationComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceFinalPreflight: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: false
nonDryRunSaveExecuted: true (G-6-g1 only; G-6-g2 not executed)
rollbackNeeded: false
```

## Related docs

- [schedule-time-fields-non-dry-run-slice-preflight.md](./schedule-time-fields-non-dry-run-slice-preflight.md)
- [schedule-title-non-dry-run-slice-implementation.md](./schedule-title-non-dry-run-slice-implementation.md)
