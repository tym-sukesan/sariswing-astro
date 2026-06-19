Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4a-schedule-text-fields-operational-expansion-planning`

**Git:** latest pushed commit `507f4b1` (G-9g3h3 CMS Kit generalization notes)

### G-9g4 summary

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-editor-usability-and-field-expansion-planning.md` |
| Status | **complete** — field expansion planning (uncommitted) |
| Operational proven field | `description` only |
| PoC frozen fields | title, venue, time, price (pilot row) |
| Expansion order | G-9g4a text → G-9g4b date/route → G-9g4c visibility → G-9g4d images → G-9g4e UX |
| First slice (planned) | G-9g4a1 `venue` only |

### Gates

```txt
stagingShellScheduleEditorUsabilityAndFieldExpansionPlanningComplete: true
readyForG9g4aScheduleTextFieldsOperationalExpansionPlanning: true
operationalProvenField: description
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4a-schedule-text-fields-operational-expansion-planning** — plan operational text field slices on content rows
2. Commit G-9g4 planning doc when ready

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
All non-dry-run arms: off
```

## 4. Do not

- Cursor / AI click Save or Preview
- Re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save
- Implement field expansion without G-9g4a planning
- Use service_role
- Touch production or `/admin`
