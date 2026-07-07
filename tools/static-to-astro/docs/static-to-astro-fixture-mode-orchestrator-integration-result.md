# G-23i — Static-to-Astro fixture mode orchestrator integration result

**Phase:** `G-23i-static-to-astro-fixture-mode-orchestrator-integration`  
**Status:** **complete** — orchestrator is standard entry; G-23d script is compatibility wrapper  
**Date:** 2026-07-08  
**Base commit:** `dfd1453`  
**Prior:** [static-to-astro-onboarding-orchestrator-skeleton-result.md](./static-to-astro-onboarding-orchestrator-skeleton-result.md) (G-23h)

| Artifact | Path |
| --- | --- |
| Standard entry | `scripts/run-onboarding-orchestrator.mjs` |
| Compatibility wrapper | `scripts/run-onboarding-fixture-dry-run.mjs` |
| Verifier | `scripts/verify-g23i-static-to-astro-fixture-mode-orchestrator-integration.mjs` |

| Check | Status |
| --- | --- |
| Orchestrator = standard entry | **yes** |
| G-23d script = compatibility wrapper | **yes** |
| Seed counts match both entries | **yes** |
| G-23d functional compatibility | **yes** |
| G-23h functional compatibility | **yes** |
| Crawl / DB / package / FTP | **not executed** |

---

## Gates

```txt
staticToAstroFixtureModeOrchestratorIntegrationComplete: true
phase: G-23i-static-to-astro-fixture-mode-orchestrator-integration
readyForG23jFirstNonNetworkSampleFullDryRun: true
readyForG23kCrawlDryRunPlanning: true
readyForG23lOnboardingReportOutputImplementation: true
legacyG23dFunctionalCompatibilityPass: true
legacyG23hFunctionalCompatibilityPass: true
legacyVerifierHeadPinMismatchKnown: true
legacyVerifierHeadPinMismatchOnly: true
liveCrawlExecuted: false
networkAccess: false
dbConnectionAttempted: false
dbWriteExecuted: false
cursorSqlMutationExecuted: false
packageBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
filesCreated: 0
```

---

## 1. Purpose

Integrate G-23d fixture dry-run with G-23h orchestrator so **one standard pipeline** serves fixture onboarding, while preserving the legacy CLI for existing docs and verifiers.

---

## 2. Orchestrator as standard entry

`run-onboarding-orchestrator.mjs --mode fixture-dry-run` is the **canonical** fixture onboarding path going forward. It runs:

config → G-23c validator → G-23f registry → fixture load → page classification → CMS planner → G-23g seed extractor → safety gates → steps 0–9.

---

## 3. Why keep G-23d script

| Reason | Detail |
| --- | --- |
| Backward compatibility | Existing docs, G-23d verifier, and positional-arg CLI |
| No breaking change | `run-onboarding-fixture-dry-run.mjs` path unchanged |
| Gradual migration | Operators can adopt `--config --fixture --mode` when ready |

Script is **not deleted** — it delegates to orchestrator and maps output to G-23d JSON/human format.

---

## 4. Standard vs compatibility entry

| | Standard | Compatibility |
| --- | --- | --- |
| Script | `run-onboarding-orchestrator.mjs` | `run-onboarding-fixture-dry-run.mjs` |
| Args | `--config` `--fixture` `--mode fixture-dry-run` | positional config + fixture |
| Output phase | `G-23h-onboarding-orchestrator-skeleton` | `G-23d-onboarding-fixture-dry-run` |
| Delegation | native | `delegatedTo: run-onboarding-orchestrator.fixture-dry-run` |
| Seed counts | `moduleCandidateCounts` | `seedCounts` (same values) |

---

## 5. Execution commands

### Standard entry

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --fixture tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --mode fixture-dry-run
```

### Compatibility entry

```bash
node tools/static-to-astro/scripts/run-onboarding-fixture-dry-run.mjs \
  tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json
