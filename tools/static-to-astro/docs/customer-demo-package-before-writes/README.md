# Customer Demo / QA Package (Before Writes)

## 目的

G-5z-f は、G-6 の write operation 設計に入る**前**に、CMS Kit staging shell の現状成果を **顧客デモ / QA / 商品化検討** 用にまとめたパッケージです。

- **read-only demo** です（保存・公開は無効）
- **`/admin` 本番管理画面ではありません** — staging shell のみ
- **production ではありません** — 本番サイト・本番データには影響しません
- **write operations はまだ無効** — `canWrite: false`

関連: [read-only-qa-rls-review-report.md](../read-only-qa-rls-review-report.md) (G-5z-e)

## G-5z-f の位置づけ

| 完了済み | 本パッケージ |
| --- | --- |
| G-5z-a〜e read-only phase | 顧客向け説明・デモ台本・QA・安全注意 |
| staging shell + Auth + read-only data | デモ前準備とフィードバック回収 |
| `readOnlyPhaseComplete: true` | `readyForCustomerDemo: true`（準備完了時） |

## デモ対象 URL

ローカル開発時:

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/
```

staging preview URL がある場合は、デモ当日に `demo-script.md` 内の URL を差し替えてください（commit しない）。

## 資料の使い方（推奨順）

1. [safety-notes.md](./safety-notes.md) — デモ前に必ず確認
2. [demo-checklist.md](./demo-checklist.md) — 環境・表示の準備
3. [demo-script.md](./demo-script.md) — デモ当日の台本
4. [customer-explanation.md](./customer-explanation.md) — 顧客向け説明（共有可）
5. [feedback-form.md](./feedback-form.md) — デモ後の要望回収
6. [next-steps.md](./next-steps.md) — 次の判断・フェーズ

## 補助資料

| ファイル | 用途 |
| --- | --- |
| [current-capabilities.md](./current-capabilities.md) | 今できること |
| [not-yet-capabilities.md](./not-yet-capabilities.md) | まだできないこと・意図的に無効なこと |
| [qa-checklist.md](./qa-checklist.md) | デモ前後の QA |
| [screenshot-guide.md](./screenshot-guide.md) | 資料用スクリーンショット |

## 機械可読レポート

```bash
node tools/static-to-astro/scripts/report-customer-demo-readiness.mjs \
  --out-dir tools/static-to-astro/output/customer-demo-readiness/gosaki
```

Config: [customer-demo-package-before-writes.json](../../config/admin/customer-demo-package-before-writes.json)

## 安全上の原則

```txt
No DB writes. No Storage. No Publish. No /admin. No production data.
Secrets and real customer PII must not be committed to this package.
```
