Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g5-post-execution-hardening-and-restore-decision (planning complete)
Latest commit (pushed): a58f5f9 (G-9g3g4 execution success)
G-9g3g5 planning: uncommitted
```

## Summary

G-9g3g5 post-execution hardening and restore decision **complete** — planning only.

- **G-9g3g4:** success at `a58f5f9` — `description` marker remains in staging DB
- **Restore decision:** Option B (UI operational restore) recommended — **not executed**
- **Restore approval (planned):** `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run`
- **Restore env arm (planned):** `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED`
- **SQL rollback:** discouraged (Option C)
- **Save / DB write (G-9g3g5):** not executed

**Do not re-click G-9g3g4 operational Save.**

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: false (or unset)
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

## Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditPostExecutionHardeningPlanningComplete: true
readyForG9g3g5bOperationalRestorePreflight: true
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

## Next

**G-9g3g5b-operational-restore-preflight**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g4 operational Save.**
