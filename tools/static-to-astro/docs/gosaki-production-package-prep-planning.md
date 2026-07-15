# G-20u38 — Gosaki production package prep planning

**Phase:** `G-20u38-gosaki-production-package-prep-planning`  
**Status:** **complete** — production package prep planning only  
**Date:** 2026-07-15  
**Planning HEAD:** `9944164` (= `origin/main`)  
**Regression:** `23/23 PASS` (current-active-regression at planning time)  
**Prior:** [G-20u37c final P0 review](./gosaki-public-readiness-final-p0-review.md)

| Check | Status |
| --- | --- |
| Production package prep planned | **yes** |
| Implementation changes | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role used | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiProductionPackagePrepPlanned: true
phase: G-20u38-gosaki-production-package-prep-planning
planningHead: 9944164
originMain: 9944164
stgDeployedSourceCommit: e3616a3ab0fbda280d75278b0a6275205ae74763
productionPackagePrepPlanned: true
productionPackageGenerationReady: conditional
productionUploadReady: false
publicReady: conditional
p0Blockers: false
stagingQaComplete: true
publicP0ReadyForProductionPackagePrep: true
implementationExecuted: false
saveExecuted: false
sqlExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
packageGenerationExecuted: false
ftpUploadExecuted: false
serviceRoleUsed: false
productionChanged: false
recommendedNextPhase: G-20u38a-gosaki-production-profile-static-preflight
```

---

## 1. Site context

| Item | Value |
| --- | --- |
| siteKey | `gosaki-piano` |
| Production public URL | `https://www.gosaki-piano.com/` |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| STG deployed package | `e3616a3` — **valid for STG QA only** |
| Current HEAD | `9944164` — **required for any new production package** |

**Critical rule:** **Do not upload `e3616a3` staging package to production.** Production package must be built from **current HEAD** with **production profile**.

---

## 2. Production profile (read-only baseline)

**Source:** `config/sites/gosaki-piano.deploy-profiles.json` · validated by `scripts/lib/site-registry.mjs`

| Field | Production value |
| --- | --- |
| `baseUrl` | `https://www.gosaki-piano.com` |
| `publicUrl` | `https://www.gosaki-piano.com/` |
| `deployBase` | `/` |
| `outputName` | `gosaki-piano-production` |
| `astroOut` | `output/gosaki-piano-astro-production` |
| `staticPublicOut` | `output/static-public/gosaki-piano-production` |
| `manualUploadOut` | `output/manual-upload/gosaki-piano-production` |
| `includeReadOnlyAdmin` | **false** |
| `includeGosakiReadOnlyAdmin` | **false** |
| `supabaseProjectRef` | `kmjqppxjdnwwrtaeqjta` (interim CMS Kit staging SoT) |
| `remotePath` | **`TBD_G-20i`** — upload blocked until operator confirms |
| `seo.stagingNoindex` | **false** |
| `seo.robotsDisallowAll` | **false** |
| `seo.productionIndexable` | **true** |

**Staging vs production path separation:**

| Profile | manualUploadOut | admin |
| --- | --- | --- |
| staging | `output/manual-upload/gosaki-piano` | **included** (read-only) |
| production | `output/manual-upload/gosaki-piano-production` | **excluded** |

---

## 3. Production package P0 conditions

All must pass before production upload is allowed.

| ID | Condition | Verification target |
| --- | --- | --- |
| P0-PROF1 | Production profile exists and registry-valid | `deploy-profiles.json` · `site-registry.mjs` |
| P0-URL1 | `baseUrl` = `https://www.gosaki-piano.com` | MANIFEST · primary HTML `<head>` |
| P0-URL2 | `deployBase` = `/` | MANIFEST · asset paths `/_astro/` |
| P0-URL3 | `publicBaseUrl` = `https://www.gosaki-piano.com/` | MANIFEST · canonical · og:url |
| P0-SEO1 | `robots.txt` production-ready (**not** `Disallow: /`) | `public-dist/robots.txt` |
| P0-SEO2 | sitemap uses production URLs only | `public-dist/sitemap-0.xml` |
| P0-SEO3 | sitemap **excludes** `/admin/` | sitemap grep |
| P0-ADM1 | Package **excludes** `/admin/` | `public-dist/` file list · `verify:manual-upload:gosaki-production` |
| P0-ADM2 | No Save / Deploy / FTP execution UI in prod package | admin absent → auto-satisfied |
| P0-SEC1 | No `service_role` / secrets / JWT leak on public pages | grep public-dist |
| P0-REF1 | **Never** Sariswing production ref `vsbvndwuajjhnzpohghh` as active connection | grep + registry guard |
| P0-REF2 | Staging ref `kmjqppxjdnwwrtaeqjta` — see §4 classification |
| P0-FRESH1 | `MANIFEST.sourceCommit` = HEAD at build time | `verify:package-freshness:gosaki:production` |
| P0-PKG1 | **Not** reuse STG `e3616a3` package for production | operator + MANIFEST profile check |
| P0-FTP1 | Upload = **FileZilla manual only** · `public-dist/` contents | README/CHECKLIST |
| P0-FTP2 | Remote path **confirmed** (not `TBD_G-20i`) before upload | MANIFEST `intendedRemotePath` |
| P0-CON1 | Contact / HubSpot embed expected on prod contact page | static + browser on prod URL post-upload |

