Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9c1-gosaki-schedule-seed-operator-manual-sql-execution-preflight` (complete)

**Docs:**
- `tools/static-to-astro/docs/gosaki-schedule-seed-operator-manual-sql-execution-preflight.md`
- `tools/static-to-astro/docs/gosaki-schedule-seed-sql-planning.md`

**G-9c2 next:** operator manual SQL on staging (explicit approval required)

### Gates

```txt
gosakiScheduleSeedOperatorSqlExecutionPreflightComplete: true
gosakiScheduleSeedExecutionSequenceDocumented: true
gosakiSiteSlugMigrationExecutionPlanReady: true
gosakiSeedLegacyIdCollisionResolutionPlanReady: true
gosakiScheduleSeedInsertExecutionPlanReady: true
gosakiScheduleSeedRollbackPlanReady: true
readyForG9c2OperatorManualSqlExecution: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9c2:** Operator manual SQL execution on `static-to-astro-cms-staging`
2. **G-9d:** Astro Supabase read + static fallback for schedule pages
3. **Operator re-upload:** if needed after CMS wiring

## 3. Do not

- Execute SQL from Cursor/CI
- DB write without operator explicit approval
- Touch production / FTP / `/admin`

## 4. Baseline

- Latest commit: `d19149c` (G-9c0c seed SQL)
- Seed: 60 INSERT, `source_route: /schedule/YYYY-MM/`
- Collision: PoC `schedule-2026-07-010` → rename to `schedule-2026-07-010-poc` before INSERT