```

Both support `--json`.

---

## 6. Standard entry result

| Item | Value |
| --- | --- |
| Overall | **PASS** |
| Config validation | PASS |
| Registry validation | PASS |
| Fixture load | PASS · fixtureOnly=true |
| Seed extraction | PASS |
| Safety gates planOnly | db · package · upload = true |

---

## 7. Compatibility entry result

| Item | Value |
| --- | --- |
| Overall | **PASS** |
| Delegated to | `run-onboarding-orchestrator.fixture-dry-run` |
| Config validation | PASS |
| Fixture load | PASS |
| 30-min timeline steps | 7 steps PASS |
| Safety gates | PASS · planOnly |

---

## 8. Seed candidate counts (both entries match)

| Module | Standard | Compatibility |
| --- | --- | --- |
| schedule | **2** | **2** |
| news | **1** | **1** |
| profile | **1** | **1** |
| discography | **1** | **1** |
| video | **1** | **1** |
| contact | **1** | **1** |

---

## 9. Safety gates (both entries)

| Gate | Value | planOnly |
| --- | --- | --- |
| allowDbWrite | false | db step planOnly |
| allowPackageBuild | false | package step planOnly |
| allowFtpUpload | false | upload step planOnly |
| ftp.enabled | false | — |

---

## 10. Legacy verifier compatibility (G-23d / G-23h)

### Functional compatibility — maintained

G-23i does **not** change orchestrator fixture-dry-run behavior. The compatibility wrapper preserves:

| Area | Status |
| --- | --- |
| API shape (`ok`, `status`, `seedCounts`, `steps`, `fixtureOnly`) | **maintained** |
| seedCounts (schedule 2 · others 1) | **maintained** |
| CLI human output (`G-23d Onboarding fixture dry-run: PASS`) | **maintained** |
| `--json` output | **maintained** |
| `fixtureOnly=true` | **maintained** |
| safety gates planOnly (db · package · upload) | **maintained** |
| no live crawl / no DB / no package / no FTP | **maintained** |

### Legacy verifier full pass vs functional pass

| Verifier | Pinned `BASE_COMMIT` | At `dfd1453` full run | Functional checks |
| --- | --- | --- | --- |
| G-23d | `dac762c` | **2 FAIL** (HEAD pin only) | **PASS** (90/90 functional) |
| G-23h | `3ca9c3a` | **2 FAIL** (HEAD pin only) | **PASS** (76/76 functional) |

**Only failures at `dfd1453`:**

```txt
G-23d: FAIL HEAD is dac762c — dfd1453
       FAIL origin/main is dac762c — dfd1453
G-23h: FAIL HEAD is 3ca9c3a — dfd1453
       FAIL origin/main is 3ca9c3a — dfd1453
```

No API, seedCount, CLI, fixture, or safety-gate assertion regressed. Failures are **known HEAD-pin mismatch** from later commits (G-23f → G-23g → G-23h → G-23i), not integration regressions.

### G-23i verifier handling

`verify-g23i-static-to-astro-fixture-mode-orchestrator-integration.mjs` explicitly:

1. Runs legacy G-23d / G-23h verifiers
2. Separates HEAD-pin failures from functional failures
3. Asserts **legacy functional compatibility pass** (not legacy full pass)
4. Confirms failure lines match `HEAD is` / `origin/main is` only

**Do not** expect G-23d/G-23h verifiers to report 0 failed at `dfd1453` without rebasing their `BASE_COMMIT` pins — that is a separate maintenance task, not a G-23i regression.

---

## 11–15. Safety — not executed

| Operation | Status |
| --- | --- |
| Live crawl | **not executed** |
| DB write | **not executed** |
| SQL mutation | **not executed** |
| Package regen | **not executed** |
| FTP / deploy | **not executed** |

`fixtureOnly=true` required — maintained in orchestrator fixture-dry-run mode.

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-23j** | First non-network sample full dry-run |
| **G-23k** | crawl-dry-run planning |
| **G-23l** | Onboarding report output implementation |

---

## Verification

```bash
node tools/static-to-astro/scripts/verify-g23i-static-to-astro-fixture-mode-orchestrator-integration.mjs
```
