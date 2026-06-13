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
- **G-6-d-dry-run-retry-after-schema-apply（完了）:** [staging-profile-schema-apply-verification-and-dry-run-qa.md](../staging-profile-schema-apply-verification-and-dry-run-qa.md) — `dryRunPassed: true`
- **G-6-d-manual-non-dry-run-prep（完了）:** [staging-profile-manual-non-dry-run-prep.md](../staging-profile-manual-non-dry-run-prep.md) — prep done; execution aborted
- **G-6-d-staging-env-gate-client-fix（完了）:** [staging-env-gate-client-fix.md](../staging-env-gate-client-fix.md) — ENABLE_* server injection for client diagnostics
- **G-6-d-staging-password-reset-callback（完了）:** [staging-password-reset-callback.md](../staging-password-reset-callback.md) — staging password reset callback; `updateUser({ password })` staging-only; no profile update; no non-dry-run yet
- **G-6-d-auth-status-denied-fix（完了）:** [staging-auth-status-denied-fix.md](../staging-auth-status-denied-fix.md) — Auth status denied fixed; valid session → authenticated
- **G-6-d-result-report（完了）:** [staging-profile-non-dry-run-result-report.md](../staging-profile-non-dry-run-result-report.md) — first manual staging non-dry-run profile update succeeded; production not touched; `/admin` unconnected; `readyForG6E: false`
- **G-6-d-hardening（完了）:** [staging-profile-write-hardening.md](../staging-profile-write-hardening.md) — gaps documented; `readyForG6EPlanning: true`; `readyForG6EImplementation: false`; broader writes blocked
- **G-6-rls-audit（完了）:** [staging-rls-audit.md](../staging-rls-audit.md) — read-only RLS audit plan
- **G-6-rls-audit-result（完了）:** [staging-rls-audit-result.md](../staging-rls-audit-result.md) — manual SQL collected; broad grants
- **G-6-rls-grant-cleanup-plan（完了）:** [staging-rls-grant-cleanup-plan.md](../staging-rls-grant-cleanup-plan.md) — REVOKE draft; cleanup not executed; `readyForManualCleanupDecision: true`
- **G-6-rls-grant-cleanup-manual-apply-prep（完了）:** [staging-rls-grant-cleanup-manual-apply-prep.md](../staging-rls-grant-cleanup-manual-apply-prep.md) — final manual REVOKE SQL; user applied in Supabase SQL Editor
- **G-6-rls-grant-cleanup-result（完了）:** [staging-rls-grant-cleanup-result.md](../staging-rls-grant-cleanup-result.md) — REVOKE succeeded; broad grants removed; smoke test pass; `readyForG6EImplementation: false`
- **G-6-e-planning-schedule-cms（完了）:** [schedule-cms-planning.md](../schedule-cms-planning.md) — Schedule CMS planned; Sariswing generalized; planning only
- **G-6-e1-schedule-schema-read-audit（完了）:** [schedule-schema-read-audit.md](../schedule-schema-read-audit.md) — read-only schema audit plan; manual SQL required
- **G-6-e1-schedule-schema-read-audit-result（完了）:** [schedule-schema-read-audit-result.md](../schedule-schema-read-audit-result.md) — MVP compatible; no schema migration before dry-run UI
- **G-6-e2-schedule-dry-run-ui-planning（完了）:** [schedule-dry-run-ui-planning.md](../schedule-dry-run-ui-planning.md) — update + duplicate dry-run; write blocked
- **G-6-e2-schedule-dry-run-ui-scaffold（完了）:** [schedule-dry-run-ui-scaffold.md](../schedule-dry-run-ui-scaffold.md) — staging shell dry-run UI; no DB write; write blocked
- **G-6-e2-schedule-dry-run-ui-verification-result（完了）:** [schedule-dry-run-ui-verification-result.md](../schedule-dry-run-ui-verification-result.md) — manual browser verification passed; port 4322; write blocked
- **G-6-e3-schedule-dry-run-adapter-planning（完了）:** [schedule-dry-run-adapter-planning.md](../schedule-dry-run-adapter-planning.md) — dry-run adapter boundary; pure functions; no DB client; write blocked
- **G-6-e3-schedule-dry-run-adapter-implementation（完了）:** [schedule-dry-run-adapter-implementation.md](../schedule-dry-run-adapter-implementation.md) — pure dry-run adapter; UI routed; write blocked
- **G-6-e3-schedule-dry-run-adapter-verification-result（完了）:** [schedule-dry-run-adapter-verification-result.md](../schedule-dry-run-adapter-verification-result.md) — manual browser pass; duplicate payload safety confirmed; write blocked
- **G-6-e4-schedule-write-adapter-planning（完了）:** [schedule-write-adapter-planning.md](../schedule-write-adapter-planning.md) — real write adapter planned; update-only first PoC; write blocked
- **G-6-e4-schedule-write-adapter-implementation-planning（完了）:** [schedule-write-adapter-implementation-planning.md](../schedule-write-adapter-implementation-planning.md) — update-only write adapter design; beforeSnapshot/rollback required; UPDATE grant review required; write blocked
- **G-6-e4-schedule-update-grant-prep（完了）:** [schedule-update-grant-prep.md](../schedule-update-grant-prep.md) — UPDATE grant SQL prepared; not executed; write blocked
- **G-6-e4-schedule-update-grant-manual-apply-prep（完了）:** [schedule-update-grant-manual-apply-prep.md](../schedule-update-grant-manual-apply-prep.md) — final manual apply steps; GRANT not executed; write blocked
- **G-6-e4-schedule-update-grant-manual-apply-result（完了）:** [schedule-update-grant-manual-apply-result.md](../schedule-update-grant-manual-apply-result.md) — UPDATE grant applied in staging; dry-run smoke pass; write adapter next
- **G-6-e4-schedule-write-adapter-implementation（完了）:** [schedule-write-adapter-implementation.md](../schedule-write-adapter-implementation.md) — guarded update-only adapter; not invoked; no DB write
- **G-6-e4-schedule-write-adapter-verification（完了）:** [schedule-write-adapter-verification.md](../schedule-write-adapter-verification.md) — guarded ScheduleWriteAdapter verified as isolated; `.update()` location verified; write adapter not invoked; UI not connected; no DB write; `readyForG6E5ScheduleNonDryRunPocPrep: true`; actual non-dry-run PoC remains blocked
- **G-6-e5-schedule-non-dry-run-poc-prep（完了）:** [schedule-non-dry-run-poc-prep.md](../schedule-non-dry-run-poc-prep.md) — first non-dry-run PoC will target one existing schedule row only; planned field change: description only; rollback SQL prepared as template; actual non-dry-run execution remains blocked
- **G-6-e5-schedule-non-dry-run-poc-target-selection（完了）:** [schedule-non-dry-run-poc-target-selection.md](../schedule-non-dry-run-poc-target-selection.md) — selected target row `schedule-2026-07-010`; beforeSnapshot captured; final payload description only; rollback SQL finalized; ready for execution prep; actual non-dry-run execution remains blocked
- **G-6-e5-schedule-non-dry-run-poc-execution-prep（完了）:** [schedule-non-dry-run-poc-execution-prep.md](../schedule-non-dry-run-poc-execution-prep.md) — execution path planning prepared; one-off execution path required; service_role prohibited; authenticated admin user required; no execution script invoked; actual non-dry-run execution remains blocked
- **G-6-e5-schedule-non-dry-run-poc-execution-path-implementation（完了）:** [schedule-non-dry-run-poc-execution-path-implementation.md](../schedule-non-dry-run-poc-execution-path-implementation.md) — hidden staging browser trigger implemented; default hidden; trigger was not invoked; no DB write occurred
- **G-6-e5-schedule-non-dry-run-poc-final-preflight（完了）:** [schedule-non-dry-run-poc-final-preflight.md](../schedule-non-dry-run-poc-final-preflight.md) — final beforeSnapshot check required; rollback SQL and after verification SQL available; execution result template prepared; Run button still not clicked; actual non-dry-run execution remains blocked
- 次: G-6-e5-schedule-non-dry-run-poc-final-preflight-result

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
G-6-d-dry-run-retry-after-schema-apply: dry-run passed
G-6-d-manual-non-dry-run-prep: manual non-dry-run prep (aborted)
G-6-d-staging-env-gate-client-fix: ENABLE_* server injection for client diagnostics
G-6-d-staging-password-reset-callback: staging password reset callback (updateUser staging-only)
G-6-d-auth-status-denied-fix: valid session → authenticated; mock allowlist no longer overrides auth status
G-6-d-result-report: first staging profile non-dry-run update succeeded (bio only)
G-6-d-hardening: updated_by / role display / dry-run restore documented
G-6-rls-audit: read-only RLS audit plan
G-6-rls-audit-result: manual SQL collected; grant cleanup recommended
G-6-rls-grant-cleanup-plan: REVOKE draft for TRUNCATE/TRIGGER/REFERENCES (not executed)
G-6-rls-grant-cleanup-manual-apply-prep: final manual REVOKE SQL (user applied)
G-6-rls-grant-cleanup-result: manual REVOKE succeeded; smoke test pass
G-6-e-planning-schedule-cms: Schedule CMS planning (done; no implementation)
G-6-e1-schedule-schema-read-audit: read-only schema audit plan (done)
G-6-e1-schedule-schema-read-audit-result: manual SQL collected; MVP compatible (done)
G-6-e2-schedule-dry-run-ui-planning: dry-run UI planning (done)
G-6-e2-schedule-dry-run-ui-scaffold: dry-run UI scaffold in staging shell (done)
G-6-e2-schedule-dry-run-ui-verification-result: manual browser verification (done)
G-6-e3-schedule-dry-run-adapter-planning: dry-run adapter boundary (done)
G-6-e3-schedule-dry-run-adapter-implementation: pure dry-run adapter (done)
G-6-e3-schedule-dry-run-adapter-verification: static + manual checklist (done)
G-6-e3-schedule-dry-run-adapter-verification-result: manual browser pass (done)
G-6-e4-schedule-write-adapter-planning: write adapter boundary planning (done)
G-6-e4-schedule-write-adapter-implementation-planning: write adapter implementation design (done)
G-6-e4-schedule-update-grant-prep: UPDATE grant manual SQL prep (done)
G-6-e4-schedule-update-grant-manual-apply-prep: final manual apply procedure (done)
G-6-e4-schedule-update-grant-manual-apply-result: UPDATE grant applied in staging (done)
G-6-e4-schedule-write-adapter-implementation: guarded write adapter (done)
G-6-e4-schedule-write-adapter-verification: isolation verified (done)
G-6-e5-schedule-non-dry-run-poc-prep: PoC prep documented (done)
G-6-e5-schedule-non-dry-run-poc-target-selection: target row selected (done)
G-6-e5-schedule-non-dry-run-poc-execution-prep: execution path planned (done)
G-6-e5-schedule-non-dry-run-poc-execution-path-implementation: hidden trigger implemented (done)
G-6-e5-schedule-non-dry-run-poc-execution-path-verification: normal dev hidden verified (done)
G-6-e5-schedule-non-dry-run-poc-execution-path-verification-result: manual browser verification recorded (done)
G-6-e5-schedule-non-dry-run-poc-final-preflight: final preflight prepared (done)
G-6-e5-schedule-non-dry-run-poc-final-preflight-result: next
G-6-e: schedule write implementation (blocked — readyForG6EImplementation false)
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
