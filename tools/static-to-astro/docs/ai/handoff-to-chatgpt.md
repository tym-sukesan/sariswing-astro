Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a1b1-venue-only-operational-expansion-manual-execution
Latest commit (pushed): 6564061 (G-9g4a1b execution runbook)
G-9g4a1a venue-only preflight: complete at 01e64af
G-9g4a1 venue-only Save gate sync fix: uncommitted
```

## Summary

G-9g4a1b1 **manual execution** — operator Preview step:

- **Target row:** `schedule-2026-03-003` / `<Live & Session>` / venue `学芸大学 珈琲美学`
- **Smoke:** `学芸大学 珈琲美学 [G-9g4a1 venue smoke]`
- **Operator Preview:** valid (actualWrite=false, changedFields=venue, stale=false, hostGatePassed=true)
- **Save:** not clicked; DB write / SQL / rollback / restore not executed
- **Bug found:** Save gate stayed disabled despite valid Preview
- **Root cause:** `refreshG9g4a1VenueOnlySaveButtonState` ran inside `renderG9g4a1VenueOnlyDryRunResult` before `g9g4a1VenueOnlyPreviewValid = true`
- **Fix (uncommitted):** refresh Save button/gate after preview state assignment; gate copy only shows Save-completed message when `g9g4a1VenueOnlySaveSuccess` is set

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
g9g4a1VenueOnlySaveGateSyncFixComplete: false (uncommitted)
readyForG9g4a1b1PreviewRetestAfterFix: true
readyForAnyDbWrite: false
```

## Next

After fix commit: operator browser reload → same row/candidate → G-9g4a1 Preview once → confirm Save gate enabled → ChatGPT gate → one manual Save
