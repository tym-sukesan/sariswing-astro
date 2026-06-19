Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3h1d-smoke-marker-restore-post-execution-hardening
Latest commit (pushed): 863fdff (G-9g3h1b1 row-picker exception)
G-9g3h1c restore execution: success (uncommitted)
```

## Summary

G-9g3h1c restore **passed** (operator manual):

- **Path:** Option A — G-9g3g general operational
- **Preview:** once (`actualWrite=false`, `wouldWrite=true`, `changedFields=description`)
- **Save:** once (`actualWrite=true`, `rowsAffected=1`)
- **Marker:** G-9g3h1a smoke marker **removed** from staging DB
- **after.description:** original (no marker)
- **Re-click blocked** after Save; no second Save/Preview
- **rollbackNeeded:** false

G-9g3h1a → G-9g3h1c **round-trip complete** (smoke append + restore removal).

**Do not re-click G-9g3h1a smoke Save or G-9g3h1c restore Save.**

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestoreExecutionComplete: true
readyForG9g3h1dSmokeMarkerRestorePostExecutionHardening: true
markerRemainsInStagingDb: false
markerRemoved: true
restoreRoundTripComplete: true
readyForAnyDbWrite: false
```

## Next

**G-9g3h1d** post-execution hardening / routine dev safety documentation
