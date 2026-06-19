Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a1e-venue-only-operational-restore-result-finalization`

**Git:** latest pushed commit `3b3e4e0` (G-9g4a1c restore preflight)

### G-9g4a1d summary (restore manual execution — complete)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-venue-only-operational-restore-manual-execution-result.md` |
| Status | **complete** — operator restore Save once (uncommitted) |
| Target row | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` |
| Before venue | `学芸大学 珈琲美学 [G-9g4a1 venue smoke]` |
| After venue | `学芸大学 珈琲美学` |
| after.updated_at | `2026-06-19T05:54:34.767498+00:00` |
| markerRemoved | **yes** |
| Re-click | blocked after Save |
| Further restore | **not required** |

### Gates

```txt
stagingShellScheduleVenueOnlyOperationalRestoreManualExecutionComplete: true
readyForG9g4a1eVenueOnlyOperationalRestoreResultFinalization: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a1e-venue-only-operational-restore-result-finalization** — routine dev safety, round-trip closure, AI context finalization
2. Commit G-9g4a1d restore execution result when ready
3. Restart dev with routine stack (all non-dry-run arms off)

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED: false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: false or unset
```

## 4. Do not

- Re-click G-9g4a1 venue-only Save without fresh Preview
- Cursor / AI click Save or Preview
- Further restore on this row (marker already removed)
- Use service_role
- Touch production or `/admin`
