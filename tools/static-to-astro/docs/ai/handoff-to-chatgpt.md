Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3h3-cms-kit-generalization-notes
Latest commit (pushed): a01fbf4 (G-9g3h1d post-execution hardening)
G-9g3h2b row-picker exception lifecycle cleanup: complete (uncommitted)
```

## Summary

G-9g3h2b **completed** row-picker restore exception lifecycle cleanup:

- **Option B:** centralized `STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY`
- G-9g3h1a entry: `status: completed` (marker removed in G-9g3h1c)
- G-9g3g4 entry: `status: completed` (marker removed in G-9g3g5c)
- **Active restore exceptions:** 0
- Live target row `888c58f2-…` is normal selectable content
- Generic `[CMS Kit staging]` audit protection **preserved**
- G-6 pilot row **audit-only**

**Do not re-click G-9g3h1a smoke Save or G-9g3h1c restore Save.**

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerExceptionLifecycleCleanupComplete: true
markerRemainsInStagingDb: false
g9g3h1aRestoreExceptionLifecycle: completed
activeRestoreExceptionsCount: 0
readyForG9g3h3CmsKitGeneralizationNotes: true
readyForAnyDbWrite: false
```

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
All non-dry-run arms: off
service_role: not used
production: untouched
```

## Next

**G-9g3h3** CMS Kit generalization notes — consolidate safety patterns from G-9g3h1 round-trip + G-9g3h2b registry
