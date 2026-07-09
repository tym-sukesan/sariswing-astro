# G-20r4c — Gosaki schedule public output review

**Phase:** `G-20r4c-gosaki-schedule-public-output-review`  
**Status:** **complete** — read-only local output review; **no FTP / deploy / regen / network / DB write**  
**Date:** 2026-07-09  
**Reviewed at (UTC):** `2026-07-09T06:16:35.124Z` (package `generatedAt` from G-20r4b)  
**Base commit:** `f1a68c8`  
**Prior:** [gosaki-schedule-local-regen-dry-run-result.md](./gosaki-schedule-local-regen-dry-run-result.md) (G-20r4b)

| Check | Status |
| --- | --- |
| Local output review | **PASS** |
| August 14 cards structure | **PASS** |
| Exclusion leak check | **PASS** |
| Sitemap policy | **PASS** |
| Legacy stub policy | **PASS** |
| P0 blockers | **none** |
| Live staging HTTP | **not executed** (network forbidden) |
| FTP / deploy | **not executed** |

---

## Gates

```txt
gosakiSchedulePublicOutputReviewComplete: true
phase: G-20r4c-gosaki-schedule-public-output-review
baseCommit: f1a68c8
priorPhase: G-20r4b-gosaki-schedule-local-regen-dry-run-result
reviewConclusion: B-local-fresh-upload-needed-for-august
localOutputReviewPass: true
augustReflectionStructurallySound: true
p0Blockers: 0
readyForG20r4dUploadPreflight: true
readyForG20r4eOperatorManualUpload: false
liveStagingHttpReview: not-executed
packageRegenExecuted: false
ftpUploadExecuted: false
deployExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
serviceRoleUsed: false
```

**Package reviewed:** `output/manual-upload/gosaki-piano/public-dist/` (29 files · G-20r4b)  
**Live staging:** **stale** — August not on host until G-20r4e manual upload.

---

## 1. Purpose

G-20r4b で生成された local `public-dist` を review し、2026-08 schedule 反映後の **構造・除外・sitemap** と **表示品質** を確認する。upload 前に直すべき P0/P1/P2 を整理する。

---

## 2. Preflight

| Check | Result |
| --- | --- |
| `HEAD` / `origin/main` | `f1a68c8` |
| G-20r4b regen | **PASS** |
| Package path | `output/manual-upload/gosaki-piano/public-dist/` |
| `fileCount` | **29** |
| `safeForStaticFtp` | **true** |
| Port 4321 LISTEN | **none** |
| Network / HTTP to live | **not executed** |

---

## 3. Route review summary

| Route / artifact | Result | Notes |
| --- | --- | --- |
| `gosaki-schedules.json` | **PASS** | 74 rows · August **14** |
| `/schedule/` hub | **PASS** | 6 month links · `2026.08` first · `scheduleDataSource=supabase` |
| `/schedule/2026-08/` | **PASS** | **14** cards · supabase marker |
| `/2026-08/` legacy | **PASS** | `noindex,follow` · canonical → `/schedule/2026-08/` · no cards |
| `sitemap-0.xml` | **PASS** | `/schedule/2026-08/` ×1 · legacy root **absent** |
| `/schedule/2026-07/` regression | **PASS** | **14** cards · `schedule-2026-07-008` in JSON |

---

## 4. Exclusion verification (no leaks)

| legacy_id | Reason | JSON | Public HTML | Result |
| --- | --- | --- | --- | --- |
| `schedule-2026-08-007` | published=false | absent | absent | **PASS** |
| `schedule-2026-08-009` | published=false | absent | absent | **PASS** |
| `schedule-2026-08-013` | published=false | absent | absent | **PASS** |
| `schedule-2026-08-008` | hold | absent | absent | **PASS** |
| `schedule-2026-08-018` | hold | absent | absent | **PASS** |
| `schedule-2026-03-014` | test row | absent | absent | **PASS** |
| `schedule-2026-09-001` | test row | absent | absent | **PASS** |

**Broken-output scan (August page):** `undefined` · `null` · `NaN` · `[object Object]` · `visibility:hidden` · PoC markers — **all absent**

---

## 5. August 14 cards — display quality

### 5.1 Structural rendering

