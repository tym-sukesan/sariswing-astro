# G-20u15 — Current active regression suite

**Phase:** `G-20u15-current-active-regression-suite`  
**Base:** `3ae56b1` (G-20u14 committed)  
**Scope:** G-20u2–u14 + G-20u17–u19 site-aware active verifiers — **no FTP / deploy / DB write / package regen**

## Purpose

Run the current major development gates in one command without being blocked by historical verifier HEAD pins or mega legacy test suites.

```bash
cd tools/static-to-astro
npm run verify:current-active-regression
```

List only:

```bash
node scripts/verify-current-active-regression-suite.mjs --list
```

## Current active verifiers (17)

| ID | Area | Script |
| --- | --- | --- |
| G-20u2 | registry | `verify-g20u2-site-registry-build-profile-foundation.mjs` |
| G-20u3 | build | `verify-g20u3-build-site-package-generic-cli.mjs` |
| G-20u4 | verify | `verify-g20u4-verify-site-package-generic-cli.mjs` |
| G-20u5 | npm-flow | `verify-g20u5-site-package-npm-convenience-and-freshness-flow.mjs` |
| G-20u6 | hooks | `verify-g20u6-astro-generator-hook-registry.mjs` |
| G-20u7 | convert | `verify-g20u7-convert-pipeline-sitekey-propagation.mjs` |
| G-20u8 | pilot-noop | `verify-g20u8-second-site-noop-hooks-pilot-dry-run.mjs` |
| G-20u9 | pilot-full | `verify-g20u9-pilot-sample-static-full-package-build-verify.mjs` |
| G-20u10 | freshness | `verify-g20u10-site-aware-package-freshness-cli.mjs` |
| G-20u11 | preflight | `verify-g20u11-site-aware-preflight-scripts.mjs` |
| G-20u12a | readme-preflight | `verify-g20u12-manual-upload-readme-checklist-preflight-integration.mjs` |
| G-20u12b | build-safety | `verify-g20u12-pilot-build-enotempty-fix.mjs` |
| G-20u13 | supabase-read | `verify-g20u13-site-aware-supabase-loaders.mjs` |
| G-20u14 | url-staging | `verify-g20u14-url-to-staging-pipeline-site-aware.mjs` |
| G-20u17 | post-build-verify | `verify-g20u17-post-build-verifier-registry.mjs` |
| G-20u18 | cli-defaults | `verify-g20u18-package-json-cli-default-decoupling.mjs` |
| G-20u19 | generator-options | `verify-g20u19-generator-option-naming-and-fixture-registry.mjs` |

## Historical verifiers (excluded)

Not part of the current active gate. Run individually when needed:

| ID | Reason excluded |
| --- | --- |
| G-20u1 | Planning/audit inventory — not a runtime gate |
| G-7b+ (`verify-url-to-staging-pipeline.mjs`) | Mega legacy suite (G-7–G-9 markers); active url-staging gate is G-20u14 |
| G-20t3–t6 | HEAD-pinned regen / phase snapshot verifiers |

## Stale package handling

On-disk manual-upload packages are **expected stale** after commits.

The suite does **not** run:

- `npm run preflight:gosaki:staging` (would STOP on stale)
- `npm run build:gosaki:staging` (full regen)
- FTP deploy / mirror / DB write

Included freshness/preflight verifiers (G-20u10–u12) test **CLI behavior**:

- stale STOP semantics (expected PASS when stale detected)
- NOTE/skip when package missing on disk
- module/source assertions (dry-run)

## Safety

- No FTP / deploy / mirror / delete
- No DB write / SQL mutation
- No package upload
- No production changes

## npm script

```json
"verify:current-active-regression": "node scripts/verify-current-active-regression-suite.mjs"
```

## When to use

| Scenario | Command |
| --- | --- |
| Before commit (site-aware stack) | `npm run verify:current-active-regression` |
| Single area debug | `npm run verify:g20u14-url-staging` etc. |
| Legacy G-7/G-8/G-9 regression | `npm run verify:url-staging` (individual) |
| Upload preflight (needs fresh package) | `npm run preflight:gosaki:staging` after regen |

## Follow-up (G-20u15 child verifier HEAD pins)

G-20u2–u7 and G-20u9 child verifiers updated to G-20t2 NOTE policy for phase-base HEAD pins.
G-20u2 wrapper assertions updated for G-20u3 delegation.
G-20u5 preflight assertion updated for G-20u11 `run-site-preflight.mjs`.
G-20u9 on-disk stale MANIFEST/freshness uses NOTE or STOP-expected (not FAIL).

## Next

- Optional: CI job wrapping `verify:current-active-regression`
- Optional: split fast vs slow tiers if suite runtime grows
