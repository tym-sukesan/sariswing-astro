Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3g4-operational-non-dry-run-execution` — **success / execution complete**

**Next:** `G-9g3g5-post-execution-hardening-and-restore-decision`

**Git:** latest pushed commit `586a1de` (G-9g3g4 runbook); execution result **uncommitted**

### G-9g3g4 execution summary

| Item | Value |
| --- | --- |
| Result | **PASS** — operator manual Save once |
| Target row | `888c58f2-…` / `schedule-2026-03-001` / `gosaki-piano` |
| changedFields | `description` only |
| actualWrite | `true` / rowsAffected `1` |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| expectedBeforeUpdatedAt | `2026-06-16T16:03:41.551792+00:00` |
| after updated_at | `2026-06-18T16:35:45.060011+00:00` |
| serviceRoleUsed | `false` |
| rollback | **not executed** |

### Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunExecutionComplete: true
readyForG9g3g5PostExecutionHardening: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g3g5-post-execution-hardening-and-restore-decision** — rollback decision / restore test / routine dev hardening
2. Commit execution result doc when ready

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D/G9G3G arms: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g3g operational Save
- Re-click G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
- Use `service_role` key
- Execute rollback SQL until G-9g3g5 operator decision
