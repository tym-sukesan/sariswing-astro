Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a2a1-open-time-only-operational-expansion-preflight` (not started)

**Git:** latest pushed commit `0d80d7d` (G-9g4a2 text fields planning); G-9g4a2a implementation **uncommitted**

### G-9g4a2a summary (open_time-only implementation — complete)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-open-time-only-operational-expansion-implementation.md` |
| Status | **complete** — implementation only (uncommitted) |
| G-9g4a2 planning | committed at `0d80d7d` |
| Field | `open_time` only |
| Approval ID | `G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED` |
| Preview / Save / DB | **not executed** in implementation phase |

### Gates

```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionImplementationComplete: true
readyForG9g4a2a1OpenTimeOnlyOperationalExpansionPreflight: true
g9g4a1VenueOnlyRoundTripComplete: true
singleFieldFirstPolicy: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## 2. Next steps

1. **G-9g4a2a1-open-time-only-operational-expansion-preflight** — target row, beforeSnapshot, smoke candidate, rollback SQL document-only (no operator Save in preflight)
2. Commit G-9g4a2a implementation when ready
3. Routine dev stack unchanged (all non-dry-run arms off)

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

- Operator Preview / Save in preflight phase (document-only)
- Multi-field operational Save (`open_time` + `start_time` together)
- Cursor / AI click Save or Preview
- Re-click G-9g4a1 venue-only Save or G-9g4a2a open_time-only Save
- Use service_role
- Touch production or `/admin`
