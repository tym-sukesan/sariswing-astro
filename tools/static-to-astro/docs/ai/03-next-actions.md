Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3h1a-save-success-reclick-prevention-smoke-test` — **operator pending**

**Git:** latest pushed commit `8780f84` (G-9g3h1)

### G-9g3h1a summary

| Item | Value |
| --- | --- |
| Smoke doc | `staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md` |
| Status | **operator pending** — manual Preview → Save once → re-click blocked check |
| Mode | G-9g3g general operational (restore arm off) |
| Target | `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano` |
| Field | `description` only |
| Save / DB write | **not yet executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: false
readyForG9g3h1bSmokeMarkerRestorePreflight: false
operatorPending: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **Operator:** G-9g3h1a smoke (Steps A–J in smoke result doc)
2. After smoke Save: if marker remains → **G-9g3h1b-smoke-marker-restore-preflight**
3. Commit G-9g3h1a smoke runbook when ready

## 3. Routine dev safety (until smoke)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Cursor / AI click Save or Preview
- Re-click G-9g3g4 / G-9g3g5c Save
- Second Save click during smoke (Step I is observe-only)
- Restore / rollback SQL in preparation phase
