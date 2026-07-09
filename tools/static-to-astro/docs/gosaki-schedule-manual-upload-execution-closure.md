# G-20r4e — Gosaki schedule August manual upload execution closure

**Phase:** `G-20r4e-gosaki-schedule-manual-upload-execution-closure`  
**Status:** **complete** — operator manual upload recorded · live staging HTTP verify **PASS**  
**Date:** 2026-07-09  
**Verified at (UTC):** `2026-07-09T06:50:00Z` (approx.)  
**Base commit:** `3bd165f`  
**Operator:** 戸山さん（FileZilla / Lolipop GUI · manual ×1）  
**Prior:** [gosaki-schedule-upload-preflight.md](./gosaki-schedule-upload-preflight.md) (G-20r4d) · [gosaki-schedule-public-output-review.md](./gosaki-schedule-public-output-review.md) (G-20r4c)

| Check | Status |
| --- | --- |
| Operator manual upload | **executed** (operator) |
| Cursor / AI FTP | **not executed** |
| Live HTTP verify | **PASS** |
| August 14 cards on staging | **PASS** |
| Exclusions absent | **PASS** |
| July regression | **PASS** (14 cards) |
| FTP re-execution | **forbidden** |

---

## Gates

```txt
gosakiScheduleAugustManualUploadExecutionClosureComplete: true
phase: G-20r4e-gosaki-schedule-manual-upload-execution-closure
baseCommit: 3bd165f
priorPhase: G-20r4d-gosaki-schedule-upload-preflight
targetProject: kmjqppxjdnwwrtaeqjta
packagePath: output/manual-upload/gosaki-piano/public-dist
packageGeneratedAt: 2026-07-09T06:16:35.124Z
uploadScope: full-public-dist-29-files
remotePath: /cms-kit-staging/gosaki-piano/
stagingUrl: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
operatorManualUploadExecuted: true
cursorFtpUploadExecuted: false
mirrorDeleteUsed: false
remoteDeleteUsed: false
liveStagingHttpVerifyPass: true
augustCardCountLive: 14
p0LiveBlockers: 0
readyForG20r4AugustStagingPublicReflectionClosure: true
ftpReExecutionForbidden: true
packageRegenExecuted: false
dbWriteExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

戸山さんが G-20r4d preflight に従い手動 FTP で August 反映済み `public-dist` を staging host へアップロードした結果を記録し、公開 URL を HTTP verify して **G-20r4 August staging 公開反映** をクローズする。

---

## 2. Executor

| Item | Value |
| --- | --- |
| **Executor** | Operator（戸山さん）— FileZilla / Lolipop GUI 手動 |
| **Cursor / AI** | FTP / upload / delete / mirror **未実行** |
| **Upload count** | **1 session**（本フェーズで再実行禁止） |
| **Rollback** | **not executed** |

---

## 3. Upload details (operator-reported + preflight alignment)

### Source (local)

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/
```

| Item | Value |
| --- | --- |
| **fileCount** | 29 |
| **generatedAt** | `2026-07-09T06:16:35.124Z` |
| **Scope** | full `public-dist/` contents（G-20r4d 推奨） |

### Destination (remote)

| Item | Value |
| --- | --- |
| **Host** | `yskcreate.weblike.jp` (Lolipop) |
| **FTP path** | `/cms-kit-staging/gosaki-piano/` |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

### Upload method

| Item | Value |
| --- | --- |
| **Method** | Manual overwrite upload (FileZilla / Lolipop GUI) |
| **Delete / remote cleanup** | **no** |
| `mirror --delete` | **no** |
| `sync --delete` | **no** |
| `deploy-public-dist-ftp.mjs --apply` | **not used** |

### Out of scope / not touched

| Target | Status |
| --- | --- |
| Sariswing production | **not touched** |
| gosaki-piano.com production | **not touched** |
| Server FTP root `/` | **not touched** |
| TLHA / other site areas | **not touched** |

---

## 4. Live staging HTTP verify (read-only GET)

