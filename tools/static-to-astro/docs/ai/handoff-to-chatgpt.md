Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3h1c-smoke-marker-restore-execution (operator pending)
Latest commit (pushed): 03cbbbe (G-9g3h1a smoke result)
G-9g3h1b restore preflight: complete (uncommitted)
```

## Summary

G-9g3h1a smoke **passed** (`03cbbbe`):

- Preview once + Save once + re-click blocked confirmed
- G-9g3h1a smoke marker **remains** in staging DB on `888c58f2-f152-4563-a3cf-a20d7c2456c1`

G-9g3h1b restore preflight **complete** (uncommitted):

- **Chosen path:** Option A — G-9g3g general operational (set candidate description to original)
- **Not used:** G-9g3g5 restore mode (hardcoded to G-9g3g4 marker in guards)
- Lock baseline: `2026-06-19T01:18:46.3938+00:00`
- Preview: `#site-slug-edit-dry-run-preview-btn`
- Save: `#site-slug-edit-g9g3g-operational-save-btn` (once)

**Next:** **G-9g3h1c-smoke-marker-restore-execution** (operator manual)

**Do not re-click G-9g3g4 / G-9g3g5c / G-9g3h1a smoke Save.**

**Cursor / AI must not click Save or Preview.**

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: false (or unset)
```

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: true
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestorePreflightComplete: true
readyForG9g3h1cSmokeMarkerRestoreExecution: true
markerRemainsInStagingDb: true
readyForAnyDbWrite: false
```

## Next

**G-9g3h1c** operator restore Save once → fill execution result doc

**Do not re-click G-9g3g4 / G-9g3g5c / G-9g3h1a smoke Save.**
