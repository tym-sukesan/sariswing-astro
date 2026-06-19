Last updated: 2026-06-19
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g4-schedule-editor-usability-and-field-expansion-planning`

**Git:** latest pushed commit `7a4dc0d` (G-9g3h2b row-picker exception lifecycle cleanup)

### G-9g3h3 summary

| Item | Value |
| --- | --- |
| Doc | `cms-kit-schedule-editor-generalization-notes.md` |
| Status | **complete** — CMS Kit generalization (uncommitted) |
| Scope | Gosaki Schedule CMS safety → reusable Kit architecture |
| Pipeline | URL → crawl → Astro → seed → staging shell → Preview → Save → verifier |
| Kit defaults | site_slug, dry-run default, approval ID, registry, result docs |
| Marker | `markerRemainsInStagingDb: false` |
| Active restore exceptions | **0** |

### Gates

```txt
cmsKitScheduleEditorGeneralizationNotesComplete: true
gosakiScheduleSafetyRoundTripGeneralized: true
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForG9g4ScheduleEditorUsabilityAndFieldExpansionPlanning: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. **G-9g4-schedule-editor-usability-and-field-expansion-planning** — plan field slices beyond description-only
2. Commit G-9g3h3 generalization notes when ready

## 3. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
All non-dry-run arms: off
```

## 4. Do not

- Cursor / AI click Save or Preview
- Automate DB write / FTP / deploy
- Use service_role
- Touch production or `/admin`
