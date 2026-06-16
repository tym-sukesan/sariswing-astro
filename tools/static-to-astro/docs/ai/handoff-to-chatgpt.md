Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9c0a-gosaki-schedule-canonical-route-implementation (complete)
G-9c: uncommitted — ON HOLD until route-aware source_route regeneration (G-9c0c)
Latest commit: d0d0a6a (G-9c/G-9c0a local changes uncommitted)
Prior: G-9b3 typography, G-9b2 font safety, G-9b extractor
```

## Summary

G-9c0a: Canonical route implementation for Gosaki schedule months.

- **Canonical implemented:** `/schedule/YYYY-MM/` (hub links + month pages + canonical/og/sitemap)
- **Legacy deferred:** `/YYYY-MM/` stubs are not implemented yet (G-9c0b)
- **Extractor updated:** `source_route` now `/schedule/YYYY-MM/` (source_file unchanged)
- **G-9c commit blocked** until seed SQL template regeneration in G-9c0c

**Docs:**
- `tools/static-to-astro/docs/gosaki-schedule-route-canonical-planning.md`
- `tools/static-to-astro/docs/gosaki-schedule-canonical-route-implementation.md`

## G-9c seed SQL (uncommitted, on hold)

```txt
scripts/supabase/gosaki-site-slug-migration.template.sql
scripts/supabase/gosaki-schedules-seed.template.sql (60 INSERT — still old route until G-9c0c regenerate)
scripts/supabase/gosaki-schedules-seed-preflight.template.sql
npm run generate:gosaki-schedule-seed-sql
```

**Collision:** `schedule-2026-07-010` vs G-6 PoC — resolve at G-9c-execution.

## CMS MVP priority

```txt
1. G-9c0b legacy month route stubs
2. G-9c0c route-aware seed SQL regeneration
3. G-9c commit (operator approval)
4. G-9c-execution — operator manual SQL on staging
5. G-9d — Supabase read + static fallback
```

## Gates

```txt
gosakiScheduleRouteCanonicalPlanningComplete: true
gosakiScheduleCanonicalRouteImplementationComplete: true
gosakiScheduleCanonicalMonthRoute: /schedule/YYYY-MM/
gosakiScheduleHubLinksUseCanonicalRoute: true
gosakiScheduleMonthPagesGeneratedUnderSchedule: true
gosakiLegacyMonthRouteStubDeferredToG9c0b: true
readyForG9cRouteAwareSeedSqlPlanning: true
readyForG9c0bGosakiScheduleLegacyMonthRouteStub: true
readyForG9c0cRouteAwareSeedSqlRegeneration: true
readyForG9cCommit: false
gosakiScheduleSeedSqlPlanningComplete: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- Staging only: `static-to-astro-cms-staging`
- No SQL execution / service_role / FTP / workflow_dispatch / `/admin`
- G-6 PoC row: `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010`

## source_route recommendation

```txt
source_file:  2026-07.html        (Wix provenance — unchanged)
source_route: /schedule/2026-07/   (canonical CMS page — implemented)
```

## Deferred

- `/` home PC horizontal scroll — gosaki responsive cleanup (G-9b3 doc)
- Wix production URL redirect plan — go-live phase
