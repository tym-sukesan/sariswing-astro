# Gosaki Schedule CMS P0 — Release Note

**Phase:** `G-22j2-gosaki-schedule-cms-p0-release-note`  
**Status:** **complete** — release note documentation only; **no Save / DB write / package regen / FTP / deploy**  
**Date:** 2026-07-07  
**Base commit:** `904a248` (G-22j1 P0 overall closure committed)  
**Prior closure:** [gosaki-schedule-p0-overall-closure.md](./gosaki-schedule-p0-overall-closure.md) (G-22j1)

| Check | Status |
| --- | --- |
| Schedule CMS P0 | **complete** |
| Audience | developers · operators · client explanation |
| Production deploy | **not executed** |
| FTP / upload | **not required** |

---

## Gates

```txt
gosakiScheduleCmsP0ReleaseNoteComplete: true
phase: G-22j2-gosaki-schedule-cms-p0-release-note
scheduleCmsP0Complete: true
p0CrudUxReflectionComplete: true
uploadNeeded: false
dbLocalLiveAligned: true
physicalDeleteDeferred: true
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
deployExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**G-22j2 = release note only.** No Save, no DB write, no package regen, no FTP.

---

## 1. 概要

**Gosaki-piano.com 向け Schedule CMS P0 が完了しました。**

これは、ピアニスト／ミュージシャン個人サイト向け **CMS Kit** の最初の実用スライスです。Wix などの既存サイトから、**Astro 静的サイト + Supabase CMS** へ移行する標準工程の基礎となります。

| 項目 | 内容 |
| --- | --- |
| 対象サイト | `gosaki-piano`（後藤沙紀 ピアノ公式サイト） |
| 管理画面 | `/__admin-staging-shell/musician-basic/`（staging のみ） |
| 公開サイト | Lolipop staging `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| データベース | Supabase staging（`kmjqppxjdnwwrtaeqjta`） |
| P0 完了日 | 2026-07-07（G-22j1 overall closure） |

---

## 2. できるようになったこと

### 2.1 閲覧・検索

| 機能 | 説明 |
| --- | --- |
| **管理画面ログイン** | Supabase 認証で staging 管理画面にログイン |
| **スケジュール一覧表示** | `gosaki-piano` の全公演を一覧表示 |
| **authenticated admin read** | ログイン後、**非公開行も含めて** DB から読み取り |
| **検索** | キーワードで公演を絞り込み |
| **公開 / 非公開フィルタ** | `published` 状態でフィルタ |
| **legacy_id 表示** | 各行に `schedule-YYYY-MM-NNN` を表示（運用・デバッグ用） |

### 2.2 追加・更新（P0 CRUD）

| 操作 | 説明 | 備考 |
| --- | --- | --- |
| **新規追加** | 新しい公演を INSERT | dry-run preview → Save |
| **複製追加** | 既存公演を複製して INSERT | 新 `legacy_id` 自動採番 |
| **非公開化** | `published=true → false` | 行は残る（物理削除ではない） |
| **再公開** | `published=false → true` | 非公開化の逆操作 |

### 2.3 安全な保存フロー

| 機能 | 説明 |
| --- | --- |
| **保存前 preview** | dry-run で変更内容を確認してから Save |
| **target 確認パネル** | Save 前に対象行（id / legacy_id / 日付）を明示 |
| **optimistic lock** | `updated_at` による同時更新検知 |
| **actualWrite 明示** | Save 結果で DB 書き込み成功を明示 |
| **public reflection 確認** | DB 更新と公開サイト反映は**別フェーズ**であることを UI で案内 |
| **published=false 除外確認** | 非公開行は公開サイト HTML に含まれないことを確認済み |

### 2.4 運用者向け操作手順

1. staging 管理画面にログイン
2. 一覧から対象公演を選択
3. 操作モード（新規 / 複製 / 非公開化 / 再公開）を選択
4. dry-run preview で内容確認
5. Save（承認済みスライスのみ）
6. 必要なら public reflection（別フェーズ・別承認）

---

## 3. 安全設計

