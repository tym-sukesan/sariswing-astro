# G-23k — Static-to-Astro crawl-dry-run safety planning

**Phase:** `G-23k-static-to-astro-crawl-dry-run-safety-planning`  
**Status:** **complete** — safety design only; **no live crawl / network / DB / package / FTP / deploy**  
**Date:** 2026-07-08  
**Base commit:** `ad6091a`  
**Prior:** [static-to-astro-first-non-network-sample-full-dry-run-result.md](./static-to-astro-first-non-network-sample-full-dry-run-result.md) (G-23j) · [static-to-astro-onboarding-orchestrator-planning.md](./static-to-astro-onboarding-orchestrator-planning.md) (G-23e)

| Check | Status |
| --- | --- |
| Crawl-dry-run safety design | **yes** |
| Live crawl definition | **yes** |
| Safety gates documented | **yes** |
| URL restrictions documented | **yes** |
| Crawl result schema planned | **yes** |
| Orchestrator integration planned | **yes** |
| Failure policy documented | **yes** |
| Live crawl / network / DB / deploy | **not executed** |

---

## Gates

```txt
staticToAstroCrawlDryRunSafetyPlanningComplete: true
phase: G-23k-static-to-astro-crawl-dry-run-safety-planning
readyForG23lOnboardingReportOutputImplementation: true
readyForG23mCrawlDryRunDesignDocClosure: true
readyForG23nLiveCrawlAllowlistConfig: true
readyForG23oFirstApprovedCrawlDryRun: false
liveCrawlExecuted: false
networkAccess: false
dbConnectionAttempted: false
dbWriteExecuted: false
cursorSqlMutationExecuted: false
packageBuildExecuted: false
astroBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
cursorCrawlExecuted: false
```

**G-23k = planning only.** No live crawl, no HTTP requests, no DB, no package, no FTP.  
**Next live crawl requires:** explicit operator approval ID + G-23n allowlist + G-23o execution phase.

---

## 1. Purpose

G-23j proved the **non-network sample full dry-run** (steps 0–9 on fixture). Before enabling **live crawl-dry-run**, define safety gates, URL policy, crawl output schema, orchestrator wiring, and failure policy.

| Principle | Detail |
| --- | --- |
| **Read-only crawl** | HTTP GET only — no writes to remote or local DB/package/FTP |
| **Separated from DB/package/FTP** | crawl-dry-run produces crawl result JSON only |
| **Human approval required** | `explicitCrawlApprovalId` before any network in execution phase |
| **Not in G-23k** | Actual crawl execution deferred to G-23o+ with operator approval |

---

## 2. Live crawl-dry-run definition

**Mode:** `crawl-dry-run` (future orchestrator mode — **not implemented in G-23k**)

| Property | Planned behavior |
| --- | --- |
| Network | **yes** — HTTP GET to `config.sourceUrl` origin only |
| Writes | **none** — no DB, no package, no FTP, no fixture overwrite without review |
| Scope | Same-origin pages per `config.crawl.sameOriginOnly` |
| Output | Crawl result JSON (fixture-compatible shape) saved to `output/` only after explicit save approval in future phase |
| Downstream | Steps 3–5 reuse page classifier + seed extractor (G-23g) |

### Crawl behavior (execution phase — not G-23k)

1. **Preflight** — validate config, approval ID, URL allowlist, safety gates
2. **HTTP GET** `sourceUrl` — record status, title, links
3. **BFS/queue** — enqueue same-origin links up to `maxPages`
4. **Assets** — limited fetch per `assetRules` (size cap, type allowlist)
5. **Robots** — if `respectRobots=true`, honor disallow for operator-chosen policy (default: **FAIL** on disallow of seed URL)
6. **Emit** — `liveCrawl=true`, `fixtureOnly=false` crawl result object
7. **Stop** — no seed INSERT, no convert, no build, no FTP

### HTTP methods allowed

| Method | Allowed |
| --- | --- |
| GET | **yes** |
| HEAD | optional for size probe only |
| POST / PUT / DELETE / PATCH | **no** |
| Form submit | **no** |
| Login / OAuth | **no** |

---

## 3. Required safety gates

### Approval and review

| Gate | Default | Rule |
| --- | --- | --- |
| `explicitCrawlApprovalId` | null | **Required** non-empty registered ID before crawl-dry-run execution |
| `requireHumanReview` | true | Crawl result must be reviewed before downstream DB/package |
| `manualCommitPush` | true | Orchestrator never auto-commits crawl output |

