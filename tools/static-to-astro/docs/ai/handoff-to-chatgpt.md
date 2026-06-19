Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3h2b-row-picker-exception-lifecycle-cleanup
Latest commit (pushed): e6b3ece (G-9g3h1c restore execution result)
G-9g3h1d post-execution hardening: complete (uncommitted)
```

## Summary

G-9g3h1 **round-trip complete** (re-click prevention smoke → marker restore):

| Phase | Outcome |
| --- | --- |
| G-9g3h1 | re-click prevention implemented (`8780f84`) |
| G-9g3h1a | smoke: Preview once + Save once; marker appended (`03cbbbe`) |
| G-9g3h1b | restore preflight; Option A chosen (`f868435`) |
| G-9g3h1b1 | row-picker narrow exception (`863fdff`) |
| G-9g3h1c | restore: Preview once + Save once; marker removed (`e6b3ece`) |
| G-9g3h1d | post-execution hardening documented (uncommitted) |

- **Marker:** removed — `markerRemainsInStagingDb: false`
- **after.description:** original (no smoke marker)
- **final updated_at:** `2026-06-19T02:05:42.615781+00:00`
- **Re-click prevention:** confirmed in smoke + restore
- **Row-picker:** `isG9g3h1aSmokeMarkerRestoreTargetRow` no longer matches; target row is normal selectable content again
- **Rollback:** not needed / not executed

**Do not re-click G-9g3h1a smoke Save or G-9g3h1c restore Save.**

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickPostExecutionHardeningComplete: true
reclickPreventionRoundTripComplete: true
restoreRoundTripComplete: true
markerRemainsInStagingDb: false
markerRemoved: true
readyForG9g3h2bRowPickerExceptionLifecycleCleanup: true
readyForAnyDbWrite: false
```

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
All non-dry-run arms: off
Non-dry-run dev server: stopped after operator execution
service_role: not used
production: untouched
FTP / deploy: not executed
```

## Next

**G-9g3h2b** row-picker exception lifecycle cleanup — retire stale marker-specific exceptions after successful restore
