# G-20t1 — Gosaki sitemap admin exclusion hardening

**Phase:** `G-20t1-gosaki-sitemap-admin-exclusion-hardening`  
**Status:** **complete** — CMS Kit sitemap filter hardened · local package regen verified  
**Date:** 2026-07-09  
**Base commit:** `6a1fdeb`  
**Scope:** CMS Kit public sitemap policy — not client-share prep

| Check | Status |
| --- | --- |
| Sitemap exclusion module | **yes** |
| Admin / staging-shell / API excluded | **yes** |
| Legacy `/YYYY-MM/` still excluded | **yes** |
| `/schedule/2026-08/` retained | **yes** |
| Public pages retained | **yes** |
| FTP / deploy | **no** |

---

## Gates

```txt
gosakiSitemapAdminExclusionHardeningComplete: true
phase: G-20t1-gosaki-sitemap-admin-exclusion-hardening
baseCommit: 6a1fdeb
sitemapFilterModule: scripts/lib/sitemap-exclusions.mjs
adminExcludedFromSitemap: true
stagingShellExcludedFromSitemap: true
apiExcludedFromSitemap: true
legacyMonthRootExcludedFromSitemap: true
scheduleAugustInSitemap: true
ftpUploadExecuted: false
packageRegenExecuted: true
```

---

## 1. Problem

Gosaki staging `sitemap-0.xml` listed **`/admin/`** while `admin/` HTML exists in the staging package (read-only admin for operator). This is:

- SEO noise / 404 risk if admin later removed from public-dist (production profile)
- Security hygiene — CMS management URLs should not be advertised in sitemaps
- CMS Kit generalization gap — filter only excluded legacy Wix month stubs (G-9c0b), not admin paths

---

## 2. Investigation

| Source | Finding |
| --- | --- |
| `@astrojs/sitemap` | Included all prerendered routes by default |
| `astro-generator.mjs` | Filter only when `legacyMonthStubsGenerated > 0` |
| `admin-cms-template.mjs` | `sitemap()` **without** filter |
| Staging package | `public-dist/admin/index.html` present · sitemap listed `/admin/` |
| `__admin-staging-shell/` | Not in static package (dev-only) — excluded by rule for future builds |

---

## 3. Implementation

### New module: `scripts/lib/sitemap-exclusions.mjs`

| Export | Role |
| --- | --- |
| `isCmsKitSitemapExcludedPath(pathname)` | Admin / staging-shell / API / preview paths |
| `shouldIncludePageInSitemap(pageUrl)` | Legacy month + CMS exclusions (deploy-base aware) |
| `buildSitemapIntegrationBlock()` | Generated `astro.config.mjs` integration |

**Excluded pathname segments (any deploy base):**

| Pattern | Examples |
| --- | --- |
| `/admin/` | `/admin/`, `…/gosaki-piano/admin/` |
| `/__admin-staging-shell/` | dev shell routes if ever built |
| `/api/` | admin/API JSON routes |
| `/preview/`, `/draft/` | preview-only (optional) |

**Still included:** `/schedule/YYYY-MM/`, all public marketing pages.

### Updated files

| File | Change |
| --- | --- |
| `scripts/lib/sitemap-exclusions.mjs` | **new** — shared CMS Kit rules |
| `scripts/lib/schedule-pages.mjs` | re-exports `shouldIncludePageInSitemap` |
| `scripts/lib/astro-generator.mjs` | always use `buildSitemapIntegrationBlock()` when `site` set |
| `scripts/lib/admin-cms-template.mjs` | sitemap filter for `--with-admin-cms` builds |
| `scripts/verify-url-to-staging-pipeline.mjs` | G-20t1 unit assertions |
| `scripts/verify-gosaki-sitemap-admin-exclusion-hardening.mjs` | **new** |

---

## 4. Local package verification (post-regen)

**Command:** `node scripts/build-gosaki-staging-admin-package.mjs`

| Check | Before | After |
| --- | --- | --- |
| `sitemap-0.xml` loc count | 13 | **12** |
| `/admin/` in sitemap | **yes** | **no** |
| `/schedule/2026-08/` | yes | **yes** |
| legacy `/2026-08/` root | no | **no** |
| `/about/`, `/contact/`, etc. | yes | **yes** |
| `public-dist/admin/index.html` | present | **present** (page exists · not in sitemap) |

---

## 5. Design notes (CMS Kit generalization)

- Rules are **pathname segment** based — works with any `deployBase`
- Not Gosaki-specific slugs — reusable for musician / school profiles
- Sitemap filter is applied at **Astro build** time — no post-build XML surgery
- Production package (`includeGosakiReadOnlyAdmin: false`) already omits `admin/` from public-dist; sitemap hardening prevents ghost URLs when admin HTML is included (staging)

---

## 6. Residual / follow-up

| Item | Priority |
| --- | --- |
| Staging FTP upload of new sitemap | operator manual · separate phase |
| HubSpot free branding | note only (G-20s2b) |
| Production cutover sitemap host swap | G-20j |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-sitemap-admin-exclusion-hardening.mjs
```
