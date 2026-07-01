# G-20h2 — Gosaki initial local production package build result

**Phase:** `G-20h2-gosaki-production-package-local-build`  
**Status:** **complete** — first local production package build + SEO/content verifier PASS  
**Date:** 2026-07-01  
**Base commit:** `c1ca639`  
**Prior:** [gosaki-production-config-implementation.md](./gosaki-production-config-implementation.md) (G-20h1)

| Check | Status |
| --- | --- |
| Production package build | **yes** (local) |
| SEO / URL / path verifier | **yes** |
| Content verifier (Discography cleanup) | **yes** |
| FTP / upload | **no** |
| DNS / SSL | **no** |
| DB write | **no** |

---

## Gates

```txt
gosakiProductionPackageLocalBuildComplete: true
phase: G-20h2-gosaki-production-package-local-build
readyForG20iProductionUploadPreflight: true
productionPackageBuildExecuted: true
packageRegenExecuted: true
ftpUploadExecuted: false
cursorDbWriteExecuted: false
dnsChangeExecuted: false
sslChangeExecuted: false
stagingUrlLeakOnPrimaryRoutes: false
primaryRoutesNoindexAbsent: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Build command

```bash
cd tools/static-to-astro
npm run build:gosaki-production-package
```

Pipeline: convert (`deployBase=/`, `baseUrl=https://www.gosaki-piano.com`) → `verify-static-public-artifact` → `manual-upload:package:gosaki-production` → `verify-g20h2-gosaki-production-package-build.mjs`.

---

## 2. Output path / file count

| Item | Value |
| --- | --- |
| Package dir | `tools/static-to-astro/output/manual-upload/gosaki-piano-production/` |
| public-dist files | **27** |
| Package total (incl. README, zip) | **31** |
| Astro out | `output/gosaki-piano-astro-production/` |
| static-public | `output/static-public/gosaki-piano-production/public-dist/` |
| CSS asset | `_astro/index.YcHrHZH4.css` |
| JS asset | `_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` |

**MANIFEST.json:** `deployBase: /`, `safeForStaticFtp: true`, `fileCount: 27`, `ftpAutoDeployUsed: false`.

---

## 3. SEO / URL / path verification

### Primary public routes (/, /discography/, /schedule/, /about/, /contact/)

| Check | Result |
| --- | --- |
| Staging URL leak (`yskcreate`, `/cms-kit-staging/gosaki-piano`) | **absent** |
| canonical host | `https://www.gosaki-piano.com/` |
| og:url host | `https://www.gosaki-piano.com/` |
| noindex in `<head>` | **absent** |
| Asset paths | `/_astro/...` (root deployBase) |

### robots.txt / sitemap

| Check | Result |
| --- | --- |
| robots.txt | `Allow: /` |
| robots Disallow `/` | **absent** |
| Sitemap line | `https://www.gosaki-piano.com/sitemap-index.xml` |
| sitemap-0.xml loc URLs | all `www.gosaki-piano.com` |
| Staging URLs in sitemap | **absent** |

### Known exceptions (documented, not primary routes)

| Path | Note |
| --- | --- |
| `/2026-03/` … `/2026-07/` legacy stubs | `noindex,follow` redirect stubs → canonical `/schedule/YYYY-MM/` |
| `/admin/` read-only CMS | `noindex` + staging URL link in admin UI only (not public site nav) |

---

## 4. Content verification

### Discography (`discography/index.html`)

| Check | Result |
| --- | --- |
| `discographyDataSource=supabase` | present |
| `Like a Lover（テスト）` | **absent** |
| `Mary Ann（テスト）` | **absent** |
| `Like a Lover` | present (SKYLARK track 7) |
| `Mary Ann` | present (Ja-Jaaaaan! track 1) |
| SKYLARK tracks | **8** (production list) |
| Ja-Jaaaaan! tracks | **8** (production list) |

### Schedule

| Check | Result |
| --- | --- |
| Hub `/schedule/` | generated |
| Months `2026-03` … `2026-07` | generated under `/schedule/YYYY-MM/` |
| `scheduleDataSource=supabase` | present on month pages |
| PoC / `（テスト）` / `[CMS Kit staging]` | **absent** |

### Home / About / Contact

| Check | Result |
| --- | --- |
| Primary HTML generated | **yes** |
| Staging noindex warnings in public pages | **absent** |

---

## 5. Code changes in G-20h2

| File | Change |
| --- | --- |
| `scripts/lib/deploy-base.mjs` | `verifyProductionPreviewHtml()` for `deployBase=/` |
| `scripts/build-gosaki-production-package.mjs` | G-20h2 verifier hook |
| `scripts/verify-g20h2-gosaki-production-package-build.mjs` | new production package verifier |
| `package.json` | `verify:manual-upload:gosaki-production` → G-20h2 verifier |

**Staging build script:** unchanged (`build-gosaki-staging-admin-package.mjs`).

---

## 6. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| FTP / upload | **no** |
| mirror / sync / delete | **no** |
| DNS / SSL change | **no** |
| DB write / Save | **no** |
| commit / push | **no** |

---

## 7. Next phase

**G-20i** — client server upload preflight (remote path, credentials checklist, G-7f1 safety).

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20h2-gosaki-production-package-build.mjs
```
