# G-20r4b — Gosaki schedule local regen dry-run result

**Phase:** `G-20r4b-gosaki-schedule-local-regen-dry-run-result`  
**Status:** **complete** — local staging package regen + verification; **no FTP / deploy / Save / DB write**  
**Date:** 2026-07-09  
**Executed at (UTC):** `2026-07-09T06:16:35.124Z` (MANIFEST `generatedAt`)  
**Base commit:** `8475a00`  
**Prior:** [gosaki-schedule-august-generation-path-enablement.md](./gosaki-schedule-august-generation-path-enablement.md) (G-20r4a) · [gosaki-schedule-public-reflection-plan.md](./gosaki-schedule-public-reflection-plan.md) (G-20r4)

| Check | Status |
| --- | --- |
| Local staging regen | **PASS** |
| `gosaki-schedules.json` 74 rows · August 14 | **PASS** |
| `/schedule/` hub 2026-08 link | **PASS** |
| `/schedule/2026-08/` 14 cards | **PASS** |
| `/2026-08/` legacy stub | **PASS** |
| Sitemap `/schedule/2026-08/` only | **PASS** |
| published=false 3件 excluded | **PASS** |
| hold 008/018 excluded | **PASS** |
| test rows 014/001 excluded | **PASS** |
| `safeForStaticFtp` | **true** |
| FTP / deploy | **not executed** |

---

## Gates

```txt
gosakiScheduleLocalRegenDryRunComplete: true
phase: G-20r4b-gosaki-schedule-local-regen-dry-run-result
baseCommit: 8475a00
priorPhase: G-20r4a-schedule-august-generation-path-enablement
targetProject: kmjqppxjdnwwrtaeqjta
scheduleDataSource: supabase
jsonRowCount: 74
augustJsonRows: 14
augustHtmlCards: 14
packageRegenExecuted: true
packageRegenScope: local-staging-only
buildExecuted: true
publicReflectionLiveUpload: false
ftpUploadExecuted: false
deployExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
serviceRoleUsed: false
readyForG20r4cPublicOutputReview: true
readyForG20r4dUploadPreflight: false
readyForG20r4eOperatorManualUpload: false
```

**Supabase:** read-only anon fetch at build time only. **Never** `vsbvndwuajjhnzpohghh`.

**Live staging URL** remains stale until **G-20r4e** operator manual upload.

---

## 1. Purpose

G-20r4a で有効化した 2026-08 生成経路が、**staging profile** local regen で期待どおり反映されることを確認する。

---

## 2. Preflight

| Check | Result |
| --- | --- |
| `HEAD` / `origin/main` | `8475a00` |
| G-20r4a `expectedMonths` includes `2026-08` | **yes** |
| Pre-regen JSON rows | **60** (03–07 only) |
| Pre-regen `schedule/2026-08/` | **absent** |
| Port 4321 LISTEN | **none** |
| FTP / deploy | **not executed** |

---

## 3. Regen command

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

**Pipeline result:** **PASS**

```txt
convert: scheduleDataSource=supabase (74 events)
verify-static-public-artifact: safeForStaticFtp=true
manual-upload:package: 29 files
verify:manual-upload: PASS
```

**Output:** `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/`

---

## 4. `gosaki-schedules.json`

**Path:** `output/gosaki-piano-astro/src/data/gosaki-schedules.json`

| Metric | Before | After | Expected |
| --- | --- | --- | --- |
| Total rows | **60** | **74** | **74** (published only) |
| 2026-08 rows | **0** | **14** | **14** |

**Month breakdown (after):**

| Month | Rows |
| --- | --- |
| 2026-03 | 13 |
| 2026-04 | 10 |
| 2026-05 | 12 |
| 2026-06 | 11 |
| 2026-07 | 14 |
| 2026-08 | **14** |

**August `legacy_id` present (14):** `001`–`006`, `010`–`012`, `014`–`017`, `019`

---

## 5. Public HTML verification

### 5.1 `/schedule/` hub

| Check | Result |
| --- | --- |
| Path | `public-dist/schedule/index.html` |
| 2026-08 month link | **present** |
| Month dirs | 2026-03 … **2026-08** (6) |

### 5.2 `/schedule/2026-08/` canonical month

| Check | Result |
| --- | --- |
| Path | `public-dist/schedule/2026-08/index.html` |
| HTTP (local file) | exists |
| Event cards | **14** (`gosaki-schedule-event-card`) |
| `scheduleDataSource=supabase` | **yes** |

### 5.3 `/2026-08/` legacy stub

| Check | Result |
| --- | --- |
| Path | `public-dist/2026-08/index.html` |
| `noindex` | **yes** |
| canonical → `/schedule/2026-08/` | **yes** |
| Event cards | **none** (stub only) |

### 5.4 Sitemap

| Check | Result |
| --- | --- |
| `sitemap-0.xml` `/schedule/2026-08/` | **1** entry |
| Legacy `/2026-08/` at site root | **absent** |

---

## 6. Exclusion verification (must be absent)

| legacy_id | Reason | JSON | August HTML | Result |
| --- | --- | --- | --- | --- |
| `schedule-2026-08-007` | published=false | absent | absent | **PASS** |
| `schedule-2026-08-009` | published=false | absent | absent | **PASS** |
| `schedule-2026-08-013` | published=false | absent | absent | **PASS** |
| `schedule-2026-08-008` | hold · not in DB | absent | absent | **PASS** |
| `schedule-2026-08-018` | hold · not in DB | absent | absent | **PASS** |
| `schedule-2026-03-014` | test row | absent | n/a | **PASS** |
| `schedule-2026-09-001` | test row | absent | n/a | **PASS** |

---

## 7. Package summary

| Item | Value |
| --- | --- |
| Package path | `output/manual-upload/gosaki-piano/` |
| `fileCount` | **29** |
| `deployBase` | `/cms-kit-staging/gosaki-piano/` |
| `safeForStaticFtp` | **true** |
| `ftpAutoDeployUsed` | **false** |
| `generatedAt` | `2026-07-09T06:16:35.124Z` |

**Local staging package:** **fresh** for 2026-08.  
**Live staging host:** still **stale** until G-20r4e manual upload.

---

## 8. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| SQL / DB write / Save | **no** |
| FTP / deploy / workflow_dispatch | **no** |
| production package regen | **no** (staging profile only) |
| commit / push | **no** |

---

## 9. Next phase

| Phase | Scope |
| --- | --- |
| **G-20r4c-public-output-review** | Formal QA · optional live compare · visual spot-check |
| **G-20r4d** | Operator manual upload preflight checklist |
| **G-20r4e** | Operator manual upload (FileZilla / Lolipop) |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-local-regen-dry-run-result.mjs
```
