# G-20t2 — Gosaki schedule month discovery generalization

Phase: `G-20t2-schedule-month-discovery-generalization`  
Base: `e30e334`  
Status: **complete**

## Problem

Gosaki August 2026 (`2026-08`) was present in staging Supabase with `published=true`, but did not appear in public output until `GOSAKI_SCHEDULE_SITE_CONFIG.expectedMonths` was manually extended (G-20r4a).

Root cause: `loadGosakiScheduleDataForBuild()` passed `expectedMonths` as a **Supabase row filter** (`months` param). Rows outside the hardcoded list were dropped before hub/month page generation.

## Solution (CMS Kit generalization)

| Before (G-20r4a) | After (G-20t2) |
| --- | --- |
| `expectedMonths: ["2026-03", …]` required manual update per new month | Months auto-discovered from published canonical schedule rows |
| `months` filter on Supabase read | `months: null` — no month filter on read |
| Hub/month list = filter ∩ DB | Hub/month list = `resolveScheduleMonthsForBuild(schedules, optionalMonthOverride)` |

### New module

`scripts/lib/schedule-month-discovery.mjs`

- `resolveScheduleMonthsForBuild(schedules, optionalMonthOverride)` — primary discovery via `deriveScheduleMonthsFromSchedules()`
- `optionalMonthOverride` — optional YYYY-MM keys to include **empty** months (0 events) on hub without DB rows

### Config change

`GOSAKI_SCHEDULE_SITE_CONFIG`:

```js
optionalMonthOverride: null, // default — auto-discovery only
```

G-20r4a `expectedMonths` array **removed**.

## Route / sitemap policy (unchanged)

| Route | Generated | In sitemap |
| --- | --- | --- |
| `/schedule/YYYY-MM/` | yes (canonical) | **yes** |
| `/YYYY-MM/` legacy stub | yes (redirect/noindex) | **no** (G-20t1) |
| `/admin/` etc. | may exist in package | **no** (G-20t1) |

Legacy stubs remain data-driven from `gosakiScheduleBundle.months` in `astro-generator.mjs`.

## Verification

### Unit (no DB)

Mock `2026-09` published row → `resolveScheduleMonthsForBuild()` includes `2026-09` without config change.

### Local package regen

`node scripts/build-gosaki-staging-admin-package.mjs` with staging Supabase env:

- `gosaki-schedule-months.json` includes `2026-08`
- `public-dist/schedule/2026-08/index.html` exists
- `public-dist/2026-08/index.html` legacy stub exists
- `sitemap-0.xml` includes `/schedule/2026-08/` · excludes legacy `/2026-08/` root · excludes `/admin/`

## Gates

```txt
gosakiScheduleMonthDiscoveryGeneralizationComplete: true
readyForNextScheduleMonthWithoutConfigChange: true
packageRegenExecuted: true (local only)
ftpUploadExecuted: false
dbWriteExecuted: false
```

## Supersedes

- G-20r4a `expectedMonths` manual gate (historical — doc retained)
- Future new months (e.g. `2026-09`) require **DB publish only** — no `expectedMonths` config edit

## Verifier policy (G-20t2 follow-up)

Historical phase verifiers (G-20r4a plan, G-20t1 sitemap) no longer **fail** on exact HEAD SHA pins.
Phase-base commit is logged as `NOTE` (non-blocking). Functional checks remain the active gate.

| Verifier | Active gate |
| --- | --- |
| `verify-gosaki-schedule-month-discovery-generalization.mjs` | auto-discovery · package 2026-08 · sitemap policy |
| `verify-gosaki-sitemap-admin-exclusion-hardening.mjs` | exclusion rules · package sitemap |
| `verify-gosaki-schedule-seed-extractor.mjs` | fixture parity · G-20t2 discovery unit |
| G-20r4a / G-20r4 plan verifiers | **historical doc snapshot** + G-20t2 supersession code checks |

## Files changed

| File | Change |
| --- | --- |
| `scripts/lib/schedule-month-discovery.mjs` | **new** — discovery + optional override |
| `scripts/lib/supabase-schedule-read.mjs` | remove `expectedMonths` filter; use discovery |
| `scripts/verify-gosaki-schedule-month-discovery-generalization.mjs` | **new** verifier |
| `scripts/verify-gosaki-schedule-seed-extractor.mjs` | G-20t2 discovery asserts |
| `scripts/verify-gosaki-schedule-august-generation-path-enablement.mjs` | supersession asserts |
| `scripts/verify-gosaki-schedule-public-reflection-plan.mjs` | supersession asserts |
