# Demo Checklist（デモ前準備）

デモ当日の 30〜60 分前に確認してください。

## リポジトリ・環境

- [ ] working tree clean（意図しない変更がない）
- [ ] `output/` が commit されていない
- [ ] `.env` が commit されていない
- [ ] 資料に実顧客のメール・秘密情報が含まれていない

## 起動確認

### Mock mode（推奨・デフォルト）

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=false \
PUBLIC_ADMIN_DATA_PROVIDER=mock \
npm run dev
```

- [ ] `http://localhost:4321/__admin-staging-shell/musician-basic/` が開く
- [ ] staging shell が無効のときは説明用の「disabled」画面になる（意図どおり）

### Supabase read-only（任意・staging のみ）

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_SUPABASE_URL="<staging project url>" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

**注意:** 実 URL/key は commit しない。production project は使わない。deploy しない。

- [ ] staging project のみ使用
- [ ] read-only preview が表示される（または news など module 単位で fallback）

## 画面・安全表示

- [ ] noindex が設定されている / 検索エンジンに載せない方針を説明できる
- [ ] `/admin` route に接続していないことを説明できる
- [ ] `canWrite: false` が read-only パネルに表示される
- [ ] Storage disabled / Publish disabled が説明できる
- [ ] `productionReady: false` が説明できる
- [ ] staging safety バナーが read-only セクションに見える

## Auth / Role（該当セクション）

- [ ] ログイン UI が表示される
- [ ] mock Auth mode が説明できる
- [ ] Supabase Auth staging は env がある場合のみ（任意）

## Read-only data

- [ ] profile / schedule / discography / links / news の preview または empty/error 状態
- [ ] news が失敗しても画面全体が壊れない

## デモ当日持ち物

- [ ] [demo-script.md](./demo-script.md) 印刷 or タブで開く
- [ ] [customer-explanation.md](./customer-explanation.md)（共有用）
- [ ] [feedback-form.md](./feedback-form.md)（メモ用）
- [ ] [safety-notes.md](./safety-notes.md)（口頭説明用）

## デモ後

- [ ] feedback を記録
- [ ] [next-steps.md](./next-steps.md) で次アクションを決める
- [ ] スクリーンショットを撮った場合 [screenshot-guide.md](./screenshot-guide.md) に沿って秘匿情報を確認
