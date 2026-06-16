# Gosaki schedule canonical route implementation (G-9c0a)

**Phase:** `G-9c0a-gosaki-schedule-canonical-route-implementation`  
**Date:** 2026-06-16  
**Status:** implementation complete (no DB write / no FTP / no workflow_dispatch)

---

## 1. Background

G-9c0 planning fixed the canonical policy:

```txt
canonical: /schedule/YYYY-MM/
legacy:    /YYYY-MM/ (compatibility only, transition phase)
```

G-9c seed SQL is still uncommitted and route-aware regeneration is deferred to G-9c0c.

---

## 2. Before / After route

```txt
Before:
/schedule/
/2026-07/

After (canonical):
/schedule/
/schedule/2026-07/
```

---

## 3. Implementation scope

This phase implemented canonical route behavior in converter / generator / verifier paths, and deferred legacy route stubs.

### 3.1 Hub month links

- `generateScheduleIndexPage()` now outputs month links from canonical month route data.
- Verified output hub links:
  - `/cms-kit-staging/gosaki-piano/schedule/2026-03/`
  - …
  - `/cms-kit-staging/gosaki-piano/schedule/2026-07/`

### 3.2 Month page generation path

- Live crawl `2026-07.html` now maps to:
  - `src/pages/schedule/2026-07/index.astro`
- Verified built output under:
  - `dist/schedule/2026-03/index.html`
  - `dist/schedule/2026-04/index.html`
  - `dist/schedule/2026-05/index.html`
  - `dist/schedule/2026-06/index.html`
  - `dist/schedule/2026-07/index.html`

### 3.3 Canonical / og:url / sitemap

- Month pages now emit:
  - canonical: `.../schedule/YYYY-MM/`
  - og:url: `.../schedule/YYYY-MM/`
- `sitemap-0.xml` now contains canonical month URLs under `/schedule/YYYY-MM/`.
- `/YYYY-MM/` is no longer canonical in generated month pages.

### 3.4 source_route handling

- Extractor canonicalized `source_route` to `/schedule/YYYY-MM/`.
- `source_file` remains `2026-07.html` (Wix provenance preserved).
- G-9b/G-9c verifier expectations updated accordingly.
- Seed SQL template regeneration is intentionally deferred to G-9c0c.

### 3.5 Legacy route split

- Legacy `/YYYY-MM/` stub/mirror/redirect was **not implemented** in this phase.
- Deferred phase: `G-9c0b-gosaki-schedule-legacy-month-route-stub`.

---

## 4. Changed files

- `tools/static-to-astro/scripts/lib/schedule-pages.mjs`
- `tools/static-to-astro/scripts/lib/astro-generator.mjs`
- `tools/static-to-astro/scripts/lib/path-transform.mjs`
- `tools/static-to-astro/scripts/lib/header-transform.mjs`
- `tools/static-to-astro/scripts/lib/static-public-artifact-verifier.mjs`
- `tools/static-to-astro/scripts/lib/gosaki-wix-schedule-extractor.mjs`
- `tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs`
- `tools/static-to-astro/scripts/verify-gosaki-schedule-seed-extractor.mjs`

---

## 5. Verification

Executed:

```bash
node tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs
node tools/static-to-astro/scripts/verify-crawl-static-site.mjs
node tools/static-to-astro/scripts/verify-gosaki-schedule-seed-extractor.mjs
node tools/static-to-astro/scripts/verify-gosaki-font-safety.mjs
```

Results:

- `verify-url-to-staging-pipeline`: **155 passed, 0 failed**
- `verify-crawl-static-site`: **30 passed, 0 failed**
- `verify-gosaki-schedule-seed-extractor`: **44 passed, 0 failed**
- `verify-gosaki-font-safety`: **36 passed, 0 failed**

Local generation check (live fixture):

- Convert/build output: `tools/static-to-astro/output/gosaki-piano-live-g9c0a/dist/`
- Verified:
  - `/schedule/index.html`
  - `/schedule/2026-03/index.html`
  - `/schedule/2026-04/index.html`
  - `/schedule/2026-05/index.html`
  - `/schedule/2026-06/index.html`
  - `/schedule/2026-07/index.html`

---

## 6. Gates

```txt
gosakiScheduleCanonicalRouteImplementationComplete: true
gosakiScheduleCanonicalMonthRoute: /schedule/YYYY-MM/
gosakiScheduleHubLinksUseCanonicalRoute: true
gosakiScheduleMonthPagesGeneratedUnderSchedule: true
gosakiLegacyMonthRouteStubDeferredToG9c0b: true
readyForG9c0bGosakiScheduleLegacyMonthRouteStub: true
readyForG9c0cRouteAwareSeedSqlRegeneration: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```
