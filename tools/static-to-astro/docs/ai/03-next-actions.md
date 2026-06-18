Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g5b-operational-restore-preflight` — **complete / restore execution pending**

**Next:** `G-9g3g5b1-operational-restore-approval-arm-implementation` (blocker — restore arm not wired)

**Git:** latest pushed commit `d202797` (G-9g3g5); G-9g3g5b preflight **uncommitted**

### G-9g3g5b summary

| Item | Value |
| --- | --- |
| Preflight doc | `staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md` |
| Target row | `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano` |
| Marker in DB | yes — G-9g3g4 temporary marker remains |
| Restore candidate | original description (no marker) |
| Restore approval | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| Restore env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` |
| Implementation gap | **not implemented** — cannot proceed to G-9g3g5c yet |
| Save / restore / DB write | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalRestorePreflightComplete: true
readyForG9g3g5b1OperationalRestoreApprovalArmImplementation: true
readyForG9g3g5cOperationalRestoreExecution: false
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g5b1-operational-restore-approval-arm-implementation** — types, guards, config, UI gate, save executor
2. **G-9g3g5c-operational-restore-execution** — operator Preview → Save once (after b1)
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
- Skip to G-9g3g5c before G-9g3g5b1
- Execute SQL rollback / restore SQL
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
