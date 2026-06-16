Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9b-gosaki-schedule-data-seed-planning` (complete — planning + dry-run extractor)

**Doc:** `tools/static-to-astro/docs/gosaki-schedule-data-seed-planning.md`

### Gates

```txt
gosakiScheduleDataSeedPlanningComplete: true
gosakiScheduleSeedExtractorDryRunComplete: true
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForGosakiClientPreview: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9c:** `gosaki-schedule-seed-sql-planning` — generate INSERT SQL from extractor JSON; operator manual staging seed
2. **G-9d:** Astro Supabase read + static fallback for `/schedule/` hub and `/YYYY-MM/` pages
3. **Parallel (after G-9c or G-9f):** YouTube `site_embeds` schema migration planning
4. **Do not:** DB write without operator approval, FTP, `/admin` changes, workflow_dispatch

## 3. Gosaki staging preview (baseline)

- Latest commit: `77b57b8` (G-9b extractor changes uncommitted)
- Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- Deploy: manual upload package only
- CMS MVP priority: Schedule → Top YouTube embed → Bands/Projects (defer)
- Schedule seed: 60 events extracted (dry-run); `npm run verify:gosaki-schedule-seed` — 36 passed
