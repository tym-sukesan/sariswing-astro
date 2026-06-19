Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a1b1-venue-only-operational-expansion-manual-execution
Latest commit (pushed): 01e64af (G-9g4a1a venue-only preflight)
G-9g4a1b venue-only operational expansion execution runbook: complete (uncommitted)
```

## Summary

G-9g4a1b **execution runbook** for venue-only smoke (operator manual execution next):

- **Runbook only:** no Save / Preview / DB write / SQL in G-9g4a1b phase
- **Target row:** still **unselected** — operator picks at G-9g4a1b1 (Option A preferred; fallback `888c58f2-…` discouraged)
- **UI:** G-9g4a1 venue-only path only — `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn`, `#site-slug-edit-g9g4a1-venue-only-save-btn` (not G-9g3g / G-9g3g5 / G-6)
- **Smoke:** `<venue> [G-9g4a1 venue smoke]` — venue field only
- **Preview STOP:** paste Preview result to ChatGPT before Save
- **Save STOP:** one manual Save only; paste result; no restore yet
- **Env:** G-9g4a1 arm only on during execution window; G-9g3g / G-9g3g5 off; inline env only — no `.env` write
- **Approval ID:** `G-9g4a1-schedule-site-slug-venue-only-non-dry-run`
- **After smoke:** restore chain G-9g4a1c → G-9g4a1d → G-9g4a1e

- `targetRowSelected: false`
- `markerRemainsInStagingDb: false`
- **No Save / Preview / DB write / SQL in runbook phase**

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionExecutionRunbookComplete: true
readyForG9g4a1b1VenueOnlyOperationalExpansionManualExecution: true
readyForAnyDbWrite: false
```

## Next

**G-9g4a1b1** manual execution — operator row selection, venue smoke, G-9g4a1 Preview, ChatGPT gate, armed stack, one manual Save, result paste
