Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3f3c-row-picker-general-edit-binding-hardening (complete)
Latest commit (pushed): 8d277d8 (G-9g3f3b smoke)
Git: working tree has uncommitted G-9g3f3c hardening work
```

## Summary

G-9g3f3c row picker → general edit binding **hardening implemented**.

- **Dirty row-switch:** `confirmDiscardDirtyCandidateIfNeeded` before picker selection change
- **Preview stale:** `markG9PreviewStale` on candidate field change / identity reload
- **Selected row strip:** id, legacy_id, site_slug, updated_at, source_route, title
- **G-9 Preview:** `#site-slug-edit-dry-run-preview-btn` → `#site-slug-edit-dry-run-result` (unchanged)
- **Legacy G-6-e2:** not valid for G-9 smoke/hardening pass criteria
- **Save / DB write:** not executed

**Docs:**
- `staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening.md`
- `staging-shell-schedule-site-slug-row-picker-general-edit-binding-smoke-test-result.md` (G-9g3f3b passed)

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
All G-9 PoC arms: off
```

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningComplete: true
readyForG9g3f3dRowPickerGeneralEditBindingHardeningSmokeTest: true
readyForAnyDbWrite: false
```

## Next

**G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**
