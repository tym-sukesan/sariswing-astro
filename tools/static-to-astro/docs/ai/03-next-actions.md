Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g3-operational-non-dry-run-preflight` — **complete / execution pending**

**Next:** `G-9g3g4-operational-non-dry-run-execution`

**Git:** latest pushed commit `2fb6d08` (G-9g3g2); G-9g3g3 preflight **uncommitted**

### G-9g3g3 summary

| Item | Value |
| --- | --- |
| Preflight doc | `staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md` |
| Target row | `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano` |
| Planned change | `description` append G-9g3g4 marker only |
| Approval ID | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` |
| Lock baseline | `2026-06-16T16:03:41.551792+00:00` (reconfirm live before G-9g3g4) |
| Save / DB write / rollback SQL | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunPreflightComplete: true
readyForG9g3g4OperationalNonDryRunExecution: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g4-operational-non-dry-run-execution** — operator Preview once → operational Save once (description only)
2. **G-9g3g5-operational-post-execution-hardening** — rollback decision / restore test

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
- Run operational Save until G-9g3g4 operator approval + armed env stack
- Execute rollback SQL until operator approves (G-9g3g5 or restore phase)
