# G-20r2a — Gosaki schedule client confirmation question list

**Phase:** `G-20r2a-gosaki-client-confirmation-question-list`  
**Status:** **complete** — client confirmation questions only (no DB / SQL)  
**Date:** 2026-07-09  
**Base commit:** `abfa594`  
**Client:** 後藤沙紀さん — ピアニスト個人ミュージシャンサイト  
**Prior:** [gosaki-schedule-august-seed-planning.md](./gosaki-schedule-august-seed-planning.md) (G-20r2) · [gosaki-schedule-august-seed-candidates.json](./gosaki-schedule-august-seed-candidates.json)

| Check | Status |
| --- | --- |
| Question list documented | **yes** |
| Mandatory confirmation (3 events) | **yes** |
| Partial gaps table | **yes** |
| Client message draft | **yes** |
| SQL / DB write | **not executed** |

---

## Gates

```txt
gosakiScheduleClientConfirmationQuestionListComplete: true
phase: G-20r2a-gosaki-client-confirmation-question-list
baseCommit: abfa594
eventCount: 19
needsClientConfirmationCount: 3
partialGapCandidates: 5
extractionConfidenceFromG20r1b: HIGH
kitAugustRowsExisting: 0
sqlFileCreated: false
dbWriteInThisPhase: false
saveInThisPhase: false
packageRegenInThisPhase: false
readyForG20r2bClientConfirmationMessageFinal: true
readyForG20r3ScheduleAugustDbInsertPreflight: false
angleBracketSourceParityNote: true
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. 目的

| Goal | Detail |
| --- | --- |
| **Primary** | 2026-08 スケジュール **19件**を DB 投入する前に、後藤沙紀さんへ確認すべき項目を質問リストとして整理 |
| **This phase** | 質問リスト + 本人向けメッセージ案 + 内部判断メモのみ |
| **Out of scope** | SQL 作成 · DB write · Save · package regen · FTP · deploy · production 変更 |

---

## 2. 入力ソース

| Source | Value |
| --- | --- |
| G-20r2 seed planning | `gosaki-schedule-august-seed-planning.md` |
| G-20r2 seed candidates | `gosaki-schedule-august-seed-candidates.json` |
| G-20r1b capture result | `gosaki-schedule-public-url-capture-result.md` |
| event_count | **19** |
| extraction confidence | **HIGH** |
| Kit 側 2026-08 rows | **0** |
| insert 候補 | **16** |
| needs_client_confirmation | **3** |

---

## 3. 本人確認が必要なイベント一覧

### 3.1 必須確認（3件）

Wix 公開ページ上でも情報がほぼ空の予定。**DB 投入前に本人確認必須。**

#### 1. 2026-08-10 — `<Duo>`（candidate_order: 7）

| 項目 | Wix source 現状 | 確認したいこと |
| --- | --- | --- |
| 会場 | （空） | 会場名はありますか？ |
| OPEN | （空） | 開場時刻は？ |
| START | （空） | 開演時刻は？ |
| 料金 | （空） | 料金表記は？ |
| 出演者 | （空） | 出演メンバーは？ |
| 会場website | （空） | 会場 URL はありますか？ |
| 公開 | Wix に日付・タイトルのみ掲載 | **このまま新サイトに掲載してよいですか？** それとも非公開・削除・後日追記ですか？ |

**質問文（個別）:**  
「8月10日（月）の `<Duo>` について、現行サイトでは日付とタイトルのみで、会場・時間・料金・出演者が空欄になっています。新サイトに載せる場合、追記情報はありますか？ それとも現状のまま（または非表示）にしますか？」

#### 2. 2026-08-15 — `<Duo>`（candidate_order: 9）

| 項目 | Wix source 現状 | 確認したいこと |
| --- | --- | --- |
| 会場 | （空） | 会場名はありますか？ |
| OPEN / START | （空） | 開場・開演時刻は？ |
| 料金 | （空） | 料金表記は？ |
| 出演者 | （空） | 出演メンバーは？ |
| 会場website | （空） | 会場 URL はありますか？ |
| 公開 | 同上 | **このまま公開してよいですか？** |

**質問文（個別）:**  
「8月15日（土）の `<Duo>` も同様に、会場・時間・料金・出演者が空欄です。追記情報があるか、または非表示にするか教えてください。」

#### 3. 2026-08-21 — `<原田茅子Quartet>`（candidate_order: 13）

| 項目 | Wix source 現状 | 確認したいこと |
| --- | --- | --- |
| 会場 | 松戸　コルコバード | ✓ あり |
| OPEN / START | （空） | 開場・開演時刻は？ |
| 料金 | （空） | 料金表記は？ |
| 出演者 | （空） | 出演メンバーは？ |
| 会場website | （空） | 会場 URL はありますか？ |
| 公開 | 会場のみ掲載 | **会場以外を追記するか、このまま公開するか** |

**質問文（個別）:**  
「8月21日（金）の `<原田茅子Quartet>` は会場（松戸　コルコバード）のみ掲載されています。時間・料金・出演者・会場 URL の追記はありますか？」

---

### 3.2 追加確認候補（partial gaps · 5グループ）

情報はあるが一部不足・表記が特殊な予定。**必須3件ほど緊急度は低いが、本人確認があると品質向上。**

| candidate_order | date | title | issue | question |
| --- | --- | --- | --- | --- |
| **1–2** | 2026-08-01, 08-02 | `<地ビールフェスト2026>` | 時間・料金が空（会場・出演・イベント URL あり） | 「地ビールフェスト」の2日間、時間・料金は意図的に空欄ですか？ 追記があれば教えてください。 |
| **8** | 2026-08-11 | `<堤智恵子 Trio>` | 時間が「開場 / 開演」のみ（時刻なし）· 料金空 | 開場・開演の具体的な時刻と料金を教えてください。 |
| **11** | 2026-08-16 | `<新谷健介オノマトペ>` | 料金空（同日 `<Quartet>` は別件 #10） | 料金表記を教えてください。 |
| **14** | 2026-08-23 | `<子どもと一緒にジャズライブ>` | 二部制（第一部 12:30/13:00 · 第二部の表記が複雑） | 二部制の時間表記を、掲載用にどう整えるか（1件として掲載 / 二部を分ける等）ご希望はありますか？ |
| **18** | 2026-08-29 | `<Set Sail Special Quartet>` | 開場なし · 料金空（開演 19:00 のみ） | 開場時刻と料金を教えてください。 |

**本人確認が必要なイベント件数（集計）:**

| 区分 | 件数 |
| --- | --- |
| 必須確認 | **3** |
| 追加確認候補 | **5**（#1–2 を1グループとして計5イベント行） |
| 確認不要（insert そのまま可） | **11** |

---

## 4. `<>` 表示についての確認

### 背景

- 現行 Wix サイトでも `<Duo>` `<紀々音>` など **角括弧付きタイトル**が表示されている
- これは **Wix source parity**（G-20q）— **Kit 変換バグではない**
- 新サイトでも同じ表記にするかは **本人確認推奨**

### 本人向け質問文

> 現在の Wix サイトでは、タイトルが `<Duo>` や `<紀々音>` のように角括弧付きで表示されている予定があります。新サイトでもこの表記のままでよろしいでしょうか？ それとも `Duo` のように括弧なしに整えますか？

### 確認ポイント

| Topic | Question |
| --- | --- |
| 角括弧の扱い | `<>` をそのままタイトルとして使うか、括弧なしにするか |
| 空タイトル由来の `<>` | 今後も Wix と同様に残すか |
| 8月全体 | 19件すべて同じルールでよいか |

**内部推奨（確定前）:** source parity として **`<>` 保持**を第一候補。本人が括弧なしを希望した場合のみ G-20r3 前に正規化ルールを更新。

---

## 5. 公開状態（published）についての確認

| Topic | Detail |
| --- | --- |
| 原則 | 19件すべて **insert 候補** |
| 必須3件 | Wix に掲載されているが情報不足 → `published: false`（下書き）候補 |
| source parity 論点 | Wix に出ている以上、空欄でも公開は可能だが **新サイト品質**として要確認 |
| 16件 insert 候補 | 原則 `published: true` 候補（partial gaps は追記後に公開でも可） |

### 本人向け質問文

> 情報が少ない予定（8/10・8/15・8/21 など）について、新サイトでは「いったん非公開（下書き）」にして、情報が揃ってから公開する形でもよろしいでしょうか？ それとも現行サイトと同じく、わかっている範囲だけでも公開しますか？

---

## 6. 本人に送る確認メッセージ案

**件名案:** 新サイト用スケジュール（8月分）のご確認

---

後藤さん

お世話になっております。戸山です。

新サイトへ反映するため、現行サイト（gosaki-piano.com）の **8月スケジュール**を確認させていただきました。**19件**掲載されていることを把握しています。

大半の予定はそのまま取り込めそうですが、**いくつか情報が少ない予定**があり、反映前にご確認させてください。

**【追記・ご確認いただきたい予定】**

1. **8月10日（月）`<Duo>`** — 会場・時間・料金・出演者が空欄
2. **8月15日（土）`<Duo>`** — 同上
3. **8月21日（金）`<原田茅子Quartet>`** — 会場のみ（松戸　コルコバード）、時間・料金・出演者が空欄

上記について、追記情報があればお知らせください。情報が未定の場合は、新サイトでは非公開にする形も可能です。

**【あわせてご確認】**

- **8月1–2日** 地ビールフェスト — 時間・料金は意図的に空欄でしょうか？
- **8月11日** 堤智恵子 Trio — 開場・開演の時刻と料金
- **8月16日** 新谷健介オノマトペ — 料金
- **8月23日** 子どもと一緒にジャズライブ — 二部制の時間表記のご希望
- **8月29日** Set Sail Special Quartet — 開場時刻と料金

**【表記について】**

現行サイトでは `<Duo>` のように角括弧付きのタイトル表示があります。新サイトでもこのままの表記でよろしいでしょうか？ それとも括弧なし（例: `Duo`）に整えますか？

お忙しいところ恐れ入りますが、わかる範囲で結構ですのでご返信いただけますと助かります。

よろしくお願いいたします。

---

*（G-20r2b で文面最終化 · 戸山さんが送信判断）*

---

## 7. 内部向け判断メモ

### 案 A — 8月19件すべて insert · 16件 published=true · 3件 published=false

| | |
| --- | --- |
| **内容** | 情報十分な16件は公開 · 必須3件は下書きで insert |
| **メリット** | Wix parity を保ちつつ品質リスクを抑制 |
| **リスク** | 3件が Wix では見えているのに新サイトでは非公開になる差分 |

### 案 B — 必須3件は needs_client_confirmation のまま保留（insert しない）

| | |
| --- | --- |
| **内容** | 16件のみ G-20r3 insert · 3件は回答後に別フェーズ |
| **メリット** | 不完全データの DB 投入を回避 |
| **リスク** | 8月ページが19件中16件になる · 後追い insert が必要 |

### 案 C — 19件すべて published=true で insert（Wix parity 優先）

| | |
| --- | --- |
| **内容** | Wix と同じ空欄状態で公開 |
| **メリット** | source parity 最大 · 実装が単純 |
| **リスク** | 新サイト品質・来場者体験が低下 · 空欄が目立つ |

### 案 D — `<>` は source parity として保持

| | |
| --- | --- |
| **内容** | タイトルを Wix 原文どおり `<…>` で insert |
| **メリット** | 既存 03–07 月データと一貫 · 変換バグではないことを維持 |
| **リスク** | 見た目が `<>` のまま（本人が括弧なし希望の場合は不整合） |

### 案 E — `<>` は本人確認後に整える

| | |
| --- | --- |
| **内容** | G-20r2b 回答後、括弧除去ルールを G-20r3 preflight に反映 |
| **メリット** | 本人意向を尊重 |
| **リスク** | 正規化ルール追加 · preflight 複雑化 |

**内部推奨（G-20r3 前の暫定）:** **案 A + 案 D**（16件公開 insert · 3件下書き insert · `<>` 保持）— 本人回答後に G-20r2b / G-20r3 で調整。

---

## 8. 次フェーズ候補

| Phase | Scope | DB |
| --- | --- | --- |
| **G-20r2b-client-confirmation-message-final** | 本人送付用文面の最終化 | **no** |
| **G-20r3-schedule-august-db-insert-preflight** | 本人回答反映 · INSERT preflight · **approvalId 必須** | preflight only |
| **G-20r4-schedule-public-reflection-plan** | DB 反映後 regen / diff / upload 計画 | 実行は別フェーズ |

---

## 9. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| SQL file creation | **no** |
| DB write / Save | **no** |
| network access | **no** |
| package regen / build | **no** |
| FTP / deploy / production change | **no** |
| commit / push | **no** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-client-confirmation-question-list.mjs
```
