Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3h3-cms-kit-generalization-notes`

**Git:** latest pushed commit `a01fbf4` (G-9g3h1d post-execution hardening)

### G-9g3h2b summary

| Item | Value |
| --- | --- |
| Cleanup doc | `staging-shell-schedule-site-slug-row-picker-exception-lifecycle-cleanup.md` |
| Status | **complete** — lifecycle cleanup (uncommitted) |
| Chosen option | **B** — centralized restore exception registry |
| Registry | `staging-schedule-site-slug-restore-exception-registry.ts` |
| G-9g3h1a entry | `status: completed` — no active live match |
| G-9g3g4 entry | `status: completed` — no active live match |
| Active exceptions | **0** |
| Marker | `markerRemainsInStagingDb: false` |

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerExceptionLifecycleCleanupComplete: true
markerRemainsInStagingDb: false
g9g3h1aRestoreExceptionLifecycle: completed
activeRestoreExceptionsCount: 0
readyForG9g3h3CmsKitGeneralizationNotes: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3h3-cms-kit-generalization-notes** — consolidate safety patterns for Kit onboarding
2. Commit G-9g3h2b lifecycle cleanup when ready

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Cursor / AI click Save or Preview
- Re-click G-9g3h1a smoke Save or G-9g3h1c restore Save
- Add new phase-specific row-picker bypass functions (use registry)
- Use service_role
- Touch production or `/admin`
