Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9c0c-gosaki-route-aware-schedule-seed-sql-regeneration` (complete)

**Docs:**
- `tools/static-to-astro/docs/gosaki-schedule-seed-sql-planning.md`
- `tools/static-to-astro/docs/gosaki-schedule-legacy-month-route-stub.md`

**G-9c SQL templates:** regenerated with canonical `source_route` — **ready for commit** (operator review)

### Gates

```txt
gosakiRouteAwareSeedSqlRegenerationComplete: true
gosakiScheduleSeedSqlTemplateUsesCanonicalSourceRoute: true
gosakiScheduleSeedSqlTemplateInsertCount: 60
gosakiScheduleSeedSqlTemplatePlainInsertOnly: true
gosakiScheduleSeedSqlTemplateNoOnConflict: true
gosakiSeedLegacyIdCollisionWarningPresent: true
gosakiSiteSlugMigrationTemplateReady: true
readyForG9cRouteAwareSeedSqlCommit: true
readyForG9c1OperatorManualSqlExecutionPreflight: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9c commit:** Commit route-aware SQL templates (operator approval)
2. **G-9c-execution:** Operator preflight → resolve `schedule-2026-07-010` collision → manual INSERT
3. **G-9d:** Astro Supabase read + static fallback for schedule pages
4. **Operator re-upload:** `manual-upload:package` if needed after CMS wiring

## 3. Do not

- Execute SQL from Cursor/CI
- DB write, FTP auto-apply, `/admin` changes
- Touch production gosaki-piano.com or Supabase production

## 4. Gosaki staging preview (baseline)

- Latest commit: `36e8c54` (G-9c0b legacy stubs; G-9c0c uncommitted)
- Canonical routes: `/schedule/2026-03/` … `/schedule/2026-07/`
- Legacy stubs: `/2026-03/` … `/2026-07/` (noindex + canonical)
- Seed `source_route`: `/schedule/YYYY-MM/` (not legacy `/YYYY-MM/`)
