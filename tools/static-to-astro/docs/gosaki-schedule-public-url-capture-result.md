# G-20r1b — Gosaki schedule public URL capture result

**Phase:** `G-20r1b-gosaki-limited-public-url-capture`  
**Status:** **complete** — single public GET + local extraction  
**Date:** 2026-07-08  
**Base commit:** `aa128b8`  
**Client:** 後藤沙紀さん — ピアニスト個人ミュージシャンサイト  
**Prior:** [gosaki-schedule-source-capture-plan.md](./gosaki-schedule-source-capture-plan.md) (G-20r1) · [gosaki-schedule-source-freshness-audit.md](./gosaki-schedule-source-freshness-audit.md) (G-20r)

| Check | Status |
| --- | --- |
| Public GET executed (single URL) | **yes** |
| Raw HTML saved | **yes** |
| Events extracted from SSR HTML | **yes** — 19 blocks |
| Playwright used | **no** (not required) |
| DB write / Save / regen / FTP | **not executed** |

---

## Gates

```txt
gosakiSchedulePublicUrlCaptureComplete: true
phase: G-20r1b-gosaki-limited-public-url-capture
baseCommit: aa128b8
extractionConfidence: HIGH
eventCountDetected: 19
method: public GET only
login: none
auth: none
formSubmission: none
recursiveCrawl: none
networkScope: exact URL only
playwrightUsed: false
dbWriteInThisPhase: false
saveInThisPhase: false
packageRegenInThisPhase: false
ftpUploadInThisPhase: false
readyForG20r2ScheduleAugustSeedPlanning: true
sourceFreshnessGapFromG20r: confirmed
angleBracketSourceParityNote: true
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Capture metadata

| Field | Value |
| --- | --- |
| **task id** | `G-20r1b-gosaki-limited-public-url-capture` |
| **target URL** | `https://www.gosaki-piano.com/2026-08` |
| **actual fetched URL** | `https://www.gosaki-piano.com/2026-08` |
| **captured_at** | `2026-07-08T14:55:43.056Z` |
| **method** | public GET only |
| **login** | none |
| **auth** | none |
| **form submission** | none |
| **recursive crawl** | none |
| **network scope** | exact URL only (+ trailing-slash probe) |
| **helper script** | `scripts/capture-gosaki-2026-08-public-url.mjs` |

### Output files

| File | Path |
| --- | --- |
| raw HTML | `output/gosaki-source-captures/2026-08/raw.html` |
| extracted text | `output/gosaki-source-captures/2026-08/extracted-text.txt` |
| capture summary | `output/gosaki-source-captures/2026-08/capture-summary.json` |

`output/` is gitignored — artifacts are local only.

---

## 2. HTTP result

| Field | Value |
| --- | --- |
| **status code** | `200` |
| **redirect** | none (primary URL) |
| **final URL** | `https://www.gosaki-piano.com/2026-08` |
| **content type** | `text/html; charset=UTF-8` |
| **byte length** | `709,766` |
| **HTML save path** | `output/gosaki-source-captures/2026-08/raw.html` |
| **extraction method** | strip scripts/styles → plain text lines → date-block parser |

### Trailing-slash probe

| URL | Status | Final URL | Redirect |
| --- | --- | --- | --- |
| `https://www.gosaki-piano.com/2026-08/` | 200 | `https://www.gosaki-piano.com/2026-08` | yes (301 → no-slash) |

---

## 3. 2026-08 schedule extraction

**event_count_detected:** `19`  
**detected dates:** 2026.08.01, 02, 06, 07, 08, 09, 10, 11, 15, 16 (×2), 20, 21, 23, 24, 25, 28, 29, 30

Wix SSR HTML にイベント本文が含まれており、Playwright 不要で抽出可能だった。

### Event table (from public GET — no inference)