### Crawl scope limits

| Gate | Default | Rule |
| --- | --- | --- |
| `sameOriginOnly` | true | Only URLs sharing origin with `sourceUrl` |
| `maxPages` | ≤ 20 (first pilot) | Hard stop when exceeded |
| `concurrency` | ≤ 2 (first pilot) | Max parallel requests |
| `requestTimeoutMs` | 15000 | Per-request timeout |
| `userAgent` | explicit string required | e.g. `CMSKit-Onboarding-Crawl/1.0 (+contact)` |
| `respectRobots` | true | robots.txt checked before crawl |
| `pageInclude` / `pageExclude` | config arrays | Path allow/deny patterns |

### Network safety

| Gate | Rule |
| --- | --- |
| Denylist domains | Block known production domains (Sariswing prod, operator blocklist) |
| Private IP / localhost | **FAIL** — block `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `::1`, link-local |
| Auth pages | **SKIP** — no login, no cookie jar, no credentials |
| Query strings | Limit length; deny obvious session tokens in query |
| File download | HTML + limited images/CSS only; deny executables, archives by default |
| Large assets | Skip assets > 5 MB (configurable cap) |
| no POST / PUT / DELETE | Enforced in crawler |
| no form submit | Detect forms → WARN only, never submit |
| no cookies reuse | Stateless client per run |
| no service_role | Never used in crawl path |
| no DB write | `allowDbWrite=false` during crawl-dry-run |
| no FTP | `allowFtpUpload=false` during crawl-dry-run |

### Config integration (existing `safetyGates`)

Reuse G-23b/G-23c `safetyGates` block plus future `approvals.crawlApprovalId` field aligned with `explicitCrawlApprovalId`.

---

## 4. Target URL restrictions

### Allowed / denied targets

| Category | Policy |
| --- | --- |
| Protocol | **https** recommended; http allowed only with explicit WARN + approval |
| Fixture URLs | `example.com`, `fixture/static`, local fixture paths — **live crawl blocked** |
| localhost / 127.0.0.1 | **FAIL** |
| Private / intranet IP | **FAIL** |
| Sariswing production | `vsbvndwuajjhnzpohghh` ref sites — **never crawl target** |
| Customer production | Operator must confirm; staging URL preferred for first pilot |
| Staging vs production | `sourceUrl` = crawl origin; `publicDomain` = future public site — **do not confuse** |

### sourceUrl vs publicDomain

| Field | Role in crawl-dry-run |
| --- | --- |
| `sourceUrl` | **Crawl entry** — HTTP GET origin (e.g. Wix live site or staging mirror) |
| `publicDomain` | **Not crawled** — used for canonical/deploy planning only |
| `stagingDomain` | **Not crawled** unless explicitly set as `sourceUrl` with approval |

### First approved crawl target (future G-23o)

- Not Sariswing production
- Not `gosaki-piano.com` production without separate approval phase
- Prefer operator-owned staging or explicit customer-approved URL
- Documented in G-23n allowlist config before G-23o

---

## 5. Crawl result schema (planned)

Future crawl output aligns with G-23d fixture shape for seed extractor compatibility.

```json
{
  "schemaVersion": "1.0",
  "phase": "G-23o-crawl-dry-run-result",
  "fixtureOnly": false,
  "liveCrawl": true,
  "siteSlug": "example-site",
  "source": {
    "url": "https://approved-example.com/",
    "platform": "detected",
    "crawledAt": "ISO-8601",
    "liveCrawl": true,
    "approvalId": "G-23o-explicit-crawl-approval"
  },
  "metadata": { "title": "", "description": "", "detectedPlatform": "", "locale": "" },
  "pages": [
    {
      "url": "https://approved-example.com/",
      "path": "/",
      "status": 200,
      "title": "",
      "description": "",
      "htmlHash": "sha256:…",
      "contentSummary": "",
      "pageType": "home",
      "detectedModule": null,
      "links": ["/schedule/"],
      "assets": []
    }
  ],
  "assets": [
    {
      "url": "https://approved-example.com/assets/main.css",
      "type": "css",
      "size": 12480,
      "localCandidatePath": "output/crawl-candidates/…/main.css"
    }
  ],
  "seedCandidates": {},
  "warnings": [],
  "blocked": [],
  "safetySummary": {
    "sameOriginOnly": true,
    "maxPages": 20,
    "pagesFetched": 0,
    "assetsFetched": 0,
    "robotsRespected": true,
    "privateIpBlocked": true
  },
  "stats": {
    "pagesFetched": 0,
    "assetsFetched": 0,
    "failed": 0,
    "durationMs": 0
  }
}
```

### Fixture compatibility mapping

| Live crawl field | Maps to G-23d fixture |
| --- | --- |
| `pages[].path` | `pages[].path` |
| `pages[].pageType` | `pages[].pageType` |
| `seedCandidates` | `seedCandidates` (extracted post-crawl or inline) |
| `fixtureOnly` | `false` |
| `source.liveCrawl` | `true` |

---

## 6. Orchestrator integration

### Current state (post G-23j)

| Mode | Status |
| --- | --- |
| `validate-only` | **implemented** |
| `fixture-dry-run` | **implemented** |
| `full-dry-run` | **implemented** (non-network fixture) |
| `crawl-dry-run` | **NOT_IMPLEMENTED** — planned |

### Planned crawl-dry-run flow

| Step | G-23j (fixture) | G-23o+ (crawl-dry-run) |
| --- | --- | --- |
| 0 | config validation | same + **approval ID check** |
| 1 | intake | same |
| 2 | fixture load | **crawl source** — HTTP GET → crawl result |
| 3 | page classification | same input shape |
| 4 | CMS module planner | same |
| 5 | seed extraction | same (G-23g) |
| 6–8 | planOnly | planOnly (unchanged) |
| 9 | handoff | handoff + crawl safety summary |

### Building blocks

| Component | Role |
| --- | --- |
| `crawl-static-site.mjs` (G-7a) | Low-level crawl CLI — reuse with G-23k gates |
| `run-onboarding-orchestrator.mjs` | Mode router + step engine |
| `onboarding-seed-extractor.mjs` | Consumes crawl result as fixture |
| `validate-onboarding-config.mjs` | Pre-crawl validation |

---

## 7. Failure policy

| Condition | Action |
| --- | --- |
| Missing `explicitCrawlApprovalId` | **FAIL** — stop before network |
| Unsafe URL (localhost, private IP, denylist) | **FAIL** — stop before network |
| `example.com` / fixture URL as live target | **FAIL** |
| robots.txt disallows seed path | **FAIL** (default) or **SKIP** page (configurable — default FAIL) |
| `maxPages` exceeded | **STOP** — emit partial result with WARN |
| Redirect to different origin | **STOP** — do not follow |
| Login required (401/403 + login form) | **SKIP** page — WARN |
| POST form detected | **no submit** — WARN |
| Binary / huge file | **SKIP** asset — WARN |
| DNS resolves to private IP | **FAIL** |
| Rate limit (429) | **WARN** then **STOP** if persistent |
| Timeout | **WARN** per URL; **STOP** if seed URL fails |
| Unexpected network error | **STOP** — partial result preserved |
| Missing `sameOriginOnly=true` | **FAIL** preflight |
| `service_role` in config/env | **FAIL** |
| Production ref as active DB target | **FAIL** |

### Incident behavior (aligned with G-7f1)

If crawl hangs or outcome unclear: **stop immediately**, do not retry blindly, do not cleanup remote, ask human.

---

## 8. Next phases

| Phase | Scope | Network |
| --- | --- | --- |
| **G-23l** | Onboarding report output implementation | no |
| **G-23m** | Crawl-dry-run design doc closure / schema freeze | no |
| **G-23n** | Live crawl allowlist config | no |
| **G-23o** | First approved crawl-dry-run against safe sample target | **yes** — requires explicit operator approval |

**G-23o gate:** Operator must provide approval in form:

```txt
承認します。この操作を1回だけ実行してください。
```

Plus registered `explicitCrawlApprovalId` matching preflight.

---

## 9. Explicitly not in G-23k

| Operation | Status |
| --- | --- |
| Live crawl / HTTP requests | **not executed** |
| Network access | **not executed** |
| DB connection / DB write / SQL mutation | **not executed** |
| Package build / Astro build | **not executed** |
| FTP / upload / deploy / workflow_dispatch | **not executed** |
| Credentials / cookies / login | **not used** |
| Customer site application | **not executed** |
| service_role | **not used** |

---

## Verification

```bash
node tools/static-to-astro/scripts/verify-g23k-static-to-astro-crawl-dry-run-safety-planning.mjs
```
