# G-20r2 — Gosaki schedule August seed planning

**Phase:** `G-20r2-gosaki-schedule-august-seed-planning`  
**Status:** **complete** — seed / INSERT **候補**整理のみ（SQL なし · DB write なし）  
**Date:** 2026-07-09  
**Base commit:** `32333b9`  
**Client:** 後藤沙紀さん — ピアニスト個人ミュージシャンサイト  
**Prior:** [gosaki-schedule-public-url-capture-result.md](./gosaki-schedule-public-url-capture-result.md) (G-20r1b) · [gosaki-schedule-source-freshness-audit.md](./gosaki-schedule-source-freshness-audit.md) (G-20r)

| Check | Status |
| --- | --- |
| 19 candidate records drafted | **yes** |
| Existing Kit schema verified | **yes** |
| legacy_id / sort_order rules proposed | **yes** |
| intended_action classified | **yes** |
| SQL file created | **no** |
| DB write / Save / regen / FTP | **not executed** |

---

## Gates

```txt
gosakiScheduleAugustSeedPlanningComplete: true
phase: G-20r2-gosaki-schedule-august-seed-planning
baseCommit: 32333b9
eventCountCandidates: 19
extractionConfidenceFromG20r1b: HIGH
kitAugustRowsExisting: 0
insertCandidates: 16
needsClientConfirmationCandidates: 3
sqlFileCreated: false
dbWriteInThisPhase: false
saveInThisPhase: false
packageRegenInThisPhase: false
ftpUploadInThisPhase: false
readyForG20r2aClientConfirmationQuestionList: true
readyForG20r3ScheduleAugustDbInsertPreflight: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. 目的

| Goal | Detail |
| --- | --- |
| **Primary** | G-20r1b で取得した **2026-08 スケジュール 19件**を Kit / Supabase 投入前の **seed / INSERT 候補**として整理 |
| **This phase** | planning doc + candidates JSON のみ |
| **Out of scope** | SQL 実行 · DB write · Save · package regen · upload · production 変更 |

---

## 2. 入力ソース

| Source | Path / value |
| --- | --- |
| Capture result doc | `gosaki-schedule-public-url-capture-result.md` |
| Capture summary | `output/gosaki-source-captures/2026-08/capture-summary.json` (gitignored) |
| Extracted text | `output/gosaki-source-captures/2026-08/extracted-text.txt` (gitignored) |
| Target URL | `https://www.gosaki-piano.com/2026-08` |
| event_count_detected | **19** |
| extraction confidence | **HIGH** |
| Method | public GET only |
| Wix login | none |
| recursive crawl | none |

---

## 3. 既存 Kit schedule schema（gosaki-schedules.json 実測）

**参照:** `output/gosaki-piano-astro-production/src/data/gosaki-schedules.json`（60 rows · 2026-03〜07）

### 3.1 Fields（JSON export に存在）

| Field | Type / example | Notes |
| --- | --- | --- |
| `legacy_id` | `schedule-2026-07-001` | 主キー相当（UUID `id` は JSON export に**なし**） |
| `site_slug` | `gosaki-piano` | 固定 |
| `date` | `2026-07-03` | `YYYY-MM-DD` |
| `date_display` | `2026.07.03 (Fri)` | Wix 表記 |
| `year` | `2026` | number |
| `month` | `2026-07` | `YYYY-MM` |
| `title` | `<Awesome Songbook>` | `<>` 含む Wix 表記 |
| `venue` | `用賀 キンのツボ` | string |
| `open_time` | `18:00` | `HH:MM` |
| `start_time` | `19:30` | `HH:MM` |
| `price` | `3,300円` | string |
| `description` | multi-line | **`出演：` + `会場website:`** を含む（performers / venue_website は独立 field なし） |
| `image_url` | `null` | 常に null（現行） |
| `source_file` | `schedule-2026-07.html` | |
| `source_route` | `/schedule/2026-07/` | |
| `show_on_home` | `false` | |
| `home_order` | `null` | |
| `published` | `true` | |
| `sort_order` | number | 月横断の並び（下記） |
| `label` | `2026.07` | |

### 3.2 Fields（JSON export に**ない**）

- `id` (UUID) — DB 投入フェーズで Supabase 生成
- `performers` — `description` 内 `出演：` に格納
- `venue_website` — `description` 内 `会場website:` に格納
- `created_at` / `updated_at` — JSON export 非含有（DB 側 trigger 想定）

### 3.3 月別 legacy_id / sort_order（既存）

| Month | Rows | legacy_id range | sort_order range |
| --- | --- | --- | --- |
| 2026-03 | 13 | `schedule-2026-03-001` … `013` | 48–60 |
| 2026-04 | 10 | `schedule-2026-04-001` … `010` | 38–47 |
| 2026-05 | 12 | `schedule-2026-05-001` … `012` | 26–37 |
| 2026-06 | 11 | `schedule-2026-06-001` … `011` | 15–25 |
| 2026-07 | 14 | `schedule-2026-07-001` … `014` | **1–14** |
| **2026-08** | **0** | — | — |

