# G-23l — Static-to-Astro onboarding report output result

**Phase:** `G-23l-onboarding-report-output`  
**Status:** **complete** — local report artifacts from orchestrator dry-run  
**Date:** 2026-07-08  
**Base commit:** `5b9ceb0`  
**Prior:** [static-to-astro-crawl-dry-run-safety-planning.md](./static-to-astro-crawl-dry-run-safety-planning.md) (G-23k) · [static-to-astro-first-non-network-sample-full-dry-run-result.md](./static-to-astro-first-non-network-sample-full-dry-run-result.md) (G-23j)

| Artifact | Path |
| --- | --- |
| Report writer | `scripts/lib/onboarding-report-writer.mjs` |
| Orchestrator (`--write-report`) | `scripts/run-onboarding-orchestrator.mjs` |
| Verifier | `scripts/verify-g23l-static-to-astro-onboarding-report-output.mjs` |

| Check | Status |
| --- | --- |
| Report writer module | **yes** |
| `--write-report` CLI | **yes** |
| full-dry-run report PASS | **yes** |
| output/ gitignored | **yes** |
| Live crawl / network / DB / package / FTP | **not executed** |

---

## Gates

```txt
staticToAstroOnboardingReportOutputComplete: true
phase: G-23l-onboarding-report-output
readyForG23mSampleFullDryRunReportArtifactReview: true
readyForG23nLiveCrawlAllowlistConfig: true
readyForG23oFirstApprovedCrawlDryRun: false
legacyG23jVerifierHeadPinMismatchKnown: true
legacyG23jVerifierNextRecommendedPhaseObsolete: true
legacyG23jVerifierKnownObsoleteFailuresOnly: true
legacyG23jFunctionalCompatibilityPass: true
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
cursorCrawlExecuted: false
cursorNetworkAccess: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
cursorPackageBuildExecuted: false
cursorFtpUploadExecuted: false
cursorDeployExecuted: false
```

---

## 1. Purpose

Save G-23j non-network full dry-run / G-23h orchestrator results as **reviewable local report artifacts** under `output/onboarding-reports/{siteSlug}/latest/`. Enables human review of dry-run results, seed candidates, safety gates, and planOnly state before any live crawl.

---

## 2. Report output role

| Role | Detail |
| --- | --- |
| Human review | Markdown checklists for operators |
| Seed preview | Module-level candidates — **NOT SQL** |
| Risk summary | Blocked operations and safety gates |
| Machine summary | JSON for tooling / future UI |
| Separation | Local file write only — no DB / network / FTP |

---

## 3. Execution command

### Recommended: full-dry-run with report

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --fixture tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --mode full-dry-run \
  --write-report
```

### Explicit report directory

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --fixture tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --mode full-dry-run \
  --report-out tools/static-to-astro/output/onboarding-reports/sample-musician-fixture/latest
```

### JSON output includes reportPath

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --fixture tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --mode full-dry-run \
  --write-report \
  --json
