# G-20u38b2 — Gosaki production package regeneration at current HEAD result

**Phase:** `G-20u38b2-gosaki-production-package-regeneration-at-current-head`  
**Status:** **complete** — production package regenerated at HEAD · local verification full PASS · upload not ready  
**Date:** 2026-07-15  
**Generation HEAD:** `1c1fb9724d82b882c46cc38be8a4434c24b40e0f` (= `origin/main`)  
**Prior:** [G-20i3 verifier drift review](./gosaki-production-manual-upload-verifier-drift-review.md) · [G-20u38b generation at prior HEAD](./gosaki-production-package-generation-at-head-result.md)

| Check | Status |
| --- | --- |
| Production package regenerated | **yes** (local) |
| Freshness / preflight / manual-upload | **full PASS** |
| FTP / upload | **no** |
| Production server changed | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiProductionPackageRegeneratedAtCurrentHead: true
phase: G-20u38b2-gosaki-production-package-regeneration-at-current-head
generationHead: 1c1fb9724d82b882c46cc38be8a4434c24b40e0f
sourceCommit: 1c1fb9724d82b882c46cc38be8a4434c24b40e0f
generatedAt: 2026-07-15T07:54:36.493Z
fileCount: 30
safeForStaticFtp: true
publicBaseUrl: https://www.gosaki-piano.com/
intendedRemotePath: TBD_G-20i
productionPackageRegenerated: true
productionPackageContentOk: true
productionPackageFreshAtGenerationHead: true
productionPackageVerifiedLocally: true
productionPackageVerifiedForUpload: false
productionUploadReady: false
publicReady: conditional
g20i3VerifierDriftResolved: true
p0Stop: false
ftpUploadExecuted: false
productionChanged: false
serviceRoleUsed: false
packageStaleAfterResultCommit: true
recommendedNextPhase: G-20u38c-gosaki-production-package-verification-review
```

**Package path:** `tools/static-to-astro/output/manual-upload/gosaki-piano-production/`  
**public-dist:** `tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/`

**Important:** This package matches HEAD `1c1fb97` at generation time. **After this result doc is committed, the package becomes stale** — do **not** use it for production FTP. Regenerate at latest HEAD immediately before upload.

---

## 1. Pre-generation git check

| Check | Result |
| --- | --- |
| `git status -sb` | `## main...origin/main` (clean) |
| HEAD | `1c1fb9724d82b882c46cc38be8a4434c24b40e0f` |
| origin/main | `1c1fb9724d82b882c46cc38be8a4434c24b40e0f` |

**Judgment:** **PASS** — clean tree · HEAD matches origin/main.

---

## 2. Build command

```bash
cd tools/static-to-astro
npm run build:gosaki:production
```

| Item | Result |
| --- | --- |
| Pipeline exit | **0** |
| Convert + Astro build | **success** |
| static-public verify | **PASS** (`safeForStaticFtp: true`) |
| G-20i3 post-build verifier | **74/74 PASS** |
| Package written | **yes** |

**Build notes:** 17 pages · Schedule 74 events (supabase) · Discography 4 releases / 34 tracks (supabase) · admin excluded from static-public copy.

---

## 3. Verification commands

| Command | Result |
| --- | --- |
| `verify:package-freshness:gosaki:production` | **PASS** — sourceCommit = HEAD |
| `preflight:gosaki:production` | **PASS** — structure + freshness |
| `verify:manual-upload:gosaki-production` (G-20i3) | **74/74 PASS** |

**Regression note:** After regen at HEAD, `verify:package-freshness:production` returns **PASS** (fresh). G-20u5 npm-flow verifier updated to accept fresh-at-HEAD or stale STOP.

---

## 4. MANIFEST summary

| Field | Value |
| --- | --- |
| `sourceCommit` | `1c1fb9724d82b882c46cc38be8a4434c24b40e0f` |
| `fileCount` | **30** |
| `safeForStaticFtp` | **true** |
| `publicBaseUrl` | `https://www.gosaki-piano.com/` |
| `deployBase` | `/` |
| `targetEnvironment` | `production` |
| `includesAdmin` | **false** |
| `includeGosakiReadOnlyAdmin` | **false** |
| `adminExcludedFromPackage` | **true** |
| `intendedRemotePath` | **`TBD_G-20i`** |
| `generatedAt` | `2026-07-15T07:54:36.493Z` |
| `ftpAutoDeployUsed` | **false** |

**sourceCommit vs HEAD:** **MATCH**

---

## 5. Admin exclusion

| Check | Result |
| --- | --- |
| `public-dist/admin/index.html` | **absent** |
| `public-dist/admin/` directory | **absent** |
| sitemap `/admin/` | **absent** |
| Public HTML admin UI strings | **absent** (no STAGING ONLY / READ-ONLY / Save disabled / dry-run admin UI) |
| Orphan `_astro` admin bundle | **present but unreferenced** (P2) |

