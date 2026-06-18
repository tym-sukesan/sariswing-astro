Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g4-operational-non-dry-run-execution` — **operator pending**

**After execution:** `G-9g3g5-post-execution-hardening-and-restore-decision`

**Git:** latest pushed commit `43c7aa7` (G-9g3g3); G-9g3g4 execution result **uncommitted**

### G-9g3g4 summary

| Item | Value |
| --- | --- |
| Execution doc | `staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md` |
| Target row | `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano` |
| Planned change | `description` append G-9g3g4 marker only |
| Approval ID | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true` |
| Save / DB write | **not yet executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunPreflightComplete: true
readyForG9g3g4OperationalNonDryRunExecution: true
stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunExecutionComplete: false
readyForAnyDbWrite: false
```

## 2. Operator steps (G-9g3g4)

1. Stop routine dev; arm non-dry-run env stack (see execution result doc §3)
2. Open `/#schedule`; select target row
3. Set Description candidate to planned after text
4. Preview once (`#site-slug-edit-dry-run-preview-btn`) — verify gates
5. Save once (`#site-slug-edit-g9g3g-operational-save-btn`) — operator manual only
6. Fill execution result doc §7; restart routine dev

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D/G9G3G arms: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Cursor/AI/Playwright click Save or Preview
- Re-click G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
- Use `service_role` key
- Execute rollback SQL until G-9g3g5 or operator restore phase
