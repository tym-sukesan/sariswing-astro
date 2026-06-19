Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a2a2-open-time-only-operational-expansion-manual-execution` (not started)

**Git:** latest pushed commit `8ae0d1e` (G-9g4a2a implementation); G-9g4a2a1 preflight **uncommitted**

### G-9g4a2a1 summary (open_time-only preflight — complete)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-open-time-only-operational-expansion-preflight.md` |
| Status | **complete** — preflight only (uncommitted) |
| G-9g4a2a implementation | committed at `8ae0d1e` |
| Target row id | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| legacy_id | `schedule-2026-03-003` |
| Current open_time | `11:30` |
| Smoke candidate | `11:30 [G-9g4a2a open_time smoke]` |
| Restore target | `11:30` |
| expectedBeforeUpdatedAt | `2026-06-19T05:54:34.767498+00:00` |
| Preview / Save / DB | **not executed** in preflight phase |

### Gates

```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionPreflightComplete: true
readyForG9g4a2a2OpenTimeOnlyOperationalExpansionManualExecution: true
targetRowId: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
markerRemainsInStagingDb: false
restoreRequired: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## 2. Next steps

1. **G-9g4a2a2-open-time-only-operational-expansion-manual-execution** — operator Preview → ChatGPT confirm → armed stack → one manual Save → result doc
2. Commit G-9g4a2a1 preflight when ready
3. After smoke Save: restore via same G-9g4a2a open_time-only path (restore required)

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

- Do **not** write arms to `.env` / `.env.local`
- Production and `/admin` remain out of scope
- `service_role` prohibition continues
- FTP / deploy prohibition continues

## 4. Do not

- Cursor / AI click row picker / Preview / Save
- Execute rollback SQL
- Use G-9g4a1 venue-only / G-9g3g / G-9g3g5 paths for this slice
- Re-click G-9g4a1 venue-only Save
- Use service_role
- Touch production or `/admin`