| # | date | title | venue | time (raw) | price | performers | venue/event website (from raw_text) | intended_action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026.08.01 (Sat) | `<地ビールフェスト2026>` | 甲府駅北口(アシストエンジニアリングよっちゃばれ広場) | （空） | （空） | 『KHACHA BAND』 | https://sannichiybs.info/beer/ | insert |
| 2 | 2026.08.02 (Sun) | `<地ビールフェスト2026>` | 甲府駅北口(アシストエンジニアリングよっちゃばれ広場) | （空） | （空） | 『KHACHA BAND』 | https://sannichiybs.info/beer/ | insert |
| 3 | 2026.08.06 (Thu) | `<紀々音>` | 銀座　The DEEP | 開場 19:00 / 開演 19:30 | 3,300円 + TC 550円 | 『紀々音』田村麻紀子cl,vo 後藤沙紀pf | https://jazz-thedeep.com/ | insert |
| 4 | 2026.08.07 (Fri) | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | 熊谷 Jazz&Cafe SPACE1497 | 開場 18:30 / 開演 19:30 | 3,500円 | 『Awesome Songbook』木村美保vo 丸山朝光vo,bjo 後藤沙紀pf | https://space1497.amebaownd.com/ | insert |
| 5 | 2026.08.08 (Sat) | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | 宇都宮　リムジン | 開場 19:00 / 開演 20:00 | 4,000円(おつまみ、お通し付) | 同上 | https://www.limous.jp/index.html | insert |
| 6 | 2026.08.09 (Sun) | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | 筑西　Jazz Live Spot village | 開場 19:00 / 開演 19:30 | 3,000円(1drink付) | 同上 | http://www.jazz1126.com/ | insert |
| 7 | 2026.08.10 (Mon) | `<Duo>` | （空） | （空） | （空） | （空） | （空） | needs_client_confirmation |
| 8 | 2026.08.11 (Tue) | `<堤智恵子 Trio>` | 西新井　カフェ・クレール | 開場 / 開演 | （空） | 堤智恵子sax 後藤沙紀pf 木川保奈美perc | https://clair.cafe.coocan.jp/ | insert |
| 9 | 2026.08.15 (Sat) | `<Duo>` | （空） | （空） | （空） | （空） | （空） | needs_client_confirmation |
| 10 | 2026.08.16 (Sun) | `<Quartet>` | 蕨　Our Delight | 開場 13:00 / 開演 13:30 | 4,500円 | 谷口英治cl 杉内浩介gt 後藤沙紀pf 本川悠平b | https://ourdelight.blog.jp/ | insert |
| 11 | 2026.08.16 (Sun) | `<新谷健介オノマトペ>` | 用賀　キンのツボ | 開場 18:00 / 開演 19:00 | （空） | 『新谷健介オノマトペ』新谷健介cl 後藤沙紀pf 吹谷禎一郎b 田中涼ds | https://kinnotsubo.com/ | insert |
| 12 | 2026.08.20 (Thu) | `✳︎Leader Live✳︎` + `<Brazilian Jazz Trio>` | 草加　Sugar Hill | 開場 18:30 / 開演 19:30 | 3,500円 | 後藤沙紀pf 石川周之介sax,fl 見谷聡一perc | https://sugarhill.jp/ | insert |
| 13 | 2026.08.21 (Fri) | `<原田茅子Quartet>` | 松戸　コルコバード | （空） | （空） | （空） | （空） | needs_client_confirmation |
| 14 | 2026.08.23 (Sun) | `✳︎Leader Live✳︎` + `<子どもと一緒にジャズライブ>` | 岡山　tonica | 【第一部】開場 12:30 / 開演 13:00 【第二部】開演 15:30 / 開演 15:00 | 大人3,000円 / 未就学児 500円 / こども(高校生まで) 1,000円 / 大学生 1,500円 | 後藤沙紀pf 鈴木梨花子ds | https://gosakirikakotrio.wixsite.com/gosakirikakotrio | insert |
| 15 | 2026.08.24 (Mon) | `✳︎Leader Live✳︎` + `<ごさきりかこTrio>` | 岡山　SOHO | 開場 19:00 / 開演 19:45 | 予約 4,000円 / 当日 5,000円 | 『ごさきりかこTrio』後藤沙紀pf 鈴木梨花子ds 寺尾陽介b | https://soho214.blog.fc2.com/ | insert |
| 16 | 2026.08.25 (Tue) | `✳︎Leader Live✳︎` + `<ごさきりかこTrio>` | 名古屋　The Wiz | 開場 18:00 / 開演 19:00 | 予約 3,800円 / 当日 4,300円 | 『ごさきりかこTrio』…（行分割あり — raw_text 参照） | https://www.wizjazz.jp/ | insert |
| 17 | 2026.08.28 (Fri) | `<カリビアンファンクション>` | 浅草　HUB | 開場 18:00 / 開演 19:00 | 2,750円 | 『カリビアンファンクション』…（行分割あり — raw_text 参照） | https://www.pub-hub.com/index.php/shop/detail/6 | insert |
| 18 | 2026.08.29 (Sat) | `<Set Sail Special Quartet>` | 上福岡　エボニー | 開演 19:00 | （空） | 天野丘gt 後藤沙紀pf 落合康介b 鈴木梨花子ds | https://www.music-cafe-ebony.com/ | insert |
| 19 | 2026.08.30 (Sun) | `<KHACHA BAND>` | 浅草　HUB | 開場 17:00 / 開演 18:00 | 2,750円 | 『KHACHA BAND』丸山朝光vo,bjo 河原真彩tp 後藤沙紀pf 菊池芳将b 田中涼ds | https://www.pub-hub.com/index.php/shop/detail/6 | insert |

