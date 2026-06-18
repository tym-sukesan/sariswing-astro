Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g1-operational-save-path-implementation` — **complete**

**Next:** `G-9g3g2-operational-save-ui-gate-smoke-test`

**Git:** latest pushed commit `b10b09a` (G-9g3g planning); G-9g3g1 implementation **uncommitted**

### G-9g3g1 summary

| Item | Value |
| --- | --- |
| Approval ID | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` |
| Save button | `#site-slug-edit-g9g3g-operational-save-btn` (disabled by default) |
| Save / DB write | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditImplementationComplete: true
readyForG9g3g2OperationalSaveUiGateSmokeTest: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g2-operational-save-ui-gate-smoke-test** — Save UI + gate smoke (Save disabled)
2. **G-9g3g3–g5** — preflight, execution, post-hardening

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D/G9G3G arms: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
- Use `service_role` key
- Implement operational Save until G-9g3g1
