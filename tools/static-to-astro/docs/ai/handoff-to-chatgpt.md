Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a2a2-open-time-only-operational-expansion-manual-execution (not started)
Latest commit (pushed): 8ae0d1e (G-9g4a2a open_time-only implementation)
G-9g4a2a1 open_time-only preflight: complete (uncommitted)
```

## Summary

**G-9g4a1 venue-only operational round-trip — closed** (commit `3b807c8`):

- Proven row: `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003`
- Final venue: `学芸大学 珈琲美学`; no marker remains
- **markerRemainsInStagingDb:** false

**G-9g4a2a open_time-only implementation — complete** (commit `8ae0d1e`):

- Field: `open_time` only; approval `G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run`
- Env arm: `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED`

**G-9g4a2a1 open_time-only preflight — complete** (uncommitted):

- **Target row:** `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` / `gosaki-piano`
- **Current open_time:** `11:30`
- **Smoke candidate:** `11:30 [G-9g4a2a open_time smoke]`
- **Restore target:** `11:30`
- **expectedBeforeUpdatedAt:** `2026-06-19T05:54:34.767498+00:00`
- **Payload:** `{ "open_time": "11:30 [G-9g4a2a open_time smoke]" }`
- **changedFields:** `["open_time"]`
- **G-9g4a2a arm only on** at execution; G-9g4a1 / G-9g3g / G-9g3g5 off
- **No Preview / Save / DB write / SQL** in preflight phase
- **restore required:** yes after smoke marker use (same G-9g4a2a path)

## Gates

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

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

Do not write arms to `.env` / `.env.local`.

## Next

**G-9g4a2a2-open-time-only-operational-expansion-manual-execution** — operator loads target row → edits open_time candidate → G-9g4a2a Preview → ChatGPT confirm → execution env stack → one manual Save → result doc. Restore chain after smoke via same G-9g4a2a path.
