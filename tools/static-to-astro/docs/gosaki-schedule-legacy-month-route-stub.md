# Gosaki schedule legacy month route stub (G-9c0b)

**Phase:** `G-9c0b-gosaki-schedule-legacy-month-route-stub`  
**Date:** 2026-06-16  
**Status:** implementation complete (no DB write / no FTP / no workflow_dispatch)

---

## 1. Background

G-9c0a canonicalized Gosaki schedule month pages:

```txt
canonical: /schedule/YYYY-MM/
```

Wix live-crawl / production used root month URLs:

```txt
legacy: /YYYY-MM/
```

G-9c0 planning adopted Option B + limited Option C: canonical under `/schedule/`, legacy stubs during transition.

---

## 2. Route policy

| Route | Role | Sitemap | Indexable |
| --- | --- | --- | --- |
| `/schedule/` | Hub | yes | yes (production) / staging noindex |
| `/schedule/YYYY-MM/` | Canonical month page | yes | yes (production) / staging noindex |
| `/YYYY-MM/` | Legacy compatibility stub | **no** | **no** (`noindex,follow`) |

`source_route` in seed data remains `/schedule/YYYY-MM/` (not legacy).

---

## 3. Legacy stub specification

Generated for Gosaki live-crawl fixture only (`fixtures/gosaki-piano`):

```txt
/2026-03/index.html
/2026-04/index.html
/2026-05/index.html
/2026-06/index.html
/2026-07/index.html
```

Each stub includes:

- `<meta name="robots" content="noindex,follow">`
- `<link rel="canonical" href=".../schedule/YYYY-MM/">`
- `og:url` pointing to canonical month URL
- Thin body: “Schedule page moved” + link to canonical page
- Site header/footer (existing layout) — no full Wix repeater content
- **No** meta refresh / JS redirect (static-hosting friendly)

### noindex / canonical decision

**Option A adopted:** legacy stub = `noindex,follow` + `rel=canonical` to `/schedule/YYYY-MM/`.

Staging builds still apply global staging noindex on canonical pages via `BaseLayout` (`BASE_URL !== "/"`). Legacy stubs use explicit `robots` prop so production go-live also keeps legacy URLs out of the index.

---

## 4. Sitemap policy

`astro.config.mjs` sitemap integration uses a filter when legacy stubs are generated:

- **Include:** `/schedule/YYYY-MM/`
- **Exclude:** `/YYYY-MM/` (root month paths)

Verified on local build: sitemap lists `schedule/2026-03/` … `schedule/2026-07/` only.

---

## 5. source_route policy

Unchanged from G-9c0a:

```txt
source_file:  2026-07.html
source_route: /schedule/2026-07/
```

Legacy `/YYYY-MM/` is not written into seed `source_route`.

---

## 6. Implementation

### 6.1 Generator

- `generateScheduleLegacyMonthStubPage()` in `astro-generator.mjs`
- Wired after schedule hub generation when `isGosakiPianoFixture()` and live-crawl month files exist
- `BaseLayout` gains optional `robots` prop (legacy stubs pass `noindex,follow`)

### 6.2 SEO resolver

- `resolve-public-seo.ts`: on staging, preserve absolute `canonical` when provided (legacy stub points to canonical month URL instead of legacy pathname)

### 6.3 Route helpers

- `legacyWixScheduleMonthRoute()`, `isLegacyWixScheduleMonthPath()`, `shouldIncludePageInSitemap()` in `schedule-pages.mjs`

### 6.4 CSS

- G-9c0b block in `gosaki-piano-overrides.mjs` — centered stub layout

---

## 7. Changed files

- `tools/static-to-astro/scripts/lib/schedule-pages.mjs`
- `tools/static-to-astro/scripts/lib/astro-generator.mjs`
- `tools/static-to-astro/scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs`
- `tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs`
- `tools/static-to-astro/templates/admin-cms/src/lib/resolve-public-seo.ts`
- `tools/static-to-astro/docs/gosaki-schedule-legacy-month-route-stub.md`

---

## 8. Verification

```bash
cd tools/static-to-astro
node scripts/verify-url-to-staging-pipeline.mjs
node scripts/verify-crawl-static-site.mjs
node scripts/verify-gosaki-schedule-seed-extractor.mjs
node scripts/verify-gosaki-font-safety.mjs
```

Results:

- `verify-url-to-staging-pipeline`: **167 passed, 0 failed**
- `verify-crawl-static-site`: **30 passed, 0 failed**
- `verify-gosaki-schedule-seed-extractor`: **36 passed, 0 failed**
- `verify-gosaki-font-safety`: **36 passed, 0 failed**

Local convert + build (`fixtures/gosaki-piano` → `output/gosaki-piano-g9c0b-verify`):

- Canonical: `dist/schedule/2026-03/` … `dist/schedule/2026-07/`
- Legacy stubs: `dist/2026-03/` … `dist/2026-07/`
- Legacy `/2026-07/`: `noindex,follow`, canonical → `/schedule/2026-07/`, thin stub body
- Sitemap: canonical month URLs only; no `/2026-07/` entries

---

## 9. Gates

```txt
gosakiScheduleLegacyMonthRouteStubComplete: true
gosakiLegacyMonthRoutesGenerated: true
gosakiLegacyMonthRoutesNoindex: true
gosakiLegacyMonthRoutesCanonicalToSchedule: true
gosakiLegacyMonthRoutesExcludedFromSitemap: true
gosakiScheduleCanonicalMonthRouteStill: /schedule/YYYY-MM/
readyForG9c0cRouteAwareSeedSqlRegeneration: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 10. Next

- **G-9c0c:** Regenerate seed SQL templates with route-aware `source_route`
- **Operator re-upload:** `npm run manual-upload:package` after commit (manual only — no FTP auto-apply)
