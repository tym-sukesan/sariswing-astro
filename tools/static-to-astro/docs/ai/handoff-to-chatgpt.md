Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a1-venue-only-operational-expansion-implementation
Latest commit (pushed): aebbf98 (G-9g4 field expansion planning)
G-9g4a text fields operational expansion planning: complete (uncommitted)
```

## Summary

G-9g4a **planned** operational expansion of Schedule text fields on content rows:

- **Operational proven:** `description` on content rows (G-9g3g4)
- **First slice:** G-9g4a1 `venue` only — new approval ID `G-9g4a1-schedule-site-slug-venue-only-non-dry-run`
- **UI/dry-run:** all six safe text fields already in preview diff; gap is venue-only guard + Save path
- **Target row:** prefer fresh gosaki-piano content row at preflight; fallback `888c58f2-…` / `schedule-2026-03-001` / venue `銀座 N`
- **Smoke marker (optional):** `銀座 N [G-9g4a1 venue smoke]` → restore `銀座 N`
- **Restore chain:** G-9g4a1b preflight → G-9g4a1c execution → G-9g4a1d hardening (G-9g3h1 template)
- **Future slices:** G-9g4a2 time → G-9g4a3 price → G-9g4a4 title

- `markerRemainsInStagingDb: false`
- `activeRestoreExceptionsCount: 0`

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleTextFieldsOperationalExpansionPlanningComplete: true
readyForG9g4a1VenueOnlyOperationalExpansionImplementation: true
readyForAnyDbWrite: false
```

## Next

**G-9g4a1** venue-only operational expansion implementation — guards, approval ID, env arm, UI gate, verifier (no operator Save in implementation phase)
