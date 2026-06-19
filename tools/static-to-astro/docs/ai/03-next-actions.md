Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g5d-post-restore-hardening` — **complete**

**Next:** `G-9g3h1-save-success-reclick-prevention`

**Git:** latest pushed commit `ca1f721` (G-9g3g5c); G-9g3g5d hardening doc **uncommitted**

### G-9g3g5d summary

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-site-slug-operational-general-edit-post-restore-hardening.md` |
| Status | **complete** — planning / verification only |
| Round-trip | G-9g3g4 marker add + G-9g3g5c restore **complete** |
| Marker in DB | **removed** (`markerRemainsInStagingDb: false`) |
| Row picker | target row back to **selectable** (no `[CMS Kit staging]` in description) |
| Rollback SQL | **not executed** |
| service_role | **not used** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalPostRestoreHardeningComplete: true
restoreRoundTripComplete: true
markerRemainsInStagingDb: false
markerRemoved: true
readyForG9g3h1SaveSuccessReclickPrevention: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3h1-save-success-reclick-prevention** — Save success UI disable / executed-state marker
2. Commit G-9g3g5d hardening doc + verifier
3. Routine dev safety (arms off, dry-run on)

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
```

## 4. Do not

- Re-click G-9g3g4 operational Save
- Re-click G-9g3g5c restore Save
- Execute SQL rollback / restore SQL
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
- Arm operational or restore env without new approval phase
