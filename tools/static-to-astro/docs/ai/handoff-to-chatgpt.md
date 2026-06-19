Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a2a1-open-time-only-operational-expansion-preflight (not started)
Latest commit (pushed): 0d80d7d (G-9g4a2 text fields planning)
G-9g4a2a open_time-only implementation: complete (uncommitted)
```

## Summary

**G-9g4a1 venue-only operational round-trip — closed** (commit `3b807c8`):

- Write G-9g4a1b1 + restore G-9g4a1d via same G-9g4a1 path
- Final venue: `学芸大学 珈琲美学`
- **markerRemainsInStagingDb:** false
- **activeRestoreExceptionsCount:** 0
- **restore required:** no

**G-9g4a2 text fields planning — complete** (commit `0d80d7d`):

- **Policy:** single-field-first (no multi-field simultaneous Save)
- **Target fields:** `open_time`, `start_time`, `price`, `description` (description defer — already G-9g3g operational)
- **First slice:** G-9g4a2a `open_time` only

**G-9g4a2a open_time-only operational expansion — implementation complete** (uncommitted):

- **Field:** `open_time` only — payload exactly `{ open_time }`, changedFields exactly `["open_time"]`
- **Approval ID:** `G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run`
- **Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED`
- **Pattern:** G-9g4a1 venue-only clone — guards, config, UI gate, executor, optimistic lock, re-click prevention
- **Mutual exclusion:** G-9g4a2a blocks G-9g4a1 / G-9g3g / G-9g3g5
- **No Preview / Save / DB write / SQL** executed in G-9g4a2a implementation phase

## Gates

```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionImplementationComplete: true
readyForG9g4a2a1OpenTimeOnlyOperationalExpansionPreflight: true
g9g4a1VenueOnlyRoundTripComplete: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
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

**G-9g4a2a1-open-time-only-operational-expansion-preflight** — target row selection, before.open_time, smoke candidate, rollback SQL document-only, env stack for execution window — **no operator Save in preflight phase**.
