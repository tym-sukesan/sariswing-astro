Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a2-framework-single-text-field-operational-commonization-planning` (not started)

**Git:** branch `main`; HEAD = origin/main = `105c6b1` (G-9g4a2a restore-and-closure — committed and pushed); working tree **clean**

### G-9g4a2a open_time-only round-trip — complete

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-open-time-only-operational-restore-and-closure.md` |
| Status | **complete** — operator restore Save once (commit `105c6b1` — committed and pushed) |
| Target row id | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| Final open_time | `11:30` |
| Final updated_at | `2026-06-19T07:27:53.256604+00:00` |
| markerRemainsInStagingDb | **false** |
| activeRestoreExceptionsCount | **0** |
| restore required | **no** |
| No further Save / restore | **yes** |

### Policy change

- Do **not** repeat per-field manual round-trips for `start_time` / `price`
- Manual non-dry-run round-trip reserved for **new common logic** only
- Next step: **config-driven single-text-field operational framework** planning (G-9g4a2)
- Verification via verifiers / guards / dry-run Preview / type checks — not per-field operator cycles
- **Not** next: `start_time`-only manual execution slice

### Gates

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

## 2. Next steps

1. **G-9g4a2-framework-single-text-field-operational-commonization-planning** — extract shared framework from G-9g4a1 + G-9g4a2a (planning only; not started)
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

- Start `start_time`-only manual round-trip without framework planning
- Re-click G-9g4a2a open_time-only Save on this row
- Cursor / AI click row picker / Preview / Save
- Use service_role
- Touch production or `/admin`
