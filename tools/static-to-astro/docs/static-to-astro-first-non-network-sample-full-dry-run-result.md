# G-23j — Static-to-Astro first non-network sample full dry-run result

**Phase:** `G-23j-first-non-network-sample-full-dry-run`  
**Status:** **complete** — 30-minute flow pseudo-full execution on sample musician fixture  
**Date:** 2026-07-08  
**Base commit:** `7ce291f`  
**Prior:** [static-to-astro-fixture-mode-orchestrator-integration-result.md](./static-to-astro-fixture-mode-orchestrator-integration-result.md) (G-23i)

| Artifact | Path |
| --- | --- |
| Orchestrator (`full-dry-run` mode) | `scripts/run-onboarding-orchestrator.mjs` |
| Verifier | `scripts/verify-g23j-static-to-astro-first-non-network-sample-full-dry-run.mjs` |

| Check | Status |
| --- | --- |
| Non-network full dry-run PASS | **yes** |
| fixture-dry-run still PASS | **yes** |
| DB / network / crawl / package / FTP | **not executed** |

---

## Gates

```txt
staticToAstroFirstNonNetworkSampleFullDryRunComplete: true
phase: G-23j-first-non-network-sample-full-dry-run
readyForG23kCrawlDryRunPlanning: true
readyForG23lOnboardingReportOutputImplementation: true
readyForG23mSampleFullDryRunReportArtifact: true
readyForG23nLiveCrawlSafetyGatePlanning: true
legacyG23hFunctionalCompatibilityPass: true
legacyG23hVerifierHeadPinMismatchKnown: true
legacyG23hVerifierFullDryRunUnsupportedObsolete: true
legacyG23hVerifierKnownObsoleteFailuresOnly: true
liveCrawlExecuted: false
networkAccess: false
dbConnectionAttempted: false
dbWriteExecuted: false
sqlMutationExecuted: false
packageBuildExecuted: false
astroBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
filesCreated: 0
```

---

## 1. Purpose

Execute the **30-minute onboarding flow as a non-network pseudo-full dry-run** using the sample musician fixture — validating the full pipeline from config through handoff without crawl, DB, package, or FTP.

Pipeline: **config → validator → registry → fixture load → page classification → seed extraction → DB planOnly → package planOnly → upload planOnly → final report**

---

## 2. Non-network sample full dry-run

| Property | Value |
| --- | --- |
| Network | **none** |
| Live crawl | **none** |
| DB connection | **none** |
| DB write / SQL | **none** |
| Package / Astro build | **none** |
| FTP / deploy | **none** |
| Data source | `sample-musician-basic-crawl-result.json` (fixtureOnly=true) |
| Output | stdout / `--json` only — no `output/` files |

---

## 3. Execution command