---

## 4. Supabase ref classification (staging ref on production)

| Context | `kmjqppxjdnwwrtaeqjta` | Classification |
| --- | --- | --- |
| **Build-time CMS read** (Schedule / Discography loader) | **expected** — interim SoT per registry | **OK** — data baked into static HTML at build |
| **Public HTML pages** (anon key / Edge URL in markup) | **must be absent** | **P0** — prod package excludes admin; verify no `eyJ` on public routes |
| **Sariswing production ref `vsbvndwuajjhnzpohghh`** | **forbidden** as active target | **P0 STOP** — registry rejects; grep must not show prod wiring |

**Note:** Gosaki production profile intentionally uses CMS Kit **staging** Supabase for content SoT until a dedicated production Supabase project is approved. This is **build-time only** — not a runtime browser connection on static public pages.

---

## 5. Pre-generation read-only verification plan (G-20u38a)

Execute **before** any production package build at HEAD.

### 5.1 Site registry / build profile

| Check | Command / source |
| --- | --- |
| Registry loads production profile | read `config/sites/gosaki-piano.deploy-profiles.json` |
| `includeReadOnlyAdmin=false` | profile JSON + `site-registry.mjs` validation |
| Path guards | staging → `gosaki-piano` · production → `gosaki-piano-production` |
| Sariswing prod ref blocked | registry throws on `vsbvndwuajjhnzpohghh` |

### 5.2 SEO / URL switch spec

| Check | Expected (production) |
| --- | --- |
| canonical / og:url | `https://www.gosaki-piano.com/...` |
| no staging URL leak | no `yskcreate` · no `/cms-kit-staging/gosaki-piano` |
| noindex | absent on primary public routes |
| robots.txt | allow crawl (not `Disallow: /`) |
| sitemap | prod host only · no `/admin/` |

### 5.3 Package naming / path design

| Artifact | Staging | Production |
| --- | --- | --- |
| manual-upload dir | `output/manual-upload/gosaki-piano/` | `output/manual-upload/gosaki-piano-production/` |
| static-public | `output/static-public/gosaki-piano/` | `output/static-public/gosaki-piano-production/` |
| astro out | `output/gosaki-piano-astro/` | `output/gosaki-piano-astro-production/` |
| MANIFEST `targetEnvironment` | staging | production |

**Rule:** Never copy staging `public-dist/` into production upload path.

### 5.4 Existing npm / verifier coverage

| Item | Status | npm script |
| --- | --- | --- |
| Production build | **exists** | `build:gosaki:production` · `build:gosaki:production:dry-run` |
| Production preflight | **exists** | `preflight:gosaki:production` |
| Site package verify | **exists** | `verify:gosaki:production` |
| Admin exclusion verify | **exists** | `verify:manual-upload:gosaki-production` |
| Package freshness | **exists** | `verify:package-freshness:gosaki:production` |
| Generic manual-upload verify | **exists** (staging-oriented default) | `verify:manual-upload` — use production profile flags in G-20u38c |
| Manual FTP checklist | **embedded** in package | `README-UPLOAD.md` · `CHECKLIST.md` (regenerated on build) |

### 5.5 G-20u38a static preflight checklist (read-only)

