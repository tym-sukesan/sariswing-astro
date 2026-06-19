Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3h1b-smoke-marker-restore-preflight
Latest commit (pushed): 78c51b8 (G-9g3h1a smoke runbook)
G-9g3h1a smoke result: success (uncommitted)
```

## Summary

G-9g3h1 Save success re-click prevention **implemented** (`8780f84`).

G-9g3h1a operator manual smoke **passed**:

- **URL:** `/__admin-staging-shell/musician-basic/#schedule`
- **Target:** `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001`
- **Mode:** G-9g3g general operational (description-only smoke marker append)
- **Preview:** operator once (`actualWrite=false`, `wouldWrite=true`)
- **Save:** operator once (`actualWrite=true`, `rowsAffected=1`, `changedFields=description`)
- **Re-click blocked:** Save disabled; executed-state message confirmed
- **Candidate change:** Preview stale; Save disabled; no 2nd Preview/Save
- **Marker remains in staging DB** — restore required

**Next:** **G-9g3h1b-smoke-marker-restore-preflight**

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
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionComplete: true
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: true
operatorPending: false
readyForG9g3h1bSmokeMarkerRestorePreflight: true
markerRemainsInStagingDb: true
readyForAnyDbWrite: false
```

## Next

**G-9g3h1b** smoke marker restore preflight → **G-9g3h1c** restore execution

**Do not re-click G-9g3g4 / G-9g3g5c / G-9g3h1a smoke Save.**
