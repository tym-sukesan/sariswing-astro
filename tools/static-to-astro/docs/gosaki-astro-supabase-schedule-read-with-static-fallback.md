# Gosaki Astro Supabase schedule read with static fallback (G-9d)

**Phase:** `G-9d-gosaki-astro-supabase-schedule-read-with-static-fallback`  
**Date:** 2026-06-16  
**Prior:** G-9c2c staging seed complete (`2bd5b90`)  
**Type:** read-only Supabase integration at convert time + static fallback

---

## 1. Background

G-9c2c populated `static-to-astro-cms-staging` `public.schedules` with 60 Gosaki rows:

```txt
site_slug = gosaki-piano
source_route = /schedule/YYYY-MM/
published = true
month counts = 13 / 10 / 12 / 11 / 14
```

G-9d wires Astro convert/build to **read** those rows (when env is available) and generate:

```txt
/schedule/
/schedule/2026-03/ … /schedule/2026-07/
```

Legacy stubs (`/2026-XX/`) and sitemap/canonical policy from G-9c0a/b are unchanged.

---

## 2. Supabase read policy

| Rule | Value |
| --- | --- |
| Table | `public.schedules` |
| Filter | `site_slug = 'gosaki-piano'`, `published = true` |
| `source_route` | canonical `/schedule/YYYY-MM/` only (post-fetch filter) |
| Sort | `date`, `sort_order` |
| Key | **anon only** — `PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY` |
| URL | `PUBLIC_SUPABASE_URL` or `SUPABASE_URL` |
| `service_role` | **not used** |

Module: `scripts/lib/supabase-schedule-read.mjs`

Env resolution reads `tools/static-to-astro/.env.local` when present (not committed). No new secret env names added.

---

## 3. Static fallback policy

| Condition | `scheduleDataSource` | Behavior |
| --- | --- | --- |
| Supabase read returns rows | `supabase` | Data-driven hub + month pages from DB JSON |
| Env missing / error / 0 rows | `static-fallback` | `extractAllGosakiScheduleSeeds()` from fixture HTML |
| Extractor empty | `wix-html` | Legacy Wix HTML month pages (pre-G-9d path) |

Build **does not fail** on read errors — warning logged, fallback used.

Log / HTML markers:

```txt
scheduleDataSource=supabase
scheduleDataSource=static-fallback
```

---

## 4. Implementation

### New modules

| File | Role |
| --- | --- |
| `scripts/lib/supabase-schedule-read.mjs` | Anon read, normalize, month derive, `loadGosakiScheduleDataForBuild()` |
| `scripts/lib/gosaki-schedule-data-pages.mjs` | `GosakiScheduleList.astro`, hub/month Astro pages, JSON data files |

### Integration

| File | Change |
| --- | --- |
| `scripts/lib/astro-generator.mjs` | Gosaki fixture: prefetch bundle → skip static month HTML → data-driven pages |
| `scripts/convert-static-to-astro.mjs` | Async prefetch before `generateAstroProject` |
| `scripts/lib/url-to-staging-pipeline.mjs` | Same prefetch on convert step |

### Generated artifacts (Gosaki + data path)

```txt
src/data/gosaki-schedules.json
src/data/gosaki-schedule-months.json
src/components/GosakiScheduleList.astro
src/pages/schedule/index.astro          (hub — .gosaki-schedule-hub)
src/pages/schedule/YYYY-MM/index.astro  (.gosaki-schedule-month + event cards)
src/pages/YYYY-MM/index.astro           (legacy stubs — unchanged)
```

### Markup

Uses G-8g3/G-8g4 classes: `.gosaki-schedule-hub`, `.gosaki-schedule-month`, `.gosaki-schedule-event-card`, etc.

---

## 5. Routes / SEO (unchanged)

| Route | Policy |
| --- | --- |
| `/schedule/YYYY-MM/` | Canonical — in sitemap |
| `/YYYY-MM/` | Thin stub, `noindex`, canonical → `/schedule/YYYY-MM/`, excluded from sitemap |

---

## 6. Verification

```bash
cd tools/static-to-astro
node scripts/verify-gosaki-schedule-seed-extractor.mjs   # includes static-fallback test
node scripts/verify-url-to-staging-pipeline.mjs          # G-9d module checks
node scripts/verify-crawl-static-site.mjs
node scripts/verify-gosaki-font-safety.mjs
```

Local convert without Supabase env (static-fallback):

```bash
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-g9d-test \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/ \
  --verify-build
```

With staging anon env set, convert uses `scheduleDataSource=supabase`.

---

## 7. Out of scope

- DB writes / SQL execution from Cursor/CI
- `/admin` changes
- FTP / workflow_dispatch
- Runtime client-side Supabase fetch in public pages (build-time JSON embed only)

---

## 8. Gates

```txt
gosakiAstroSupabaseScheduleReadPlanningOrImplementationComplete: true
gosakiScheduleReadUsesSiteSlug: true
gosakiScheduleReadUsesCanonicalSourceRoute: true
gosakiScheduleStaticFallbackReady: true
gosakiScheduleLegacyStubsStillGenerated: true
gosakiScheduleSitemapCanonicalOnly: true
readyForG9dVerificationAndCommit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 9. Next

- Operator re-upload after staging convert with Supabase env (optional)
- G-9d+ staging shell read binding (separate phase)
- Top YouTube embed CMS (G-9a scope item 2)
