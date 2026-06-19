Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3h1d-smoke-marker-restore-post-execution-hardening`

**Git:** latest pushed commit `863fdff` (G-9g3h1b1 row-picker exception)

### G-9g3h1c summary

| Item | Value |
| --- | --- |
| Execution doc | `staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-execution-result.md` |
| Status | **success** — operator manual restore complete |
| Path | Option A — G-9g3g general operational |
| Preview | operator once (`actualWrite=false`) |
| Save | operator once (`actualWrite=true`, `rowsAffected=1`) |
| Marker | **removed** — `markerRemainsInStagingDb: false` |
| Re-click blocked | confirmed |
| Rollback | not needed / not executed |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestoreExecutionComplete: true
readyForG9g3h1dSmokeMarkerRestorePostExecutionHardening: true
markerRemainsInStagingDb: false
markerRemoved: true
restoreRoundTripComplete: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3h1d-smoke-marker-restore-post-execution-hardening** — document round-trip complete, routine dev safety
2. Commit G-9g3h1c restore execution result doc when ready

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Cursor / AI click Save or Preview
- Re-click G-9g3h1a smoke Save or G-9g3h1c restore Save
- Re-arm non-dry-run stacks for routine dev
