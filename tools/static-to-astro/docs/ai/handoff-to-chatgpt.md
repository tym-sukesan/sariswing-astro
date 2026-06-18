Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g5b1-operational-restore-approval-arm-implementation (complete / restore execution pending)
Latest commit (pushed): 95ff18c (G-9g3g5b restore preflight)
G-9g3g5b1 implementation: uncommitted
```

## Summary

G-9g3g5b1 operational restore approval arm **implementation complete** — G-9g3g5b gap audit blockers **resolved**.

- **Marker in staging DB:** G-9g3g4 temporary marker on row `888c58f2-…`
- **Restore approval:** `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run`
- **Restore env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED`
- **Restore / DB write:** not executed
- **Next:** G-9g3g5b2 UI gate smoke test (recommended before G-9g3g5c)

**Do not re-click G-9g3g4 operational Save.** **Do not skip G-9g3g5b2 unless explicitly waived.**

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
stagingShellScheduleSiteSlugOperationalRestoreApprovalArmImplementationComplete: true
readyForG9g3g5b2OperationalRestoreApprovalArmUiGateSmokeTest: true
readyForG9g3g5cOperationalRestoreExecution: false
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## Next

**G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test** (recommended)

Then: **G-9g3g5c-operational-restore-execution** (only after b2 or explicit waiver)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g4 operational Save.**
