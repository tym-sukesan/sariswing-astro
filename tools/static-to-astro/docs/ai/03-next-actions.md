Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9c2a-gosaki-existing-schedule-rows-migration-replanning` (complete — planning only, uncommitted)

**Docs:**
- `tools/static-to-astro/docs/gosaki-existing-schedule-rows-migration-replanning.md`
- `tools/static-to-astro/docs/gosaki-schedule-seed-operator-manual-sql-execution-checklist.md` (deprecated — 60 INSERT path)

**G-9c2b next:** operator manual SQL checklist for existing-rows UPDATE migration (explicit approval required)

### Discovered DB state (operator G-9c2 Step 1)

```txt
schedule-2026-* rows: 60 (legacy_id duplicates: 0)
site_slug column: absent
source_route: /schedule-2026-XX/ (legacy format)
schedule-2026-07-010: G-6 PoC altered — same id as Gosaki row
```

### Gates

```txt
gosakiExistingScheduleRowsMigrationReplanningComplete: true
gosakiScheduleInsertPlanDeprecated: true
gosakiExisting60RowsAdoptionRecommended: true
gosakiSiteSlugBackfillPlanReady: true
gosakiSourceRouteCanonicalUpdatePlanReady: true
gosakiPocRowRestorePlanReady: true
readyForG9c2bExistingRowsManualSqlExecutionChecklist: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9c2b:** Operator manual SQL execution checklist (UPDATE path — site_slug + source_route + PoC restore)
2. **G-9c2c:** Operator manual SQL execution on staging (after G-9c2b checklist + approval)
3. **G-9d:** Astro Supabase read + static fallback for schedule pages

## 3. Do not

- Execute SQL from Cursor/CI
- Follow deprecated G-9c2 60 INSERT checklist
- PoC legacy_id rename (superseded by Option A)
- Touch production / FTP / `/admin`

## 4. Baseline

- Latest commit: `b969418` (G-9c2 checklist — INSERT path, now deprecated)
- Recommended approach: Option A — adopt existing 60 rows via UPDATE
- PoC row: restore fields, keep `legacy_id = schedule-2026-07-010`
