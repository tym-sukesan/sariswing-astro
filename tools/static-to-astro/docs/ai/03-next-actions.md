Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test` — **passed**

**Next:** `G-9g3g5c-operational-restore-execution`

**Git:** latest pushed commit `23b7b68` (G-9g3g5b1); G-9g3g5b2 smoke result **uncommitted**

### G-9g3g5b2 summary

| Item | Value |
| --- | --- |
| Smoke doc | `staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-ui-gate-smoke-test-result.md` |
| Status | **passed** — restore UI gate smoke |
| Restore approval | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| Restore env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true` (smoke only — stop server) |
| Preview | operator manual once — valid dry-run |
| Save clicked | **no** |
| Restore / DB write | **not executed** |
| Marker in DB | yes — G-9g3g4 temporary marker remains |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalRestoreApprovalArmUiGateSmokeTestPassed: true
readyForG9g3g5cOperationalRestoreExecution: true
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g5c-operational-restore-execution** — operator Preview → Save once (restore approval ID + arm)
2. **G-9g3g5d-post-restore-hardening**
3. Return to routine dev safety until G-9g3g5c (restore arm off, dry-run on)

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Re-click G-9g3g4 operational Save
- Re-click G-9g3g5b2 smoke Save (Save was enabled but not clicked — do not click until G-9g3g5c)
- Execute SQL rollback / restore SQL
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
