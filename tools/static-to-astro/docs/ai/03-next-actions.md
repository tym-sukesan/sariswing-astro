Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a1b1-venue-only-operational-expansion-manual-execution`

**Git:** latest pushed commit `01e64af` (G-9g4a1a venue-only preflight)

### G-9g4a1b summary

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-venue-only-operational-expansion-execution-runbook.md` |
| Status | **complete** — execution runbook (uncommitted) |
| Target row | **unselected** — operator selects at G-9g4a1b1 |
| UI path | G-9g4a1 venue-only buttons only (`#site-slug-edit-g9g4a1-venue-only-*`) |
| Smoke | `<venue> [G-9g4a1 venue smoke]` |
| Restore chain | G-9g4a1c → G-9g4a1d → G-9g4a1e (after smoke Save) |
| Operator Save / Preview | **not executed** in runbook phase |

### Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionExecutionRunbookComplete: true
readyForG9g4a1b1VenueOnlyOperationalExpansionManualExecution: true
targetRowSelected: false
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a1b1-venue-only-operational-expansion-manual-execution** — operator row pick → venue smoke → G-9g4a1 Preview → paste to ChatGPT → armed stack → one manual Save
2. Commit G-9g4a1b execution runbook when ready

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
- Write execution arms to `.env` / `.env.local` in runbook phase
- Start dev server with G-9g4a1 arm on during runbook phase
- Execute rollback SQL or restore in runbook phase
- Use service_role
- Touch production or `/admin`
