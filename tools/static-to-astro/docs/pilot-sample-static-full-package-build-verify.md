# G-20u9 — Pilot sample static full package build + verify

**Phase:** `G-20u9-pilot-sample-static-full-package-build-verify`  
**Base commit:** `49f1786`  
**Gate:** `pilotSampleStaticFullPackageBuildVerifyComplete: true`

## Goal

Confirm `pilot-sample-static` passes **full package build** (not dry-run only) and **generic `verify-site-package`**, validating the multi-site build/package/verify path for a noop-hooks second site.

## Execution

```bash
cd tools/static-to-astro
node scripts/build-site-package.mjs --site pilot-sample-static --profile staging
npm run verify:pilot:staging
node scripts/verify-package-upload-freshness.mjs --package-dir output/manual-upload/pilot-sample-static
```

## Build result (HEAD `49f1786`)

| Item | Value |
| --- | --- |
| **Output** | `output/manual-upload/pilot-sample-static/` |
| **fileCount** | **9** |
| **includesAdmin** | `false` |
| **static-public verify** | PASS (`safeForStaticFtp: true`) |
| **verify-site-package** | PASS |
| **Gosaki env** | skipped (non-gosaki site) |

## MANIFEST (主要値)

| Field | Value |
| --- | --- |
| `siteKey` | `pilot-sample-static` |
| `targetEnvironment` | `staging` |
| `includesAdmin` | `false` |
| `sourceCommit` | `49f178637a67aa2d9b077500897b958d8410aac7` |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static/` |
| `intendedRemotePath` | `/cms-kit-staging/pilot-sample-static/` |
| `fileCount` | `9` |

## public-dist contents (9 files)

- `index.html`, `about/index.html`, `contact/index.html`, `service/index.html`
- `robots.txt`, `sitemap-0.xml`, `sitemap-index.xml`
- `assets/js/main.js`, `images/logo.svg`

**Not present:** `admin/`, `gosaki-*`, `discography/`, `schedule/2026-*`, HubSpot/YouTube hooks

## Infrastructure fixes (G-20u9)

| Module | Change |
| --- | --- |
| `static-public-site-expectations.mjs` | Per-site HTML/nav expectations (pilot vs gosaki) |
| `static-public-artifact-verifier.mjs` | `--site` + no Gosaki schedule fallback for pilot |
| `deploy-base.mjs` | Configurable `navSampleSegment` (`about` for pilot) |
| `build-site-package-core.mjs` | Pass `--site` to static-public verifier |

## Freshness

| Method | Status |
| --- | --- |
| `verify-package-upload-freshness.mjs --package-dir output/manual-upload/pilot-sample-static` | **PASS** at regen HEAD |
| `npm run verify:package-freshness:staging` | Gosaki-only default — **do not use for pilot** |
| `npm run verify:package-freshness:pilot` | Added — wraps `--package-dir` for pilot |

## Gosaki regression

- `build:gosaki:staging:dry-run` — PASS
- Gosaki schedule/sitemap gates unchanged (scoped to `gosaki-piano`)

## Package freshness note

Pilot + Gosaki on-disk packages are **fresh at regen HEAD**. **Commit after regen → stale** until rebuild + freshness verify.

## Not executed

- FTP / deploy  
- DB write  
- Production profile for pilot  
- Client preview  

## Next

- **G-20u10** — real second customer hook factory (when approved)
- Unify freshness CLI with `--site` registry resolution
