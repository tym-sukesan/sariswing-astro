Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a1a-venue-only-operational-expansion-preflight`

**Git:** latest pushed commit `9a38c11` (G-9g4a text fields operational expansion planning)

### G-9g4a1 summary

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-venue-only-operational-expansion-implementation.md` |
| Status | **complete** — venue-only implementation (uncommitted) |
| Approval ID | `G-9g4a1-schedule-site-slug-venue-only-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` (default off) |
| Preview btn | `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn` |
| Save btn | `#site-slug-edit-g9g4a1-venue-only-save-btn` |
| Operator Save / Preview | **not executed** in implementation phase |

### Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionImplementationComplete: true
readyForG9g4a1aVenueOnlyOperationalExpansionPreflight: true
venueOnlyOperationalPathImplemented: true
operationalProvenFields: description
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a1a-venue-only-operational-expansion-preflight** — target row (Option A), beforeSnapshot, env stack, rollback SQL documented (not executed)
2. Commit G-9g4a1 implementation when ready

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
All non-dry-run arms: off (including PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED)
```

## 4. Do not

- Cursor / AI click Save or Preview
- Write non-dry-run arms to `.env` / `.env.local` without operator approval
- Reuse G-9g3g operational arm for venue Save
- Use service_role
- Touch production or `/admin`
