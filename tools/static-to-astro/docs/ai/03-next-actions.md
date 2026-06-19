Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a1d-venue-only-operational-restore-manual-execution`

**Git:** latest pushed commit `11368be` (G-9g4a1b1 manual execution result)

### G-9g4a1c summary

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-venue-only-operational-restore-preflight.md` |
| Status | **complete** — restore preflight (uncommitted) |
| Target row | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` |
| Current venue | `学芸大学 珈琲美学 [G-9g4a1 venue smoke]` |
| Restore venue | `学芸大学 珈琲美学` |
| expectedBeforeUpdatedAt | `2026-06-19T05:12:41.853845+00:00` |
| Restore path | G-9g4a1 venue-only UI (not G-9g3g5) |
| Operator Save / Preview | **not executed** in preflight phase |

### Gates

```txt
stagingShellScheduleVenueOnlyOperationalRestorePreflightComplete: true
readyForG9g4a1dVenueOnlyOperationalRestoreManualExecution: true
markerRemainsInStagingDb: true
activeRestoreExceptionsCount: 1
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a1d-venue-only-operational-restore-manual-execution** — load row → venue restore value → G-9g4a1 Preview → ChatGPT gate → one manual Save
2. Commit G-9g4a1c restore preflight when ready
3. **Do not execute rollback SQL** — UI restore preferred

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED: false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: false or unset
```

## 4. Do not

- Cursor / AI click Save or Preview
- Use G-9g3g5 restore path for this row
- Execute rollback SQL in preflight
- Use service_role
- Touch production or `/admin`
