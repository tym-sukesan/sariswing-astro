# G-20q — Gosaki internal preview readiness gap audit

**Phase:** `G-20q-gosaki-internal-preview-readiness-gap-audit`  
**Status:** **complete** — read-only / local artifact inspection · **reclassified 2026-07-08** (addendum)  
**Date:** 2026-07-08  
**Base commit:** `fd59ceb`  
**Client:** 後藤沙紀さん — **ピアニスト個人ミュージシャンサイト**（音楽教室サイトではない）  
**Artifact basis:** `output/manual-upload/gosaki-piano-production/public-dist/` (G-20i3) + prior staging QA docs  
**Prior:** [gosaki-production-upload-preflight-refresh.md](./gosaki-production-upload-preflight-refresh.md) · [gosaki-staging-browser-qa-and-client-preview-readiness.md](./gosaki-staging-browser-qa-and-client-preview-readiness.md) (G-7j)

| Check | Status |
| --- | --- |
| Production package artifacts inspected | **yes** |
| Route-by-route QA inventory | **yes** |
| P0 / P1 / P2 / Defer classified | **yes** |
| Implementation candidates proposed | **yes** |
| Fix implementation / build / FTP | **not executed** |

---

## Gates

```txt
gosakiInternalPreviewReadinessGapAuditComplete: true
phase: G-20q-gosaki-internal-preview-readiness-gap-audit
baseCommit: fd59ceb
clientPreviewVerdict: NOT_READY
internalOperatorPreviewVerdict: READY_WITH_NOTES
artifactInspected: gosaki-piano-production-public-dist
testPoCTextAbsent: true
stagingUrlLeakAbsent: true
scheduleEmptyTitleSourceParity: true
scheduleEmptyTitleNotKitP0Blocker: true
scheduleSourceFreshnessGap: true
wixSourceIncludes2026-08: operator-reported
packageScheduleMonthsMax: 2026-07
notPackageStalenessVsG22j: true
mobileDeviceQaPending: true
hubspotE2eUnverified: true
readyForG20rScheduleSourceFreshnessAudit: true
readyForG20rMobileDeviceQa: true
liveCrawlExecuted: false
networkAccess: false
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

## 1. 現在の見せられる度合い

| Question | Verdict |
| --- | --- |
| 今すぐクライアントに見せてよいか | **いいえ** — schedule freshness（8月未反映の可能性）· mobile 未検証 · HubSpot E2E 未確認 |
| 内部確認（戸山さん）なら OK か | **はい（注意付き）** — staging URL で route 横断 QA 継続可 |
| クライアント確認前に直すべきか | **一部** — P0 は freshness 確認・mobile・Contact E2E（§9） |
| 本番公開前でよいもの | P1 文言・`<>` 本人確認時整理 · SEO 細部など |
| 公開後 / Kit 一般化でよいもの | hosted admin · News CMS · FTP 自動化など |

### clientPreviewVerdict

```txt
clientPreviewVerdict: NOT_READY
```

**理由（2026-07-08 再分類後）:**

1. **Schedule source freshness gap** — 現行 Wix 公開サイトには **2026-08** スケジュールが追加されているが、CMS Kit 側 artifact / package は **2026-07 まで**（§2.1）。クライアント preview 前に差分の把握が必要。
2. **Mobile 実機 spot-check 未完了**（G-7j から pending）。
3. **HubSpot Contact 送信 E2E 未確認**（embed は存在）。

**`<>` タイトルは NOT_READY の理由に含めない** — 下記 §2.2 参照（Wix source parity · P1 / Content note）。

**内部向け:** G-7/8 + G-22j までの PC staging は operator 視覚 PASS 済み。test/PoC/staging 文言の混入は artifact 上 **なし**。

---

## 2. Artifact 検査サマリ

| Item | Result |
| --- | --- |
| Package path | `output/manual-upload/gosaki-piano-production/public-dist/` |
| File count | **26** |
| `admin/` in package | **absent** ✓ |
| Test/PoC/staging strings | **absent** (`（テスト）`, `[CMS Kit staging]`, `yskcreate`, etc.) |
| `音楽教室` in About | **biography 文脈**（「ヤマハ音楽教室に通い」）— サイト種別の誤表記ではない |
| `/profile/` route | **absent** — profile は `/about/` |

### 2.1 Schedule source freshness gap（新規 — 重要）

| Item | State |
| --- | --- |
| **Current Wix public site** (`gosaki-piano.com`) | Operator report: **`/2026-08` schedule now exists** on live Wix |
| **CMS Kit production package** | Months **2026-03 … 2026-07** only — **no** `/schedule/2026-08/` · **no** `/2026-08/` legacy stub |
| **Staging Supabase seed scope** | Designed for 2026-03 … 2026-07 (`expectedMonths` pilot) |
| **G-20p package staleness vs G-22j** | **Separate issue** — G-20p concluded published content within 03–07 matches DB; **not** invalidated |
| **Gap type** | **Source-content freshness** — Wix live moved ahead of Kit crawl/seed window |
| **Live crawl / network (this phase)** | **not executed** |
| **Data update / Save / regen / upload** | **deferred** — separate approved phases |

**Implication for client preview:** Showing staging/preview without August may **under-represent** the client's current public schedule. Resolve via `G-20r-schedule-source-freshness-audit` before client demo.

### 2.2 Content note — `<>` schedule titles（source parity）

| Item | State |
| --- | --- |
| Artifact observation | `/schedule/2026-07/` HTML shows `&lt;&gt;` for **3 events** (2026-07-17/18/19) |
| **Kit implementation bug?** | **No** — operator confirms **same `<>` display exists on current gosaki-piano.com (Wix)** |
| Classification | **Source parity / source content artifact** — Wix-originated empty title pattern |
| Client preview blocker? | **No** — not a CMS Kit conversion defect |
| Recommended handling | **P1 / Content note** — clarify with client during sign-off if titles should be filled |
| DB row `schedule-2026-07-008` | G-22j republish used `title=<>` — mirrors Wix source; **do not re-Save** without new approval |

---

## 3. Route 別 QA inventory

凡例: **CP** = client preview に出してよいか · **Pri** = P0/P1/P2/defer

### Primary routes

| Route | 役割 | CP | 所見 | Pri |
| --- | --- | --- | --- | --- |
| `/` | Home · KV · YouTube | ⚠️ | canonical/OGP prod OK · MENU/nav markup あり · Wix favicon CDN · 英語 title「Goto Saki Official Web Site」 | P1 |
| `/about/` | Profile + Wix About + Bands | ⚠️ | 5 band cards 注入済 · biography 自然 · nav「About」英語 | P1 |
| `/schedule/` | Month hub | ⚠️ | hub links 03–07 only · **2026-08 absent**（§2.1） | **P0** (freshness) |
| `/schedule/2026-03/` | March events | ✓ | 13 cards · test 文言なし | defer |
| `/schedule/2026-04/` | April events | ✓ | 10 cards | defer |
| `/schedule/2026-05/` | May events | ✓ | 12 cards | defer |
| `/schedule/2026-06/` | June events | ✓ | 11 cards | defer |
| `/schedule/2026-07/` | July events | ⚠️ | 14 cards · `&lt;&gt;` ×3 — **Wix source parity**（§2.2）· **not Kit P0** | P1 / Content note |
| `/discography/` | Albums + tracklists | ✓ | Supabase read · 8+8 tracks · test タイトルなし | P1 |
| `/contact/` | HubSpot contact | ⚠️ | `hubspot-embed` / `hs-form-frame` あり · Wix form なし · **送信 E2E 未検証** | **P0** (E2E) |
| `/link/` | External links | ✓ | 10 external links · 構造単純 | defer |

### Legacy stubs

| Route | 役割 | CP | 所見 | Pri |
| --- | --- | --- | --- | --- |
| `/2026-03/` … `/2026-07/` | Old Wix month URLs | △ | `noindex,follow` ✓ · canonical → `/schedule/YYYY-MM/` ✓ · **本文英語**「Schedule page moved」 | P1 |

### SEO files

| Route | 役割 | CP | 所見 | Pri |
| --- | --- | --- | --- | --- |
| `robots.txt` | Prod indexable | ✓ | `Allow: /` + sitemap line | P2 |
| `sitemap-index.xml` | Sitemap index | ✓ | prod host | P2 |
| `sitemap-0.xml` | URL list | ⚠️ | **12 URLs · `/admin/` を含む** — package は admin 除外 · 404 リンクリスク | P2 |

---

## 4. 見た目 / UX 重点所見

| Area | Status | Notes | Pri |
| --- | --- | --- | --- |
| Home hero / KV | OK (staging) | G-7j operator: Wix に近い · G-7i2 overlay 修正済 | P1 fine-tune |
| Header nav | OK markup | Schedule 含む 6 リンク · `nav-toggle` + `global-nav` JS | mobile QA pending |
| Mobile MENU | **unverified** | CSS `@768px` rules 13 箇所 · G-8g1–g8g2 fixes in overrides — **実機未確認** | **P0** |
| Footer | OK (staging) | 二重 SNS（Wix mask icons + text links）— 意図的 fallback | P1 |
| About / Profile | OK | `/about/` · band cards | P1 nav 日本語化 |
| Bands / Projects | OK | 5 cards + images in package | P1 |
| Schedule hub | ⚠️ | Missing Aug vs live Wix | **P0** (freshness audit) |
| Schedule months | OK (03–07) | July `<>` = source parity | P1 / Content note |
| Legacy stubs | OK function / EN copy | 英語 stub | P1 |
| Discography | OK (staging) | G-7j PASS · spacing G-8g5–g8g8 | P1 |
| Tracklist | OK | 8+8 · no test strings | defer |
| Contact | ⚠️ | HubSpot only · disclaimer なし | P0 (E2E) / P1 (disclaimer) |
| Link | OK | — | defer |
| Font / spacing | OK baseline | Wix export + G-8 overrides | P1 |
| OGP / title | Mixed | `saki-goto` suffix on subpages · home EN title | P1 |
| `/profile/` 導線 | N/A | `/about/` で足りる — 破綻なし | defer |

---

## 5. コンテンツ確認

| Pattern | Found in production artifact |
| --- | --- |
| `（テスト）` / PoC / `[CMS Kit staging]` | **no** |
| `mock` / `dummy` / `Lorem` / `TODO` / `FIXME` | **no** |
| staging URL leak | **no** |
| 音楽教室サイト誤認文案 | **no**（biography 内「ヤマハ音楽教室」は OK） |
| `&lt;&gt;` visible schedule title | **yes** — `/schedule/2026-07/` × **3** · **Wix source parity**（live Wix 同様）— **not Kit defect** |
| Contact「送信できる」誤認 | **risk** — HubSpot embed あるが E2E 未証明 · 注意書き推奨 |

---

## 6. Mobile / responsive

### Artifact / CSS で確認できたこと

| Item | Status |
| --- | --- |
| `nav-toggle` button + `aria-expanded` | present all routes |
| `header-transform.mjs` toggle script | inlined in HTML |
| Responsive CSS `@media (max-width:768px)` | present in `index.YcHrHZH4.css` |
| G-8b–G-8g override rules | in build pipeline (staging QA PASS PC) |

### 未確認（次タスク）

| Item | Proposed phase |
| --- | --- |
| ≤767px MENU open/close | `G-20r-mobile-device-qa` |
| Schedule month scroll / card wrap | same |
| Discography image-first SP | same |
| About band card stack | same |
| Contact form narrow viewport | same |
| Footer SNS clip / overlap | same |

**G-7j:** mobile basic check **PENDING** — 今回も未実施（browser QA なし）。

---

## 7. Contact / HubSpot

| Item | State |
| --- | --- |
| Current contact page | Wix layout shell + **`gosaki-hubspot-embed`** / `hs-form-frame` |
| Wix native form | **not detected** (`comp-kei80gar` absent) |
| HubSpot embed | **present** in artifact |
| Production domain E2E | **not verified** — portal domain allowlist 要確認 |
| Before client preview | Operator note: 「お問い合わせはプレビュー環境 — 送信テストは別途」 |
| Before production cutover | **必須:** submit → HubSpot inbox 受信確認（G-20j preflight §5） |

---

## 8. Admin / CMS 表示

| Item | State |
| --- | --- |
| Production package `admin/` | **excluded** ✓ |
| Client preview で CMS admin を見せる | **すべきでない** |
| Hosted admin on prod | **別フェーズ**（G-20i2 Option B） |
| 「本人が更新できる」運用 | **未完成** — operator local regen → manual upload |
| 機能実証済み（内部記録） | Schedule CMS P0 · Discography slices · YouTube · About JSON · Contact slice |

**Preview URL:** staging `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` — **public site only**。`/__admin-staging-shell/` は local dev のみ。

---

## 9. P0 / P1 / P2 / Defer 分類

### P0 — client preview 前に確認・対応したい（3 件）

| ID | Item | Why |
| --- | --- | --- |
| P0-1 | **Schedule source freshness gap** — Wix に 2026-08 追加 · Kit は 07 まで | クライアント preview で現行公開より古く見えるリスク |
| P0-2 | **Mobile 実機 spot-check**（MENU + schedule + footer） | G-7j から pending |
| P0-3 | **Contact HubSpot 送信確認**（staging 上で operator E2E） | 送信できるように見えて未検証は危険 |

### P1 — client preview 前にできれば（9 件）

| ID | Item |
| --- | --- |
| P1-1 | Page `<title>` の `saki-goto` → 後藤沙紀 / Goto Saki ブランド統一 |
| P1-2 | Nav ラベル英日混在（Home/About vs 日本語本文） |
| P1-3 | Legacy stub 英語 → 日本語短文 |
| P1-4 | Header logo 表記「SAKI GOTO Website」 |
| P1-5 | Footer 二重 SNS の見た目整理 |
| P1-6 | Discography / About SP 余白の最終調整 |
| P1-7 | Contact ページにプレビュー用注意書き（送信未検証時） |
| P1-8 | Home favicon Wix CDN 依存 → 自ホスト検討 |
| P1-9 | **`<>` schedule titles** — Wix source parity · 本人確認時にタイトル整理を相談 |

### Content note（blocker ではない）

| ID | Item | Note |
| --- | --- | --- |
| CN-1 | July `&lt;&gt;` titles ×3 | Live Wix 同様 · Kit 変換ミスではない · 修正は client/content 判断 |

### P2 — 本番公開前でよい（5 件）

| ID | Item |
| --- | --- |
| P2-1 | `sitemap-0.xml` から `/admin/` 除去 |
| P2-2 | sitemap に legacy month URLs 要否 |
| P2-3 | OGP description 微調整 |
| P2-4 | HubSpot production domain allowlist |
| P2-5 | Search Console 準備 |

### Defer — 公開後 / Kit（6 件）

| ID | Item |
| --- | --- |
| D-1 | Hosted admin |
| D-2 | News CMS |
| D-3 | Image upload CMS |
| D-4 | FTP 自動化（G-7f1 停止中） |
| D-5 | Full self-service CMS |
| D-6 | G-23o / seiichijazz |

**件数:** P0 **3** · P1 **9** · Content note **1** · P2 **5** · Defer **6**

---

## 10. 次の最小タスク候補（今回は実装しない）

| Priority | Phase | Scope | Risk |
| --- | --- | --- | --- |
| **1** | **`G-20r-schedule-source-freshness-audit`** | Wix 公開 schedule（**2026-08 含む**）vs CMS Kit DB/package 差分の read-only 棚卸し · live crawl は別承認 | low (read-only) |
| **2** | `G-20r-mobile-device-qa-and-header-footer-fix` | 実機 QA → MENU/footer 残差修正（CSS only なら低リスク） | low–medium |
| **3** | `G-20r-client-preview-readiness-patch-batch` | P1 文言（legacy stub JP化 · title/OGP）· contact disclaimer · sitemap admin 除去 | low |

**推奨着手順:** **1**（freshness audit — Save 不要）→ **2**（mobile QA）→ 差分が確定後に **data update / seed / regen** は別フェーズ（承認付き）。

**明示的に今回やらないこと:** live crawl · DB write · Save · package regen · upload · 2026-08 ルート追加実装。

---

## 11. High-risk separation — 今回未実行

| Operation | Executed |
| --- | --- |
| 修正実装 | **no** |
| Astro / package build / regen | **no** |
| DB write / Save | **no** |
| FTP / deploy / workflow_dispatch | **no** |
| DNS / SSL / MX change | **no** |
| production change | **no** |
| live crawl / network | **no** |
| `service_role` | **no** |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-internal-preview-readiness-gap-audit.mjs
```