| Check | Result |
| --- | --- |
| Date headings (`2026.08.DD (Dow)`) | **14/14 present** |
| Venue lines (`会場：`) | **14/14** |
| Title lines | **14/14** (angle-bracket Wix style) |
| Time lines | **11/14** (see gaps below) |
| Price lines | **11/14** (see gaps below) |
| Description / 出演 lines | **present** where seeded |

### 5.2 Per-row notes (published August)

| legacy_id | date | Quality note |
| --- | --- | --- |
| `001`, `002` | 08-01, 08-02 | 会場あり · **時間・料金なし** — Wix source parity |
| `003`–`006` | 08-06–09 | 時間・料金・出演 OK |
| `010`, `011` | 08-16 ×2 | 同日2件 · `011` **料金なし** |
| `012` | 08-20 | OK |
| `014` | 08-23 | 二部制 description あり · 第二部表記 `開演 15:30 / 開演 15:00` は **Wix原文寄せの疑い**（typo候補） |
| `015`–`019` | 08-24–30 | OK |

**Angle-bracket titles** (`&lt;地ビールフェスト2026&gt;` 等): Wix ソース再現 — G-20s で Kit bug ではないと分類済み。

---

## 6. Hub / legacy / SEO

### 6.1 `/schedule/` hub

- Month links: `2026.08` → `2026.03`（新しい月が先 — `deriveScheduleMonthsFromSchedules` 降順）
- `deployBase` 付き internal links — OK
- `robots: noindex,nofollow,noarchive` — staging policy OK

### 6.2 `/2026-08/` legacy stub

- Body: English 「Schedule page moved」+ link — G-9c0b 既存仕様
- **No** event cards — OK
- G-20s P1: legacy stub 日本語化は site-wide 課題（August 固有ではない）

### 6.3 Sitemap

Canonical URLs in `sitemap-0.xml`:

```txt
/schedule/2026-03/ … /schedule/2026-08/
```

Legacy `/2026-08/` at site root: **not listed** — G-9c0b OK

---

## 7. Upload readiness — P0 / P1 / P2

### P0 — upload ブロッカー

| # | Item | Status |
| --- | --- | --- |
| — | **none** | August 反映の構造・除外・sitemap は upload 可能 |

**Conclusion:** **no P0** — G-20r4d upload preflight に進行可（FTP はまだ禁止・preflight のみ）。

### P1 — upload 前に認識すべき品質（修正必須ではない）

| # | Item | Scope | Recommendation |
| --- | --- | --- | --- |
| P1-1 | Angle-bracket titles `<…>` | August + 既存月 | Wix parity · クライアント確認は G-20r2c 任意 |
| P1-2 | Legacy stub 英語文言 | site-wide | G-20s 既知 · 別フェーズで JP 化 |
| P1-3 | `#014` 第二部時刻表記 | `schedule-2026-08-014` | description 内 `開演/開演` — 必要なら CMS/DB 修正（別承認） |
| P1-4 | `#001`/`002` 時間・料金空 | beer fest | Wix ソース通り · hold ではない |

### P2 — defer（upload 後・別フェーズ）

| # | Item | Notes |
| --- | --- | --- |
| P2-1 | August SP レイアウト visual QA | G-20s1 mobile QA |
| P2-2 | 同日2件 (8/16) SP 表示 | spot-check on device |
| P2-3 | hold `#008`/`#018` 将来追補 | G-20r2c client confirm 後の別 INSERT |
| P2-4 | `published=false` 3件の公開判断 | クライアント確認後に republish 検討 |
| P2-5 | Live HTTP compare | G-20r4e 後に staging URL verify |

---

## 8. Upload scope hint (for G-20r4d — not executed)

August 初回反映の最小候補:

```txt
schedule/index.html
schedule/2026-08/index.html
2026-08/index.html
sitemap-0.xml
sitemap-index.xml
_astro/   (CSS hash 変更時は full public-dist 推奨)
```

---

## 9. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| Live staging HTTP GET | **no** |
| package regen | **no** |
| FTP / deploy | **no** |
| DB write / SQL / Save | **no** |
| commit / push | **no** |

---

## 10. Next phase

| Phase | Scope |
| --- | --- |
| **G-20r4d-upload-preflight** | Operator manual upload checklist doc |
| **G-20r4e** | Operator manual upload once + HTTP verify |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-public-output-review.mjs
```
