Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g5c-operational-restore-execution` — **success / complete**

**Next:** `G-9g3g5d-post-restore-hardening`

**Git:** latest pushed commit `d8b328c` (G-9g3g5c runbook); G-9g3g5c execution result **uncommitted**

### G-9g3g5c summary

| Item | Value |
| --- | --- |
| Execution doc | `staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md` |
| Status | **success** — operator manual restore Save once |
| Target | `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano` |
| Restore approval | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| changedFields | `description` only |
| actualWrite | `true` / rowsAffected `1` |
| before | description included G-9g3g4 marker |
| after | original description (marker **removed**) |
| `updated_at` | `2026-06-18T16:35:45.060011+00:00` → `2026-06-18T18:07:44.737552+00:00` |
| service_role | **not used** |
| Rollback SQL | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalRestoreExecutionComplete: true
readyForG9g3g5dPostRestoreHardening: true
markerRemainsInStagingDb: false
markerRemoved: true
restoreExecuted: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g5d-post-restore-hardening** — row picker / routine dev / operational editor follow-up
2. Commit G-9g3g5c execution result doc
3. Routine dev safety (restore arm off, dry-run on)

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Re-click G-9g3g5c restore Save (executed once — do not re-run)
- Re-arm G-9g3g4 operational Save
- Execute SQL rollback / restore SQL
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
