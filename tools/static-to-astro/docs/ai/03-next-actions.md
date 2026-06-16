Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9c2c-gosaki-existing-schedule-rows-operator-manual-sql-execution` (complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/gosaki-existing-schedule-rows-manual-sql-execution-result.md` (**new**)
- `tools/static-to-astro/docs/gosaki-existing-schedule-rows-manual-sql-execution-checklist.md`

**G-9d next:** Astro Supabase read + static fallback for Gosaki schedule pages

### Staging DB state (operator verified)

```txt
site_slug=gosaki-piano: 60 rows
month counts: 13/10/12/11/14
source_route: canonical /schedule/YYYY-MM/ only
schedule-2026-07-010: PoC restored, legacy_id unchanged
show_on_home=false on all 60 (3 rows corrected)
rollback: not executed
```

### Gates

```txt
gosakiExistingRowsOperatorManualSqlExecutionComplete: true
gosakiScheduleRowsSiteSlugBackfilled: true
gosakiScheduleRowsSourceRouteCanonicalized: true
gosakiSchedulePocRowRestored: true
gosakiScheduleHomeFlagsNormalized: true
gosakiScheduleSeedRowsVerified: true
readyForG9dAstroSupabaseScheduleRead: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9d:** Wire Astro schedule pages to Supabase read (`site_slug=gosaki-piano`) + static fallback
2. **Operator re-upload:** if needed after G-9d CMS wiring

## 3. Do not

- Execute SQL from Cursor/CI
- Touch production / FTP / `/admin`
- Re-run G-9c2c migration on staging without new approval

## 4. Baseline

- Latest commit: `479347a` (G-9c2b checklist)
- G-9c2c: operator manual execution — success, rollback not needed
