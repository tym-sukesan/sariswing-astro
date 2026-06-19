Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a2-framework-single-text-field-operational-commonization-planning (not started)
Latest commit (pushed): 54623a1 (G-9g4a2a2 open_time-only manual execution)
G-9g4a2a open_time-only restore-and-closure: complete (uncommitted)
```

## Summary

**G-9g4a2a open_time-only smoke round-trip — closed** (uncommitted closure doc):

- **Target row:** `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` / `gosaki-piano`
- **G-9g4a2a2 smoke:** `11:30` → `11:30 [G-9g4a2a open_time smoke]` (commit `54623a1`)
- **Restore:** `11:30 [G-9g4a2a open_time smoke]` → `11:30` (operator manual; same G-9g4a2a path)
- **Final open_time:** `11:30`
- **Final updated_at:** `2026-06-19T07:27:53.256604+00:00`
- **markerRemainsInStagingDb:** false
- **activeRestoreExceptionsCount:** 0
- **restore required:** no
- **no further Save / restore needed:** yes
- **Cursor/AI:** did not click row picker / Preview / Save for restore documentation

## Policy change

- Do **not** repeat full manual round-trip per field (`start_time`, `price`)
- Manual non-dry-run round-trip only when **new common logic** is introduced
- `start_time` / `price` → **G-9g4a2 single-text-field operational common framework** (config-driven)
- Verification: verifiers, guards, dry-run Preview, type checks — not per-field operator cycles
- **Not** splitting G-9g4a2a3 / a4 / a5 per field

## Gates

```txt
stagingShellScheduleOpenTimeOnlyOperationalRoundTripComplete: true
readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationPlanning: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
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

## Next

**G-9g4a2-framework-single-text-field-operational-commonization-planning** — planning only; extract shared operational framework from G-9g4a1 venue-only + G-9g4a2a open_time-only. **Not** `start_time`-only manual execution as next slice.
