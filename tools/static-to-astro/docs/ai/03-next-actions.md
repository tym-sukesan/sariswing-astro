Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test` — **complete / passed**

**Next:** `G-9g3g-operational-general-edit-planning`

**Git:** latest pushed commit `f0fd3af` (G-9g3f3c); G-9g3f3d smoke **uncommitted**

### G-9g3f3d summary

| Check | Status |
| --- | --- |
| Selected row identity | **PASS** |
| G-9 Preview (`#site-slug-edit-dry-run-preview-btn`) | **PASS** |
| Stale invalidation | **PASS** |
| Dirty row-switch Cancel | **PASS** |
| Dirty row-switch Continue | **PASS** |
| PoC audit row exclusion | **PASS** |
| actualWrite=false / no DB write | **PASS** |

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningSmokeTestPassed: true
readyForG9g3gOperationalGeneralEditPlanning: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g-operational-general-edit-planning** — operational Save path on operator-chosen non-PoC row
2. Commit G-9g3f3d smoke when operator approves

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D arms: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
- Use `service_role` key
