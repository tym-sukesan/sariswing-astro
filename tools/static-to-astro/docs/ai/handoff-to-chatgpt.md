Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3f3b-row-picker-general-edit-binding-smoke-test (complete / passed)
Latest commit (pushed): 1ec29eb (G-9g3f3a implementation)
G-9g3f3a committed at: 1ec29eb
Git: working tree has uncommitted G-9g3f3b smoke work
```

## Summary

G-9g3f3b row picker → general edit binding smoke **passed**.

- **Hydrate:** non-PoC row `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano`
- **Preview:** G-9 changed-fields-only dry-run via `#site-slug-edit-dry-run-preview-btn` → `#site-slug-edit-dry-run-result`
- **First attempt:** legacy G-6-e2 mis-click (documented false-path; not pass criteria)
- **Re-smoke:** `changedFields=price` only, `optimisticLock.stale=false`, `hostGatePassed=true`, `actualWrite=false`
- **Save / DB write:** not executed

**Docs:**
- `staging-shell-schedule-site-slug-row-picker-general-edit-binding-smoke-test-result.md`

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
All G-9 PoC arms: off
```

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingSmokeTestPassed: true
readyForG9g3f3cRowPickerGeneralEditBindingHardening: true
readyForAnyDbWrite: false
```

## Next

**G-9g3f3c-row-picker-general-edit-binding-hardening**
