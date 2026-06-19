Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a2a3-open-time-only-operational-restore-preflight (not started)
Latest commit (pushed): 8d57b1b (G-9g4a2a1 open_time-only preflight)
G-9g4a2a2 open_time-only manual execution: complete (uncommitted)
```

## Summary

**G-9g4a2a2 open_time-only manual execution — complete** (uncommitted):

- **Target row:** `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` / `gosaki-piano`
- **Operator:** Preview once + ChatGPT confirm + Save exactly once
- **Cursor/AI:** did not click row picker / Preview / Save
- **before open_time:** `11:30` → **after:** `11:30 [G-9g4a2a open_time smoke]`
- **before updated_at:** `2026-06-19T05:54:34.767498+00:00`
- **after updated_at:** `2026-06-19T07:14:34.018855+00:00`
- **changedFields:** `["open_time"]` only
- **approvalId:** `G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run`
- **rowsAffected:** 1; **re-click:** blocked
- **markerRemainsInStagingDb:** true
- **activeRestoreExceptionsCount:** 1
- **restore required:** yes
- **restore target open_time:** `11:30`
- **restore lock baseline:** `2026-06-19T07:14:34.018855+00:00`
- Restore path: **same G-9g4a2a open_time-only UI** (not G-9g3g5)

## Gates

```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionManualExecutionComplete: true
readyForG9g4a2a3OpenTimeOnlyOperationalRestorePreflight: true
markerRemainsInStagingDb: true
activeRestoreExceptionsCount: 1
restoreRequired: yes
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

**Do not re-click G-9g4a2a open_time-only Save.** Do not write arms to `.env` / `.env.local`.

## Next

**G-9g4a2a3-open-time-only-operational-restore-preflight** — restore target `11:30`, lock baseline `2026-06-19T07:14:34.018855+00:00`, rollback SQL document-only, operator restore checklist — **no operator Save in preflight phase**.
