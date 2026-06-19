Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a1b1-venue-only-operational-expansion-manual-execution`

**Git:** latest pushed commit `6564061` (G-9g4a1b execution runbook)

### G-9g4a1b1 status (manual execution — Preview step)

| Item | Value |
| --- | --- |
| Target row | `schedule-2026-03-003` / title `<Live & Session>` / venue before `学芸大学 珈琲美学` |
| Smoke candidate | `学芸大学 珈琲美学 [G-9g4a1 venue smoke]` |
| Operator Preview | **valid** — actualWrite=false, changedFields=venue, lock/host OK |
| Save | **not clicked** |
| Gate sync bug | valid Preview but Save gate stayed disabled — **fix uncommitted** |
| Root cause | Save gate refreshed before `g9g4a1VenueOnlyPreviewValid = true` |

### Gates

```txt
g9g4a1VenueOnlyPreviewValidAtOperatorPreview: true
g9g4a1VenueOnlySaveExecuted: false
readyForG9g4a1b1PreviewRetestAfterFix: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. Commit G-9g4a1 venue-only Save gate sync fix when ready
2. Operator: browser reload → same row / same venue candidate → G-9g4a1 Preview **once** → confirm Save gate `enabled` → paste to ChatGPT → Save (separate step)

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
- Re-click Save without fresh Preview after fix verification
- Execute rollback SQL or restore before smoke Save result doc
- Use service_role
- Touch production or `/admin`
