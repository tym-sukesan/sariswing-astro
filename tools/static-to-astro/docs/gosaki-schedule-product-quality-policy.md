# G-20r2b — Gosaki schedule product quality policy

**Phase:** `G-20r2b-gosaki-schedule-product-quality-policy`  
**Status:** **complete** — internal publication quality rules (no DB / SQL)  
**Date:** 2026-07-09  
**Base commit:** `64afcc4`  
**Client:** 後藤沙紀さん — ピアニスト個人ミュージシャンサイト  
**Prior:** [gosaki-schedule-client-confirmation-question-list.md](./gosaki-schedule-client-confirmation-question-list.md) (G-20r2a) · [gosaki-schedule-august-seed-planning.md](./gosaki-schedule-august-seed-planning.md) (G-20r2)

| Check | Status |
| --- | --- |
| 19 events reclassified | **yes** |
| Quality rules documented | **yes** |
| Wix parity vs product quality prioritized | **yes** |
| G-20r3 readiness assessed | **yes** |
| SQL / DB write | **not executed** |

---

## Gates

```txt
gosakiScheduleProductQualityPolicyComplete: true
phase: G-20r2b-gosaki-schedule-product-quality-policy
baseCommit: 64afcc4
eventCount: 19
publishedTrueCandidates: 14
publishedFalseCandidates: 3
holdCandidates: 2
g20r3FirstBatchInsertCount: 17
g20r3HoldDeferredCount: 2
angleBracketPolicy: retain-source-parity
qualityOverWixParityForIncomplete: true
sqlFileCreated: false
dbWriteInThisPhase: false
readyForG20r3ScheduleAugustDbInsertPreflight: true
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. 目的

| Goal | Detail |
| --- | --- |
| **Primary** | 2026-08 schedule **19件**を DB 投入する前に、**本人確認より先に**「こちらが納得できる商品品質」基準で掲載判断ルールを定義 |
| **This phase** | 内部品質ポリシー + 再分類のみ |
| **Supersedes for next step** | G-20r2a の「本人確認文面最終化」— 品質基準確定後に必要なら G-20r2c で実施 |
| **Out of scope** | SQL · DB write · Save · regen · FTP · deploy |

---

## 2. 入力ソース

| Source | Value |
| --- | --- |
| G-20r2 seed planning | `gosaki-schedule-august-seed-planning.md` |
| G-20r2 seed candidates | `gosaki-schedule-august-seed-candidates.json` |
| G-20r2a question list | `gosaki-schedule-client-confirmation-question-list.md` |
| event_count | **19** |
| extraction confidence | **HIGH** (G-20r1b) |
| Kit 2026-08 rows | **0** |

---

## 3. 優先順位（品質判断スタック）

DB 投入・公開判断で衝突した場合、**上ほど優先**。

| Priority | Rule |
| --- | --- |
| **P0** | **壊れた表示を出さない** — 空ラベル（`OPEN:` のみ・`料金:` 空白）や意味不明な時刻表記を公開ページに出さない |
| **P1** | **来場者に有用な最小情報** — `published=true` には date + title + venue（または代替説明）+ 出演またはイベント説明のいずれかが必要 |
| **P2** | **推測補完禁止** — 空欄を埋めない · Wix にない情報を創作しない |
| **P3** | **Wix source parity** — 取得済みフィールドは原文保持（`<>` 含む） |
| **P4** | **本人確認** — 非ブロッキング · G-20r2c 以降で非同期に取得可能 |

**結論:** 新サイトの**商品品質 > 不完全レコードの Wix 掲載 parity**。Wix に出ていても、品質基準を満たさない行は `published=false` または `hold`。

---

## 4. フィールド別品質ルール

### 4.1 空欄・不足フィールド

| Situation | Policy |
| --- | --- |
| `venue` 空 | **公開不可** (`published=false` または `hold`) |
| `open_time` / `start_time` ともに空 · かつ `time_raw` も空 | 公開可 **if** フェスト等で Wix も同様 · UI は時間行を**非表示** |
| `time_raw` = `開場 / 開演`（時刻なし） | **hold** — 壊れた時刻表示リスク |
| `price` 空 | 公開可 **if** 他フィールド十分 · UI は料金行を**非表示**（空ラベル禁止） |
| `performers` 空 | venue も空なら公開不可 · venue のみあれば `published=false` 候補 |
| 複数フィールド空（3件以上） | **published=false** または **hold** |

### 4.2 `<>` タイトル表記

| Topic | Policy |
| --- | --- |
| Kit bug? | **No** — Wix source parity（G-20q）· 既存 03–07 JSON も `<>` 使用 |
| 商品品質判断 | **内部 OK — 保持** · 03–07 と一貫 · 来場者にも Wix 同等の情報 |
| 括弧除去 | 本人希望があれば G-20r2c/G-20r3 で別ルール · **デフォルトは保持** |
| 空タイトル由来 `<>` | 8/10・8/15 の `<Duo>` はタイトルとして成立 · ただし**中身不足のため非公開** |

### 4.3 二部制（#14 · 2026-08-23）

| Topic | Policy |
| --- | --- |
| 公開 | **published=true** — venue · 料金 · 出演あり |
| 時刻 | `time_raw` 全文を `description` に保持 · `open_time`/`start_time` は第一部のみ（12:30/13:00） |
| UI | 1カード · 時間欄に二部制全文表示、または description 参照 · **2行に分割しない**（推測分割禁止） |
| 本人確認 | 任意（G-20r2c）· 品質上は現状で公開可 |

### 4.4 UI 要件（regen / 公開反映時の検証対象）

```txt
schedule card rendering:
  - if open_time is null/empty → do not render OPEN row
  - if start_time is null/empty → do not render START row
  - if price is null/empty → do not render price row
  - if venue is null/empty → do not render venue row (published=true では原則発生しない)
