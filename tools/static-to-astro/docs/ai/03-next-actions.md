Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9c2b-gosaki-existing-schedule-rows-manual-sql-execution-checklist` (complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/gosaki-existing-schedule-rows-manual-sql-execution-checklist.md` (**active**)
- `tools/static-to-astro/docs/gosaki-existing-schedule-rows-migration-replanning.md`
- `tools/static-to-astro/docs/gosaki-schedule-seed-operator-manual-sql-execution-checklist.md` (**deprecated** — banner added)

**G-9c2c next:** operator manual SQL execution on staging (UPDATE path, explicit approval)

### Gates

```txt
gosakiExistingRowsManualSqlExecutionChecklistComplete: true
gosakiDeprecatedInsertChecklistBannerAdded: true
gosakiExistingRowsMigrationSequenceDocumented: true
gosakiExistingRowsRollbackPlanDocumented: true
readyForG9c2cExistingRowsOperatorManualSqlExecution: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9c2c:** Operator manual SQL execution — existing 60 rows UPDATE migration
2. **G-9d:** Astro Supabase read + static fallback for schedule pages

## 3. Do not

- Execute SQL from Cursor/CI
- Follow deprecated G-9c2 60 INSERT checklist
- PoC legacy_id rename
- Touch production / FTP / `/admin`

## 4. Baseline

- Latest commit: `d24376e` (G-9c2a replanning)
- Approach: Option A — site_slug backfill + source_route fix + PoC restore
- Operator approval: G-9c2b text in new checklist
