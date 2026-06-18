Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g5b1-operational-restore-approval-arm-implementation` — **complete / restore execution pending**

**Next:** `G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test` (recommended — do not skip unless waived)

**Git:** latest pushed commit `95ff18c` (G-9g3g5b); G-9g3g5b1 implementation **uncommitted**

### G-9g3g5b1 summary

| Item | Value |
| --- | --- |
| Implementation doc | `staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-implementation.md` |
| Restore approval | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| Restore env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` |
| Implementation gap (G-9g3g5b) | **resolved** — allowlist, config, guards, save path, UI gate, single-arm |
| Marker in DB | yes — G-9g3g4 temporary marker remains |
| Restore / DB write | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalRestoreApprovalArmImplementationComplete: true
readyForG9g3g5b2OperationalRestoreApprovalArmUiGateSmokeTest: true
readyForG9g3g5cOperationalRestoreExecution: false
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test** — UI gate smoke (recommended)
2. **G-9g3g5c-operational-restore-execution** — operator Preview → Save once (after b2 or explicit waiver)
3. **G-9g3g5d-post-restore-hardening**

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Re-click G-9g3g4 operational Save
- Skip to G-9g3g5c before G-9g3g5b2 (unless smoke explicitly waived)
- Execute SQL rollback / restore SQL
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
