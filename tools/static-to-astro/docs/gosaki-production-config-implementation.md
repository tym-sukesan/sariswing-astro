# G-20h1 — Gosaki production config implementation

**Phase:** `G-20h1-gosaki-production-config-implementation`  
**Status:** **complete** — deploy profile JSON + build profile lib + production build script + npm scripts; **production build not executed**  
**Date:** 2026-07-01  
**Base commit:** `f35e462`  
**Prior:** [gosaki-production-config-implementation-planning.md](./gosaki-production-config-implementation-planning.md) (G-20g)

| Check | Status |
| --- | --- |
| Deploy profiles JSON | **yes** |
| Build profile lib | **yes** |
| Production build script | **yes** |
| npm scripts | **yes** |
| Staging build script unchanged | **yes** |
| Production package build executed | **no** |
| FTP / DNS / DB write | **no** |

---

## Gates

```txt
gosakiProductionConfigImplementationComplete: true
phase: G-20h1-gosaki-production-config-implementation
readyForG20h2ProductionPackageLocalBuild: true
productionBuildExecuted: false
packageRegenExecuted: false
cursorFtpExecuted: false
cursorDbWriteExecuted: false
dnsChangeExecuted: false
sslChangeExecuted: false
stagingBuildScriptBehaviorUnchanged: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Files created

| File | Role |
| --- | --- |
| `config/sites/gosaki-piano.deploy-profiles.json` | staging + production deploy profiles |
| `scripts/lib/gosaki-package-build-profile.mjs` | Profile loader / validator |
| `scripts/build-gosaki-production-package.mjs` | Production package build entry (not run in G-20h1) |
| `package.json` | `build:gosaki-production-package`, `manual-upload:package:gosaki-production`, `verify:manual-upload:gosaki-production` |

**Staging script unchanged:** `build-gosaki-staging-admin-package.mjs` — hardcoded staging URLs/paths preserved.

---

## 2. Deploy profiles summary

### Staging profile

| Field | Value |
| --- | --- |
| origin | `https://yskcreate.weblike.jp` |
| baseUrl | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano` |
| publicUrl | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| deployBase | `/cms-kit-staging/gosaki-piano/` |
| outputName | `gosaki-piano` |
| manualUploadOut | `output/manual-upload/gosaki-piano` |
| seo | stagingNoindex / robotsDisallowAll |

### Production profile

| Field | Value |
| --- | --- |
| origin | `https://www.gosaki-piano.com` |
| baseUrl | `https://www.gosaki-piano.com` |
| publicUrl | `https://www.gosaki-piano.com/` |
| deployBase | `/` |
| outputName | `gosaki-piano-production` |
| manualUploadOut | `output/manual-upload/gosaki-piano-production` |
| seo | productionIndexable (no staging noindex) |
| supabaseProjectRef | `kmjqppxjdnwwrtaeqjta` (interim SoT) |

### Staging vs production differences

| Item | Staging | Production |
| --- | --- | --- |
| deployBase | subdir | `/` |
| Output trees | `gosaki-piano/` | `gosaki-piano-production/` |
| SEO | noindex + Disallow | indexable (via existing libs when built) |
| Remote path | `/cms-kit-staging/gosaki-piano/` | `TBD_G-20i` |

---

## 3. Production build script (not executed)

```bash
# G-20h2 only — do not run in G-20h1
node tools/static-to-astro/scripts/build-gosaki-production-package.mjs
# or
npm run build:gosaki-production-package
```

Pipeline (when executed): convert → verify-static-public-artifact → manual-upload:package:gosaki-production → verify:manual-upload:gosaki-production.

---

## 4. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| `build-gosaki-production-package.mjs` | **no** |
| `npm run build:gosaki-production-package` | **no** |
| `npm run manual-upload:package:gosaki-production` | **no** |
| Staging package regen | **no** |
| FTP / upload | **no** |
| DNS / SSL | **no** |
| DB write / Save | **no** |
| commit / push | **no** |

---

## 5. Next phase

**G-20h2** — first local production package build + `verify-gosaki-production-package-build.mjs` (SEO / noindex / canonical / sitemap checks).

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20h1-gosaki-production-config-implementation.mjs
```