**Judgment:** **PASS** — no admin route or HTML in production package.

---

## 6. Production URL / robots / sitemap

| Check | Result |
| --- | --- |
| `robots.txt` | `Allow: /` · sitemap `https://www.gosaki-piano.com/sitemap-index.xml` **PASS** |
| `sitemap-0.xml` | All URLs `https://www.gosaki-piano.com/...` **PASS** |
| Staging URL in public HTML | **0 hits** (`yskcreate` · `/cms-kit-staging/gosaki-piano`) |
| Primary routes canonical/og:url | production host (G-20i3 + preflight **PASS**) |
| `noindex` on primary routes | **absent** |

**Judgment:** **PASS**

---

## 7. Secrets / project ref

| Pattern | public-dist result | Classification |
| --- | --- | --- |
| `service_role` / `SUPABASE_SERVICE_ROLE` | **0 hits** in HTML | **PASS** |
| `eyJ` (JWT-shaped) | **0 hits** in HTML | **PASS** |
| `access_token` / `refresh_token` / `sk_` | **0 credential leaks** in HTML | **PASS** |
| `vsbvndwuajjhnzpohghh` | 1 orphan `_astro/*.js` | **false positive** — guard constant only · **not linked from HTML** |
| `kmjqppxjdnwwrtaeqjta` | 1 orphan `_astro/*.js` | **orphan admin bundle** — guard/build artifact · **not runtime on public pages** |
| Sariswing prod ref active connection | **no** | **PASS** |

**Judgment:** **PASS for P0 secrets** — no credentials on public HTML; orphan admin JS not loaded by any page.

---

## 8. Discography restore

| Check | Result |
| --- | --- |
| `On a Clear Day` | **present** (`discography/index.html`) |
| Marker `On a Clear Day [CMS Kit staging G-20u36e]` | **0 hits** |
| `Like a Lover` | **present** |

**Judgment:** **PASS**

---

## 9. STOP conditions

| STOP condition | Active? |
| --- | --- |
| build exit ≠ 0 | **no** — exit **0** |
| freshness / preflight / manual-upload not full PASS | **no** — all **PASS** |
| sourceCommit ≠ HEAD | **no** |
| `/admin/` in package | **no** |
| robots `Disallow: /` | **no** |
| sitemap/baseUrl staging | **no** |
| staging base path in public HTML | **no** |
| service_role / secret leak | **no** |
| Sariswing prod ref active | **no** |
| upload ready with TBD remote | **no** — `PRODUCTION_UPLOAD_READY: false` maintained |

```txt
P0_STOP: false
```

---

## 10. P2 orphan asset note

Orphan `_astro/index.astro_astro_type_script_index_0_lang.BA9SPEq7.js` + admin CSS remain in package but are **not referenced** by any public HTML — optional bundle pruning in future phase. Contains staging/prod ref strings as **guard constants only** (not active runtime connections on public pages).

---

## 11. Verdict

| Verdict | Value | Notes |
| --- | --- | --- |
| **PRODUCTION_PACKAGE_REGENERATED** | **true** | Local build at HEAD `1c1fb97` |
| **PRODUCTION_PACKAGE_CONTENT_OK** | **true** | admin excluded · prod URL/robots/sitemap · secrets P0 clear · discography restored |
| **PRODUCTION_PACKAGE_FRESH_AT_GENERATION_HEAD** | **true** | `sourceCommit` = HEAD · freshness + preflight **PASS** |
| **PRODUCTION_PACKAGE_VERIFIED_LOCALLY** | **true** | build exit **0** · G-20i3 **74/74** · freshness + preflight **PASS** |
| **PRODUCTION_PACKAGE_VERIFIED_FOR_UPLOAD** | **false** | remote path `TBD_G-20i` · no FTP · package stale after result commit |
| **G20I3_VERIFIER_DRIFT_RESOLVED** | **true** |
| **PRODUCTION_UPLOAD_READY** | **false** | `TBD_G-20i` · regenerate at latest HEAD before upload |
| **PUBLIC_READY** | **CONDITIONAL** | |
| **P0_STOP** | **false** | |

**Why not upload-verified:** Production remote path remains **`TBD_G-20i`**. No FTP executed. Package will become **stale** once this result doc is committed — final upload package must be regenerated at latest HEAD immediately before upload.

---

## 12. What was NOT done

| Item | Status |
| --- | --- |
| FTP / upload | **no** |
| Production deploy | **no** |
| Remote path confirmation | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |

---

## 13. Next

```txt
recommendedNextPhase: G-20u38c-gosaki-production-package-verification-review
```

G-20u38c: operator review of local verification results · remote path confirmation before any upload · regenerate package at latest HEAD immediately before FTP.
