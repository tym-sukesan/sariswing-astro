Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3f3c-row-picker-general-edit-binding-hardening` — **complete**

**Next:** `G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test`

**Git:** latest pushed commit `8d277d8` (G-9g3f3b); G-9g3f3c hardening **uncommitted**

### G-9g3f3c summary

| Check | Status |
| --- | --- |
| Dirty candidate row-switch confirm | **implemented** |
| Preview stale invalidation | **implemented** |
| Selected row identity strip | **implemented** |
| G-9 / G-6 preview distinction | **maintained** |
| PoC audit row excluded | **maintained** |
| Save / DB write | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningComplete: true
readyForG9g3f3dRowPickerGeneralEditBindingHardeningSmokeTest: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test** — operator manual smoke
2. Later: **G-9g3g-operational-general-edit-planning**

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
