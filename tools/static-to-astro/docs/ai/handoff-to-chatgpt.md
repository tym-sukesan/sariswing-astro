Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9c1-gosaki-schedule-seed-operator-manual-sql-execution-preflight (complete)
Latest commit: d19149c (G-9c0c seed SQL)
G-9c1 preflight: uncommitted
```

## Summary

G-9c1: Operator manual SQL execution preflight for Gosaki schedule seed.

- **Project:** `static-to-astro-cms-staging` only
- **Sequence:** before SELECT → site_slug migration → PoC rename → 60 INSERT → after verify
- **Collision:** PoC `schedule-2026-07-010` → `schedule-2026-07-010-poc` before seed
- **Cursor/AI:** does NOT execute SQL

**Doc:** `tools/static-to-astro/docs/gosaki-schedule-seed-operator-manual-sql-execution-preflight.md`

## G-9c2 approval text

```txt
承認します。static-to-astro-cms-staging に対して、G-9c1 のSQLをこの順番で1回だけ手動実行します。
```

## Gates

```txt
gosakiScheduleSeedOperatorSqlExecutionPreflightComplete: true
readyForG9c2OperatorManualSqlExecution: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- No SQL execution from Cursor/CI
- G-6 PoC: `aa440e29-5be8-402e-9190-0d81c48434c0`

## Next

G-9c2 — operator manual SQL execution (staging only)
