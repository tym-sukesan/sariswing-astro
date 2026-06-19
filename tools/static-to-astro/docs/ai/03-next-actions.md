Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3h1c-smoke-marker-restore-execution` — **operator pending** (retry after G-9g3h1b1)

**Git:** latest pushed commit `f868435` (G-9g3h1b restore preflight)

### G-9g3h1c pause

| Item | Value |
| --- | --- |
| Status | Paused **before** Preview / Save |
| Cause | Target row under PoC audit panel (not selectable) |
| Marker | G-9g3h1a smoke marker → `[CMS Kit staging]` exclusion |
| Preview / Save / DB write | **not executed** |

### G-9g3h1b1 summary

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md` |
| Status | **implementation complete** (uncommitted) |
| Fix | Narrow `isG9g3h1aSmokeMarkerRestoreTargetRow` exception |
| UI | **G-9g3h1a restore target** badge + **Select (restore)** |
| Protections | Generic `[CMS Kit staging]` / G-6 pilot / PoC rows still excluded |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestoreRowPickerExceptionComplete: true
readyForG9g3h1cSmokeMarkerRestoreExecution: true
g9g3h1cExecutionPausedBeforePreviewSave: true
markerRemainsInStagingDb: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. Commit / deploy G-9g3h1b1 when ready
2. **Operator:** retry G-9g3h1c — confirm **Select (restore)** on G-9g3h1a restore target row
3. If row still audit-only → **STOP**

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Cursor / AI click Save or Preview
- Re-click G-9g3h1a smoke Save
- Use G-9g3g5 restore mode for G-9g3h1a marker
