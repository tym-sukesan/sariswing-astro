Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a2-framework-single-text-field-operational-commonization-implementation` (not started)

**Git:** branch `main`; HEAD = origin/main = `e267da3` (G-9g4a2 framework planning — committed and pushed); working tree **clean**

### G-9g4a2 framework planning — complete

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-single-text-field-operational-commonization-planning.md` |
| Status | **complete** — commit `e267da3` (committed and pushed) |
| Verifier | 39 passed, 0 failed |
| Target fields | `open_time`, `start_time`, `price` |
| Next | `G-9g4a2-framework-single-text-field-operational-commonization-implementation` |

### G-9g4a2a open_time-only round-trip — complete (historical)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-open-time-only-operational-restore-and-closure.md` |
| Status | **complete** — commit `105c6b1` (committed and pushed) |
| markerRemainsInStagingDb | **false** |
| No further Save / restore | **yes** |

### Policy (manual round-trip reduction)

- Do **not** repeat per-field manual round-trips for `start_time` / `price`
- Manual non-dry-run round-trip reserved for **new common logic** only
- Config-only field additions: static verifiers, guards, dry-run Preview, type checks
- Next: common framework **implementation** — **not** `start_time`-only manual execution slice

### Gates

```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationPlanningComplete: true
readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationImplementation: true
stagingShellScheduleOpenTimeOnlyOperationalRoundTripComplete: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## 2. Next steps

1. **G-9g4a2-framework-single-text-field-operational-commonization-implementation** — registry + shared modules + G-9g4a2a delegate (implementation only; not started)
2. **Not** next: `start_time`-only manual execution slice

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

## 4. Do not

- Start `start_time`-only manual round-trip (use framework implementation instead)
- Re-click G-9g4a2a open_time-only Save on proven row
- Cursor / AI click row picker / Preview / Save
- Use service_role
- Touch production or `/admin`
