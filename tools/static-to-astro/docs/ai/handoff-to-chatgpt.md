Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g5b-operational-restore-preflight (complete / restore execution pending)
Latest commit (pushed): d202797 (G-9g3g5 planning)
G-9g3g5b preflight: uncommitted
```

## Summary

G-9g3g5b operational restore preflight **complete** — gap audit shows restore arm **not implemented**.

- **Marker in staging DB:** G-9g3g4 temporary marker on row `888c58f2-…`
- **Restore candidate:** original description (no marker)
- **Restore approval (planned):** `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run`
- **Restore env arm (planned):** `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED`
- **Blocker:** types / guards / config / UI / save path not wired for restore ID
- **Restore / DB write:** not executed

**Do not re-click G-9g3g4 operational Save.** **Do not skip to G-9g3g5c.**

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
stagingShellScheduleSiteSlugOperationalRestorePreflightComplete: true
readyForG9g3g5b1OperationalRestoreApprovalArmImplementation: true
readyForG9g3g5cOperationalRestoreExecution: false
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## Next

**G-9g3g5b1-operational-restore-approval-arm-implementation**

Then: **G-9g3g5c-operational-restore-execution**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g4 operational Save.**