```bash
# Read-only — no build / FTP
node -e "import('./scripts/lib/site-registry.mjs').then(m => console.log(JSON.stringify(m.resolveSitePackageProfile('gosaki-piano','production'),null,2)))"
grep -E 'includeReadOnlyAdmin|baseUrl|deployBase|remotePath' config/sites/gosaki-piano.deploy-profiles.json
# Confirm on-disk staging package is NOT production target:
test -f output/manual-upload/gosaki-piano/MANIFEST.json && grep sourceCommit output/manual-upload/gosaki-piano/MANIFEST.json
# Confirm production remote still TBD:
grep TBD_G-20i config/sites/gosaki-piano.deploy-profiles.json
```

---

## 6. STOP conditions (production package / upload)

**STOP immediately** if any of:

| ID | STOP condition |
| --- | --- |
| STOP-ADM1 | `/admin/` present in production `public-dist/` |
| STOP-SEO1 | `robots.txt` is `Disallow: /` on production package |
| STOP-SEO2 | sitemap URLs still use staging base |
| STOP-URL1 | `baseUrl` / canonical still staging |
| STOP-FTP1 | Production remote path still `TBD_G-20i` or unconfirmed |
| STOP-FRESH1 | `MANIFEST.sourceCommit` ≠ HEAD at build time |
| STOP-SEC1 | `service_role` credential or secret leak in public-dist |
| STOP-REF1 | Sariswing production ref `vsbvndwuajjhnzpohghh` as active Supabase URL |
| STOP-FTP2 | FTP plan uses CLI mirror / sync / `--delete` / auto-deploy |
| STOP-PKG1 | Attempt to upload STG `e3616a3` package to production |
| STOP-MIX1 | Staging and production `public-dist/` directories mixed or overwritten |

**FTP policy (permanent):** Human operator · **FileZilla manual upload only** · upload **`public-dist/` contents** · **no** CLI FTP · **no** mirror/delete/sync · G-7f1 hardening applies.

---

## 7. Next phase roadmap

| Phase | Purpose | Package / FTP |
| --- | --- | --- |
| **G-20u38a** | Production profile static preflight (read-only) | none |
| **G-20u38b** | Production package generation (local build at HEAD) | build only · no FTP |
| **G-20u38c** | Production package verification (SEO · admin · secrets · freshness) | verify only |
| **G-20u38d** | Production manual FTP upload checklist (operator preflight) | checklist only · remote path must be confirmed |
| **G-20u38e** | Production upload result record | operator FileZilla · result record only |

**Alternate (operator choice before G-20u38b):** Contact HubSpot submit E2E on STG or prod preview — P1 from G-20u37c.

---

## 8. P1 carryovers (unchanged from G-20u37c)

| ID | Item |
| --- | --- |
| P1-ADM-MOB1 | Admin mobile left alignment (STG only — admin excluded from prod) |
| P1-CON1 | Contact HubSpot submit E2E not executed |
| P1-FTP1 | Production remote path confirmation (`TBD_G-20i` → operator path) |

---

## 9. Verdict

| Verdict | Value | Rationale |
| --- | --- | --- |
| **PRODUCTION_PACKAGE_PREP_PLANNED** | **true** | This planning doc + verifier complete |
| **PRODUCTION_PACKAGE_GENERATION_READY** | **CONDITIONAL** | Profile exists · tooling exists · G-20u38a preflight + HEAD regen required before build |
| **PRODUCTION_UPLOAD_READY** | **false** | No prod package at HEAD · remote path TBD · upload not executed |
| **PUBLIC_READY** | **CONDITIONAL** | STG QA complete · prod package/upload pending · contact E2E P1 |

```txt
PRODUCTION_PACKAGE_GENERATION_READY: CONDITIONAL
PRODUCTION_UPLOAD_READY: false
PUBLIC_READY: CONDITIONAL
```

**Reasons for CONDITIONAL (not YES):**

1. Production package **not yet generated** at HEAD `9944164`
2. G-20u38a static preflight not yet executed
3. Production remote FTP path **unconfirmed** (`TBD_G-20i`)
4. Contact submit E2E remains **P1 carryover**

---

## 10. What was NOT done this phase

| Item | Status |
| --- | --- |
| Implementation / code fixes | **no** |
| Production package build | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| FTP / upload | **no** |
| Production deploy | **no** |

---

## 11. Next

```txt
recommendedNextPhase: G-20u38a-gosaki-production-profile-static-preflight
```

G-20u38a: read-only verification of production profile · path separation · STOP checklist · confirm tooling before G-20u38b local build.
