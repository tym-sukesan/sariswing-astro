# G-22g2 — Gosaki Schedule operator procedure hints

Phase: `G-22g2-gosaki-schedule-operator-procedure-hints`

Gate: `gosakiScheduleOperatorProcedureHintsComplete: true`

## 1. Purpose

Gosaki Schedule 管理画面で、operator が「次に何を押すべきか」「今は保存前なのか」「この操作は DB に書くのか」を迷わないように、操作手順ヒントを UI に追加する。

**Scope:** UI 表示改善・docs・verifier・AI context 更新のみ。

## 2. Added procedure hints

### Static panel (`gosaki-schedule-operator-procedure-hints`)

- 4 操作カード: 通常更新 / 複製 / 新規追加 / 非公開化
- 共通安全文言: DBは「変更を確認」まで変わりません / 保存ボタン 1 回のみ（連打禁止）/ 削除（準備中）は使わない
- ログイン後 admin read ヒント（`#gosaki-schedule-admin-read-procedure-hint`）— authenticated read 時のみ表示

### Dynamic panel (`renderOperationProcedureDetail`)

- save target panel（G-22g1c）内に Step 1–3 + 操作別説明 + 保存状態（有効/無効）+ 物理削除しない注意

### Button / banner copy

- 「変更を確認」ヒント: 保存前プレビュー。DBは変わりません
- 保存ボタン note: 先に変更を確認 / 保存無効理由 / 1 回のみ（連打禁止）
- admin read banner: 非公開フィルタ・legacy_id 検索・公開サイト非表示

## 3. Per-operation explanation

| Operation | Step 1 | Step 2 | Step 3 | Key note |
|-----------|--------|--------|--------|----------|
| 通常更新 | 公演を選択 | 変更を確認 | 更新する / 戸山が確認 | 「変更を確認」= 保存前プレビュー。DBは変わりません |
| 複製 | 複製案を作成 | 変更を確認 | 複製案を保存 / 戸山が確認 | 元の公演は変更しません |
| 新規追加 | 新規追加案を作成 | 変更を確認 | 新規追加を保存 / 戸山が確認 | まだ保存されません |
| 非公開化 | 非公開化案を作成 | 変更を確認 | 非公開化を保存 / 戸山が確認 | 行は削除しません。published → false（物理削除ではない） |

## 4. Preview vs DB write

- 「変更を確認」= **保存前プレビュー**（確認のみ）。`actualWrite=false`。DBは変わりません。保存ボタンを押すまでDBは変更されません。
- 保存ボタン（更新する / 複製案を保存 / 新規追加を保存 / 非公開化を保存）= **DB write 経路**（write-armed 時のみ有効）。本フェーズでは Save 未実行。

## 5. Save once / no double-click

- UI に「保存ボタンは 1 回だけ押してください（連打禁止）」を明示。
- write-armed でない通常 dev では保存は無効。「保存は現在無効です」。

## 6. Unpublish is not physical DELETE

- 「非公開化案を作成」= 行は削除しません。
- 「非公開化を保存」= `published` を `false` にします。物理削除ではありません。
- 「削除（準備中）」= 現在は使いません。

## 7. Authenticated admin read — finding unpublished rows

ログイン後 Supabase admin read（authenticated）で:

- 非公開行（`published=false`）も管理画面の公演一覧に表示
- 「非公開のみ」フィルタで絞り込み
- `legacy_id` キーワード検索（例: `schedule-2026-07-008`）
- 公開サイトには非公開行は表示されない

## 8. Safety — this phase

| Item | Status |
|------|--------|
| Save executed | **false** |
| DB write | **false** |
| SQL INSERT/UPDATE/DELETE/UPSERT | **false** |
| rollback SQL | **false** |
| GRANT / REVOKE | **false** |
| RLS policy change | **false** |
| service_role | **not used** |
| Sariswing production ref | **never** use `vsbvndwuajjhnzpohghh` |

## 9. Package / FTP

- package regen: **false**
- FTP / upload / deploy / workflow_dispatch: **false**

## 10. Changed files

- `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts`
- `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro`
- `tools/static-to-astro/templates/admin-cms/styles/admin.css`
- `tools/static-to-astro/docs/gosaki-schedule-operator-procedure-hints.md`
- `tools/static-to-astro/scripts/verify-g22g2-gosaki-schedule-operator-procedure-hints.mjs`
- AI context: `00-current-state.md`, `03-next-actions.md`, `handoff-to-chatgpt.md`

**Not changed:** save modules, write adapter, approvalId registry, RLS SQL.

## 11. Next phase candidates

- Schedule P0 UX QA
- Schedule P0 UX まとめ
- republish planning（deferred）
- physical DELETE planning（deferred — 後回し）
