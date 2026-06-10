# Next Steps（デモ後の選択肢）

## デモ直後の推奨アクション

1. [feedback-form.md](./feedback-form.md) を記録
2. [qa-checklist.md](./qa-checklist.md) の未達があれば次回デモ前に修正
3. 下記オプションから **1〜2 つ** に絞って合意

---

## Option A: G-6-a write operation safety plan（技術・完了）

**G-6-a（完了）:** [write-operation-safety-plan.md](../write-operation-safety-plan.md)

- 書き込みを **いきなり実装せず**、安全計画から開始 — 計画書作成済み
- **G-6-b（完了）:** [rls-write-policy-review-plan.md](../rls-write-policy-review-plan.md)
- **G-6-c（完了）:** [disabled-write-action-scaffold.md](../disabled-write-action-scaffold.md) — UI scaffold only; all write actions disabled
- **G-6-d-prep（完了）:** [staging-profile-update-poc-approval-plan.md](../staging-profile-update-poc-approval-plan.md)
- **G-6-d（完了）:** [staging-profile-update-poc-implementation.md](../staging-profile-update-poc-implementation.md) — profile update PoC; default disabled; dry-run default
- **G-6-d-verify（完了）:** [staging-profile-update-poc-verification-checklist.md](../staging-profile-update-poc-verification-checklist.md)
- **G-6-d-blocker（完了）:** [profile-schema-alignment-plan.md](../profile-schema-alignment-plan.md) — `public.profile` missing; schema alignment before non-dry-run
- **G-6-d-schema-apply-prep（完了）:** [profile-schema-apply-prep.md](../profile-schema-apply-prep.md) — manual SQL package; Cursor does not execute SQL
- **G-6-d-schema-apply（ユーザー手動・完了）:** `public.profile` on staging; seed row; RLS policies
- **G-6-d-dry-run-retry-after-schema-apply（完了）:** [staging-profile-schema-apply-verification-and-dry-run-qa.md](../staging-profile-schema-apply-verification-and-dry-run-qa.md) — dry-run retried; `dryRunPassed: false` (GRANT); non-dry-run still blocked
- 次: G-6-d-result-report — GRANT fix + dry-run retry

## Option B: customer-specific schema mapping

- 顧客の更新項目に合わせて table / field mapping を確定
- G-5z-c-prep 型のレビューを顧客プロジェクト向けに実施

## Option C: staging data QA with actual customer content

- **staging project のみ** で read-only 表示 QA
- 本番データ・本番 project は使わない
- news 等の schema 差異を事前確認

## Option D: pricing / subscription / onboarding design

- 商品化: 料金プラン・サポート範囲・オンボーディング手順
- デモ内容と整合する SLA / 保守範囲の整理

## Option E: wait and gather feedback

- 追加デモ・他ステークホルダーへの共有
- G-6 に入る前に要望をもう一段集める

---

## 技術ロードマップ（write 前の推奨順）

```txt
G-6-a: write operation safety plan
G-6-b: RLS write policy review plan
G-6-c: disabled write action scaffold (UI only)
G-6-d-prep: staging profile update PoC approval plan
G-6-d: staging profile update PoC implementation (gated; default disabled)
G-6-d-verify: verification checklist (non-dry-run not executed)
G-6-d-blocker: profile schema alignment plan (public.profile missing)
G-6-d-schema-apply-prep: manual SQL package (no is_active in RLS)
G-6-d-schema-apply: user applies SQL to staging (manual) — done
G-6-d-dry-run-retry-after-schema-apply: schema verified; dry-run retried (GRANT blocker)
G-6-e: staging create operation (blocked until profile aligned)
```

**G-6 でもいきなり write 実装しない。** まず G-6-a。

---

## 商品化ロードマップ（並行候補）

| 候補 | 内容 |
| --- | --- |
| Customer onboarding package | 初回セットアップ・研修・資料 |
| Pricing / subscription plan | 月額・更新回数・サポート枠 |
| Support / maintenance policy | 障害対応・バックアップ・変更窓口 |
| Demo landing page | デモ予約・安全説明の公開ページ（本番 CMS とは別） |

---

## 判断マトリクス（簡易）

| 顧客の声 | おすすめオプション |
| --- | --- |
| 「早く保存したい」 | A → C（staging のみ） |
| 「項目が足りない」 | B |
| 「料金を知りたい」 | D |
| 「もう一度見せて」 | E + 本パッケージ再デモ |

---

## やらないこと（デモ後も継続）

- 本番 `/admin` 接続
- 本番データへの write
- 無承認の Storage / Publish / FTP
- service role をブラウザや repo に含めること
