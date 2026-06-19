Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a1b-venue-only-operational-expansion-execution-runbook
Latest commit (pushed): 49986c1 (G-9g4a1 venue-only implementation)
G-9g4a1a venue-only operational expansion preflight: complete (uncommitted)
```

## Summary

G-9g4a1a **preflight** for venue-only smoke execution:

- **Target row:** Option A — operator picks new safe content row (gosaki-piano, no `[CMS Kit staging]`, not pilot/PoC); fallback `888c58f2-…` discouraged
- **beforeSnapshot:** id, legacy_id, site_slug, venue, updated_at required; full template in preflight doc
- **Smoke:** `<venue> [G-9g4a1 venue smoke]` — not `[CMS Kit staging]` alone; published row may show venue briefly
- **Env:** G-9g4a1 arm only on during execution window; G-9g3g / G-9g3g5 off; no `.env` write in preflight
- **Rollback SQL:** document-only placeholder — UI restore preferred (G-9g4a1c–e)
- **Approval ID:** `G-9g4a1-schedule-site-slug-venue-only-non-dry-run`

- `targetRowSelected: false` until operator execution
- `markerRemainsInStagingDb: false`
- **No Save / Preview / DB write / SQL in preflight phase**

**Cursor / AI must not click Save or Preview.**

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionPreflightComplete: true
readyForG9g4a1bVenueOnlyOperationalExpansionExecutionRunbook: true
readyForAnyDbWrite: false
```

## Next

**G-9g4a1b** execution runbook — operator row selection, G-9g4a1 Preview, checklist, one manual Save (optional smoke), result doc
