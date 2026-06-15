# G-7d1 — gosaki live route static-public compatibility fix

Phase: `G-7d1-gosaki-live-route-static-public-compatibility-fix`  
Date: 2026-06-15  
Prior phase: `G-7d-gosaki-live-crawl-pilot` (commit `60386c2`)

## Summary

Fixed static-public verifier and staging SEO checks so G-7d live crawl output (`2026-XX/index.html` routes) passes `prepare-public`, while preserving G-7c manual fixture compatibility (`schedule-2026-XX/index.html`).

## G-7d failure root cause

G-7d live crawl succeeded (10 pages, convert/build PASS) but `prepare-public` failed with `safeForStaticFtp: false`.

Three independent verifier issues:

| Issue | Location | Symptom |
| --- | --- | --- |
| Route shape mismatch | `static-public-artifact-verifier.mjs` | Expected hardcoded `schedule-2026-03/index.html` … `schedule-2026-07/index.html`; live crawl dist has `2026-03/index.html` … `2026-07/index.html` |
| `_astro` path requirement | `deploy-base.mjs` `verifyAssetPathsIncludeBase` | Wix-heavy convert produced no `_astro` bundle (inline Wix CSS only); check required `/{deployBase}_astro/` in index.html |
| Staging canonical leak (false positive) | `deploy-base.mjs` `verifyPublicDistSeoFlags` | Full HTML body scan flagged `www.gosaki-piano.com` from Wix nav/content even though `<head>` canonical/og:url pointed to staging |

## Fixes applied

### 1. Dynamic monthly schedule route detection

**File:** `scripts/lib/static-public-artifact-verifier.mjs`

- Core pages always required: `index.html`, `discography/index.html`
- Month routes discovered from public dir: `YYYY-MM/` or `schedule-YYYY-MM/`
- For each month, either variant satisfies the check
- Helpers: `discoverMonthlyScheduleMonths`, `resolveMonthlySchedulePath`, `isMonthlyScheduleRoute`

Accepted route shapes:

```txt
schedule-2026-07/index.html   (manual fixture / G-7c)
2026-07/index.html            (live crawl / Wix)
```

### 2. Optional `_astro` for static-only Wix builds

**File:** `scripts/lib/deploy-base.mjs`

- `publicDirReferencesAstroAssets()` scans dist for `_astro/` dir or references
- Staging subdir check: nav link with deploy base required; `_astro` prefix required only when assets exist

### 3. Head-only staging SEO canonical check

**File:** `scripts/lib/deploy-base.mjs`

- `extractHeadHtml`, `extractSeoMetaUrlsFromHtml`, `stagingCanonicalLeakInSeoMeta`
- Production domain leak detection limited to `<link rel="canonical">` and `og:url` in `<head>`
- Wix body links to external domains no longer fail staging SEO verification

### 4. Pipeline gate updates

**File:** `scripts/lib/url-to-staging-pipeline.mjs`, `url-to-staging-pipeline-plan.mjs`

- Added `G7D1_PILOT_PHASE`
- `convertOk` accepts prior convert when `dist/` exists and `runConvert` gate is off
- Manifest gates: `gosakiLiveRouteStaticPublicCompatibilityFixComplete`, updated `readyForG7eGosakiStagingPreviewPreparation`

### 5. Regression tests

**File:** `scripts/verify-url-to-staging-pipeline.mjs`

- Route shape unit tests (live + manual temp dirs)
- Wix body SEO false-positive test
- No-`_astro` deploy-base test

## prepare-public re-run (no re-crawl)

Used existing G-7d local artifacts:

- `fixtures/gosaki-piano/` (fixture, gitignored)
- `output/gosaki-piano-astro/dist/` (build output, gitignored)

Commands:

```bash
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md

npm run url:staging -- \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --no-dry-run --prepare-public \
  --pilot-phase G-7d1-gosaki-live-route-static-public-compatibility-fix
```

### Result

| Check | Result |
| --- | --- |
| prepare-public | **PASS** |
| safeForStaticFtp | **true** |
| public HTML (live routes) | `2026-03` … `2026-07` OK |
| deployBaseCheckOk | true |
| seoFlagsOk | true (staging-url, noindex, robots Disallow) |
| static-public copy files | 13 |

## Regression checks

| Command | Result |
| --- | --- |
| `npm run verify:url-staging` | 37 passed, 0 failed |
| `npm run verify:crawl` | 30 passed, 0 failed |
| `npm run build` (repo root) | PASS |
| Manual fixture route shape (temp dir) | PASS via verify script |
| G-7c dry-run pilot config | PASS (existing verify:url-staging coverage) |

## Safety confirmation

| Action | Status |
| --- | --- |
| gosaki-piano.com re-crawl | **NOT executed** |
| External site crawl | **NOT executed** |
| FTP deploy | **NOT executed** |
| GitHub workflow_dispatch | **NOT executed** |
| DB write / Supabase SQL | **NOT executed** |
| Production touch | **NOT executed** |
| Secrets added | **NOT executed** |
| output / generated fixture commit | **NOT committed** |

## Gate state

```txt
gosakiLiveRouteStaticPublicCompatibilityFixComplete: true
readyForG7eGosakiStagingPreviewPreparation: true
```

(G-7d convert/build already PASS; G-7d1 prepare-public re-run PASS with existing dist.)

## Proceed to G-7e?

**Yes.** Static-public verifier accepts live crawl route shape; `safeForStaticFtp: true` on G-7d output.

G-7e scope: staging preview preparation (FTP dry-run, browser QA, canonical duplicate-path cleanup if needed).

## Remaining issues (not G-7d1 scope)

- Canonical URL duplicate path in live crawl build: `.../gosaki-piano/cms-kit-staging/gosaki-piano/` (staging-url mode passes verifier; URL normalization deferred)
- Nav Home link: `/cms-kit-staging/gosaki-piano/https://www.gosaki-piano.com` (convert/link rewrite — separate phase)
- `schedule-YYYY-MM` URL normalization to production shape: deferred; live crawl `YYYY-MM/` accepted as canonical for G-7 stage
