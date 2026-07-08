# G-20r1 — Gosaki schedule source capture plan

**Phase:** `G-20r1-gosaki-schedule-source-capture-plan`  
**Status:** **complete** — operator manual capture procedure + record format only  
**Date:** 2026-07-08  
**Base commit:** `406ec63`  
**Client:** 後藤沙紀さん — ピアニスト個人ミュージシャンサイト  
**Prior:** [gosaki-schedule-source-freshness-audit.md](./gosaki-schedule-source-freshness-audit.md) (G-20r) · [gosaki-internal-preview-readiness-gap-audit.md](./gosaki-internal-preview-readiness-gap-audit.md) (G-20q)

| Check | Status |
| --- | --- |
| Manual capture procedure documented | **yes** |
| Record format template | **yes** |
| Normalization rules (plan only) | **yes** |
| Safety rules documented | **yes** |
| Next phases separated | **yes** |
| Live crawl / network / DB / Save | **not executed** |

---

## Gates

```txt
gosakiScheduleSourceCapturePlanComplete: true
phase: G-20r1-gosaki-schedule-source-capture-plan
baseCommit: 406ec63
captureTargetMonth: 2026-08
captureExecutor: operator-human-browser-only
cursorNetworkAccess: false
cursorLiveCrawl: false
cursorHttpFetchWix: false
dbWriteInThisPhase: false
saveInThisPhase: false
packageRegenInThisPhase: false
ftpUploadInThisPhase: false
readyForG20r1aOperatorCaptureResult: true
readyForG20r2ScheduleAugustSeedPlanning: false
sourceFreshnessGapFromG20r: confirmed
g20pContentGoMaintained: true
angleBracketSourceParityNote: true
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. 目的

| Goal | Detail |
| --- | --- |
| **Primary** | 現行 Wix 公開サイトの **2026-08** スケジュールを、**戸山さんが人間のブラウザ**で確認・取得する手順を定義する |
| **This phase** | 手順書 + 記録フォーマット + 正規化ルール**案**のみ |
| **Cursor / AI** | Wix に **アクセスしない** · live crawl / HTTP 取得 **しない** |
| **Out of scope** | DB write · seed · Supabase Save · package regen · FTP · production 変更 |

### Context (G-20r confirmed)

- **sourceFreshnessGap:** CONFIRMED — Kit は 2026-07 まで · Wix に 2026-08（operator report）
- **G-20p:** package content GO / regen 不要は G-22j 時点の 03–07 整合として **維持**
- **`<>` titles:** Wix source parity — **not** Kit conversion bug

---

## 2. 対象 URL（operator report ベース — Cursor は未アクセス）

Wix 公開サイトの月ページは従来 **ルート直下 `/YYYY-MM/`** 形式（G-9c0b legacy stub 設計と整合）。

| Priority | URL candidate | Note |
| --- | --- | --- |
| **1** | `https://www.gosaki-piano.com/2026-08` | Legacy month path（末尾スラッシュなし） |
| **2** | `https://www.gosaki-piano.com/2026-08/` | 同上（末尾スラッシュあり） |

**Operator action:** ブラウザで両方試し、**実際に表示される方**を `source_url` に記録。404 の場合は notes に記載し、schedule hub からの導線も確認。

**Kit 側（参考 — 現状なし）:**

```txt
/schedule/2026-08/   → not in package (G-20r)
/2026-08/           → not in package (G-20r)
```

---

## 3. 手動取得手順（戸山さん · 人間ブラウザのみ）

### 3.1 Before capture

- [ ] 本手順書（G-20r1）を一読
- [ ] 記録先を決める（§4 テンプレート — 推奨: ローカル markdown または CSV、**repo 外**でも可）
- [ ] スクリーンショット保存先フォルダを用意（例: `~/Desktop/gosaki-2026-08-capture/` — **gitignore 推奨**）
- [ ] **Supabase / CMS / admin Save は開かない**（取得のみ）

### 3.2 Capture steps

| Step | Action |
| --- | --- |
| **1** | 現行 Wix サイトの **2026-08** ページをブラウザで開く（§2 URL 候補） |
| **2** | ページ全体の **スクリーンショット**を保存（ファイル名例: `2026-08-full-YYYYMMDD-HHMM.png`） |
| **3** | 画面上の **イベント件数**を数え、件数を記録ヘッダに書く |
| **4** | **各イベントごと**に、画面上の表記を **そのまま** コピーして §4 テーブルに転記 |
| **5** | **不明欄・空欄・`<>`・日付だけの予定**も推測せずそのまま記録 |
| **6** | **venue website / 外部 URL** も原文のまま `venue_website` に記録 |
| **7** | **取得日時**（`captured_at` · ISO 8601 推奨）を記録 |
| **8** | **取得者**（`captured_by` · 例: `戸山`）を記録 |
| **9** | 判断に迷う点は `uncertainty_notes` に残す（推測で埋めない） |
| **10** | **その場で DB / CMS に入力しない** — 取得完了後 G-20r1a で結果を整理 |

### 3.3 Per-event screenshot（推奨）

イベントが多い場合、各カードの **部分スクリーンショット** も保存（`screenshot_ref` にファイル名を記載）。

### 3.4 What NOT to do during capture

- Wix 上のデータを編集しない
- タイトルや会場名を「きれいに」書き換えない
- Supabase staging に INSERT しない
- Cursor に「Wix を crawl して」と依頼しない（本フェーズ方針外）

---

## 4. 記録フォーマット

