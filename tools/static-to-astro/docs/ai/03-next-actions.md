Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3h1c-smoke-marker-restore-execution` — **operator pending**

**Git:** latest pushed commit `03cbbbe` (G-9g3h1a smoke result)

### G-9g3h1b summary

| Item | Value |
| --- | --- |
| Preflight doc | `staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-preflight.md` |
| Status | **complete** — restore path + runbook fixed |
| Chosen path | **Option A** — G-9g3g general operational (description → original) |
| G-9g3g5 restore mode | **not used** for G-9g3h1a marker (G-9g3g4-specific guards) |
| Lock baseline | `2026-06-19T01:18:46.3938+00:00` |
| Save / DB write (preflight) | **not executed** |

### G-9g3h1a context

| Item | Value |
| --- | --- |
| Smoke result | committed `03cbbbe` |
| Marker in DB | **yes** — G-9g3h1a smoke marker on target row |
| Restore target | original description (no marker) |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestorePreflightComplete: true
readyForG9g3h1cSmokeMarkerRestoreExecution: true
markerRemainsInStagingDb: true
operatorPending: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **Operator:** G-9g3h1c restore execution (Steps A–I in preflight doc + pending execution result doc)
2. After restore Save: fill execution result doc; confirm `markerRemoved: true`
3. Commit G-9g3h1b preflight + pending execution doc when ready

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
- Use G-9g3g5 restore arm for G-9g3h1a marker (wrong marker semantics)
- Restore / rollback SQL without G-9g3h1c operator execution phase
