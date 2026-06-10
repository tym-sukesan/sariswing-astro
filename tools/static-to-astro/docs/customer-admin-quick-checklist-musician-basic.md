# Musician Basic Admin — Quick Checklist

**対象:** `musician-basic` テンプレートを使う顧客・運用者  
**用途:** 更新前・更新後・本番公開前に、1ページで確認するチェックリスト

詳しい説明は [Customer Admin Manual — Musician Basic](./customer-admin-manual-musician-basic.md) を参照してください。

**顧客デモ時（G-5v）:** デモ前後のチェックは [customer-demo-package-musician-basic/demo-checklist.md](./customer-demo-package-musician-basic/demo-checklist.md) を使い、local preview route（`/__admin-preview/musician-basic/`）と組み合わせてください。デモは mock / scaffold です。

---

## 更新前

- [ ] **画像の権利確認** — 自分の素材か、使用許可があるか
- [ ] **日付確認** — Schedule / News の日付が正しいか（意図しない未来日付でないか）
- [ ] **公開 / 非公開の確認** — 意図どおり ON / OFF か
- [ ] **URL確認** — Links / News 外部 URL が正しいか（https://、余分な空白なし）
- [ ] **スマホ表示を意識** — 長文・大きな画像はスマホで見た目を想像する

---

## 更新後

- [ ] **Staging で確認** — 確認用サイトで表示をチェック
- [ ] **スマホで確認** — 実機またはスマホ表示で見る
- [ ] **リンク確認** — 外部リンクが正しく開くか
- [ ] **画像確認** — 切れ・日付違い・プレースホルダー残りがないか
- [ ] **誤字確認** — タイトル・会場名・本文
- [ ] **本番公開が必要か確認** — Staging で十分なら Production は慎重に

---

## 本番公開前

- [ ] **顧客承認** — 公開内容について OK を得た
- [ ] **権利確認** — 画像・テキストの使用許可が取れている
- [ ] **rollback plan** — 問題時の戻し方を把握している（または制作側と確認済み）
- [ ] **production publish enabled** — サイト設定で本番公開が有効か（制作側確認）
- [ ] **admin 権限か** — Production 公開は admin のみ

---

> **開発者向け:** このチェックリストは G-5q docs のみ。runtime / Auth / DB / Storage / Publish は未接続（`productionReady: false` / `connectedToRuntime: false`）。顧客デモ前は [preview-safety-checklist.md](../templates/admin-cms/preview/preview-safety-checklist.md)（G-5r）も確認してください。`customerDemoReady: false`。
