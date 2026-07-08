# G-20r — Gosaki schedule source freshness audit

**Phase:** `G-20r-gosaki-schedule-source-freshness-audit`  
**Status:** **complete** — read-only / local artifact inspection only  
**Date:** 2026-07-08  
**Base commit:** `5fa16c3`  
**Client:** 後藤沙紀さん — ピアニスト個人ミュージシャンサイト  
**Prior:** [gosaki-internal-preview-readiness-gap-audit.md](./gosaki-internal-preview-readiness-gap-audit.md) (G-20q) · [gosaki-production-package-staleness-review.md](./gosaki-production-package-staleness-review.md) (G-20p)

| Check | Status |
| --- | --- |
| Kit schedule months inventoried | **yes** |
| 2026-08 absence confirmed locally | **yes** |
| Operator Wix `/2026-08` report recorded | **yes** |
| G-20p relationship clarified | **yes** |
| Next phases separated | **yes** |
| Live crawl / network / DB / build | **not executed** |

---

## Gates

```txt
gosakiScheduleSourceFreshnessAuditComplete: true
phase: G-20r-gosaki-schedule-source-freshness-audit
baseCommit: 5fa16c3
sourceFreshnessGapConfirmed: true
gapType: source-content-freshness
notPackageStalenessVsG22j: true
g20pContentGoWithinPilotScope: maintained
operatorReportWix2026-08Exists: true
kitPackageScheduleMonthsMin: 2026-03
kitPackageScheduleMonthsMax: 2026-07
schedule2026-08InPackage: false
legacy2026-08InPackage: false
sitemap2026-08Present: false
gosakiSchedulesJson2026-08Rows: 0
angleBracketTitlesSourceParity: true
angleBracketNotKitBug: true
wixAugustEventCount: unknown
readyForG20r1ScheduleSourceCapturePlan: true
liveCrawlExecuted: false
networkAccess: false
httpFetchWixExecuted: false
buildExecuted: false
packageRegenExecuted: false
dbWriteExecuted: false
saveExecuted: false
ftpUploadExecuted: false
deployExecuted: false
productionChangeExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. 目的

現行 **Wix 公開サイト**（gosaki-piano.com）と **CMS Kit 側** production package / schedule JSON の **freshness gap** を read-only で棚卸しする。

| Scope | In | Out |
| --- | --- | --- |
| Local artifact inspection | **yes** | — |
| Operator report of Wix `/2026-08` | **record** | — |
| Live crawl / HTTP to Wix | — | **no** |
| DB write / Save / regen / upload | — | **no** |

---

## 2. Kit 側の現在状態（verified read-only）

### 2.1 Production package

| Item | Value |
| --- | --- |
| Path | `output/manual-upload/gosaki-piano-production/public-dist/` |
| MANIFEST `generatedAt` | `2026-07-01T17:16:34.661Z` |
| `fileCount` | **26** |

### 2.2 Schedule month routes present

| Route type | Months present |
| --- | --- |
| Canonical `/schedule/YYYY-MM/` | **2026-03, 2026-04, 2026-05, 2026-06, 2026-07** |
| Legacy stub `/YYYY-MM/` | **2026-03 … 2026-07** |
| `/schedule/` hub month links | **03–07 only** (verified in `schedule/index.html`) |

### 2.3 Absent (confirmed on disk)

| Route / artifact | Present? |
| --- | --- |
| `/schedule/2026-08/` | **no** |
| `/2026-08/` legacy stub | **no** |
| `sitemap-0.xml` loc for 2026-08 | **no** |

**Sitemap schedule URLs (12 locs total — schedule subset):**

```txt
/schedule/
/schedule/2026-03/ … /schedule/2026-07/
```

(No `/schedule/2026-08/`. Note: sitemap also lists `/admin/` though package excludes admin — separate P2 issue.)

### 2.4 `gosaki-schedules.json` (intermediate convert output)

| File | Total rows | 2026-08 rows | Month breakdown (all dates) |
| --- | --- | --- | --- |
| `output/gosaki-piano-astro-production/src/data/gosaki-schedules.json` | **60** | **0** | Mar 13 · Apr 10 · May 12 · Jun 11 · Jul 14 |
| `output/gosaki-piano-astro/src/data/gosaki-schedules.json` | **60** | **0** | same |

**2026-09 rows:** also **0** (pilot `expectedMonths` was 03–07 per G-9/G-22i docs).

### 2.5 Historical Kit expectation

`gosaki-public-schedule-read-verification.md` documented `/schedule/2026-08/` → **404** on staging as **expected** when seed scope ended at 2026-07. That was correct for the pilot window; it is now a **freshness gap** relative to updated Wix source.

---

## 3. G-20p との関係

| Statement | Status |
| --- | --- |
| G-20p: package content **GO** vs G-22j published state (03–07) | **Still valid** — JSON/HTML within pilot months match |
| G-20p: package regen **not required** for G-22j closure | **Still valid** for that scope |
| This audit contradicts G-20p? | **No** |
| New issue type | **Source freshness gap** — Wix live updated **after** Kit seed/crawl window |
| Mislabel | **Not** “package staleness vs G-22j” |

```txt
G-20p answered:  "Is the G-20i3 package stale vs G-22j DB for months 03–07?"
G-20r answers:  "Has the external Wix source moved ahead of Kit (2026-08)?"
```

---

## 4. 2026-08 source evidence

| Evidence | Detail |
| --- | --- |
| **Operator report** | Current live **gosaki-piano.com** has **`/2026-08`** schedule content |
| Method | Manual browser observation / screenshot (operator-held; not in repo) |
| Cursor verification | **None** — no HTTP fetch to Wix |
| August event count | **Unknown** — not determined this phase |
| August event details | **Unknown** — titles, dates, venues TBD until G-20r1 capture |

---

## 5. リスク分類

### 5.1 Client preview

| Risk | Level |
| --- | --- |
| Showing Kit staging/preview **without August** while Wix live has August | **High** — site looks **out of date** |
| Mitigation | Disclose gap to client OR complete G-20r1→r4 before preview |

### 5.2 Production cutover

| Risk | Level |
| --- | --- |
| Full upload of current 26-file package | August schedule **missing** on new site |
| Mitigation | **Must** resolve 08 data + routes before G-20j upload |

### 5.3 `<>` schedule titles

| Item | Classification |
| --- | --- |
| Visible `&lt;&gt;` on July events | **Source parity note** — same on live Wix per operator |
| Kit conversion bug? | **No** |
| Blocks this freshness audit? | **No** — orthogonal content note (G-20q P1-9) |

### 5.4 Source freshness gap conclusion

```txt
sourceFreshnessGap: CONFIRMED (read-only)
kitMaxMonth: 2026-07
wixReportedMonth: 2026-08 (operator report; unverified by Cursor)
actionRequired: yes — before client preview and before production cutover
immediateDataMutation: no — separate approved phases
```

---

## 6. 次フェーズ候補（今回は実行しない）

### G-20r1 — `G-20r1-schedule-source-capture-plan`

| Item | Detail |
| --- | --- |
| Goal | Operator manually captures Wix August schedule |
| Methods | Browser screenshot · copy HTML/text · CSV/manual notes · event count |
| Who | **戸山さん** (human browser) |
| Network | Human only — **not** Cursor crawl |
| Output | Off-repo capture doc for G-20r2 |

### G-20r2 — `G-20r2-schedule-august-seed-planning`

| Item | Detail |
| --- | --- |
| Goal | Plan how August rows enter Supabase (`site_slug=gosaki-piano`) |
| Scope | `expectedMonths` extension · row mapping · legacy route policy |
| DB write | **none** in planning phase |

### G-20r3 — `G-20r3-schedule-august-db-insert-preflight`

| Item | Detail |
| --- | --- |
| Goal | Preflight for INSERT/UPDATE if needed |
| Gate | Dedicated **approvalId** · staging only · no production ref |
| Execution | **Separate phase** after G-20r2 |

### G-20r4 — `G-20r4-schedule-public-reflection-plan`

| Item | Detail |
| --- | --- |
| Goal | After DB update: G-22i-style local regen · diff · upload plan for August routes |
| Includes | `/schedule/2026-08/` · `/2026-08/` stub · sitemap · hub link |
| Build/regen/upload | **Further separate phases** with explicit approval |

**Recommended order:** G-20r1 → G-20r2 → G-20r3 → G-20r4 → (regen) → (upload).

---

## 7. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| live crawl | **no** |
| network access | **no** |
| HTTP fetch to gosaki-piano.com / Wix | **no** |
| build / Astro build | **no** |
| package regen | **no** |
| DB write / SQL mutation | **no** |
| Supabase Save | **no** |
| FTP / deploy / workflow_dispatch | **no** |
| DNS / SSL / MX change | **no** |
| production change | **no** |
| commit / push | **no** |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-source-freshness-audit.mjs
```
