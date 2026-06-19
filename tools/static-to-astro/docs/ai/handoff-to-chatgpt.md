Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a1d-venue-only-operational-restore-manual-execution
Latest commit (pushed): 11368be (G-9g4a1b1 manual execution result)
G-9g4a1c venue-only operational restore preflight: complete (uncommitted)
```

## Summary

G-9g4a1c **restore preflight** for venue smoke marker removal:

- **Target row:** `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` / `<Live & Session>`
- **markerRemainsInStagingDb:** true
- **Current venue:** `学芸大学 珈琲美学 [G-9g4a1 venue smoke]`
- **Restore venue:** `学芸大学 珈琲美学`
- **expectedBeforeUpdatedAt:** `2026-06-19T05:12:41.853845+00:00`
- **Payload:** `{ "venue": "学芸大学 珈琲美学" }` — changedFields `["venue"]` only
- **Path:** G-9g4a1 venue-only UI — not G-9g3g5 restore
- **Env:** G-9g4a1 arm only on during restore window; G-9g3g / G-9g3g5 off
- **Rollback SQL:** document-only — not executed
- **No Save / Preview / DB write / SQL in preflight phase**

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalRestorePreflightComplete: true
readyForG9g4a1dVenueOnlyOperationalRestoreManualExecution: true
markerRemainsInStagingDb: true
readyForAnyDbWrite: false
```

## Next

**G-9g4a1d** manual restore execution — operator load row → set venue to `学芸大学 珈琲美学` → G-9g4a1 Preview → ChatGPT gate → one manual Save → confirm marker removed
