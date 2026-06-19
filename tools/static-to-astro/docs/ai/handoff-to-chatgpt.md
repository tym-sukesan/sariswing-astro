Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3h1c-smoke-marker-restore-execution (operator pending — retry after G-9g3h1b1)
Latest commit (pushed): f868435 (G-9g3h1b restore preflight)
G-9g3h1b1 row-picker exception: complete (uncommitted)
```

## Summary

G-9g3h1c restore **paused** before Preview/Save:

- Target row `888c58f2-…` appeared under **PoC audit rows (not selectable)** due to G-9g3h1a smoke marker (`[CMS Kit staging]`)
- **No Preview / Save / DB write** executed

G-9g3h1b1 **implementation complete** (uncommitted):

- Narrow exception: `isG9g3h1aSmokeMarkerRestoreTargetRow` (id + legacy + site_slug + G-9g3h1a marker + `updated_at`)
- UI: **G-9g3h1a restore target** / **Select (restore)**
- `assertOperationalNotPocAuditRow` allows restore target for Option A Save path
- Generic audit protections **unchanged**

**Next:** Retry **G-9g3h1c** after G-9g3h1b1 is deployed. **STOP** if row still audit-only.

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestoreRowPickerExceptionComplete: true
readyForG9g3h1cSmokeMarkerRestoreExecution: true
g9g3h1cExecutionPausedBeforePreviewSave: true
markerRemainsInStagingDb: true
readyForAnyDbWrite: false
```

## Next

**G-9g3h1c** operator restore Save once (Option A — G-9g3g general operational)

**Do not re-click G-9g3h1a smoke Save.**
