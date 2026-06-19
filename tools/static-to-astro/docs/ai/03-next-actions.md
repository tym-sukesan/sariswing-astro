Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a1c-venue-only-operational-restore-preflight`

**Git:** latest pushed commit `78888f5` (G-9g4a1 Save gate sync fix)

### G-9g4a1b1 summary (manual execution — complete)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-venue-only-operational-expansion-manual-execution-result.md` |
| Status | **complete** — operator Save once (uncommitted) |
| Target row | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` |
| changedFields | `["venue"]` only |
| Before venue | `学芸大学 珈琲美学` |
| After venue | `学芸大学 珈琲美学 [G-9g4a1 venue smoke]` |
| after.updated_at | `2026-06-19T05:12:41.853845+00:00` |
| Re-click | blocked after Save |
| Restore | **required** — not executed |

### Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionManualExecutionComplete: true
readyForG9g4a1cVenueOnlyOperationalRestorePreflight: true
markerRemainsInStagingDb: true
activeRestoreExceptionsCount: 1
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a1c-venue-only-operational-restore-preflight** — restore target, lock baseline, rollback template, operator checklist
2. Commit G-9g4a1b1 execution result when ready
3. **Do not re-click G-9g4a1 Save** on consumed Preview

## 3. Routine dev safety

Restart dev with routine stack after execution window:

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
- Execute restore without G-9g4a1c preflight
- Use service_role
- Touch production or `/admin`
