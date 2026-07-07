# G-23h — Static-to-Astro onboarding orchestrator skeleton result

**Phase:** `G-23h-static-to-astro-onboarding-orchestrator-skeleton`  
**Status:** **complete** — orchestrator skeleton CLI; **no crawl / DB / SQL / package / FTP / deploy**  
**Date:** 2026-07-08  
**Base commit:** `3ca9c3a`  
**Prior:** [static-to-astro-seed-extractor-standardization-result.md](./static-to-astro-seed-extractor-standardization-result.md) (G-23g)

| Artifact | Path |
| --- | --- |
| Orchestrator CLI | `scripts/run-onboarding-orchestrator.mjs` |
| Verifier | `scripts/verify-g23h-static-to-astro-onboarding-orchestrator-skeleton.mjs` |

| Check | Status |
| --- | --- |
| Orchestrator skeleton implemented | **yes** |
| validate-only PASS | **yes** |
| fixture-dry-run PASS | **yes** |
| DB / network / crawl | **not used** |

---

## Gates

```txt
staticToAstroOnboardingOrchestratorSkeletonComplete: true
phase: G-23h-static-to-astro-onboarding-orchestrator-skeleton
readyForG23iFixtureModeOrchestratorIntegration: true
readyForG23jFirstNonNetworkSampleFullDryRun: true
readyForG23kCrawlDryRunPlanning: true
liveCrawlExecuted: false
networkAccess: false
dbConnectionAttempted: false
dbWriteExecuted: false
cursorSqlMutationExecuted: false
packageBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
filesCreated: 0
```

---

## 1. Purpose

Implement the **minimum orchestrator skeleton** that wires G-23b–G-23g building blocks into a single CLI for fixture/dry-run onboarding.

Pipeline: **config → validator → CMS preset registry validation → fixture load → seed extractor → dry-run report**

---

## 2. Orchestrator skeleton role

| Component | Module |
| --- | --- |
| Config validation | G-23c `validateOnboardingConfig` |
| Preset validation | G-23f `validateCmsPresetConfig` |
| Seed extraction | G-23g `extractOnboardingSeedCandidates` |
| Page classification | G-23d logic (inlined) |
| Safety gates | config `safetyGates` + planOnly enforcement |
| G-23d prototype | `run-onboarding-fixture-dry-run.mjs` retained — not replaced |

---

## 3. Supported modes

| Mode | Fixture required | Description |
| --- | --- | --- |
| `validate-only` | no | Config + registry validation + safety gates + steps 6–8 planOnly |
| `fixture-dry-run` | yes | Full steps 0–9 with fixture load + seed extraction |

---

## 4. Unsupported modes (NOT_IMPLEMENTED)

| Mode | G-23h behavior |
| --- | --- |
| `crawl-dry-run` | **NOT_IMPLEMENTED** — exit 2 |
| `seed-dry-run` | **NOT_IMPLEMENTED** — exit 2 |
| `package-dry-run` | **NOT_IMPLEMENTED** — exit 2 |
| `full-dry-run` | **NOT_IMPLEMENTED** — exit 2 |
| `apply-staging-db` | **NOT_IMPLEMENTED** — exit 2 |
| `prepare-upload-plan` | **NOT_IMPLEMENTED** — exit 2 |

---

## 5. Execution commands

### validate-only

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --mode validate-only
```

### fixture-dry-run

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --fixture tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --mode fixture-dry-run
```

Add `--json` for machine-readable output. **No report files written** in G-23h.

---

## 6. fixture-dry-run result

| Item | Value |
| --- | --- |
| Overall status | **PASS** |
| Config validation | PASS |
| Registry validation | PASS |
| Fixture load | PASS · 6 pages · fixtureOnly=true |
| Seed extraction | PASS |
| Page classification | PASS (news unmapped — WARN-level note) |

---

## 7. validate-only result

| Item | Value |
| --- | --- |
| Overall status | **PASS** |
| Config validation | PASS |
| Registry validation | PASS |
| Steps 2–5 | SKIP |
| Steps 6–8 | PLAN_ONLY |
| Next phase | G-23i-fixture-mode-orchestrator-integration |

---

## 8. Seed candidate counts (fixture-dry-run)

| Module | Count |
| --- | --- |
| schedule | **2** |
| news | **1** |
| profile | **1** |
| discography | **1** |
| video | **1** |
| contact | **1** |

**Total:** 7 active candidates

---

## 9. Safety gate summary

| Gate | Sample value | Status |
| --- | --- | --- |
| allowDbWrite | false | PASS |
| allowPackageBuild | false | PASS |
| allowFtpUpload | false | PASS |
| allowProductionDeploy | false | PASS |
| forbidMirrorDelete | true | PASS |
| forbidServiceRole | true | PASS |
| ftp.enabled | false | PASS |
| supabase.projectRef | kmjqppxjdnwwrtaeqjta (staging) | PASS |

---

## 10. DB step planOnly

Step 6 — **PLAN_ONLY** when `allowDbWrite=false` (default). No DB connection. Target ref and table list planned only.

---

## 11. Package step planOnly

Step 7 — **PLAN_ONLY** when `allowPackageBuild=false` (default). Output paths resolved but not created.

---

## 12. FTP/upload step planOnly

Step 8 — **PLAN_ONLY** when `allowFtpUpload=false` (default). Diff/QA checklist scope only; no FTP.

---

## 13–17. Safety — not executed

| Operation | Status |
| --- | --- |
| Live crawl | **not executed** |
| DB write | **not executed** |
| SQL mutation | **not executed** |
| Package regen | **not executed** |
| FTP / deploy | **not executed** |

---

## Steps 0–9 summary

| Step | Label | validate-only | fixture-dry-run |
| --- | --- | --- | --- |
| 0 | config validation | PASS | PASS |
| 1 | intake summary | PASS | PASS |
| 2 | fixture source | SKIP | PASS |
| 3 | page classification | SKIP | PASS |
| 4 | CMS module planner | SKIP | PASS |
| 5 | seed extraction | SKIP | PASS |
| 6 | staging DB | PLAN_ONLY | PLAN_ONLY |
| 7 | package | PLAN_ONLY | PLAN_ONLY |
| 8 | diff/QA | PLAN_ONLY | PLAN_ONLY |
| 9 | handoff | PASS | PASS |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-23i** | Fixture mode orchestrator integration |
| **G-23j** | First non-network sample full dry-run |
| **G-23k** | crawl-dry-run planning |

---

## Verification

```bash
node tools/static-to-astro/scripts/verify-g23h-static-to-astro-onboarding-orchestrator-skeleton.mjs
```
