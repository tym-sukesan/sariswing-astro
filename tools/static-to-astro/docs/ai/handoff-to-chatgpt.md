Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3h1-save-success-reclick-prevention (implementation complete)
Latest commit (pushed): 972e640 (G-9g3g5d post-restore hardening)
G-9g3h1 implementation: uncommitted
```

## Summary

G-9g3h1 operational / restore **Save success re-click prevention** implemented (UI + client guard).

- **Save button:** `#site-slug-edit-g9g3g-operational-save-btn`
- **After success:** Save disabled; preview consumed; executed-state in result panel
- **Modes:** G-9g3g general + G-9g3g5 restore (separate preview identity per mode/approval)
- **Save / Preview / DB write (G-9g3h1 phase):** not executed by Cursor
- **Round-trip:** G-9g3g4 / G-9g3g5c complete; marker removed (`ca1f721`)

**Do not re-click G-9g3g4 operational Save.** **Do not re-click G-9g3g5 restore Save.**

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: false (or unset)
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionComplete: true
readyForG9g3h1aSaveSuccessReclickPreventionSmokeTest: true
restoreRoundTripComplete: true
markerRemainsInStagingDb: false
readyForAnyDbWrite: false
```

## Next

**G-9g3h1a-save-success-reclick-prevention-smoke-test**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g4 / G-9g3g5c restore Save.**
