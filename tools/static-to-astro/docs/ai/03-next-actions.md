Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g5c-operational-restore-execution` — **operator pending**

**Next after execution:** `G-9g3g5d-post-restore-hardening`

**Git:** latest pushed commit `3b113c5` (G-9g3g5b2); G-9g3g5c execution runbook **uncommitted**

### G-9g3g5c summary

| Item | Value |
| --- | --- |
| Execution doc | `staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md` |
| Status | **operator pending** — Preview → Save once (restore approval + arm) |
| Target | `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano` |
| Restore approval | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| Restore env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true` |
| Lock baseline | `2026-06-18T16:35:45.060011+00:00` (reconfirm live at Preview) |
| Save / DB write | **not yet executed** |
| Marker in DB | yes — G-9g3g4 temporary marker remains |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalRestoreApprovalArmUiGateSmokeTestPassed: true
stagingShellScheduleSiteSlugOperationalRestoreExecutionComplete: false
readyForG9g3g5dPostRestoreHardening: false
operatorPending: true
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **Operator:** G-9g3g5c restore execution (Steps 0–7 in execution result doc)
2. **G-9g3g5d-post-restore-hardening** — after successful restore Save
3. Routine dev until G-9g3g5c (restore arm off, dry-run on)

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Re-click G-9g3g4 operational Save
- Re-click G-9g3g5c restore Save after execution (one Save only)
- Execute G-9g3g5c Save before completing live baseline check + Preview
- Execute SQL rollback / restore SQL
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
