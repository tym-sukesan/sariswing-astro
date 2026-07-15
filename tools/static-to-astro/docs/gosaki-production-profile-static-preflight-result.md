# G-20u38a — Gosaki production profile static preflight result

**Phase:** `G-20u38a-gosaki-production-profile-static-preflight`  
**Status:** **complete** — read-only static preflight · result record only  
**Date:** 2026-07-15  
**Preflight HEAD:** `51ae3fe` (= `origin/main`)  
**Regression:** `23/23 PASS` (current-active-regression at preflight time)  
**Prior:** [G-20u38 production package prep planning](./gosaki-production-package-prep-planning.md)

| Check | Status |
| --- | --- |
| Static preflight executed | **yes** (read-only registry / config / on-disk sample) |
| Implementation changes | **no** |
| Package generation | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| FTP / upload | **no** |
| service_role used | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiProductionProfileStaticPreflightCompleted: true
phase: G-20u38a-gosaki-production-profile-static-preflight
preflightHead: 51ae3fe
originMain: 51ae3fe
stgDeployedSourceCommit: e3616a3ab0fbda280d75278b0a6275205ae74763
productionProfileStaticPreflightCompleted: true
adminExcludedInProductionProfile: true
productionRobotsReady: true
productionSitemapReady: true
productionSeoUrlReady: true
supabaseRuntimePublicConnection: false
sariswingProdRefRisk: false
serviceRoleRisk: false
productionBuildScriptReady: true
productionFreshnessGateReady: true
productionPreflightReady: true
productionPackageGenerationReady: true
productionUploadReady: false
publicReady: conditional
p0StopForGeneration: false
implementationExecuted: false
packageGenerationExecuted: false
saveExecuted: false
sqlExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
ftpUploadExecuted: false
serviceRoleUsed: false
productionChanged: false
recommendedNextPhase: G-20u38b-gosaki-production-package-generation-at-head
```

**Critical rules (reconfirmed):**

- STG package `e3616a3` **must not** be used for production upload.
- Production package must be built from **current HEAD** at generation time.
- This phase did **not** run build or generate a new package.

---

## 1. Production profile definition

**Sources read:** `config/sites/registry.json` · `config/sites/gosaki-piano.deploy-profiles.json` · `scripts/lib/site-registry.mjs` (runtime resolve)

| Field | Expected | Resolved (production) | Result |
| --- | --- | --- | --- |
| Profile exists | yes | `production` in registry + deploy profiles | **PASS** |
| `baseUrl` | `https://www.gosaki-piano.com` | `https://www.gosaki-piano.com` | **PASS** |
| `publicBaseUrl` | `https://www.gosaki-piano.com/` | `https://www.gosaki-piano.com/` | **PASS** |
| `deployBase` | `/` | `/` | **PASS** |
| `targetEnvironment` | `production` | `production` | **PASS** |
| `intendedRemotePath` | TBD until operator confirms | `TBD_G-20i` | **PASS (TBD recorded)** |
| Staging output | `output/manual-upload/gosaki-piano` | staging profile | **PASS** |
| Production output | `output/manual-upload/gosaki-piano-production` | production profile | **PASS** |

**Registry validation:** `resolveSitePackageBuildProfile('gosaki-piano', 'production')` succeeds without error.

**On-disk STG manifest (reference only):** `output/manual-upload/gosaki-piano/MANIFEST.json` → `sourceCommit=e3616a3` · `targetEnvironment=staging` · `includesAdmin=true` · **not a production target**.

**On-disk production manifest (stale sample):** `output/manual-upload/gosaki-piano-production/MANIFEST.json` → `sourceCommit=55d0364` · **≠ HEAD `51ae3fe`** · must regen in G-20u38b before upload.

---

## 2. Admin exclusion

| Check | Result |
| --- | --- |
| `includeReadOnlyAdmin=false` (deploy profile) | **PASS** |
| `includesAdmin=false` (registry packageProfiles.production) | **PASS** |
| `shouldExcludeFromStaticPublic` excludes `admin/` when admin off | **PASS** (code: `static-public-artifact-verifier.mjs`) |
| Sitemap excludes `/admin/` | **PASS** (`sitemap-exclusions.mjs` · `/admin/` pattern) |
| Post-build verifier | `verify-g20i3-gosaki-production-package-admin-exclusion.mjs` |
| Stale on-disk prod `admin/index.html` | **absent** |

```txt
ADMIN_EXCLUDED_IN_PRODUCTION_PROFILE: true
```

**Judgment:** No P0 STOP for production package **generation** — admin exclusion is specified in profile, registry, static-public pipeline, and sitemap rules.

---

## 3. robots / sitemap / SEO URL switch

### Profile SEO flags (production)

| Flag | Value | Result |
| --- | --- | --- |
| `seo.robotsDisallowAll` | **false** | **PASS** — not `Disallow: /` by spec |
| `seo.productionIndexable` | **true** | **PASS** |
| `seo.stagingNoindex` | **false** | **PASS** |

### Expected production artifact behavior (from profile + verifiers)

