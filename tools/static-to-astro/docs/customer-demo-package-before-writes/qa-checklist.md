# QA Checklist（顧客デモ前後）

デモ担当者用。分類ごとにチェックしてください。

## Visual QA

- [ ] staging safety / status バナーが見える
- [ ] read-only パネルの meta 情報が読める
- [ ] module カードが詰まりすぎていない
- [ ] empty / error 状態が区別できる
- [ ] 長い URL がレイアウトを崩さない（折り返し）
- [ ] スマホ幅で大きく崩れない（可能な範囲）

## Auth QA

- [ ] ログイン UI が表示される
- [ ] mock Auth mode でデモできる
- [ ] Supabase Auth は staging env のみ（任意・本番 project 禁止）
- [ ] Auth ステータス（接続 / mock）を説明できる

## Role QA

- [ ] role / allowlist 表示セクションが見える（該当時）
- [ ] 「表示のみ・本番 enforcement 未接続」と説明できる
- [ ] 実顧客メールが画面・資料に出ていない

## Data QA

- [ ] profile preview が表示される（mock または staging）
- [ ] schedules preview が表示される
- [ ] discography preview が表示される
- [ ] links preview が表示される
- [ ] news が empty / error でも **画面全体がクラッシュしない**
- [ ] module status バッジ（ok / empty / error）が見える
- [ ] mock fallback を env で切り替えられる

## Safety QA

- [ ] `canWrite: false` が表示される
- [ ] save / delete / publish / upload が **有効なボタンとして出ない**（read-only セクション）
- [ ] `/admin` に接続していない
- [ ] Storage / Publish disabled を説明できる
- [ ] `productionReady: false` を説明できる
- [ ] 本番データに触れていない

## Mobile QA

- [ ] スマホブラウザで staging shell が開く（担当者確認）
- [ ] 横スクロールが過度でない
- [ ] タップしやすい余白がある

## Feedback QA

- [ ] [feedback-form.md](./feedback-form.md) の質問を回収した
- [ ] 要望を「今できる / 将来」の線で整理した
- [ ] [next-steps.md](./next-steps.md) で次アクションを記録した

## デモ後サインオフ

```txt
Date:
Customer (optional label):
Demo mode: mock / supabase-read-only
Visual QA: pass / fail
Safety QA: pass / fail
Follow-up:
```
