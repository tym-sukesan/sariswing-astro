Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3h2b-row-picker-exception-lifecycle-cleanup`

**Git:** latest pushed commit `e6b3ece` (G-9g3h1c restore execution result)

### G-9g3h1d summary

| Item | Value |
| --- | --- |
| Hardening doc | `staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md` |
| Status | **complete** — post-execution hardening (uncommitted) |
| Round-trip | G-9g3h1 → G-9g3h1a smoke → G-9g3h1b/b1 → G-9g3h1c restore |
| Marker | **removed** — `markerRemainsInStagingDb: false` |
| Re-click prevention | round-trip **confirmed** (smoke + restore) |
| Row-picker exception | `isG9g3h1aSmokeMarkerRestoreTargetRow` **no longer matches** after marker removal |
| Rollback | not needed / not executed |

### G-9g3h1c summary (committed)

| Item | Value |
| --- | --- |
| commit | `e6b3ece` |
| Path | Option A — G-9g3g general operational |
| Preview | operator once (`actualWrite=false`) |
| Save | operator once (`actualWrite=true`, `rowsAffected=1`) |
| final updated_at | `2026-06-19T02:05:42.615781+00:00` |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickPostExecutionHardeningComplete: true
reclickPreventionRoundTripComplete: true
restoreRoundTripComplete: true
markerRemainsInStagingDb: false
markerRemoved: true
readyForG9g3h2bRowPickerExceptionLifecycleCleanup: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3h2b-row-picker-exception-lifecycle-cleanup** — retire or auto-expire stale marker-specific row-picker exceptions
2. Commit G-9g3h1d post-execution hardening doc when ready

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

Non-dry-run dev server: **stopped** after operator execution. Restart routine dev with dry-run only.

## 4. Do not

- Cursor / AI click Save or Preview
- Re-click G-9g3h1a smoke Save or G-9g3h1c restore Save
- Re-arm non-dry-run stacks for routine dev
- Use service_role
- Touch production or `/admin`
