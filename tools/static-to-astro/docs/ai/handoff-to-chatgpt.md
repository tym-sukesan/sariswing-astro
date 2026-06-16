Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9c2a-gosaki-existing-schedule-rows-migration-replanning (complete — uncommitted)
Latest commit: b969418 (G-9c2 INSERT checklist — deprecated for execution)
```

## Summary

G-9c2 operator execution discovered existing 60 `schedule-2026-*` rows on staging. **60 INSERT aborted.**

**New approach (Option A):** adopt existing rows via UPDATE:
1. Add `site_slug` column
2. Backfill `site_slug = 'gosaki-piano'` on 60 rows
3. Canonicalize `source_route` → `/schedule/YYYY-MM/`
4. Restore `schedule-2026-07-010` PoC fields (no legacy_id rename)

**Doc:** `tools/static-to-astro/docs/gosaki-existing-schedule-rows-migration-replanning.md`

## G-9c2b approval text (planned)

```txt
承認します。static-to-astro-cms-staging に対して、G-9c2a の既存60行 migration SQLをこの順番で1回だけ手動実行します。
```

## Deprecated

- G-9c2 60 INSERT checklist / PoC rename path
- `gosaki-schedules-seed.template.sql` execution (field reference only)

## Gates

```txt
gosakiExistingScheduleRowsMigrationReplanningComplete: true
gosakiScheduleInsertPlanDeprecated: true
gosakiExisting60RowsAdoptionRecommended: true
readyForG9c2bExistingRowsManualSqlExecutionChecklist: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- No SQL execution from Cursor/CI
- PoC row id: `aa440e29-5be8-402e-9190-0d81c48434c0` — restore, do not rename

## Next

G-9c2b — operator checklist for existing-rows UPDATE migration (staging only)
