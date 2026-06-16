Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9b-gosaki-schedule-data-seed-planning (complete — planning + dry-run extractor)
Latest commit: 77b57b8 (G-9b changes uncommitted)
Prior: G-9a gosaki CMS scope planning; G-8g gosaki staging preview fixes
```

## Summary

G-9b: Gosaki Wix repeater schedule seed planning + dry-run extractor. `gosaki-wix-schedule-extractor.mjs` parses `fixtures/gosaki-piano/2026-XX.html` → 60 events, `site_slug = gosaki-piano`. `site_slug` migration + seed SQL are **templates only** — not executed.

**Doc:** `tools/static-to-astro/docs/gosaki-schedule-data-seed-planning.md`

## Extractor (G-9b)

```txt
Module: scripts/lib/gosaki-wix-schedule-extractor.mjs
CLI: npm run extract:gosaki-schedule-seed (dry-run default)
Verify: npm run verify:gosaki-schedule-seed (36 passed)
Events: 60 across 5 months (matches manual fixture counts)
Routes: /2026-03/ … /2026-07/ (not /schedule/2026-XX/)
legacy_id: schedule-YYYY-MM-NNN
```

## CMS MVP priority

```txt
1. Schedule CMS — seed SQL next (G-9c)
2. Top YouTube embed — site_embeds (G-9f+)
3. Bands/Projects — static JSON (defer)
```

## Gates

```txt
gosakiScheduleDataSeedPlanningComplete: true
gosakiScheduleSeedExtractorDryRunComplete: true
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForGosakiClientPreview: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Recommended next phase

```txt
G-9c-gosaki-schedule-seed-sql-planning
```

## Safety (always)

```txt
No production touch
No Supabase production project
No service_role in Kit staging write
No FTP / workflow_dispatch
No /admin changes
PUBLIC_ADMIN_WRITE_DRY_RUN=true default for routine dev
```
