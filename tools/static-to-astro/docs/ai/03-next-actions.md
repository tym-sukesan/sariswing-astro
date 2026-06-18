Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g5-post-execution-hardening-and-restore-decision` — **planning complete**

**Next:** `G-9g3g5b-operational-restore-preflight`

**Git:** latest pushed commit `a58f5f9` (G-9g3g4); G-9g3g5 planning **uncommitted**

### G-9g3g5 summary

| Item | Value |
| --- | --- |
| Planning doc | `staging-shell-schedule-site-slug-operational-general-edit-post-execution-hardening-and-restore-decision.md` |
| G-9g3g4 commit | `a58f5f9` — Save success, marker in staging DB |
| Restore decision | **Option B** (UI operational restore) in G-9g3g5b/c — not executed |
| Restore approval (planned) | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| Restore env arm (planned) | `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` |
| Save / DB write (this phase) | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditPostExecutionHardeningPlanningComplete: true
readyForG9g3g5bOperationalRestorePreflight: true
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g5b-operational-restore-preflight** — restore payload, dedicated approval/env, operator checklist
2. **G-9g3g5c-operational-restore-execution** — operator Preview → Save once (description → original)
3. **G-9g3g5d-post-restore-hardening** — verify clean state

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Re-click G-9g3g4 operational Save
- Execute restore / rollback SQL until G-9g3g5b/c operator approval
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
