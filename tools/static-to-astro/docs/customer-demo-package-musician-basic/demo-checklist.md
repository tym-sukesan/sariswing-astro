# Demo Checklist — Musician Basic Admin

**用途:** 顧客デモの前・中・後に確認するチェックリスト  
**対象:** デモを行う開発者・制作担当者

---

## デモ前

### 環境・画面

- [ ] local preview route が表示できる（`ENABLE_ADMIN_PREVIEW=true npm run dev`）
- [ ] `/__admin-preview/musician-basic/` を開ける
- [ ] 画面上部に **scaffold-only / local preview** の表示がある
- [ ] 表示されているのが **mock data（サンプルデータ）** であることを確認した
- [ ] 本番サイト（Sariswing 本番など）に影響しないことを説明できる
- [ ] 本番 URL ではなく、開発用 preview で見せることを確認した

### 準備・資料

- [ ] [demo-script.md](./demo-script.md) の順番を確認した
- [ ] [customer-explanation.md](./customer-explanation.md) を読んだ
- [ ] [demo-safety-notes.md](./demo-safety-notes.md) を確認した
- [ ] [customer-admin-manual-musician-basic.md](../customer-admin-manual-musician-basic.md) を手元に用意した（必要なら）
- [ ] [customer-admin-quick-checklist-musician-basic.md](../customer-admin-quick-checklist-musician-basic.md) を手元に用意した（必要なら）
- [ ] [customer-feedback-form.md](./customer-feedback-form.md) の印刷またはメモ用を用意した

### 表示確認

- [ ] デスクトップ幅で表示を確認した
- [ ] スマホ幅（ブラウザの開発者ツール等）で表示を確認した
- [ ] 画面が極端に崩れていないことを確認した
- [ ] 秘密情報・実顧客データ・本番 env が画面に出ていないことを確認した

---

## デモ中

### 説明

- [ ] 「これは完成版ではない」と最初に説明した
- [ ] 「実際の保存はされない」と説明した
- [ ] 「本番サイトには影響しない」と説明した
- [ ] mock data であることを伝えた

### 画面確認

- [ ] Dashboard を見せた
- [ ] Profile を見せた
- [ ] Schedule / Live を見せた
- [ ] Discography を見せた
- [ ] Links を見せた
- [ ] News を見せた
- [ ] Media を見せた（アップロードは行わない）
- [ ] Publish を見せた（実公開は行わない）

### メモ

- [ ] 顧客の反応（良かった点・不安点）をメモした
- [ ] 不要な項目をメモした
- [ ] 追加したい項目をメモした
- [ ] 優先度（必須 / あると良い / 後回し）をメモした

---

## デモ後

### フィードバック整理

- [ ] [customer-feedback-form.md](./customer-feedback-form.md) の内容を整理した
- [ ] 必須機能と後回し機能を分けた
- [ ] デザイン・文言の要望を記録した

### 次のステップ

- [ ] 実データ接続の優先順位を決めた（または合意のための論点を整理した）
- [ ] staging 作成の合意・タイミングを確認した（または次回に持ち越し）
- [ ] 本番公開までの流れ（承認制）を説明した
- [ ] [post-demo-next-steps.md](./post-demo-next-steps.md) に沿って次アクションを整理した

### 安全確認

- [ ] デモ中に実 env・secret・本番 URL を表示していない
- [ ] 実 DB 接続・本番 deploy コマンドを実行していない
- [ ] 顧客承認なしで公開していない

---

## 関連資料

- [demo-script.md](./demo-script.md)
- [demo-safety-notes.md](./demo-safety-notes.md)
- [preview-safety-checklist.md](../../templates/admin-cms/preview/preview-safety-checklist.md) — 開発者向け preview harness checklist

---

*G-5v: demo checklist. Use with local-only preview route.*
