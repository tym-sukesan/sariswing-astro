# Site slug schedule read generalization (G-9e)

**Phase:** `G-9e-site-slug-schedule-read-generalization`  
**Date:** 2026-06-17  
**Prior:** G-9d3 commit `e5aa2ab`  
**Type:** read-only refactor — generic `site_slug` loader + Gosaki wrapper

---

## 1. Background

G-9d implemented Gosaki-specific Supabase schedule read + static fallback at convert/build time. G-9d3 recommended generalizing before adding more customers or staging-shell CMS UI.

G-9e extracts a **generic CMS Kit loader** while keeping Gosaki as the pilot via a thin wrapper.

---

## 2. Generic API (`supabase-schedule-read.mjs`)

| Export | Role |
| --- | --- |
| `SCHEDULE_SELECT` | Shared select columns (alias: `GOSAKI_SCHEDULE_SELECT`) |
| `DEFAULT_CANONICAL_ROUTE_PREFIX` | `/schedule/` |
| `GOSAKI_SCHEDULE_SITE_CONFIG` | Gosaki pilot constants (`siteSlug`, `expectedMonths`, prefix) |
| `isCanonicalScheduleSourceRoute(route, prefix)` | Canonical `/schedule/YYYY-MM/` filter |
| `compareScheduleRecords` / `sortScheduleRecords` | Stable sort: date → sort_order → legacy_id |
| `loadScheduleRowsFromSupabase({ env, siteSlug, months, canonicalRoutePrefix })` | Anon read + filter + sort |
| `loadScheduleDataForBuild({ siteSlug, inputDir, staticFallback, ... })` | Supabase → static-fallback → wix-html |
| `loadGosakiScheduleDataForBuild(opts)` | Gosaki wrapper (unchanged call sites) |

### `loadScheduleRowsFromSupabase`

```txt
siteSlug          — required
published=true    — always
source_route      — canonical prefix match (default /schedule/YYYY-MM/)
months            — optional filter (Gosaki: 2026-03 … 2026-07)
sort              — date, sort_order, legacy_id
service_role      — not used
```

### `loadScheduleDataForBuild`

```txt
siteSlug          — required
staticFallback    — site-specific extractor fn (required)
Supabase success  → scheduleDataSource=supabase
env missing/error → static-fallback
extractor empty   → wix-html
build never fails on read errors (warn + fallback)
```

---

## 3. Gosaki wrapper

`loadGosakiScheduleDataForBuild()` delegates to `loadScheduleDataForBuild()` with:

```js
GOSAKI_SCHEDULE_SITE_CONFIG = {
  siteSlug: "gosaki-piano",
  canonicalRoutePrefix: "/schedule/",
  expectedMonths: ["2026-03", …, "2026-07"],
}
staticFallback → extractAllGosakiScheduleSeeds()
logPrefix → "gosaki-schedule"
```

**Unchanged call sites:** `convert-static-to-astro.mjs`, `url-to-staging-pipeline.mjs`, verifiers.

`fetchGosakiSchedulesFromSupabase` retained as deprecated alias → `loadScheduleRowsFromSupabase`.

---

## 4. Fallback policy (unchanged)

| Condition | `scheduleDataSource` |
| --- | --- |
| Supabase rows > 0 | `supabase` |
| Env missing / error / 0 rows | `static-fallback` |
| Extractor empty | `wix-html` |

G-9d1 Gosaki month counts (13/10/12/11/14) preserved via same extractor path.

---

## 5. Env / secrets

- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_*`)
- `.env.local` read at runtime only — **not committed**
- **No `service_role`**

---

## 6. Changed files

| File | Change |
| --- | --- |
| `scripts/lib/supabase-schedule-read.mjs` | Generic loaders + Gosaki config + wrapper refactor |
| `scripts/verify-gosaki-schedule-seed-extractor.mjs` | G-9e assertions |
| `scripts/verify-url-to-staging-pipeline.mjs` | G-9e assertions |

**Not changed:** `gosaki-schedule-data-pages.mjs`, `astro-generator.mjs`, `/admin`

---

## 7. Verification

```bash
cd tools/static-to-astro
node scripts/verify-gosaki-schedule-seed-extractor.mjs
node scripts/verify-url-to-staging-pipeline.mjs
node scripts/verify-crawl-static-site.mjs
node scripts/verify-gosaki-font-safety.mjs
npm run verify:manual-upload
```

Env-less static-fallback: `NO_SUPABASE_ENV` tests in seed extractor (60 rows, 5 months).

Supabase read: optional when operator `.env.local` present (read-only).

---

## 8. Gates

```txt
siteSlugScheduleReadGeneralizationComplete: true
genericScheduleReadHelperReady: true
gosakiScheduleReadUsesGenericSiteSlugLoader: true
gosakiScheduleStaticFallbackStillWorks: true
gosakiScheduleSupabaseReadStillWorks: true | deferred
gosakiScheduleCanonicalRoutesStillVerified: true
gosakiScheduleLegacyStubsStillVerified: true
readyForG9eCommit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 9. Next

- Staging shell schedule read binding for `site_slug=gosaki-piano` (separate phase)
- Second customer: pass `siteSlug` + `staticFallback` without new hard-coded branches
- Optional: convert with Supabase env → `scheduleDataSource=supabase` in preview HTML
