Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3h1a-save-success-reclick-prevention-smoke-test (operator pending)
Latest commit (pushed): 8780f84 (G-9g3h1 re-click prevention)
G-9g3h1a smoke runbook: uncommitted
```

## Summary

G-9g3h1 Save success re-click prevention **implemented** (`8780f84`).

G-9g3h1a operator manual smoke **pending**:

- **URL:** `/__admin-staging-shell/musician-basic/#schedule`
- **Target:** `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001`
- **Mode:** G-9g3g general operational (description-only smoke marker append)
- **Save / Preview / DB write (prep phase):** not executed by Cursor

After smoke Save (if marker remains): **G-9g3h1b-smoke-marker-restore-preflight**

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
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: false
operatorPending: true
readyForAnyDbWrite: false
```

## Next

**G-9g3h1a** operator smoke → then **G-9g3h1b** restore preflight if marker in DB

**Do not re-click G-9g3g4 / G-9g3g5c Save.**
