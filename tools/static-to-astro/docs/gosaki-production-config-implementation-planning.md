# G-20g — Gosaki production config implementation planning

**Phase:** `G-20g-gosaki-production-config-implementation-planning`  
**Status:** **complete** — read-only build/config survey + implementation plan only; **no code changes, no production build**  
**Date:** 2026-07-01  
**Base commit:** `f36e857`  
**Client:** 後藤沙紀さん（gosaki-piano / pianist personal site）  
**Prior:** [gosaki-production-release-config-and-cutover-preflight.md](./gosaki-production-release-config-and-cutover-preflight.md) (G-20f)

| Check | Status |
| --- | --- |
| Staging build/config survey | **yes** |
| Production switch design | **yes** |
| Options A / B / C comparison | **yes** |
| Recommended approach | **Option C + production build script (B)** |
| G-20h verifier checklist design | **yes** |
| Phase split G-20h1–G-20k | **yes** |
| Implementation / production build | **no** |

---

## Gates

```txt
gosakiProductionConfigImplementationPlanningComplete: true
phase: G-20g-gosaki-production-config-implementation-planning
recommendedApproach: option-c-deploy-profile-plus-production-build-script
readyForG20h1ProductionConfigImplementation: true
readyForG20h2ProductionPackageLocalBuild: false
readyForG20iClientServerUploadPreflight: false
readyForG20jManualProductionUpload: false
implementationExecuted: false
packageRegenExecuted: false
productionBuildExecuted: false
cursorFtpExecuted: false
cursorDbWriteExecuted: false
dnsChangeExecuted: false
```

**Supabase interim production SoT:** `kmjqppxjdnwwrtaeqjta` only.  
**STOP — never use Sariswing production:** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

| Item | Value |
| --- | --- |
| `HEAD` | `f36e857` |
| `origin/main` | `f36e857` |
| Working tree | clean at planning start |

---

## 2. Current staging build/config survey (read-only)

### 2.1 Entry script — `build-gosaki-staging-admin-package.mjs`

