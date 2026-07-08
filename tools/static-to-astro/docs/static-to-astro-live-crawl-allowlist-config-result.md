# G-23n — Static-to-Astro live crawl allowlist config result

**Phase:** `G-23n-live-crawl-allowlist-config`  
**Status:** **complete** — allowlist config + static validator + inspect CLI  
**Date:** 2026-07-08  
**Base commit:** `76eab7e`  
**Prior:** [static-to-astro-crawl-dry-run-safety-planning.md](./static-to-astro-crawl-dry-run-safety-planning.md) (G-23k) · [static-to-astro-sample-full-dry-run-report-artifact-review-result.md](./static-to-astro-sample-full-dry-run-report-artifact-review-result.md) (G-23m)

| Artifact | Path |
| --- | --- |
| Example allowlist | `config/onboarding.crawl-allowlist.example.json` |
| Validator | `scripts/lib/onboarding-crawl-allowlist.mjs` |
| Inspect CLI | `scripts/inspect-onboarding-crawl-allowlist.mjs` |
| Verifier | `scripts/verify-g23n-static-to-astro-live-crawl-allowlist-config.mjs` |

| Check | Status |
| --- | --- |
| Allowlist config + validator | **yes** |
| readyForLiveCrawl=false default | **yes** |
| Invalid fixtures FAIL | **yes** |
| Static-only validation | **yes** |
| Live crawl / DNS / network / DB / package / FTP | **not executed** |

---

## Gates

```txt
staticToAstroLiveCrawlAllowlistConfigComplete: true
phase: G-23n-live-crawl-allowlist-config
readyForG23oFirstApprovedCrawlDryRun: false
readyForG23pCrawlResultReviewBeforeSeedPackage: true
liveCrawlExecuted: false
dnsLookupAttempted: false
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
cursorDnsLookupAttempted: false
cursorNetworkAccess: false
```

**G-23n = config + static validation only.** No live crawl, no DNS, no HTTP, no DB, no package, no FTP.

---

## 1. Purpose

Implement G-23k crawl-dry-run safety planning as **machine-verifiable allowlist config** before G-23o first approved crawl-dry-run. Validates allowed/denied targets, approval metadata, and safety flags without network access.

---

## 2. Allowlist config role

| Role | Detail |
| --- | --- |
| Pre-crawl gate | Defines what may be crawled when `readyForLiveCrawl=true` |
| Default safe | `readyForLiveCrawl=false` — structure valid, crawl not armed |
| Deny list | localhost, private IP, example.com, production ref |
| G-23o handoff | Operator sets real URL + approvalId + arms allowlist |

---

## 3. readyForLiveCrawl=false default

Example config (`onboarding.crawl-allowlist.example.json`):

- `readyForLiveCrawl: false`
- `allowedTargets: []`
- `explicitCrawlApprovalId: null`
- Validator returns **`PASS_WITH_NOT_READY`** — safe, not armed

---

## 4. approvalId required policy

When `readyForLiveCrawl=true`:

| Field | Required |
| --- | --- |
| `explicitCrawlApprovalId` | non-empty string |
| `approvedBy` | non-empty string |
| `approvedAt` | ISO-8601 string |
| `allowedTargets` | ≥ 1 entry |

---

## 5. allowedTargets schema

Each target includes:

- `label`, `sourceUrl`, `allowedOrigin`
- `sameOriginOnly: true` (required)
- `maxPages` ≤ 20, `concurrency` ≤ 2, `requestTimeoutMs` ≤ 15000
- `respectRobotsTxt: true` (required)
- `denyPrivateIp`, `denyLocalhost`, `denyLoginPages`, `denyCredentials`, `denyCookies`, `denyServiceRole`, `denyDbWrite`, `denyFtp` — all **true** required
- `allowAssets`, `maxAssetBytes`, `allowedContentTypes`, `denyQueryStrings`, `denyExternalRedirects`, `denyFormsSubmit`

**URL policy (static):** https recommended; http → WARN. localhost / 127.0.0.1 / private IP / example.com → **FAIL**.

---

## 6. deniedTargets schema

Array of `{ label, pattern, reason? }` documenting blocked patterns:

- localhost, 127.0.0.1, RFC1918 ranges
- example.com
- `vsbvndwuajjhnzpohghh` (forbidden production ref)
- fixture paths

---

## 7. Validator specification

Module: `validateOnboardingCrawlAllowlist(config, options)`

| Mode | Result |
| --- | --- |
| `readyForLiveCrawl=false` + valid structure | `PASS_WITH_NOT_READY` |
| `readyForLiveCrawl=true` + all checks pass | `PASS` or `WARN` |
| Any safety violation | `FAIL` |

**Static checks only** — no DNS resolution, no HTTP fetch, no network.

Rejections: maxPages>20, concurrency>2, sameOriginOnly=false, respectRobotsTxt=false, denyDbWrite=false, denyFtp=false, service_role string, production ref in active target.

---

## 8. Invalid fixture validation results

| Fixture | Expected | Result |
| --- | --- | --- |
| `invalid-crawl-allowlist-localhost.json` | FAIL | localhost hostname blocked |
| `invalid-crawl-allowlist-production-ref.json` | FAIL | `vsbvndwuajjhnzpohghh` in sourceUrl |
| `invalid-crawl-allowlist-missing-approval.json` | FAIL | empty approvalId + missing approvedBy/At |

---

## 9. Inspect script examples

```bash
node tools/static-to-astro/scripts/inspect-onboarding-crawl-allowlist.mjs \
  tools/static-to-astro/config/onboarding.crawl-allowlist.example.json
```

```bash
node tools/static-to-astro/scripts/inspect-onboarding-crawl-allowlist.mjs \
  tools/static-to-astro/config/onboarding.crawl-allowlist.example.json \
  --json
```

Example output verdict: **NOT READY (safe — live crawl not armed)**

---

## 10–16. Operations NOT executed

| Operation | Status |
| --- | --- |
| 実クロール | **not executed** |
| DNS lookup | **not executed** |
| Network access | **not executed** |
| DB write / SQL mutation | **not executed** |
| Package build | **not executed** |
| FTP / deploy | **not executed** |

---

## 17. Next phases

| Phase | Requirement |
| --- | --- |
| **G-23o** | First approved crawl-dry-run — real URL + approvalId + operator approval |
| **G-23p** | Crawl result review before seed/package |

---

## Verification

```bash
node tools/static-to-astro/scripts/verify-g23n-static-to-astro-live-crawl-allowlist-config.mjs
```
