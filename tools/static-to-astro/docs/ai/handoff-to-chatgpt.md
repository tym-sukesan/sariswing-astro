Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9c0b-gosaki-schedule-legacy-month-route-stub (complete)
G-9c: uncommitted — ON HOLD until G-9c0c route-aware seed SQL regeneration
Latest commit: acc834c (G-9c0 planning doc)
Prior commits: c385a7f G-9c0a canonical routes, d0d0a6a G-9b3 typography
G-9c0b: uncommitted
```

## Summary

G-9c0b: Legacy `/YYYY-MM/` compatibility stub pages for Gosaki.

- **Legacy stubs:** `/2026-03/` … `/2026-07/` — thin “page moved” content
- **noindex:** `noindex,follow` on legacy stubs
- **canonical:** legacy stubs point to `/schedule/YYYY-MM/`
- **sitemap:** legacy routes excluded; canonical month URLs only
- **No redirect:** no meta refresh / JS redirect
- **source_route:** unchanged `/schedule/YYYY-MM/` (G-9c0a)

**Docs:**
- `tools/static-to-astro/docs/gosaki-schedule-legacy-month-route-stub.md`
- `tools/static-to-astro/docs/gosaki-schedule-canonical-route-implementation.md`

## G-9c seed SQL (uncommitted, on hold)

```txt
scripts/supabase/gosaki-site-slug-migration.template.sql
scripts/supabase/gosaki-schedules-seed.template.sql (stale until G-9c0c regenerate)
scripts/supabase/gosaki-schedules-seed-preflight.template.sql
scripts/lib/gosaki-schedules-seed-sql.mjs
scripts/generate-gosaki-schedules-seed-sql.mjs
package.json (generate:gosaki-schedule-seed-sql script)
```

**Collision:** `schedule-2026-07-010` vs G-6 PoC — resolve at G-9c-execution.

## CMS MVP priority

```txt
1. G-9c0c route-aware seed SQL regeneration
2. G-9c commit (operator approval)
3. G-9c-execution — operator manual SQL on staging
4. G-9d — Supabase read + static fallback
5. Operator re-upload after G-9c0b commit
```

## Gates

```txt
gosakiScheduleLegacyMonthRouteStubComplete: true
gosakiLegacyMonthRoutesGenerated: true
gosakiLegacyMonthRoutesNoindex: true
gosakiLegacyMonthRoutesCanonicalToSchedule: true
gosakiLegacyMonthRoutesExcludedFromSitemap: true
gosakiScheduleCanonicalMonthRouteStill: /schedule/YYYY-MM/
readyForG9c0cRouteAwareSeedSqlRegeneration: true
readyForG9cCommit: false
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

## Deferred

- `/` home PC horizontal scroll — gosaki responsive cleanup (G-9b3 doc)
- Wix production URL redirect plan — go-live phase
