# G-23m — Static-to-Astro sample full dry-run report artifact review result

**Phase:** `G-23m-sample-full-dry-run-report-artifact-review`  
**Status:** **complete** — sample musician report artifacts reviewed; operator-ready with minor G-23m improvements  
**Date:** 2026-07-08  
**Base commit:** `b1f7dcb`  
**Prior:** [static-to-astro-onboarding-report-output-result.md](./static-to-astro-onboarding-report-output-result.md) (G-23l)

| Artifact | Path |
| --- | --- |
| Report output | `output/onboarding-reports/sample-musician-fixture/latest/` |
| Report writer (improved) | `scripts/lib/onboarding-report-writer.mjs` |
| Verifier | `scripts/verify-g23m-static-to-astro-sample-full-dry-run-report-artifact-review.mjs` |

| Check | Status |
| --- | --- |
| Report artifact review PASS | **yes** |
| Operator-ready human-review.md | **yes** |
| seeds-preview reviewOnly / notDbSql | **yes** |
| output/ gitignored | **yes** |
| Live crawl / network / DB / package / FTP | **not executed** |

---

## Gates

```txt
staticToAstroSampleFullDryRunReportArtifactReviewComplete: true
phase: G-23m-sample-full-dry-run-report-artifact-review
readyForG23nLiveCrawlAllowlistConfig: true
readyForG23oFirstApprovedCrawlDryRun: false
readyForG23pCrawlResultReviewBeforeSeedPackage: true
reportArtifactReviewVerdict: PASS_WITH_KNOWN_WARNING
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

**Verdict:** **PASS_WITH_KNOWN_WARNING** — artifacts sufficient for human review before G-23n; 1 known warning (news unmapped route).

---

## 1. Purpose

Review G-23l onboarding report artifacts from sample musician `full-dry-run` — confirm summary / seeds-preview / human-review / risk-summary are sufficient for operator review before live crawl allowlist (G-23n) and approved crawl-dry-run (G-23o).

---

## 2. Execution command

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --fixture tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --mode full-dry-run \
  --write-report
```

---

## 3. Report output path

```
tools/static-to-astro/output/onboarding-reports/sample-musician-fixture/latest/
├── summary.json
├── seeds-preview.json
├── human-review.md
└── risk-summary.md
```

`output/` is gitignored — **not a commit target**.

---

## 4. Four-report review summary

| Report | Verdict | Notes |
| --- | --- | --- |
| summary.json | **PASS** | All required fields present; steps 0–9; planOnly clear |
| seeds-preview.json | **PASS** | reviewOnly + notDbSql; 7 candidates human-readable |
| human-review.md | **PASS** (improved) | Operator checklist + do-not-proceed + approval gates |
| risk-summary.md | **PASS** (improved) | Blocked ops table + next-phase risk table |

---

## 5. summary.json evaluation

| Field | Expected | Actual | OK |
| --- | --- | --- | --- |
| siteSlug | sample-musician-fixture | sample-musician-fixture | yes |
| mode | full-dry-run | full-dry-run | yes |
| overall | PASS | PASS | yes |
| generatedAt | present | present | yes |
| schedule | 2 | 2 | yes |
| news | 1 | 1 | yes |
| profile | 1 | 1 | yes |
| discography | 1 | 1 | yes |
| video | 1 | 1 | yes |
| contact | 1 | 1 | yes |
| Steps 0–9 | visible | 10 steps in `steps[]` | yes |
| DB/package/upload PLAN_ONLY | clear | steps 6–8 PLAN_ONLY + `dbPlan`/`packagePlan`/`uploadPlan` | yes |
| warnings | news unmapped | 1 warning | yes |
| nextRecommendedPhase | G-23n (post G-23m) | G-23n-live-crawl-allowlist-config | yes |

**G-23m additions:** `reviewReady: true`, `reportArtifacts[]`, phase tag `G-23m-...`.

---

## 6. seeds-preview.json evaluation

| Check | Status |
| --- | --- |
| `notDbSql: true` | **yes** |
| `reviewOnly: true` | **yes** (G-23m) |
| `doNotExecuteAsSql: true` | **yes** (G-23m) |
| Disclaimer — not DB SQL | **yes** |
| Module-by-module candidates | **yes** — 6 modules |
| schedule 2 items reviewable | **yes** — titles, venues, dates visible |
| news/profile/discography/video/contact | **yes** — raw + normalized |
| `approvedForDbInsert: false` per candidate | **yes** (G-23m) |
| Misinterpret as DB-ready | **prevented** |

---

## 7. human-review.md evaluation

| Check | Status |
| --- | --- |
| Non-engineer readable | **yes** — "What to review first" + operator checklist |
| 30-minute flow visible | **yes** — step table |
| Warnings visible | **yes** — news unmapped |
| seeds-preview.json导線 | **yes** — explicit reference |
| DB / package / upload planOnly | **yes** |
| Conditions to proceed | **yes** |
| Do NOT proceed if | **yes** (G-23m) |
| Live crawl approval requirements | **yes** (G-23m) |

---

## 8. risk-summary.md evaluation

| Check | Status |
| --- | --- |
| 実クロールなし | **yes** |
| networkなし | **yes** |
| DBなし / SQL mutationなし | **yes** |
| packageなし | **yes** |
| FTP/deployなし | **yes** |
| service_roleなし | **yes** |
| production ref未使用 | **yes** — `vsbvndwuajjhnzpohghh` blocked |
| Blocked operations table | **yes** (G-23m) |
| Next-phase risk increases | **yes** (G-23m) — G-23n/G-23o/future DB/package |

---

## 9. Improvements made (G-23m)

| Area | Change |
| --- | --- |
| summary.json | `reviewReady`, `reportArtifacts`, G-23m phase tag |
| seeds-preview.json | `reviewOnly`, `doNotExecuteAsSql`, `approvedForDbInsert: false` per candidate |
| human-review.md | Operator checklist, do-not-proceed, live crawl approval section |
| risk-summary.md | Blocked ops table, production ref note, next-phase risk table |
| orchestrator | `nextRecommendedPhase` → `G-23n-live-crawl-allowlist-config` |

---

## 10. Remaining issues (non-blocking)

| Issue | Severity | Action |
| --- | --- | --- |
| news module unmapped (no `/news/` page in fixture) | WARN | Document in fixture or accept for sample; live crawl may surface real route |
| G-23l legacy verifier nextRecommendedPhase drift | INFO | G-23m updates phase to G-23n — G-23l verifier obsolete expectation (not regression) |
| G-23j legacy verifier nextRecommendedPhase drift | INFO | Still expects G-23k — known obsolete (documented in G-23l) |

---

## 11. Output / git safety

| Check | Status |
| --- | --- |
| Reports under `onboarding-reports/sample-musician-fixture/latest/` | **yes** |
| `git status output/` clean | **yes** |
| No writes outside onboarding-reports | **yes** |
| Reports not commit targets | **yes** |

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
| **G-23n** | Live crawl allowlist config |
| **G-23o** | First approved crawl-dry-run (operator approval) |
| **G-23p** | Crawl result review before seed/package |

---

## G-23l legacy verifier note

G-23m updates `nextRecommendedPhase` from `G-23m-...` to `G-23n-live-crawl-allowlist-config`. G-23l verifier does not pin this value on the current API. Functional compatibility (report output, seed counts, planOnly) remains **PASS**.

---

## Verification

```bash
node tools/static-to-astro/scripts/verify-g23m-static-to-astro-sample-full-dry-run-report-artifact-review.mjs
```
