Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3f3b-row-picker-general-edit-binding-smoke-test` — **complete / passed**

**Next:** `G-9g3f3c-row-picker-general-edit-binding-hardening`

**Git:** latest pushed commit `1ec29eb` (G-9g3f3a); G-9g3f3b smoke **uncommitted**

**G-9g3f3a committed at:** `1ec29eb`

### G-9g3f3b summary

| Check | Status |
| --- | --- |
| Row picker hydrate | **PASS** |
| G-9 Preview (`#site-slug-edit-dry-run-preview-btn`) | **PASS** (manual re-smoke) |
| changedFields price only | **PASS** |
| optimisticLock stale=false | **PASS** |
| hostGatePassed=true | **PASS** |
| actualWrite=false / no DB write | **PASS** |
| Legacy G-6-e2 false-path (first attempt) | documented — not pass criteria |

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingSmokeTestPassed: true
readyForG9g3f3cRowPickerGeneralEditBindingHardening: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3f3c-row-picker-general-edit-binding-hardening** — reload/stale, row-switch discard confirm
2. Later: **G-9g3g-operational-general-edit-preflight**

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
