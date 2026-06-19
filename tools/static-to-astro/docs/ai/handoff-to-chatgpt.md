Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4-schedule-editor-usability-and-field-expansion-planning
Latest commit (pushed): 7a4dc0d (G-9g3h2b row-picker exception lifecycle cleanup)
G-9g3h3 CMS Kit generalization notes: complete (uncommitted)
```

## Summary

G-9g3h3 **documented** Gosaki Schedule CMS safety as CMS Kit reusable assets:

- **Proven:** site_slug row picker, dry-run Preview, optimistic lock, host gate, approval ID, env arm, operator Save, re-click prevention, smoke/restore round-trip, audit classification, restore registry, verifiers, AI handoff
- **Pipeline model:** URL → crawl → Astro → seed → staging shell → Preview → Save → verifier → production checklist (deploy separate)
- **Kit defaults:** dry-run first, non-dry-run arms off, Preview before Save, registry lifecycle, result docs required
- **Never automate:** Cursor Save/Preview, service_role, production writes, FTP apply without approval

- `markerRemainsInStagingDb: false`
- `activeRestoreExceptionsCount: 0`

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
cmsKitScheduleEditorGeneralizationNotesComplete: true
gosakiScheduleSafetyRoundTripGeneralized: true
readyForG9g4ScheduleEditorUsabilityAndFieldExpansionPlanning: true
readyForAnyDbWrite: false
```

## Next

**G-9g4** schedule editor usability and field expansion planning — venue, date, published, image slices