```

**P0 遵守:** 空ラベル・プレースホルダ文字列（`—` や `TBD` の自動挿入）を**禁止**。

---

## 5. 2026-08 再分類（published / hold）

### 5.1 Summary

| Classification | Count | G-20r3 first batch |
| --- | --- | --- |
| **published=true** | **14** | INSERT · 公開 |
| **published=false** | **3** | INSERT · 下書き（DB に入れるが公開しない） |
| **hold** | **2** | **INSERT 延期**（G-20r3 第1弾から除外） |
| **Total** | **19** | **17 insert** · **2 deferred** |

### 5.2 Full table

| # | date | title | class | rationale |
| --- | --- | --- | --- | --- |
| 1 | 2026-08-01 | `<地ビールフェスト2026>` | **published=true** | venue · 出演 · URL あり · 時間/料金空は Wix 同等 · UI 非表示で OK |
| 2 | 2026-08-02 | `<地ビールフェスト2026>` | **published=true** | 同上 |
| 3 | 2026-08-06 | `<紀々音>` | **published=true** | 全主要フィールド充足 |
| 4 | 2026-08-07 | `<Awesome Songbook…>` | **published=true** | 同上 |
| 5 | 2026-08-08 | `<Awesome Songbook…>` | **published=true** | 同上 |
| 6 | 2026-08-09 | `<Awesome Songbook…>` | **published=true** | 同上 |
| 7 | 2026-08-10 | `<Duo>` | **published=false** | venue/time/price/performers すべて空 · 公開ページに出せない |
| 8 | 2026-08-11 | `<堤智恵子 Trio>` | **hold** | `開場 / 開演` のみ — 壊れた時刻表示リスク · 料金も空 |
| 9 | 2026-08-15 | `<Duo>` | **published=false** | #7 と同様 |
| 10 | 2026-08-16 | `<Quartet>` | **published=true** | 全主要フィールド充足 |
| 11 | 2026-08-16 | `<新谷健介オノマトペ>` | **published=true** | 料金空のみ · UI 非表示で OK |
| 12 | 2026-08-20 | `<Brazilian Jazz Trio>` | **published=true** | 全主要フィールド充足 |
| 13 | 2026-08-21 | `<原田茅子Quartet>` | **published=false** | venue のみ · 時間/料金/出演空 · 公開品質不足 |
| 14 | 2026-08-23 | `<子どもと一緒にジャズライブ>` | **published=true** | 二部制は description 保持 · 品質 OK |
| 15 | 2026-08-24 | `<ごさきりかこTrio>` | **published=true** | 全主要フィールド充足 |
| 16 | 2026-08-25 | `<ごさきりかこTrio>` | **published=true** | 同上 |
| 17 | 2026-08-28 | `<カリビアンファンクション>` | **published=true** | 同上 |
| 18 | 2026-08-29 | `<Set Sail Special Quartet>` | **hold** | 開場空 · 料金空 · 開演のみ — 来場者情報不足 |
| 19 | 2026-08-30 | `<KHACHA BAND>` | **published=true** | 全主要フィールド充足 |

### 5.3 hold vs published=false の使い分け

| Status | Meaning | G-20r3 action |
| --- | --- | --- |
| **published=false** | DB に下書き insert 可 · CMS で後から編集・公開 | **include in batch** |
| **hold** | データ品質が閾値未満 · 第1弾 insert **しない** | **exclude from batch** |

**hold 解除条件:** 時刻・料金等が揃った時点で G-20r3 追補バッチまたは CMS 手動投入。

---

## 6. G-20r2a との関係

| G-20r2a | G-20r2b（本 doc） |
| --- | --- |
| 本人確認質問リスト | **内部品質基準を先に確定** |
| 推奨案 A（16公開+3下書き） | **14公開+3下書き+2hold**（より保守的） |
| 本人メッセージ案 | **G-20r2c で任意** — 品質ポリシー確定後に送付判断 |

本人確認は**ブロッキングしない**。hold 2件・ published=false 3件は CMS 反映後に本人が追記可能。

---

## 7. G-20r3 への進行判断

### readyForG20r3: **true**（条件付き）

| Item | Value |
| --- | --- |
| First batch INSERT count | **17**（14 published=true + 3 published=false） |
| Deferred (hold) | **2** (#8, #18) |
| approvalId | G-20r3 で必須 |
| SQL | G-20r3 preflight で作成 · **本フェーズでは未作成** |
| sort_order / July bump | G-20r3 preflight で確定 |
| UI empty-field rule | G-20r4 regen 前に package 側で検証推奨 |

**G-20r3 に進める条件:** 本ポリシー承認 · hold 2件除外を preflight に明記 · rollback SQL 準備。

---

## 8. 次フェーズ候補

| Phase | Scope |
| --- | --- |
| **G-20r2c-client-confirmation-message-final**（任意） | hold/published=false の背景説明を含む本人連絡 |
| **G-20r3-schedule-august-db-insert-preflight** | 17件 INSERT preflight · approvalId 必須 |
| **G-20r4-schedule-public-reflection-plan** | regen / diff / upload · UI 空欄非表示検証含む |

---

## 9. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| SQL creation / execution | **no** |
| DB write / Save | **no** |
| network access | **no** |
| package regen / build | **no** |
| FTP / deploy / production change | **no** |
| commit / push | **no** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-product-quality-policy.mjs
```
