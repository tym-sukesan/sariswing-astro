Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a2a-open-time-only-operational-expansion-implementation (not started)
Latest commit (pushed): 3b807c8 (G-9g4a1e round-trip finalization)
G-9g4a2 text fields planning: complete (uncommitted)
```

## Summary

**G-9g4a1 venue-only operational round-trip — closed** (commit `3b807c8`):

- Write G-9g4a1b1 + restore G-9g4a1d via same G-9g4a1 path
- Final venue: `学芸大学 珈琲美学`
- **markerRemainsInStagingDb:** false
- **activeRestoreExceptionsCount:** 0
- **restore required:** no

**G-9g4a2 text fields planning — complete** (uncommitted):

- **Policy:** single-field-first (no multi-field simultaneous Save)
- **Target fields:** `open_time`, `start_time`, `price`, `description` (description defer — already G-9g3g operational)
- **First recommended slice:** `G-9g4a2a-open-time-only-operational-expansion-implementation`
- **Reuse:** G-9g4a1 guard/UI/executor/optimistic-lock/re-click/restore pattern
- **No UI / DB / SQL** executed in G-9g4a2 planning

## Gates

```txt
stagingShellScheduleTextFieldsOperationalExpansionPlanningComplete: true
readyForG9g4a2aOpenTimeOnlyOperationalExpansionImplementation: true
g9g4a1VenueOnlyRoundTripComplete: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
readyForAnyDbWrite: false
```

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

G-9g4a2a env arm not created yet. Do not write arms to `.env` / `.env.local`.

## Next

**G-9g4a2a-open-time-only-operational-expansion-implementation** — `open_time` only; new approval ID + guards + UI + executor; **no operator Save** in implementation phase.
