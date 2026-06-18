Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g2-operational-save-ui-gate-smoke-test` — **passed**

**Next:** `G-9g3g3-operational-non-dry-run-preflight`

**Git:** latest pushed commit `025156f` (G-9g3g1); G-9g3g2 smoke result **uncommitted**

### G-9g3g2 summary

| Item | Value |
| --- | --- |
| Smoke doc | `staging-shell-schedule-site-slug-operational-general-edit-ui-gate-smoke-test-result.md` |
| Test row | `888c58f2-…` / `schedule-2026-03-001` |
| Preview | `changedFields=description` only; `actualWrite=false` |
| Operational Save | **disabled** throughout routine dev (expected) |
| Save / DB write | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditUiGateSmokeTestPassed: true
readyForG9g3g3OperationalNonDryRunPreflight: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g3-operational-non-dry-run-preflight** — beforeSnapshot, rollback SQL template, env stack doc
2. **G-9g3g4** — operational non-dry-run execution (operator Save once)
3. **G-9g3g5** — post-execution hardening

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
- Run operational non-dry-run Save until G-9g3g3 preflight + G-9g3g4 execution approval
