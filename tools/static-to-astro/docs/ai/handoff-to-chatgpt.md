Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a1a-venue-only-operational-expansion-preflight
Latest commit (pushed): 9a38c11 (G-9g4a text fields operational expansion planning)
G-9g4a1 venue-only operational expansion: implementation complete (uncommitted)
```

## Summary

G-9g4a1 **implemented** venue-only operational path on staging shell:

- **Approval ID:** `G-9g4a1-schedule-site-slug-venue-only-non-dry-run`
- **Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` (default off; not in `.env`)
- **changedFields:** `["venue"]` only; payload `{ venue }` only
- **UI:** dedicated G-9g4a1 Preview/Save buttons (separate from G-9g3g)
- **Mutual exclusion:** G-9g4a1 arm blocks G-9g3g / G-9g3g5 and vice versa
- **Re-click:** G-9g3h1 pattern with mode `venue-only`
- **Smoke example (docs only):** `銀座 N` → `銀座 N [G-9g4a1 venue smoke]` → restore `銀座 N`
- **Target row:** Option A at preflight (new content row); fallback `888c58f2-…` documented

- `markerRemainsInStagingDb: false`
- `activeRestoreExceptionsCount: 0`
- **No Save / Preview / DB write in implementation phase**

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionImplementationComplete: true
readyForG9g4a1aVenueOnlyOperationalExpansionPreflight: true
readyForAnyDbWrite: false
```

## Next

**G-9g4a1a** venue-only operational expansion preflight — row picker target, beforeSnapshot, env stack, rollback SQL (document only)