### uncertainty_notes (extraction)

| Topic | Note |
| --- | --- |
| venue_website field | Wix は URL を次行に配置 — `capture-summary.json` の `venue_website` は空のことがある。**raw_text** を SoT |
| 2026.08.10 / 08.15 / 08.21 | Wix 上で会場・時間・料金・出演が空 — **推測補完しない** |
| 2026.08.11 | 時間欄は「開場 / 開演」のみ（時刻なし） |
| 2026.08.16 | 同日 2 イベント（#10 afternoon · #11 evening） |
| 2026.08.23 | 二部制・時間表記が複雑（Wix 原文のまま保持） |
| 2026.08.25 / 08.28 | 出演者行が Wix HTML で改行分割 — **raw_text** で全文確認 |
| `<>` titles | Wix source parity（G-20q）— そのまま保持 |

---

## 4. Extraction confidence

**判定: HIGH**

| Criterion | Result |
| --- | --- |
| SSR HTML にイベント本文 | **yes** — 19 blocks |
| Playwright 必要 | **no** |
| 主要フィールド（日付・タイトル・会場） | ほぼ全件取得 |
| 一部不明/空欄 | Wix 原文どおり（#7, #9, #13 等） |

---

## 5. Kit 側との差分

| Item | Kit (G-20r) | Public Wix (G-20r1b) |
| --- | --- | --- |
| Schedule months | 2026-03 … 2026-07 | **2026-08 あり** |
| `/schedule/2026-08/` | not in package | N/A (Wix uses `/2026-08`) |
| `gosaki-schedules.json` 2026-08 rows | **0** | **19 events on page** |
| Gap type | **source freshness gap** | confirmed |

**To add 2026-08 to Kit:** DB insert / seed planning required (**G-20r2**). **No DB write in this phase.**

**G-20p:** package content GO / regen 不要は G-22j 時点の 03–07 整合として **維持** — 今回の gap は別問題。

---

## 6. `<>` の扱い

- `<>`（例: `<Duo>`, `<紀々音>`）は **Wix source parity note**（G-20q）
- **Kit 変換バグではない**
- 2026-08 でも `<>` タイトルが多数存在 — **source raw text として保持**
- seed 時も推測で埋めず、Wix 表記を優先

---

## 7. 次フェーズ候補

| Phase | Scope | DB / build |
| --- | --- | --- |
| **G-20r2-schedule-august-seed-planning** | 本 capture → Supabase seed / INSERT **候補**変換計画 | **no** SQL |
| **G-20r3-schedule-august-db-insert-preflight** | approvalId 付き INSERT/UPDATE preflight | preflight only · 実行は戸山さん判断 |
| **G-20r4-schedule-public-reflection-plan** | DB 反映後 package regen / diff / upload 計画 | 実行はさらに別フェーズ |

**G-20r1a**（operator 手動取得）は **G-20r1b で代替完了** — 再実施不要。

---

## 8. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| Wix login / admin | **no** |
| recursive crawl / sitemap crawl | **no** |
| form submit / HubSpot | **no** |
| Playwright render | **no** |
| DB write / Save | **no** |
| package regen / build | **no** |
| FTP / deploy / production change | **no** |
| commit / push | **no** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-public-url-capture-result.mjs
```
