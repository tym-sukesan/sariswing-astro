Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a1c-venue-only-operational-restore-preflight
Latest commit (pushed): 78888f5 (G-9g4a1 Save gate sync fix)
G-9g4a1b1 venue-only manual execution: complete (uncommitted)
```

## Summary

G-9g4a1b1 **manual execution** — operator Save success:

- **Target row:** `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` / `<Live & Session>`
- **changedFields:** `["venue"]` only
- **Before venue:** `学芸大学 珈琲美学`
- **After venue:** `学芸大学 珈琲美学 [G-9g4a1 venue smoke]`
- **after.updated_at:** `2026-06-19T05:12:41.853845+00:00`
- **Save:** operator manual once; `actualWrite=true`, `rowsAffected=1`
- **Safety:** `serviceRoleUsed=false`, `productionBlocked=true`, `scheduleMonthsTouched=false`
- **Re-click:** blocked — Preview consumed
- **Restore:** required — marker remains in staging DB; **not executed**
- **Restore target venue:** `学芸大学 珈琲美学`

**Cursor / AI did not click Save or Preview.**

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionManualExecutionComplete: true
markerRemainsInStagingDb: true
activeRestoreExceptionsCount: 1
readyForG9g4a1cVenueOnlyOperationalRestorePreflight: true
readyForAnyDbWrite: false
```

## Next

**G-9g4a1c** restore preflight — lock baseline `2026-06-19T05:12:41.853845+00:00`, restore payload `{ venue: "学芸大学 珈琲美学" }`