| Check | Spec | Stale on-disk sample |
| --- | --- | --- |
| `robots.txt` | Allow crawl · sitemap prod URL | `Allow: /` · sitemap `https://www.gosaki-piano.com/...` **PASS** |
| `sitemap-0.xml` | `https://www.gosaki-piano.com/` URLs | prod host in sample **PASS** |
| No staging URL in public HTML | no `yskcreate` · no `/cms-kit-staging/gosaki-piano` | verified by G-20i3 verifier on build |
| canonical / og:url | prod host | G-20i3 SEO sample routes |

```txt
PRODUCTION_ROBOTS_READY: true
PRODUCTION_SITEMAP_READY: true
PRODUCTION_SEO_URL_READY: true
```

**Note:** Stale on-disk production package reflects **older HEAD** — G-20u38b must regen at `51ae3fe` and re-verify SEO URLs after G-20u36f discography restore and other changes.

---

## 4. Supabase / CMS reference handling

| Check | Result | Classification |
| --- | --- | --- |
| Runtime Supabase on public static pages | **no** — static export · admin excluded | `SUPABASE_RUNTIME_PUBLIC_CONNECTION: false` |
| `kmjqppxjdnwwrtaeqjta` | build-time CMS SoT (Schedule / Discography loaders) | **expected interim design** |
| `vsbvndwuajjhnzpohghh` (Sariswing prod) | registry **throws** if used in deploy profile | `SARISWING_PROD_REF_RISK: false` |
| `service_role` in static public build | not used in browser static export path | `SERVICE_ROLE_RISK: false` |

**Public pages:** No admin bundle → no anon key / Edge Save UI in production package. CMS data baked at build time from staging-kit Supabase.

---

## 5. Production scripts / freshness / preflight gates

| Item | npm script | Result |
| --- | --- | --- |
| Production build | `build:gosaki:production` · `build:gosaki:production:dry-run` | **exists** |
| Production preflight | `preflight:gosaki:production` | **exists** |
| Package freshness | `verify:package-freshness:gosaki:production` | **exists** |
| Site package verify | `verify:gosaki:production` | **exists** |
| Admin exclusion verify | `verify:manual-upload:gosaki-production` | **exists** |
| Generic manual-upload | `verify:manual-upload` | staging-default; production uses dedicated G-20i3 verifier |
| `sourceCommit=HEAD` after build | `verify-package-upload-freshness.mjs` | **ready** (runs in preflight chain) |

```txt
PRODUCTION_BUILD_SCRIPT_READY: true
PRODUCTION_FRESHNESS_GATE_READY: true
PRODUCTION_PREFLIGHT_READY: true
```

---

## 6. FTP remote path (upload blocked)

| Item | Status |
| --- | --- |
| `intendedRemotePath` | **`TBD_G-20i`** — operator must confirm Lolipop path |
| `PRODUCTION_UPLOAD_READY` | **false** (maintained) |
| Upload method | **FileZilla manual only** · `public-dist/` contents |
| Forbidden | CLI FTP · mirror · sync · `--delete` · auto-deploy |

---

## 7. STOP conditions review

| STOP condition | Active? |
| --- | --- |
| Production profile missing | **no** |
| Admin exclusion unconfirmed | **no** |
| robots `Disallow: /` by production spec | **no** |
| sitemap/baseUrl staging by production spec | **no** |
| Output path mixing staging/production | **no** — separate dirs enforced |
| Freshness/preflight gates missing | **no** |
| Upload with remote path TBD | **would STOP upload** — not attempted |
| service_role / secrets leak in spec | **no** |
| Sariswing prod ref active | **no** |
| CLI FTP / mirror / delete plan | **no** |

```txt
P0_STOP_FOR_GENERATION: false
P0_STOP_FOR_UPLOAD: true (remote TBD + no HEAD package + stale on-disk prod)
```

---

## 8. Verdict

| Verdict | Value | Rationale |
| --- | --- | --- |
| **PRODUCTION_PROFILE_STATIC_PREFLIGHT_COMPLETED** | **true** | All read-only profile/spec checks PASS |
| **PRODUCTION_PACKAGE_GENERATION_READY** | **true** | Profile · admin exclusion · SEO switch · scripts ready — proceed to G-20u38b at HEAD |
| **PRODUCTION_UPLOAD_READY** | **false** | Remote TBD · no fresh package at HEAD · stale `55d0364` on disk |
| **PUBLIC_READY** | **CONDITIONAL** | STG QA complete · prod package/upload pending |

**Upgrade from G-20u38:** `PRODUCTION_PACKAGE_GENERATION_READY` **CONDITIONAL → true** after this preflight PASS.

---

## 9. What was NOT done this phase

| Item | Status |
| --- | --- |
| Production package build / regen | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| FTP / upload | **no** |
| Production deploy | **no** |

---

## 10. Next

```txt
recommendedNextPhase: G-20u38b-gosaki-production-package-generation-at-head
```

G-20u38b: run `build:gosaki:production` at HEAD `51ae3fe` · then G-20u38c verification · **do not upload** until remote path confirmed and G-20u38d checklist complete.
