Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3f3a-row-picker-general-edit-binding-implementation (complete)
Latest commit (pushed): bf27151 (G-9g3f3 planning)
Git: working tree has uncommitted G-9g3f3a implementation
```

## Summary

G-9g3f3a connects row picker selection to general edit form via CustomEvent bridge.

- **Bridge:** `staging-schedule-site-slug-row-selected` / `cleared` / `reloaded`
- **Pilot SSR preload:** removed — edit `targetRow` null until picker selection
- **Safety:** PoC audit rows blocked; site_slug fixed; Save/Preview not executed
- **Preview:** deferred to G-9g3f3b smoke
- **Save / operational arm / DB write:** not implemented
- **All G-9 PoC Saves:** re-run prohibited

**Docs:**
- `staging-shell-schedule-site-slug-row-picker-general-edit-binding-implementation.md` (**new**)
- `staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md`

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
All G-9 PoC arms: off
```

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingImplementationComplete: true
readyForG9g3f3bRowPickerGeneralEditBindingSmokeTest: true
readyForAnyDbWrite: false
```

## Next

**G-9g3f3b-row-picker-general-edit-binding-smoke-test** — Preview dry-run on selected row; no Save / DB write.