| 原則 | 実装 |
| --- | --- |
| **Save 前 preview** | すべての write 操作で dry-run 必須 |
| **operator 確認** | target パネル + procedure hints |
| **actualWrite 明示** | Save 結果パネルで成功 / 失敗を表示 |
| **physical DELETE なし** | 非公開化のみ（行は DB に残る） |
| **rollback 未実行** | 各スライスで rollback 不要と確認済み |
| **DB 更新と公開反映の分離** | CMS Save ≠ 公開サイト更新 |
| **FTP は別高リスクゲート** | 手動アップロード・明示承認必須 |
| **`--delete` / mirror 禁止** | G-7f 事故対策 — auto FTP 停止中 |
| **Sariswing production 分離** | staging のみ · production ref **不使用** |
| **service_role 未使用** | ブラウザ・ビルドとも anon / authenticated のみ |
| **RLS / GRANT 変更なし** | P0 期間中に policy 変更なし |

---

## 4. 現在の DB 状態（staging）

| Row | id | published | 役割 |
| --- | --- | --- | --- |
| **`schedule-2026-07-008`** | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | **`true`** | 本番運用相当のライフサイクル検証行 |
| **`schedule-2026-03-014`** | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | **`false`** | 複製 INSERT テスト行（staging に残存） |
| **`schedule-2026-09-001`** | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | **`false`** | 新規 INSERT テスト行（staging に残存） |

**DB / local package / live staging は `008` について整合済み。**

`014` / `001` は staging テスト行として残っています。公開サイトには表示されません。

---

## 5. 公開反映状態

| 項目 | 状態 |
| --- | --- |
| Local `public-dist` vs live staging | **byte-identical**（G-22i4 MD5 match） |
| `schedule-2026-07-008` on live | **表示済み**（`2026.07.17` · 14 event cards） |
| Upload | **不要** |
| FTP / deploy | **不要**（この republish slice） |
| G-22i5 / G-22i6 | **skipped** |

**将来の DB 変更時:** G-22i3（local package）→ G-22i4（live 比較）を再実行し、差分がある場合のみ upload を検討。

---

## 6. まだ未対応 / 後回し

| 項目 | 状態 |
| --- | --- |
| **physical DELETE** | 未実装 · 別フェーズで計画 |
| **Save gate copy / UX polish** | 軽微な文言整理の余地あり |
| **schedule 以外の CMS** | Discography · YouTube · News 等は別スライス |
| **本番運用の完全自動化** | FTP auto-deploy 停止中（G-7f 対策） |
| **新規サイト 30 分構築フロー** | 標準化は今後の戦略フェーズ |

---

## 7. 今後の展開

| 方向 | 内容 |
| --- | --- |
| **Discography CMS** | ディスコグラフィー編集の CMS 化 |
| **YouTube / Video CMS** | トップページ動画 embed 管理 |
| **News CMS** | お知らせ・ニュース記事 |
| **Profile / Biography CMS** | プロフィール・経歴 |
| **30 分 onboarding flow** | URL 入力 → Astro + CMS 初期版を短時間で生成 |
| **URL → Astro + CMS 生成** | `tools/static-to-astro` パイプラインの汎用化 |
| **顧客向け CMS Kit 標準化** | 2 社目以降のオンボーディングテンプレート |

---

## 8. 顧客説明向け（短い説明）

> **スケジュール更新が、専門知識なしでできるようになりました。**
>
> - 管理画面から公演の追加・複製・非公開化・再公開ができます
> - 保存前に変更内容をプレビューできるので、誤操作を防げます
> - 公開サイトは静的 HTML なので**表示が速く、壊れにくい**です
> - データベースの更新と公開サイトへの反映は**分けて行う**ため、安全です
> - Wix 等と比べて**軽量で、運用費を抑えやすい**構成です

---

## 9. P0 完了チェーン（開発者向け参考）

```txt
G-22d  duplicate INSERT
G-22e  new event INSERT
G-22f  unpublish UPDATE
G-22g  P0 UX + authenticated admin read
G-22h  republish UPDATE
G-22i  public reflection (planning → package → review → closure)
G-22j1 overall closure
G-22j2 release note (this doc)
```

**閉じた Save スライスの再実行は禁止。** 新規作業には新しい approval ID と新フェーズが必要です。

---

## 10. Safety (G-22j2 phase)

| Item | Status |
| --- | --- |
| Save / DB write / SQL mutation | **no** |
| Package regen / FTP / deploy | **no** |
| Rollback SQL | **no** |
| GRANT / REVOKE / RLS | **no** |
| `service_role` | **not used** |
| Production deploy | **no** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22j2-gosaki-schedule-cms-p0-release-note.mjs
```
