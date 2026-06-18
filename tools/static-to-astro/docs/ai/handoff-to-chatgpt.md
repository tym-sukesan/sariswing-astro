Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test (complete / passed)
Latest commit (pushed): f0fd3af (G-9g3f3c hardening)
G-9g3f3d smoke: passed (uncommitted)
```

## Summary

G-9g3f3d hardening smoke **passed** (operator manual).

- **Identity strip:** id, legacy_id, site_slug, updated_at, source_route, title — confirmed
- **G-9 Preview:** `#site-slug-edit-dry-run-preview-btn` → `#site-slug-edit-dry-run-result`; `changedFields=price` only; `hostGatePassed=true`; `actualWrite=false`
- **Stale invalidation:** `Preview is stale — run G-9 preview again` — confirmed
- **Dirty row-switch:** Cancel keeps row/candidate; Continue hydrates new row — confirmed
- **PoC audit row:** `CMS Kit staging` keyword → 0 selectable; pilot read-only
- **Save / DB write:** not executed

**Docs:**
- `staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening-smoke-test-result.md`

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
All G-9 PoC arms: off
```

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningSmokeTestPassed: true
readyForG9g3gOperationalGeneralEditPlanning: true
readyForAnyDbWrite: false
```

## Next

**G-9g3g-operational-general-edit-planning**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**
