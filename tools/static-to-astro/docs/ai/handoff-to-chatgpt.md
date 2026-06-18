Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g5c-operational-restore-execution (operator pending)
Latest commit (pushed): 3b113c5 (G-9g3g5b2 restore UI gate smoke passed)
G-9g3g5c execution runbook: uncommitted
```

## Summary

G-9g3g5b2 restore UI gate smoke **passed** (commit `3b113c5`).

G-9g3g5c restore execution **operator pending** — runbook + pending result doc prepared. Cursor/AI must not click Preview or Save.

- **Target:** `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001` / `gosaki-piano`
- **Restore approval:** `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run`
- **Restore env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true`
- **Lock baseline:** `2026-06-18T16:35:45.060011+00:00` (reconfirm live at Preview)
- **Restore / DB write:** not yet executed
- **Marker in DB:** yes — G-9g3g4 temporary marker remains
- **Next after success:** G-9g3g5d post-restore hardening

**Do not re-click G-9g3g4 operational Save.** **Do not run G-9g3g5c until operator follows execution doc.**

## Routine dev safety (default until G-9g3g5c arm)

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
stagingShellScheduleSiteSlugOperationalRestoreExecutionComplete: false
readyForG9g3g5dPostRestoreHardening: false
operatorPending: true
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## Next

**Operator:** G-9g3g5c restore execution (Preview once → Save once)

Then: **G-9g3g5d-post-restore-hardening**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g4 operational Save.**
