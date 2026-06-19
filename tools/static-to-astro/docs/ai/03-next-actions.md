Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a2a-open-time-only-operational-expansion-implementation` (not started — await commit of G-9g4a2 planning)

**Git:** latest pushed commit `3b807c8` (G-9g4a1e round-trip finalization)

### G-9g4a2 summary (text fields planning — complete)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-text-fields-operational-expansion-planning.md` |
| Status | **complete** — planning only (uncommitted) |
| G-9g4a1 closure | round-trip complete at `3b807c8` |
| Policy | **single-field-first** |
| Target fields | `open_time`, `start_time`, `price`, `description` (description already G-9g3g — defer) |
| First slice | **G-9g4a2a `open_time` only** |
| markerRemainsInStagingDb | **false** |
| activeRestoreExceptionsCount | **0** |
| restore required | **no** |

### Gates

```txt
stagingShellScheduleTextFieldsOperationalExpansionPlanningComplete: true
readyForG9g4a2aOpenTimeOnlyOperationalExpansionImplementation: true
g9g4a1VenueOnlyRoundTripComplete: true
singleFieldFirstPolicy: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a2a-open-time-only-operational-expansion-implementation** — guards, config, UI gate, executor (no operator Save in implementation phase)
2. Commit G-9g4a2 planning when ready
3. Routine dev stack unchanged (all non-dry-run arms off)

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

- G-9g4a2a env arm: **not created in planning phase**
- Do **not** write arms to `.env` / `.env.local`
- Production and `/admin` remain out of scope
- `service_role` prohibition continues
- FTP / deploy prohibition continues

## 4. Do not

- Implement G-9g4a2a without committing G-9g4a2 planning first
- Multi-field operational Save (`open_time` + `start_time` together)
- Cursor / AI click Save or Preview
- Re-click G-9g4a1 venue-only Save
- Use service_role
- Touch production or `/admin`