**Base:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano`  
**Method:** Cursor read-only `fetch` (staging public URL only)

### 4.1 HTTP status

| # | URL | HTTP | Size (bytes) | Result |
| --- | --- | --- | --- | --- |
| 1 | `/` | **200** | 34533 | **PASS** |
| 2 | `/schedule/` | **200** | 9453 | **PASS** |
| 3 | `/schedule/2026-08/` | **200** | 14434 | **PASS** |
| 4 | `/2026-08/` | **200** | 9247 | **PASS** |
| 5 | `/schedule/2026-07/` | **200** | 13577 | **PASS** |
| 6 | `/sitemap-0.xml` | **200** | 1522 | **PASS** |

### 4.2 Content checks

| # | Check | Expected | Live result |
| --- | --- | --- | --- |
| 1 | Hub `/schedule/` — 2026.08 link | present | **PASS** — `href="/cms-kit-staging/gosaki-piano/schedule/2026-08/"` |
| 2 | August month page — event cards | **14** | **PASS** — `gosaki-schedule-event-card` ×14 |
| 3 | August — `scheduleDataSource=supabase` | present | **PASS** |
| 4 | August dates | 14 distinct show dates | **PASS** — `2026.08.01` … `2026.08.30` (8/16 ×2) |
| 5 | Legacy `/2026-08/` — `noindex` | yes | **PASS** — `robots: noindex,follow` |
| 6 | Legacy — canonical | → `/schedule/2026-08/` | **PASS** |
| 7 | Legacy — event cards | **0** | **PASS** |
| 8 | Sitemap — `/schedule/2026-08/` | present | **PASS** |
| 9 | Sitemap — legacy `/2026-08/` root | **absent** | **PASS** — 13 `<loc>` entries · no bare `/2026-08/` |
| 10 | July regression — cards | 14 | **PASS** |

### 4.3 Exclusion verify (must be absent on live)

| legacy_id | Reason | August page | July page | Hub |
| --- | --- | --- | --- | --- |
| `schedule-2026-08-007` | published=false | **absent** | absent | absent |
| `schedule-2026-08-009` | published=false | **absent** | absent | absent |
| `schedule-2026-08-013` | published=false | **absent** | absent | absent |
| `schedule-2026-08-008` | hold · not in DB | **absent** | absent | absent |
| `schedule-2026-08-018` | hold · not in DB | **absent** | absent | absent |
| `schedule-2026-03-014` | test row | absent | absent | absent |
| `schedule-2026-09-001` | test row | absent | absent | absent |

**Exclusion verify:** **PASS**

---

## 5. Conclusion

| Item | Value |
| --- | --- |
| **Staging August reflection** | **live and verified** |
| **Live staging state** | **fresh** (was stale before upload) |
| **P0 live blockers** | **none** |
| **FTP re-execution** | **forbidden** — do not re-upload without new phase |
| **Client preview** | staging URL shareable for August schedule feedback |

**G-20r4 August DB → local package → staging upload → HTTP verify chain: PASS on staging.**

---

## 6. Known non-blockers (from G-20r4c — unchanged)

| # | Item | Severity |
| --- | --- | --- |
| P1-1 | Angle-bracket titles `<…>` | Wix parity · optional client confirm |
| P1-2 | Legacy stub English copy | G-20s defer |
| P1-3 | `#014` dual-session typo in description | optional CMS fix |
| P1-4 | Beer fest no time/price | Wix source parity |
| P2-1 | August SP layout visual QA | G-20s1 mobile QA |

---

## 7. 今回（G-20r4e）実行していないこと

| Operation | Executed |
| --- | --- |
| FTP / deploy (Cursor) | **no** |
| FTP re-execution | **no** |
| package regen | **no** |
| DB write / SQL / Save | **no** |
| production change | **no** |
| commit / push | **no** |

---

## 8. Next phase

| Phase | Scope |
| --- | --- |
| **G-20r4-august-staging-public-reflection-closure** (optional doc) | Chain summary · gates for client preview |
| **G-20r4f** (optional) | Production profile regen + diff — no production deploy |
| **G-20r2c** (optional) | Client confirmation on hold / unpublished rows |
| **G-20s1** (optional) | Mobile visual QA on live staging |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-manual-upload-execution-closure.mjs
```