```

Without `--write-report`: stdout / `--json` only (unchanged from G-23j).

---

## 4. Generated reports

| File | Format | Purpose |
| --- | --- | --- |
| `summary.json` | JSON | Mode, status, validation, safety gates, steps, seed counts, warnings |
| `seeds-preview.json` | JSON | Module seed candidates (raw/normalized) — **not DB SQL** |
| `human-review.md` | Markdown | 30-min flow checklist, planOnly status, warnings, proceed conditions |
| `risk-summary.md` | Markdown | Blocked ops, safety gates, risk level |

**Output directory strategy:** `{siteSlug}/latest/` — **overwrite on each run** (safe because `output/` is gitignored). Use `--report-out` for explicit path under `onboarding-reports/`.

---

## 5. summary.json contents

- `mode`, `siteSlug`, `cmsPreset`, `overall`, `generatedAt`
- `validation` (config + registry status)
- `safetyGates` (status, planOnly, rows)
- `steps` (0–9 summaries)
- `seedCounts`, `totalActiveCandidates`
- `warnings`, `riskSummary`, `nextRecommendedPhase`
- `operationsNotExecuted` (all false for destructive ops)

---

## 6. seeds-preview.json contents

- `notDbSql: true` + disclaimer
- `byModule` with candidates per module (schedule, news, profile, discography, video, contact)
- Each candidate: `raw`, `normalized`, `warnings`, `confidence`, `status`
- Sample counts: schedule **2**, news/profile/discography/video/contact **1** each

---

## 7. human-review.md contents

- 30-minute flow step table
- **DB planOnly** / **package planOnly** / **upload planOnly**
- Seed candidate counts
- Warning list
- Conditions to proceed (no live crawl without G-23n/G-23o approval)

---

## 8. risk-summary.md contents

- **実クロールなし** / **DBなし** / **FTPなし** / networkなし
- Safety gate table
- Plan-only enforcement
- Blocked operations list

---

## 9. Output path safety design

| Rule | Implementation |
| --- | --- |
| Allowed root | `tools/static-to-astro/output/onboarding-reports/` only |
| Path traversal | Rejected via `assertReportPathAllowed` |
| siteSlug validation | Alphanumeric + hyphens only |
| `--report-out` | Must resolve under reports root |
| output/ gitignore | `tools/static-to-astro/.gitignore` → `output/*` |

---

## 10. Output外書き込み拒否

`assertReportPathAllowed` rejects any path outside `output/onboarding-reports/`. Orchestrator never writes elsewhere when `--write-report` is used.

---

## 11. Git tracked outputなし

`output/` is gitignored. Report files are local-only artifacts. `git status` must not show tracked diffs under `output/`.

---

## 12–17. Operations NOT executed

| Operation | Status |
| --- | --- |
| 実クロール | **not executed** |
| Network access | **not executed** |
| DB write | **not executed** |
| SQL mutation | **not executed** |
| Package build | **not executed** |
| FTP / deploy | **not executed** |

---

## 18. Next phases

| Phase | Scope |
| --- | --- |
| **G-23m** | Sample full dry-run report artifact review |
| **G-23n** | Live crawl allowlist config |
| **G-23o** | First approved crawl-dry-run (operator approval required) |

---

## G-23j legacy verifier compatibility

### G-23l change: `nextRecommendedPhase` updated for report output

G-23l report output implementation updates `full-dry-run` handoff from `G-23k-crawl-dry-run-planning` to **`G-23m-sample-full-dry-run-report-artifact-review`** (G-23k planning is complete; next step is report artifact review).

### G-23j legacy verifier — known obsolete expectations (not regressions)

The G-23j verifier (`verify-g23j-static-to-astro-first-non-network-sample-full-dry-run.mjs`) pins `BASE_COMMIT=7ce291f` and expects `nextRecommendedPhase === "G-23k-crawl-dry-run-planning"`. At `5b9ceb0` (post G-23l) it reports **3 FAIL** — all are **known obsolete expectations**, not dry-run regressions:

| # | Failure | Cause | Regression? |
| --- | --- | --- | --- |
| 1 | `HEAD is 7ce291f` | HEAD pin mismatch (G-23k/G-23l commits after G-23j) | **no** |
| 2 | `origin/main is 7ce291f` | HEAD pin mismatch | **no** |
| 3 | `full-dry-run next G-23k` | G-23j expected `G-23k-crawl-dry-run-planning`; G-23l now returns `G-23m-sample-full-dry-run-report-artifact-review` | **no** — obsolete expectation |

### G-23j functional compatibility — maintained

| Area | Status |
| --- | --- |
| `full-dry-run` API / CLI | **PASS** |
| `fixture-dry-run` API | **PASS** |
| seedCounts (schedule 2 · others 1 · total 7) | **PASS** |
| DB / package / upload planOnly steps | **PASS** |
| safety gates | **PASS** |
| no network / no DB / no SQL / no package / no FTP | **PASS** |
| `--write-report` output (G-23l) | **PASS** (verified by G-23l verifier) |

**Do not** treat G-23j full verifier 0-failed as a G-23l gate. G-23l verifier separately confirms **legacy functional compatibility pass** and **known obsolete failures only**.

Fixing G-23j full pass requires a separate maintenance commit: update `BASE_COMMIT` to `5b9ceb0` and change `nextRecommendedPhase` expectation to `G-23m-sample-full-dry-run-report-artifact-review`.

---

## Verification

```bash
node tools/static-to-astro/scripts/verify-g23l-static-to-astro-onboarding-report-output.mjs
```
