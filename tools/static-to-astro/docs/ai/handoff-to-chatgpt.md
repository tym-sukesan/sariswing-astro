Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3f2-row-picker-read-only-smoke-test (complete)
Latest commit (pushed): c3d49ee (G-9g3f1 implementation)
Git: working tree has uncommitted G-9g3f2 smoke doc + verifier + AI context updates
```

## Summary

G-9g3f2 confirms read-only row picker on staging shell — SSR + static/source smoke.

- **Row picker:** read-only; site_slug fixed `gosaki-piano`
- **Pilot row:** excluded from selectable (59 rows); 1 audit row
- **General edit binding:** still deferred (G-9g3f3)
- **Save / Preview / DB write / manual SQL:** not executed
- **Next:** G-9g3f3 general edit binding planning

**Docs:**
- `staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md` (**new**)
- `staging-shell-schedule-site-slug-row-picker-implementation.md`

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerReadOnlySmokeTestPassed: true
readyForG9g3f3RowPickerGeneralEditBindingPlanning: true
readyForAnyDbWrite: false
```

## Next

**G-9g3f3-row-picker-general-edit-binding-planning** — planning only; no Save / DB write.
