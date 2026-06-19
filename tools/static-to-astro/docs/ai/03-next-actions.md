Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a2a3-open-time-only-operational-restore-preflight` (not started)

**Git:** latest pushed commit `8d57b1b` (G-9g4a2a1 preflight); G-9g4a2a2 manual execution result **uncommitted**

### G-9g4a2a2 summary (open_time-only manual execution — complete)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-open-time-only-operational-expansion-manual-execution-result.md` |
| Status | **complete** — operator Save once (uncommitted) |
| Target row id | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| before open_time | `11:30` |
| after open_time (smoke) | `11:30 [G-9g4a2a open_time smoke]` |
| after updated_at | `2026-06-19T07:14:34.018855+00:00` |
| rowsAffected | 1 |
| Cursor Preview / Save | **no** |
| Re-click | blocked |

### Gates

```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionManualExecutionComplete: true
readyForG9g4a2a3OpenTimeOnlyOperationalRestorePreflight: true
markerRemainsInStagingDb: true
activeRestoreExceptionsCount: 1
restoreRequired: yes
restoreTargetOpenTime: 11:30
restoreLockBaselineUpdatedAt: 2026-06-19T07:14:34.018855+00:00
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## 2. Next steps

1. **G-9g4a2a3-open-time-only-operational-restore-preflight** — restore target, lock baseline, rollback SQL document-only
2. Commit G-9g4a2a2 execution result when ready
3. Restore via same G-9g4a2a open_time-only path (not G-9g3g5)

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

- **Do not re-click G-9g4a2a open_time-only Save** on this row
- Do **not** write arms to `.env` / `.env.local`
- `service_role` prohibition continues

## 4. Do not

- Re-click G-9g4a2a open_time-only Save without fresh Preview
- Cursor / AI click row picker / Preview / Save
- Use G-9g3g5 restore path for this row
- Execute restore until G-9g4a2a3 preflight complete
- Use service_role
- Touch production or `/admin`
