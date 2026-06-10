# Safety Notes（デモ時の安全注意）

デモ担当者・顧客双方が安心できるよう、以下をデモ前に共有してください。

## English summary (for internal checklist)

```txt
- This is not production admin
- /admin is not connected
- canWrite is false
- no DB writes
- no Storage upload
- no Publish dispatch
- no FTP deploy
- productionReady false
- production data not touched
- secrets are not committed
```

## 日本語（顧客・担当者向け）

### これは本番の管理画面ではありません

- 表示しているのは **staging shell**（開発・確認用の試作画面）です
- 本番サイトの URL（例: 公開中のホームページ）とは別です
- **`/admin/` 本番管理画面には接続していません**

### データの書き込みはできません

- **保存・新規作成・更新・削除はすべて無効** です（`canWrite: false`）
- デモ中にデータが上書きされたり、削除されたりすることはありません
- **本番のデータベースには触れません**（staging 用の確認環境のみ、またはモック表示）

### 画像・公開・デプロイはできません

- **画像アップロード（Storage）は未接続**
- **公開ボタン・サイト更新（Publish）は無効**
- **FTP / GitHub による本番デプロイは行いません**

### 秘密情報の取り扱い

- デモ用の Supabase URL / キーは **ローカル環境のみ** に設定し、**リポジトリに commit しません**
- 画面共有時にブラウザの開発者ツールでキーが見えないよう注意してください
- 資料・スクリーンショットに **実顧客のメールアドレス・本名・本番 URL** を映さないでください

### 現時点の完成度

- `productionReady: false` — 本番提供の準備はまだ完了していません
- 段階的に **見た目 → ログイン → データ表示 →（将来）保存・公開** の順で安全確認を進めています

### 万が一のとき

- 不明な操作を促さない（「とりあえず押してみて」は避ける）
- エラーが出ても **本番サイトには影響しない** ことを伝える
- 書き込みが必要な要望は [feedback-form.md](./feedback-form.md) に記録し、G-6 以降の計画で扱う
