Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test (passed)
Latest commit (pushed): 23b7b68 (G-9g3g5b1 restore approval arm implementation)
G-9g3g5b2 smoke result: uncommitted
```

## Summary

G-9g3g5b2 restore UI gate smoke **passed** (operator manual).

- **Marker in staging DB:** G-9g3g4 temporary marker on row `888c58f2-…`
- **Preview:** operator manual once — valid dry-run, `changedFields=description` only
- **Restore gate:** restore mode, approval ID, env arm confirmed; Save **enabled but not clicked**
- **Stale blocks Save:** confirmed
- **Restore / DB write:** not executed
- **Next:** G-9g3g5c restore execution

**Do not re-click G-9g3g4 operational Save.** **Do not re-run G-9g3g5b2 smoke.**

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
stagingShellScheduleSiteSlugOperationalRestoreApprovalArmUiGateSmokeTestPassed: true
readyForG9g3g5cOperationalRestoreExecution: true
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## Next

**G-9g3g5c-operational-restore-execution** — operator Preview once → Save once (restore approval ID + arm)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g4 operational Save.**