**Pattern:** 新しい月ほど **小さい** `sort_order`。July が現在最若番 1–14。

### 3.4 Kit 側 2026-08 現状

- `gosaki-schedules.json` 2026-08 rows: **0**（G-20r / G-20r1b 確認済み）
- G-20p 03–07 package content GO: **維持**（別問題）

---

## 4. 2026-08 candidate records

**候補 JSON:** `gosaki-schedule-august-seed-candidates.json`（planning only · **not** confirmed DB seed）

**件数:** 19  
**UUID `id`:** 今回は生成しない（G-20r3 で扱う）

### Summary table

| # | proposed_legacy_id | date | title | venue | intended_action | confidence | published_candidate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | schedule-2026-08-001 | 2026-08-01 | `<地ビールフェスト2026>` | 甲府駅北口… | insert | MEDIUM | true |
| 2 | schedule-2026-08-002 | 2026-08-02 | `<地ビールフェスト2026>` | 甲府駅北口… | insert | MEDIUM | true |
| 3 | schedule-2026-08-003 | 2026-08-06 | `<紀々音>` | 銀座　The DEEP | insert | HIGH | true |
| 4 | schedule-2026-08-004 | 2026-08-07 | `<Awesome Songbook 2ndEP…>` | 熊谷 Jazz&Cafe SPACE1497 | insert | HIGH | true |
| 5 | schedule-2026-08-005 | 2026-08-08 | `<Awesome Songbook 2ndEP…>` | 宇都宮　リムジン | insert | HIGH | true |
| 6 | schedule-2026-08-006 | 2026-08-09 | `<Awesome Songbook 2ndEP…>` | 筑西　Jazz Live Spot village | insert | HIGH | true |
| 7 | schedule-2026-08-007 | 2026-08-10 | `<Duo>` | （空） | **needs_client_confirmation** | LOW | **false** |
| 8 | schedule-2026-08-008 | 2026-08-11 | `<堤智恵子 Trio>` | 西新井　カフェ・クレール | insert | MEDIUM | true |
| 9 | schedule-2026-08-009 | 2026-08-15 | `<Duo>` | （空） | **needs_client_confirmation** | LOW | **false** |
| 10 | schedule-2026-08-010 | 2026-08-16 | `<Quartet>` | 蕨　Our Delight | insert | HIGH | true |
| 11 | schedule-2026-08-011 | 2026-08-16 | `<新谷健介オノマトペ>` | 用賀　キンのツボ | insert | MEDIUM | true |
| 12 | schedule-2026-08-012 | 2026-08-20 | `<Brazilian Jazz Trio>` | 草加　Sugar Hill | insert | HIGH | true |
| 13 | schedule-2026-08-013 | 2026-08-21 | `<原田茅子Quartet>` | 松戸　コルコバード | **needs_client_confirmation** | LOW | **false** |
| 14 | schedule-2026-08-014 | 2026-08-23 | `<子どもと一緒にジャズライブ>` | 岡山　tonica | insert | MEDIUM | true |
| 15 | schedule-2026-08-015 | 2026-08-24 | `<ごさきりかこTrio>` | 岡山　SOHO | insert | HIGH | true |
| 16 | schedule-2026-08-016 | 2026-08-25 | `<ごさきりかこTrio>` | 名古屋　The Wiz | insert | HIGH | true |
| 17 | schedule-2026-08-017 | 2026-08-28 | `<カリビアンファンクション>` | 浅草　HUB | insert | HIGH | true |
| 18 | schedule-2026-08-018 | 2026-08-29 | `<Set Sail Special Quartet>` | 上福岡　エボニー | insert | MEDIUM | true |
| 19 | schedule-2026-08-019 | 2026-08-30 | `<KHACHA BAND>` | 浅草　HUB | insert | HIGH | true |

詳細フィールドは `gosaki-schedule-august-seed-candidates.json` を参照。

---

## 5. proposed legacy_id / sort_order ルール案

### 5.1 legacy_id

```txt
schedule-{YYYY}-{MM}-{NNN}
```

- 2026-08: `schedule-2026-08-001` … `schedule-2026-08-019`
- `NNN`: G-20r1b `source_order` 順 · 3桁ゼロ埋め
- 同日複数（2026-08-16）: source_order 10 → `010`, 11 → `011`
- **確定:** G-20r3 preflight

### 5.2 sort_order

**候補案 A（推奨・要 G-20r3 確認）:**

- August 19件: `sort_order` **1–19**（source_order 順）
- 既存 July 1–14 → **20–33** へ繰り下げが必要（**UPDATE** · G-20r3 で別途判断）

**根拠:** 既存 Kit は新しい月ほど小さい sort_order（July が現在最若番 1–14）。

**候補案 B:** August のみ INSERT し sort_order は暫定 1–19、July 繰り下げは G-20r4 regen 前に一括