### Recommended: `full-dry-run` mode (G-23j)

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --fixture tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --mode full-dry-run
```

### Also valid: `fixture-dry-run` (G-23h/G-23i)

Same pipeline core; `full-dry-run` adds warnings, risk summary, upload candidates, and plan detail fields.

---

## 4–9. Step results (sample musician)

| Step | Label | Status | Summary |
| --- | --- | --- | --- |
| 0 | config validation | **PASS** | config PASS · registry PASS |
| 1 | intake summary | **PASS** | siteSlug=sample-musician-fixture · cmsPreset=musician-basic · sourcePlatform=static |
| 2 | fixture source | **PASS** | 6 pages · 5 assets · fixtureOnly=true · liveCrawl=false |
| 3 | page classification | **PASS** | / home · /profile/ profile · /schedule/ schedule · /discography/ discography · /videos/ video · /contact/ contact · unmapped: news (WARN in warnings) |
| 4 | CMS module planner | **PASS** | schedule, news, profile, discography, video, contact enabled · news missing /news/ route (WARN) |
| 5 | seed extraction | **PASS** | 7 active candidates |
| 6 | staging DB | **PLAN_ONLY** | allowDbWrite=false · no connection · human approval required |
| 7 | package | **PLAN_ONLY** | allowPackageBuild=false · output paths only |
| 8 | diff/QA upload | **PLAN_ONLY** | allowFtpUpload=false · upload candidates listed only |
| 9 | handoff | **PASS** | next: G-23k-crawl-dry-run-planning |

**Overall: PASS**

---

## 10. Seed candidate counts

| Module | Count |
| --- | --- |
| schedule | **2** |
| news | **1** |
| profile | **1** |
| discography | **1** |
| video | **1** |
| contact | **1** |

**Total active candidates: 7**

---

## 11–13. PlanOnly steps

### Step 6 — DB planOnly

- `allowDbWrite=false`
- No DB connection · no SQL generated · no SQL executed
- `humanApprovalRequired=true`
- Staging ref: `kmjqppxjdnwwrtaeqjta`

### Step 7 — package planOnly

- `allowPackageBuild=false`
- No package build · no Astro build
- Output path candidates: astroOut, staticPublicOut, manualUploadOut (computed only)

### Step 8 — upload planOnly

- `allowFtpUpload=false`
- `requireOutputDiffReview=true`
- `requireUploadFileList=true`
- Upload candidate list (plan only) — no FTP connection

---

## 14. Safety gates summary

| Gate | Value | Status |
| --- | --- | --- |
| allowDbWrite | false | PASS |
| allowPackageBuild | false | PASS |
| allowFtpUpload | false | PASS |
| allowProductionDeploy | false | PASS |
| forbidMirrorDelete | true | PASS |
| forbidServiceRole | true | PASS |
| requireOutputDiffReview | true | PASS |
| requireUploadFileList | true | PASS |
| ftp.enabled | false | PASS |
| stagingOnly | true | PASS |

---

## 15. Warnings

| Code | Message |
| --- | --- |
| unmapped-module | enabled module **news** has no matching page route in fixture (missing `/news/`) |

Risk summary: `low-with-warnings` (1 warning) — non-blocking for dry-run PASS.

---

## 16. Final result

**PASS** — all steps 0–9 completed; steps 6–8 planOnly; no destructive operations.

---

## 17–21. Safety — not executed

| Operation | Status |
| --- | --- |
| Live crawl | **not executed** |
| Network access | **not executed** |
| DB connection | **not executed** |
| DB write | **not executed** |
| SQL mutation | **not executed** |
| Package regen / Astro build | **not executed** |
| FTP / deploy | **not executed** |

---

## G-23h legacy verifier compatibility

### G-23j change: `full-dry-run` formally supported

G-23j adds **`full-dry-run`** to `SUPPORTED_MODES`. It runs the same non-network fixture pipeline as `fixture-dry-run` with enhanced warnings, risk summary, and planOnly detail fields.

### G-23h legacy verifier — known obsolete expectations (not regressions)

The G-23h verifier (`verify-g23h-static-to-astro-onboarding-orchestrator-skeleton.mjs`) pins `BASE_COMMIT=3ca9c3a` and still expects `full-dry-run` to be **NOT_IMPLEMENTED**. At `7ce291f` it reports **4 FAIL** — all are **known obsolete expectations**, not fixture-dry-run regressions:

| # | Failure | Cause | Regression? |
| --- | --- | --- | --- |
| 1 | `HEAD is 3ca9c3a` | HEAD pin mismatch (later commits) | **no** |
| 2 | `origin/main is 3ca9c3a` | HEAD pin mismatch | **no** |
| 3 | `unsupported CLI exit 2` | G-23h expected `full-dry-run` → NOT_IMPLEMENTED; G-23j now supports it (exit 0) | **no** — obsolete expectation |
| 4 | `unsupported CLI NOT_IMPLEMENTED` | same as above | **no** — obsolete expectation |

### G-23h functional compatibility — maintained

| Area | Status |
| --- | --- |
| `validate-only` API / CLI | **PASS** |
| `fixture-dry-run` API / CLI | **PASS** |
| seedCounts (schedule 2 · others 1) | **PASS** |
| DB / package / upload planOnly steps | **PASS** |
| safety gates | **PASS** |
| `crawl-dry-run` still NOT_IMPLEMENTED | **PASS** |

**Do not** treat G-23h full verifier 0-failed as a G-23j gate. G-23j verifier separately confirms **legacy functional compatibility pass** and **known obsolete failures only**.

Fixing G-23h full pass requires a separate maintenance commit: update `BASE_COMMIT` to `7ce291f` and change unsupported-mode test from `full-dry-run` to `crawl-dry-run`.

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-23k** | crawl-dry-run planning |
| **G-23l** | onboarding report output implementation |
| **G-23m** | sample full dry-run report artifact |
| **G-23n** | live crawl safety gate planning |

---

## Verification

```bash
node tools/static-to-astro/scripts/verify-g23j-static-to-astro-first-non-network-sample-full-dry-run.mjs
```
