Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a1-venue-only-operational-expansion-implementation`

**Git:** latest pushed commit `aebbf98` (G-9g4 field expansion planning)

### G-9g4a summary

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-text-fields-operational-expansion-planning.md` |
| Status | **complete** — text fields operational expansion planning (uncommitted) |
| First slice | G-9g4a1 `venue` only |
| Approval ID (planned) | `G-9g4a1-schedule-site-slug-venue-only-non-dry-run` |
| Env arm (planned) | `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true` |
| Operational proven field | `description` only (G-9g3g4) |
| Target row | Option A: new content row at preflight; Option B fallback: `888c58f2-…` |

### Gates

```txt
stagingShellScheduleTextFieldsOperationalExpansionPlanningComplete: true
readyForG9g4a1VenueOnlyOperationalExpansionImplementation: true
operationalProvenFields: description
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a1-venue-only-operational-expansion-implementation** — guard, approval ID, env arm, Save routing (no operator Save in implementation phase)
2. Commit G-9g4a planning doc when ready

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
All non-dry-run arms: off
```

## 4. Do not

- Cursor / AI click Save or Preview
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save
- Reuse G-9g3g operational arm for venue Save without G-9g4a1 slice
- Use service_role
- Touch production or `/admin`