| Item | Current value |
| --- | --- |
| Env loader | `gosaki-staging-admin-public-env.mjs` — blocks `vsbvndwuajjhnzpohghh` |
| Fixture input | `fixtures/gosaki-piano` |
| Astro output | `output/gosaki-piano-astro` |
| `--base-url` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano` |
| `--deploy-base` | `/cms-kit-staging/gosaki-piano/` |
| Post-convert | `verify-static-public-artifact.mjs` → `output/static-public/gosaki-piano/` |
| Package | `npm run manual-upload:package` → `output/manual-upload/gosaki-piano/` |
| Verify | `npm run verify:manual-upload` |

**All production URLs are hardcoded as staging** — no profile switch today.

### 2.2 Convert CLI — `convert-static-to-astro.mjs`

| Flag | Role |
| --- | --- |
| `--base-url` | Astro `site` + canonical / og:url / sitemap host |
| `--deploy-base` | Astro `base` when not `/`; drives SEO mode via `isStagingSubdirBuild()` |
| `--site-profile` | `musician` — unchanged for production |
| `--verify-build` | Astro build in convert pipeline |

**Key:** `deployBase=/` already triggers production SEO path in existing libs — **no new noindex logic required** if flags are set correctly.

### 2.3 SEO generation chain

| Layer | Module | Staging (`deployBase≠/`) | Production (`deployBase=/`) |
| --- | --- | --- | --- |
| noindex meta | `astro-generator.mjs` BaseLayout | `noindex,nofollow,noarchive` | **omitted** |
| robots.txt | `seo-publish.mjs` `generateRobotsTxt` | `Disallow: /` | `Allow: /` + Sitemap line |
| canonical / og:url | `deploy-base.mjs` `applyBaseUrlToSeo` | staging deploy origin | production `--base-url` |
| Leak guard | `STAGING_CANONICAL_LEAK_PATTERN` | blocks `www.gosaki-piano.com` in staging meta | N/A for prod build |
| Readiness flags | `buildSeoPublishReadiness` | `stagingNoindex: true` | `productionIndexable: true` |
| Artifact verify | `static-public-artifact-verifier.mjs` | checks staging preview HTML | **needs production profile checks in G-20h2** |

### 2.4 Astro config generation

`generateAstroConfig(baseUrl, deployBase)` in `astro-generator.mjs`:

- `site: "https://…"` from `--base-url`
- `base: "/cms-kit-staging/gosaki-piano/"` only when `deployBase ≠ /`
- `@astrojs/sitemap` integration — URLs follow `site` + routes
- `trailingSlash: "always"`

Production: `base` line **omitted** when `deployBase=/`; asset paths become `/_astro/…` not `/cms-kit-staging/gosaki-piano/_astro/…`.

### 2.5 Manual upload package

| Item | Staging today |
| --- | --- |
| npm script | `manual-upload:package` — hardcoded `gosaki-piano` paths |
| Source | `output/static-public/gosaki-piano/public-dist` |
| Out | `output/manual-upload/gosaki-piano` |
| Manifest | `deployBase`, `stagingUrl` in `manual-upload-package.mjs` |
| File count | **27** (reference) |
| CSS check | `verifyPublicDistCssPresence` uses manifest `deployBase` |

**Gap:** production package must use **separate output dirs** so staging reflection uploads are not overwritten.

### 2.6 public-dist composition (staging reference)

```txt
index.html
discography/index.html
schedule/index.html
schedule/2026-03/ … 2026-07/
2026-03/ … 2026-07/          # legacy month stubs
about/index.html
contact/index.html
link/index.html
robots.txt
sitemap-index.xml
sitemap-0.xml
_astro/*.css
_astro/*.js
images/bands/*.jpg
```

Admin shell pages are **not** in public-dist (dev-only `__admin-staging-shell`).

### 2.7 Data sources (unchanged for production v1)

| Source | Production build |
| --- | --- |
| Schedule | `scheduleDataSource=supabase` — `kmjqppxjdnwwrtaeqjta` |
| Discography | `discographyDataSource=supabase` — same |
| YouTube | `gosaki-piano-youtube-embed.json` |
| About | `gosaki-piano-about-content.json` + band profiles |
| Contact | `gosaki-piano-contact-hubspot.json` |
| Env at build | `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` from `.env` (staging ref — Option A) |

`validateGosakiStagingAdminPublicEnv` already **rejects** `vsbvndwuajjhnzpohghh` — reuse for production build with same staging keys (interim SoT).

### 2.8 Existing config files

| File | Production-ready? |
| --- | --- |
| `gosaki-piano.url-to-staging.json` | Has `productionBaseUrl` but staging-only `deployBase` |
| `gosaki.site-config.example.json` | `deploy.production.enabled: false` — template only |
| `staging-generation-planner.mjs` + `site-config-loader.mjs` | Kit planner exists — **not wired** to Gosaki build script |

---

## 3. Production config switch design

### 3.1 Target production profile

| Setting | Value |
| --- | --- |
| **site origin (`--base-url`)** | `https://www.gosaki-piano.com` |
| **deployBase (`--deploy-base`)** | `/` |
| **public URL** | `https://www.gosaki-piano.com/` |
| **canonical / og:url** | `https://www.gosaki-piano.com{route}/` per page |
| **sitemap index** | `https://www.gosaki-piano.com/sitemap-index.xml` |
| **robots.txt** | `Allow: /` + production sitemap line |
| **noindex** | **absent** on all public pages |
| **asset paths** | `/_astro/…` (root deploy) |
| **astro output** | `output/gosaki-piano-astro-production` |
| **static-public** | `output/static-public/gosaki-piano-production/` |
| **manual-upload** | `output/manual-upload/gosaki-piano-production/` |
| **package name / zip** | `gosaki-piano-production-manual-upload.zip` |
| **Supabase** | `kmjqppxjdnwwrtaeqjta` (interim SoT — G-20f Option A) |

### 3.2 Staging coexistence rules

| Rule | Rationale |
| --- | --- |
| **Separate output trees** | Staging reflection chain must keep writing to `gosaki-piano/` paths |
| **Staging script unchanged in G-20h1** | Avoid regressing proven G-14c–G-20e reflection flow |
| **Production script new** | `build-gosaki-production-package.mjs` only |
| **Shared lib optional** | Extract `runGosakiPackageBuild(profile)` after production path proven |
| **npm scripts** | Add `manual-upload:package:production` — do not replace staging script |

### 3.3 Per-field switch mechanism (no new SEO code expected)

| Field | Switch mechanism |
| --- | --- |
| site origin | `--base-url` CLI arg |
| deployBase | `--deploy-base /` |
| canonical / og:url | `applyBaseUrlToSeo` + `buildDeployOrigin` |
| sitemap URLs | Astro `site` config |
| robots.txt | `generateRobotsTxt` when `!isStagingSubdirBuild` |
| noindex | BaseLayout omits robots meta when `!shouldApplyStagingNoindex` |
| asset paths | Astro `base` omitted at `/` |
| output paths | **new profile JSON** (not CLI alone) |

---

## 4. Implementation options comparison

### Option A — Production mode flag on staging script

Add `--profile production` to `build-gosaki-staging-admin-package.mjs`.

| Pros | Cons |
| --- | --- |
| Fastest single-file change | Name says "staging"; mixes concerns |
| Reuses env validation | Easy to run wrong profile accidentally |
| One script to maintain | Harder Kit generalization (G-21) |

### Option B — Dedicated production build script

New `build-gosaki-production-package.mjs` with hardcoded production URLs.

| Pros | Cons |
| --- | --- |
| Clear separation | URL/path duplication vs staging script |
| Staging script untouched | Two scripts drift over time |
| Fast to ship | Weak path to multi-site Kit |

### Option C — Deploy profile JSON + build scripts

Add `config/sites/gosaki-piano.deploy-profiles.json` (staging + production profiles); scripts read profile.

| Pros | Cons |
| --- | --- |
| Single source of truth for URLs/paths | Slightly more G-20h1 scope |
| Maps to G-21 site-config generalization | Requires loader + verifier |
| Staging + production coexist cleanly | — |

### 4.1 Recommendation — **Option C + production script (B)**

**Fastest safe path that generalizes:**

1. **G-20h1:** Add `config/sites/gosaki-piano.deploy-profiles.json` with `staging` and `production` profiles.
2. **G-20h1:** Add `scripts/lib/gosaki-package-build-profile.mjs` — load profile, validate refs, return build args.
3. **G-20h1:** Add `build-gosaki-production-package.mjs` — calls convert/verify/package with `production` profile.
4. **G-20h1 (optional follow-up):** Refactor staging script to use same lib — **non-blocking**; staging hardcoded paths stay until refactor proven.
5. **G-20h2:** First production build + new verifier (below).

**Do not** extend staging script with a flag only (Option A) — avoids operator confusion and supports G-21.

---

## 5. Proposed deploy profile JSON (G-20h1 — not created in G-20g)

```json
{
  "$comment": "G-20h1 — Gosaki deploy profiles. No secrets.",
  "siteSlug": "gosaki-piano",
  "fixtureDir": "fixtures/gosaki-piano",
  "profiles": {
    "staging": {
      "baseUrl": "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
      "deployBase": "/cms-kit-staging/gosaki-piano/",
      "publicUrl": "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/",
      "astroOut": "output/gosaki-piano-astro",
      "staticPublicOut": "output/static-public/gosaki-piano",
      "manualUploadOut": "output/manual-upload/gosaki-piano",
      "remotePath": "/cms-kit-staging/gosaki-piano/",
      "supabaseProjectRef": "kmjqppxjdnwwrtaeqjta"
    },
    "production": {
      "baseUrl": "https://www.gosaki-piano.com",
      "deployBase": "/",
      "publicUrl": "https://www.gosaki-piano.com/",
      "astroOut": "output/gosaki-piano-astro-production",
      "staticPublicOut": "output/static-public/gosaki-piano-production",
      "manualUploadOut": "output/manual-upload/gosaki-piano-production",
      "remotePath": "TBD_G-20i",
      "supabaseProjectRef": "kmjqppxjdnwwrtaeqjta"
    }
  }
}
```

---

## 6. G-20h production build verifier design (G-20h2)

**New script (implementation phase):** `verify-gosaki-production-package-build.mjs`

### 6.1 Profile / manifest checks

| Check | Expected |
| --- | --- |
| Profile loaded | `production` |
| `deployBase` | `/` |
| `baseUrl` | `https://www.gosaki-piano.com` |
| Output dir | `gosaki-piano-production` (not staging path) |
| `safeForStaticFtp` | `true` |
| `stagingNoindex` | **false** |
| `productionIndexable` | **true** |
| `robotsDisallowAll` | **false** |

### 6.2 SEO leak checks (sample HTML routes)

Routes: `/`, `/discography/`, `/schedule/`, `/about/`, `/contact/`

| Check | Expected |
| --- | --- |
| **no** `noindex` in `<head>` | pass |
| **no** `yskcreate.weblike.jp` in canonical / og:url | pass |
| canonical host | `www.gosaki-piano.com` |
| og:url host | `www.gosaki-piano.com` |
| trailing slash | consistent with Astro `always` |

### 6.3 robots.txt / sitemap

| Check | Expected |
| --- | --- |
| `robots.txt` | `Allow: /` |
| `robots.txt` | **no** `Disallow: /` |
| Sitemap line | `https://www.gosaki-piano.com/sitemap-index.xml` |
| `sitemap-index.xml` | all `<loc>` use `www.gosaki-piano.com` |
| **no** staging URLs in sitemap | pass |

### 6.4 Asset paths (`deployBase=/`)

| Check | Expected |
| --- | --- |
| CSS ref | `/_astro/index.*.css` (no staging prefix) |
| `_astro/` files exist in package | pass |
| HTML asset refs resolve in package | pass |

### 6.5 Content checks (Supabase-backed)

| Check | Expected |
| --- | --- |
| `discographyDataSource=supabase` | present |
| `Like a Lover（テスト）` | **absent** |
| `Mary Ann（テスト）` | **absent** |
| `Like a Lover` / `Mary Ann` | present |
| `scheduleDataSource=supabase` | on month pages |
| Ja-Jaaaaan! / SKYLARK track counts | 8 each |

### 6.6 Scope / safety

| Check | Expected |
| --- | --- |
| File count | ~27 (same route set as staging) |
| `admin/` in public-dist | absent (or read-only Gosaki admin only if explicitly included — default **no**) |
| Supabase host | `kmjqppxjdnwwrtaeqjta` |
| Sariswing prod ref | **absent** |

### 6.7 Extend existing verifiers

| Verifier | Change in G-20h1 |
| --- | --- |
| `verify-static-public-artifact.mjs` | Accept `--profile production` or `--deploy-base /` production expectations |
| `verify-manual-upload-package.mjs` | Accept production manifest path |
| `manual-upload-package.mjs` | Read `deployBase` / `publicUrl` from profile |

---

## 7. Implementation phase split

| Phase | Scope | Build? | FTP? |
| --- | --- | --- | --- |
| **G-20g** | This planning doc | **no** | **no** |
| **G-20h1** | Deploy profile JSON + `gosaki-package-build-profile.mjs` + `build-gosaki-production-package.mjs` + npm scripts + verifier stubs | **no** (code only) | **no** |
| **G-20h2** | First local production package build + `verify-gosaki-production-package-build.mjs` full PASS | **yes** (local) | **no** |
| **G-20i** | Client server upload preflight — remote path, credentials, file manifest, G-7f1 checklist | **no** | **no** |
| **G-20j** | Operator manual production FTP upload (full package) | **no** | **yes** (operator) |
| **G-20k** | Production HTTP verify + release result doc | **no** | **no** |
| **G-20l** (candidate) | DNS / SSL cutover | — | DNS operator |
| **G-21** | Kit generalization — profile loader for any site | — | — |

**G-20h1 deliverables (code — next phase):**

1. `config/sites/gosaki-piano.deploy-profiles.json`
2. `scripts/lib/gosaki-package-build-profile.mjs`
3. `scripts/build-gosaki-production-package.mjs`
4. `package.json` — `build:gosaki-production-package`, `manual-upload:package:production`
5. `verify-gosaki-production-package-build.mjs` (shell — full run in G-20h2)
6. Unit verifier: `verify-gosaki-package-build-profile.mjs`

**G-20h1 must not:** run convert/build, touch FTP, change DNS, write DB.

---

## 8. Staging vs production quick reference

| Item | Staging | Production |
| --- | --- | --- |
| Origin | `yskcreate.weblike.jp/.../gosaki-piano` | `www.gosaki-piano.com` |
| deployBase | `/cms-kit-staging/gosaki-piano/` | `/` |
| noindex | yes | **no** |
| robots | Disallow `/` | Allow `/` |
| canonical | staging host | `www.gosaki-piano.com` |
| Build script | `build-gosaki-staging-admin-package.mjs` | `build-gosaki-production-package.mjs` (planned) |
| Package out | `manual-upload/gosaki-piano/` | `manual-upload/gosaki-piano-production/` |
| Remote path | `/cms-kit-staging/gosaki-piano/` | TBD (G-20i) |
| Supabase | `kmjqppxjdnwwrtaeqjta` | same (interim) |

---

## 9. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Code implementation | **no** |
| Production / staging package build | **no** |
| FTP / upload / mirror / sync / delete | **no** |
| DNS / SSL change | **no** |
| SQL / Save / DB write | **no** |
| Sariswing production | **no** |
| commit / push | **no** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20g-gosaki-production-config-implementation-planning.mjs
```
