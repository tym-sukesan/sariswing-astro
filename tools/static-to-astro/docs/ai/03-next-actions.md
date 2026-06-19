Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a2-text-fields-operational-expansion-planning` (planning only)

**Git:** latest pushed commit `82e1aaa` (G-9g4a1d restore execution result)

### G-9g4a1e summary (round-trip finalization — complete)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-venue-only-operational-restore-result-finalization.md` |
| Status | **complete** — documentation / verifier / AI context only (uncommitted) |
| Round-trip | G-9g4a1b1 write + G-9g4a1d restore via same G-9g4a1 venue-only path |
| Target row | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` |
| Final venue | `学芸大学 珈琲美学` |
| final.updated_at | `2026-06-19T05:54:34.767498+00:00` |
| markerRemainsInStagingDb | **false** |
| activeRestoreExceptionsCount | **0** |
| restore required | **no** |
| Further Save / restore | **not needed** |

### Gates

```txt
stagingShellScheduleVenueOnlyOperationalRoundTripComplete: true
readyForG9g4a2TextFieldsOperationalExpansionPlanning: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a2-text-fields-operational-expansion-planning** — planning only; do not implement until approved
2. Commit G-9g4a1e finalization when ready
3. Routine dev stack (all non-dry-run arms off) — already documented

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

- Execution-only inline env is **ended**
- Do **not** write arms to `.env` / `.env.local`
- Production and `/admin` remain out of scope
- `service_role` prohibition continues
- FTP / deploy prohibition continues

## 4. Do not

- Re-click G-9g4a1 venue-only Save without fresh Preview
- Cursor / AI click Save or Preview
- Further restore on this row (marker already removed; round-trip closed)
- Use service_role
- Touch production or `/admin`
- Implement G-9g4a2 without planning phase approval
