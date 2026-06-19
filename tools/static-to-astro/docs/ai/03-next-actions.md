Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3h1b-smoke-marker-restore-preflight`

**Git:** latest pushed commit `78c51b8` (G-9g3h1a smoke runbook)

### G-9g3h1a summary

| Item | Value |
| --- | --- |
| Smoke doc | `staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md` |
| Status | **success** — operator manual smoke passed |
| Mode | G-9g3g general operational (restore arm off) |
| Target | `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano` |
| Field | `description` only |
| Preview | operator once (`actualWrite=false`) |
| Save | operator once (`actualWrite=true`, `rowsAffected=1`) |
| Re-click blocked | confirmed |
| Candidate change | Preview stale / Save disabled (no 2nd Preview/Save) |
| Marker in DB | **yes** — restore required |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: true
readyForG9g3h1bSmokeMarkerRestorePreflight: true
operatorPending: false
markerRemainsInStagingDb: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3h1b-smoke-marker-restore-preflight** — plan restore of original description (remove G-9g3h1a smoke marker)
2. After preflight: **G-9g3h1c-smoke-marker-restore-execution** (operator restore Save once)
3. Commit G-9g3h1a smoke result doc when ready

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Cursor / AI click Save or Preview
- Re-click G-9g3g4 / G-9g3g5c / G-9g3h1a smoke Save
- Second Save click during any smoke observation
- Restore / rollback SQL without G-9g3h1b preflight
