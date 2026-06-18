Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3f1-row-picker-implementation (complete)
Latest commit (pushed): 9333e2c (G-9g3f planning)
Git: working tree has uncommitted G-9g3f1 implementation + AI context updates
```

## Summary

G-9g3f1 adds read-only schedule row picker to staging shell — site_slug-scoped list, filters, selected row summary.

- **Row picker:** read-only; no Save / Preview / DB write
- **site_slug:** fixed `gosaki-piano`
- **Pilot row:** excluded from selectable rows; PoC audit panel
- **General edit:** still pilot row — binding deferred G-9g3f3
- **All G-9 PoC Saves:** re-run prohibited
- **Next:** G-9g3f2 read-only smoke test

**Docs:**
- `staging-shell-schedule-site-slug-row-picker-implementation.md` (**new**)
- `staging-shell-schedule-site-slug-row-picker-planning.md`

## Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D arms: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerImplementationComplete: true
readyForG9g3f2RowPickerReadOnlySmokeTest: true
readyForAnyDbWrite: false
```

## Next

**G-9g3f2-row-picker-read-only-smoke-test** — no Save / DB write.
