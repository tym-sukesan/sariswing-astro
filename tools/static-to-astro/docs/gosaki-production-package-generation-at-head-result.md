# G-20u38b — Gosaki production package generation at HEAD result

**Phase:** `G-20u38b-gosaki-production-package-generation-at-head`  
**Status:** **complete** — local production package generated · content OK · upload verification pending · result record  
**Date:** 2026-07-15  
**Generation HEAD:** `4259c8cfdc38b7eccf5400208da0151bbbe0da70` (= `origin/main`)  
**Prior:** [G-20u38a static preflight](./gosaki-production-profile-static-preflight-result.md)

| Check | Status |
| --- | --- |
| Production package generated | **yes** (local) |
| Freshness / preflight verified | **yes** |
| FTP / upload | **no** |
| Production server changed | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiProductionPackageGeneratedAtHead: true
phase: G-20u38b-gosaki-production-package-generation-at-head
generationHead: 4259c8cfdc38b7eccf5400208da0151bbbe0da70
sourceCommit: 4259c8cfdc38b7eccf5400208da0151bbbe0da70
generatedAt: 2026-07-15T07:16:08.210Z
fileCount: 30
safeForStaticFtp: true
publicBaseUrl: https://www.gosaki-piano.com/
intendedRemotePath: TBD_G-20i
productionPackageGenerated: true
productionPackageContentOk: true
productionPackageFresh: true
productionPackageVerifiedForUpload: false
g20i3VerifierDrift: true
productionUploadReady: false
publicReady: conditional
p0Stop: false
ftpUploadExecuted: false
productionChanged: false
serviceRoleUsed: false
recommendedNextPhase: G-20u38c-gosaki-production-package-verification-review
```

**Package path:** `tools/static-to-astro/output/manual-upload/gosaki-piano-production/`  
**public-dist:** `tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/`

---

## 1. Pre-generation git check

| Check | Result |
| --- | --- |
| `git status -sb` | `## main...origin/main` (clean) |
| HEAD | `4259c8cfdc38b7eccf5400208da0151bbbe0da70` |
| origin/main | `4259c8cfdc38b7eccf5400208da0151bbbe0da70` |

**Judgment:** **PASS** — clean tree · HEAD matches origin/main.

---

## 2. Build command

```bash
cd tools/static-to-astro
npm run build:gosaki:production
```

| Item | Result |
| --- | --- |
| Pipeline exit | **1** (post-build G-20i3 verifier drift — see §10) |
| Convert + Astro build | **success** |
| static-public verify | **PASS** (`safeForStaticFtp: true`) |
| Package written | **yes** |

**Build notes:** 17 pages · Schedule 74 events (supabase) · Discography 4 releases / 34 tracks (supabase) · admin excluded from static-public copy.

---

## 3. Verification commands

| Command | Result |
| --- | --- |
| `verify:package-freshness:gosaki:production` | **PASS** — sourceCommit = HEAD |
| `preflight:gosaki:production` | **PASS** — structure + freshness |
| `verify:manual-upload:gosaki-production` (G-20i3) | **70/73 PASS** · 3 drift failures (§10) |

---

## 4. MANIFEST summary

| Field | Value |
| --- | --- |
| `sourceCommit` | `4259c8cfdc38b7eccf5400208da0151bbbe0da70` |
| `fileCount` | **30** |
| `safeForStaticFtp` | **true** |
| `publicBaseUrl` | `https://www.gosaki-piano.com/` |
| `deployBase` | `/` |
| `targetEnvironment` | `production` |
| `includesAdmin` | **false** |
| `includeGosakiReadOnlyAdmin` | **false** |
| `adminExcludedFromPackage` | **true** |
| `intendedRemotePath` | **`TBD_G-20i`** |
| `generatedAt` | `2026-07-15T07:16:08.210Z` |
| `ftpAutoDeployUsed` | **false** |

**sourceCommit vs HEAD:** **MATCH**

---

## 5. Admin exclusion

| Check | Result |
| --- | --- |
| `public-dist/admin/index.html` | **absent** |
| `public-dist/admin/` directory | **absent** |
| sitemap `/admin/` | **absent** |
| Public HTML admin UI strings | **absent** (no READ-ONLY / Save disabled in `.html`) |
| Orphan `_astro` admin bundle | **present but unreferenced** (P2 — see §10) |

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
| `access_token` / `refresh_token` / `sk_` | **0 credential leaks** | **PASS** |
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

## 10. G-20i3 verifier drift (non-P0)

`verify:manual-upload:gosaki-production` reported **3 failures** — **verifier drift**, not package P0 defects:

| Failure | Cause | Blocker? |
| --- | --- | --- |
| `public-dist file count 28` | Hardcoded `EXPECTED_PUBLIC_DIST_COUNT=28` in G-20i3; actual **30** (schedule months + assets) | **no** |
| `manifest fileCount 28` | Same hardcoded expectation | **no** |
| `manifest includeReadOnlyAdmin false` | MANIFEST uses `includeGosakiReadOnlyAdmin` + `adminExcludedFromPackage` instead of `includeReadOnlyAdmin` field | **no** |

**P2 note:** Orphan `_astro/index.astro_astro_type_script_index_0_lang.BA9SPEq7.js` + admin CSS remain in package but are **not referenced** by any public HTML — optional bundle pruning in future phase.

**Build pipeline exit code 1** due to G-20i3 post-build hook — package artifacts are valid; freshness + preflight **PASS**.

---

## 11. Verdict

| Verdict | Value | Notes |
| --- | --- | --- |
| **PRODUCTION_PACKAGE_GENERATED** | **true** | Local build at HEAD `4259c8c` |
| **PRODUCTION_PACKAGE_CONTENT_OK** | **true** | admin excluded · prod URL/robots/sitemap · secrets P0 clear · discography restored |
| **PRODUCTION_PACKAGE_FRESH** | **true** | `sourceCommit` = HEAD · freshness + preflight **PASS** |
| **PRODUCTION_PACKAGE_VERIFIED_FOR_UPLOAD** | **false** | Build pipeline exit **1** · G-20i3 **70/73** (not full PASS) |
| **G20I3_VERIFIER_DRIFT** | **true** | Hardcoded fileCount 28 vs 30 · manifest field naming drift |
| **PRODUCTION_UPLOAD_READY** | **false** | `TBD_G-20i` · verifier drift unresolved · FTP not executed |
| **PUBLIC_READY** | **CONDITIONAL** | |
| **P0_STOP** | **false** | Package content P0 checks pass; upload gate not cleared |

**Why not upload-verified:** `build:gosaki:production` ended with pipeline exit **1** (G-20i3 post-build hook). `verify:manual-upload:gosaki-production` scored **70/73** — not a full PASS. Upload requires G-20u38c review + G-20i3 drift fix/review + remote path confirmation.

---

## 12. What was NOT done

| Item | Status |
| --- | --- |
| FTP / upload | **no** |
| Production deploy | **no** |
| Remote path confirmation | **no** |
| Save / SQL / DB write | **no** |

---

## 13. Next

```txt
recommendedNextPhase: G-20u38c-gosaki-production-package-verification-review
alternateNextPhase: G-20i3 verifier drift review / update
```

G-20u38c: formal verification review rollup. G-20i3: update hardcoded fileCount / manifest field assertions if approved. Remote path confirmation required before G-20u38d upload checklist.