**今回:** 案 A を候補として記録。**確定・実行は G-20r3。**

### 5.3 その他 proposed fields

| Field | Candidate value |
| --- | --- |
| `proposed_site_slug` | `gosaki-piano` |
| `proposed_source_route` | `/schedule/2026-08/` |
| `proposed_source_file` | `schedule-2026-08.html` |
| `proposed_label` | `2026.08` |
| `show_on_home_candidate` | `false` |
| `home_order_candidate` | `null` |
| `image_url_candidate` | `null` |

---

## 6. intended_action 分類

| Action | Count | candidate_order |
| --- | --- | --- |
| **insert** | **16** | 1–6, 8, 10–12, 14–19 |
| **needs_client_confirmation** | **3** | **7, 9, 13** |
| **update** | **0** | Kit 側 2026-08 行なし |
| **skip** | **0** | — |

**方針:**

- 2026-08 は Kit 0件 → 基本 **insert** 候補
- **8/10 Duo · 8/15 Duo · 8/21** は会場/時間/料金/出演が Wix 上でも空 → `needs_client_confirmation`
- `<>` は source parity として **保持候補**（Kit bug ではない）

---

## 7. 変換・正規化ルール案

| Field | Rule |
| --- | --- |
| `date` | `2026.08.01` → `2026-08-01` |
| `date_display` | raw_text 先頭行を保持（例: `2026.08.01 (Sat)`） |
| `title` | Wix source 保持 · `<>` 含む |
| `venue` | source にある場合のみ · 空欄は `null`（推測しない） |
| `open_time` / `start_time` | `開場`/`開演` から抽出 · 取れない場合は `null` |
| `price` | source 表記保持 · 空欄は `null` |
| `performers` | raw_text から全文復元（行分割対応）· candidates JSON 参照 |
| `venue_website` | raw_text から URL 抽出 · `description` 内 `会場website:` に格納 |
| `description` | 既存 Kit 形式: `出演：…\n会場website: …` · Leader Live 等は先頭行保持 |
| 同日複数 | source_order 順 |
| `published_candidate` | 原則 `true` · `needs_client_confirmation` は `false` |
| **禁止** | 推測補完 |

---

## 8. 要確認項目（DB 投入前 · 人間確認）

### 8.1 必須確認（needs_client_confirmation）

| Date | Title | Issue |
| --- | --- | --- |
| **2026-08-10** | `<Duo>` | 会場・時間・料金・出演・URL すべて空 |
| **2026-08-15** | `<Duo>` | 同上 |
| **2026-08-21** | `<原田茅子Quartet>` | 会場のみ · 時間・料金・出演・URL 空 |

### 8.2 追加確認（insert 候補だが partial gaps）

| # | Issue |
| --- | --- |
| 1–2 | 時間・料金空（フェスト系） |
| 8 | 時間「開場 / 開演」のみ（時刻なし）· 料金空 |
| 11 | 料金空 |
| 14 | 二部制時間表記が複雑 |
| 18 | 開場なし · 料金空 |

### 8.3 方針確認

- **`<>` 表示:** Wix parity としてそのまま公開してよいか（G-20q: Kit bug ではない）
- **published:** 不足情報ありの行を `published: false` で下書き投入するか、確認後に一括 insert するか
- **sort_order:** August 1–19 + July 繰り下げ UPDATE が必要か

---

## 9. DB 投入前の安全ゲート

| Rule | Status |
| --- | --- |
| G-20r2 では SQL を**作らない・実行しない** | ✓ |
| DB write は **G-20r3 以降** | ✓ |
| G-20r3 では **approvalId 必須** | 未実施 |
| INSERT 対象・件数・rollback・verification SQL を事前提示 | G-20r3 で実施 |
| Save / package regen / upload | さらに後続（G-20r4+） |
| `vsbvndwuajjhnzpohghh` | **使用禁止** |
| Target 明示前は DB 操作しない | staging `kmjqppxjdnwwrtaeqjta` のみ |

---

## 10. 次フェーズ候補

| Phase | Scope | DB |
| --- | --- | --- |
| **G-20r2a-client-confirmation-question-list** | 不足情報・`<>` 表示の本人確認用質問リスト | **no** |
| **G-20r3-schedule-august-db-insert-preflight** | candidates → INSERT preflight · approvalId 必須 | preflight only |
| **G-20r4-schedule-public-reflection-plan** | DB 反映後 regen / diff / upload 計画 | 実行は別フェーズ |

**推奨順序:** G-20r2（本 doc）→ G-20r2a（質問リスト）→ G-20r3（preflight）→ G-20r4（reflection plan）

---

## 11. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| SQL file creation | **no** |
| SQL execution | **no** |
| DB write / Save | **no** |
| network access | **no** |
| package regen / build | **no** |
| FTP / deploy / production change | **no** |
| commit / push | **no** |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-august-seed-planning.mjs
```