### 4.1 Capture session header（1回の取得セッション）

```txt
source_month: 2026-08
source_site: gosaki-piano.com (Wix live)
capture_session_id: gosaki-2026-08-capture-YYYYMMDD
captured_at: 2026-07-08T12:00:00+09:00
captured_by: 戸山
source_url_used: https://www.gosaki-piano.com/2026-08/
event_count_on_screen: TBD
full_page_screenshot_ref: 2026-08-full-YYYYMMDD-HHMM.png
kit_gap_reference: G-20r source freshness gap
notes: 
```

### 4.2 Event table（markdown）

| source_month | source_url | captured_at | captured_by | source_order | date | weekday | title | venue | open_time | start_time | price | performers | venue_website | description | raw_text | screenshot_ref | uncertainty_notes | intended_action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-08 | `https://www.gosaki-piano.com/2026-08/` | 2026-07-08T12:00:00+09:00 | 戸山 | 1 | （画面上の日付） | （曜日） | （タイトル or `<>`） | （会場） | （OPEN） | （START） | （料金） | （出演） | （URL） | （説明） | （カード全文コピー） | `2026-08-ev01.png` | | insert / update / skip / needs_client_confirmation |

**空行テンプレート:** イベント数が確定するまで、行をコピーして `source_order` のみ increment。

### 4.3 CSV header（代替形式）

```csv
source_month,source_url,captured_at,captured_by,source_order,date,weekday,title,venue,open_time,start_time,price,performers,venue_website,description,raw_text,screenshot_ref,uncertainty_notes,intended_action
```

### 4.4 `intended_action` 候補

| Value | When to use |
| --- | --- |
| `insert` | Kit DB に新規行として入れる候補（G-20r2 で検討） |
| `update` | 既存行と同一イベントの更新候補（legacy_id 判明後） |
| `skip` | 重複・テスト・非公開候補として取り込まない |
| `needs_client_confirmation` | タイトル空・`<>` · 料金不明 · 会場曖昧などクライアント確認が必要 |

**G-20r1 時点:** `intended_action` は **仮ラベル**のみ。確定は G-20r2 以降。

---

## 5. 正規化ルール案（今回は変換しない）

取得データを Kit / Supabase に入れる**前**のルール案。G-20r2 seed planning で採用可否を決める。

| Field | Rule (draft) |
| --- | --- |
| `date` | 目標形式 `YYYY-MM-DD` — **正規化は G-20r2** · 取得時は画面上の表記を `date` + `raw_text` に保持 |
| `weekday` | 日本語/英語混在を **そのまま記録** · 正規化は別フェーズ |
| `title` | **推測しない** · `<>` は source parity として **保持候補**（G-20q） |
| 空欄 | **空欄のまま** · NULL 埋めしない |
| `venue_website` | URL **原文保持**（`http`/`https` 含む） |
| `performers` / `description` | **原文保持**（「出演：」プレフィックス含む） |
| `open_time` / `start_time` | 画面上の `OPEN`/`START` 表記をそのまま · **分解は G-20r2** |
| `price` | 原文保持 · 円表記・「入場無料」等は推測補完しない |
| 重複判定（G-20r2） | 基本候補: **`date` + `title` + `venue`** · legacy_id は未取得時は未使用 |
| `site_slug` | 固定 `gosaki-piano`（G-20r2 で付与） |
| `legacy_id` | G-20r2 で `schedule-2026-08-NNN` 採番案 — **今回は採番しない** |

---

## 6. 安全ルール

| Rule | Status |
| --- | --- |
| 本 capture plan は **DB write ではない** | ✓ |
| Supabase SQL（INSERT/UPDATE/DELETE） | **実行しない** |
| Supabase Save / admin Save | **押さない** |
| package regen / Astro build | **しない** |
| FTP upload / deploy | **しない** |
| production / DNS / SSL / MX 変更 | **しない** |
| 取得は **人間がブラウザ**で確認するだけ | ✓ |
| Cursor / AI live crawl / network access | **しない** |
| 取得データの DB 投入 | **G-20r2 / G-20r3** 別フェーズ · approvalId 必須 |
| スクリーンショット / 生データに secrets | **含めない**（FTP パスワード等） |
| Sariswing production ref `vsbvndwuajjhnzpohghh` | **使用しない** |

---

## 7. 次フェーズ候補

| Phase | Scope | DB / build |
| --- | --- | --- |
| **G-20r1a-operator-capture-result** | 戸山さんが手動取得した 2026-08 データを doc/artifact に記録 | **no** DB write |
| **G-20r2-schedule-august-seed-planning** | 取得データ → Supabase seed / INSERT **候補**への変換計画 | **no** SQL 実行 |
| **G-20r3-schedule-august-db-insert-preflight** | INSERT/UPDATE 最終 preflight · **approvalId 必須** | preflight only |
| **G-20r4-schedule-public-reflection-plan** | 8月反映後の package regen / diff / upload **計画** | 実行はさらに別フェーズ |

**推奨順序:** G-20r1（本 doc）→ **G-20r1a**（operator 実行 + 結果記録）→ G-20r2 → G-20r3 → G-20r4 → regen/upload。

---

## 8. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| live crawl | **no** |
| network access / HTTP to Wix | **no** |
| operator browser capture | **no**（手順のみ — 実行は G-20r1a） |
| DB write / Save | **no** |
| package regen / build | **no** |
| FTP / deploy | **no** |
| production change | **no** |
| commit / push | **no** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-source-capture-plan.mjs
```
