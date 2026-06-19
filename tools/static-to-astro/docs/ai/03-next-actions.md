Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a1b-venue-only-operational-expansion-execution-runbook`

**Git:** latest pushed commit `49986c1` (G-9g4a1 venue-only implementation)

### G-9g4a1a summary

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-venue-only-operational-expansion-preflight.md` |
| Status | **complete** — preflight runbook (uncommitted) |
| Target row | Option A — operator selects at execution (not fixed in preflight) |
| Fallback | `888c58f2-…` / `schedule-2026-03-001` / venue `銀座 N` (discouraged) |
| Smoke | `<venue> [G-9g4a1 venue smoke]` → restore original venue |
| Rollback SQL | document-only — **not executed** |
| Operator Save / Preview | **not executed** in preflight phase |

### Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionPreflightComplete: true
readyForG9g4a1bVenueOnlyOperationalExpansionExecutionRunbook: true
targetRowSelected: false
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a1b-venue-only-operational-expansion-execution-runbook** — operator row pick → G-9g4a1 Preview → armed stack → one manual Save
2. Commit G-9g4a1a preflight when ready

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED: false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: false or unset
```

## 4. Do not

- Cursor / AI click Save or Preview
- Write execution arms to `.env` / `.env.local` in preflight
- Start dev server with G-9g4a1 arm on during preflight
- Execute rollback SQL
- Use service_role
- Touch production or `/admin`
