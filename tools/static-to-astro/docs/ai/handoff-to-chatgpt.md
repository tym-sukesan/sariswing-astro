Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9c2b-gosaki-existing-schedule-rows-manual-sql-execution-checklist (complete — uncommitted)
Latest commit: d24376e (G-9c2a replanning)
```

## Summary

G-9c2b: Operator execution checklist for **existing 60 rows UPDATE migration** (not 60 INSERT).

**Sequence:** site_slug DDL → backfill → source_route canonicalize → schedule-2026-07-010 PoC restore → verify

**Active doc:** `tools/static-to-astro/docs/gosaki-existing-schedule-rows-manual-sql-execution-checklist.md`

**Deprecated:** `gosaki-schedule-seed-operator-manual-sql-execution-checklist.md` (INSERT path — banner added)

## G-9c2b approval text

```txt
承認します。static-to-astro-cms-staging に対して、G-9c2b の既存60行 migration SQL をこの順番で1回だけ手動実行します。
```

## Gates

```txt
gosakiExistingRowsManualSqlExecutionChecklistComplete: true
gosakiDeprecatedInsertChecklistBannerAdded: true
readyForG9c2cExistingRowsOperatorManualSqlExecution: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- No SQL execution from Cursor/CI
- PoC row: restore in place — no legacy_id rename
- Step 1 snapshot mandatory for rollback C

## Next

G-9c2c — operator manual SQL execution (staging only)
