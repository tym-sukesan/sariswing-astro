Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3f3-row-picker-general-edit-binding-planning (complete)
Latest commit (pushed): 94d4e61 (G-9g3f2 smoke)
Git: working tree has uncommitted G-9g3f3 planning doc + AI context updates
```

## Summary

G-9g3f3 plans how the read-only row picker connects to the general edit form.

- **Binding strategy:** client-side CustomEvent bridge; no URL row param; SSR edit `targetRow` null until G-9g3f3a
- **Safety:** site_slug `gosaki-piano` fixed; PoC audit rows blocked; null selection disables edit
- **Operational path:** new approval ID `G-9g3-schedule-site-slug-general-edit` + env `PUBLIC_ADMIN_SCHEDULE_SITE_SLUG_GENERAL_EDIT_ENABLED` — G-9g3g only (not G-9g3d PoC ID)
- **Save / Preview / DB write / manual SQL:** not executed
- **All G-9 PoC Saves:** re-run prohibited

**Docs:**
- `staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md` (**new**)
- `staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md`

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
All G-9 PoC arms: off
```

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingPlanningComplete: true
readyForG9g3f3aRowPickerGeneralEditBindingImplementation: true
readyForAnyDbWrite: false
```

## Next

**G-9g3f3a-row-picker-general-edit-binding-implementation** — wire picker → edit form; no Save / DB write.
