Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a-schedule-text-fields-operational-expansion-planning
Latest commit (pushed): 507f4b1 (G-9g3h3 CMS Kit generalization notes)
G-9g4 field expansion planning: complete (uncommitted)
```

## Summary

G-9g4 **planned** Schedule editor field expansion and UX:

- **Operational proven:** `description` on content rows (G-9g3g4)
- **PoC frozen:** title, venue, time, price on pilot row (G-9g2–G-9g3c)
- **Expansion order:** G-9g4a text → G-9g4b date/route → G-9g4c visibility → G-9g4d images → G-9g4e client UX
- **First slice:** G-9g4a1 `venue` only (recommended)
- **Safety:** every slice needs Preview, changed-fields-only, optimistic lock, re-click prevention, result doc, verifier

- `markerRemainsInStagingDb: false`
- `activeRestoreExceptionsCount: 0`

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleEditorUsabilityAndFieldExpansionPlanningComplete: true
readyForG9g4aScheduleTextFieldsOperationalExpansionPlanning: true
readyForAnyDbWrite: false
```

## Next

**G-9g4a** schedule text fields operational expansion planning — venue, time, price, title slices on selectable content rows
