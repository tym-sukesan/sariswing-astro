Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9c0c-gosaki-route-aware-schedule-seed-sql-regeneration (complete)
G-9c SQL templates: regenerated — ready for commit (uncommitted)
Latest commit: 36e8c54 (G-9c0b legacy stubs)
G-9c0c: uncommitted
```

## Summary

G-9c0c: Regenerated Gosaki schedule seed SQL templates with canonical routes.

- **source_route:** `/schedule/YYYY-MM/` (60 rows)
- **Legacy `/YYYY-MM/`:** not used in seed data (site stubs only)
- **INSERT:** 60 plain INSERTs, begin/commit, no ON CONFLICT
- **Collision:** `schedule-2026-07-010` — COLLISION WARNING in template; resolve at execution

**Artifacts:**
```txt
scripts/supabase/gosaki-site-slug-migration.template.sql
scripts/supabase/gosaki-schedules-seed.template.sql
scripts/supabase/gosaki-schedules-seed-preflight.template.sql
scripts/lib/gosaki-schedules-seed-sql.mjs
scripts/generate-gosaki-schedules-seed-sql.mjs
npm run generate:gosaki-schedule-seed-sql
```

## CMS MVP priority

```txt
1. G-9c commit (operator approval)
2. G-9c-execution — operator manual SQL on staging
3. G-9d — Supabase read + static fallback
```

## Gates

```txt
gosakiRouteAwareSeedSqlRegenerationComplete: true
gosakiScheduleSeedSqlTemplateUsesCanonicalSourceRoute: true
gosakiScheduleSeedSqlTemplateInsertCount: 60
readyForG9cRouteAwareSeedSqlCommit: true
readyForG9c1OperatorManualSqlExecutionPreflight: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- Staging only: `static-to-astro-cms-staging`
- No SQL execution / service_role / FTP / workflow_dispatch / `/admin`
- G-6 PoC row: `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010`

## source_route

```txt
source_file:  2026-07.html
source_route: /schedule/2026-07/
```

## Collision resolution (execution phase only)

Rename PoC `legacy_id` to `schedule-2026-07-010-poc` before INSERT (operator approval).
