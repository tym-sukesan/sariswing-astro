# Screenshot Guide（資料用撮影ガイド）

社内資料・提案スライド用。顧客共有前に **秘匿情報** を必ず確認してください。

## 撮影対象（推奨順）

1. **staging shell 全体** — ページ上部の「staging / not production」文脈が入る構図
2. **safety banner** — read-only セクションの青い注意バナー
3. **login UI** — ログインフォーム全体
4. **auth status** — Provider / staging 接続状態
5. **role / allowlist status** — mock 表示（実メールが映らないよう）
6. **read-only data status** — Approval ID・Provider・canWrite false
7. **profile preview** — mock または staging の1件
8. **schedule preview** — リスト数件
9. **news fallback / empty state** — エラー時の module 局所表示（全体が壊れていないこと）
10. **canWrite false / Publish disabled** — meta 行のクローズアップ

## 起動（mock 推奨）

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=false \
PUBLIC_ADMIN_DATA_PROVIDER=mock \
npm run dev
```

## 禁止・注意

| 禁止 | 理由 |
| --- | --- |
| 実 Supabase URL / anon key をアドレスバー・画面に映す | secret 漏洩 |
| ブラウザ devtools の Network / Application に key が見える状態 | secret 漏洩 |
| 実顧客メール・本名 | 個人情報 |
| production project 名・本番ドメインの管理画面 | 誤解・セキュリティ |
| `.env` ファイルのウィンドウ | secret 漏洩 |

## OK の例

- `example.com` の mock URL
- `canWrite: false` / `productionReady: false` の表示
- `localhost:4321/__admin-staging-shell/...`（社内資料のみ。外部公開時は説明付き）

## 撮影後チェック

- [ ] トリミングで URL バーから key が切れている
- [ ] 実顧客情報が写っていない
- [ ] 「本番管理画面ではない」キャプションをスライドに付ける
- [ ] 外部共有前に [safety-notes.md](./safety-notes.md) と整合

## ファイル命名（社内）

```txt
demo-staging-shell-overview.png
demo-readonly-canwrite-false.png
demo-module-news-fallback.png
```

リポジトリに **実スクリーンショットを commit しない** 方針を推奨（顧客環境依存のため）。
