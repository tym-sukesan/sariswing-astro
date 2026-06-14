Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit
Repository focus: sariswing-astro / tools/static-to-astro
Primary product goal: Wix / Studio / Jimdo などから、軽量・低コスト・本人更新可能な Astro + Supabase CMS へ移行するための汎用CMSキットを作る。

1. Project overview
このプロジェクトは、Sariswing.com で実装した Astro + Supabase + GitHub Actions + Lolipop FTP 構成を一般化し、ミュージシャン・音楽教室・小規模事業者向けの CMS Kit として商品化することを目的とする。
現在の中心テーマは、tools/static-to-astro における Musician CMS Kit の一般化である。

主な対象機能は以下。
Schedule CMS
News CMS
Profile / About CMS
Media / Instagram / YouTube CMS
Discography CMS
Sitemap / robots / SEO metadata
静的HTMLサイトからAstroプロジェクトへの変換
Supabase連携
Staging Shell
将来的な管理画面一般化
将来的な顧客オンボーディング・課金・デプロイ自動化

2. Current phase
現在フェーズ: G-6-f5-schedule-safe-fields-non-dry-run-preflight（完了）

Safe fields non-dry-run 前の preflight doc。対象行・payload・rollback・beforeSnapshot SQL・approval ID・updated_at 方針を整理。DB write なし。

直近完了フェーズ:
G-6-f5-schedule-safe-fields-non-dry-run-preflight
前フェーズ:
G-6-f4-schedule-safe-fields-dry-run-prototype
直近commit:
（G-6-f5 commit 後に更新）

G-6-e5 成功状態（維持）:
- description: 出演： [G-6-e5 non-dry-run PoC]
- rollbackNeeded: false
- hidden PoC Run button: 再クリック禁止（EXPLICIT_RERUN なしでは UI 非武装）

3. Important completed milestones

3.1 Sariswing CMS implementation
Sariswing.com では以下が実装済み。
Astro化
Supabase連携
管理画面 /admin
NEWS CRUD
SCHEDULE CRUD
Instagram管理
Sitemap生成
Basic認証
Supabase Auth
admin role
GitHub Actions workflow_dispatch
Lolipop FTP deploy
管理画面から「公開サイトを更新」
本人がスマホで更新できる状態

Sariswing本番は完成済みで、現在の開発では触らない。

3.2 Static-to-Astro conversion
tools/static-to-astro では、静的HTMLサイトを Astro プロジェクトへ変換する仕組みの実装が進んでいる。
実案件検証として gosaki-static-site / gosaki-piano.com 相当の音楽教室サイトを使用。
完了済みの内容:
既存HTML解析
Astroページ生成
BaseLayout化
SEO / OGP移植
CSS / assets整理
sitemap / robots生成
scheduleページ再設計
visual diff
意図的差分の記録
customer demo package before writes

3.3 Profile write PoC
G-6-d 系フェーズで Profile write PoC は成功済み。
重要な実績:
public.profile への non-dry-run update 成功
Supabase Auth + RLS + admin_users の流れで動作確認済み
service_role は使っていない
この設計思想を Schedule PoC にも合わせる方針

Profile PoC での成功は、Schedule PoC の認証設計の基準とする。

3.4 RLS / GRANT cleanup
Supabase staging project にて以下を確認・整理済み。
RLS enabled
admin_users / is_admin() の存在確認
anon/authenticated の不要な broad grants を削除
authenticated UPDATE on public.schedules は手動で grant 済み
INSERT / DELETE / TRUNCATE / TRIGGER / REFERENCES 等は許可していない

重要:
public.schedules:
- anon: SELECT
- authenticated: SELECT, UPDATE

4. Supabase project
現在の staging project:
static-to-astro-cms-staging
本番 project は触らない。
開発中に Supabase SQL Editor を使う場合、必ず static-to-astro-cms-staging であることを確認する。

5. Schedule CMS current state

5.1 Tables
主な対象テーブル:
public.schedules
public.schedule_months
設計上の扱い:
public.schedules:
- authoring table
- write対象
public.schedule_months:
- read-only / derived model
- 初回Schedule write PoCでは絶対に書き換えない

5.2 Schedule target row for first non-dry-run PoC
初回 Schedule non-dry-run PoC の対象行:
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
year: 2026
month: 2026-07
title: <>
venue:
open_time: null
start_time: null
price: null
description: 出演： [G-6-e5 non-dry-run PoC]
image_url: null
home_image_url: null
source_file: schedule-2026-07.html
source_route: /schedule-2026-07/
show_on_home: false
home_order: null
published: true
sort_order: 10
created_at: 2026-06-05 17:39:44.140168+00
updated_at: 2026-06-05 17:39:44.140168+00
PoC 成功後の状態（after-verification 確認済み）:
description_match: true
changedFields: description のみ
選定理由:
title が <>
venue が空
description が 出演： のみ
実ライブ情報がほぼ空
show_on_home が false
description-only change なら低リスク

5.3 Planned payload
初回 Schedule write PoC の payload:
{
  "description": "出演： [G-6-e5 non-dry-run PoC]"
}
変更対象は description のみ。
変更禁止:
date, year, month, title, venue, open_time, start_time, price, image_url, home_image_url, source_file, source_route, show_on_home, home_order, published, sort_order, created_at, updated_at, schedule_months

5.4 Rollback SQL
必要時のみ、stagingで実行する rollback SQL:
update public.schedules
set description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
現時点では rollback は不要。PoC 成功後も rollback SQL は staging 復元用に保持（未実行）。

6. Schedule write PoC history

6.1 Target selection
完了済み: G-6-e5-schedule-non-dry-run-poc-target-selection

6.2 Execution prep
完了済み: G-6-e5-schedule-non-dry-run-poc-execution-prep
方針: Node script ではなく hidden staging browser trigger を採用（Supabase Auth sessionをそのまま使えるため。service_role不使用）

6.3 Execution path implementation
完了済み: G-6-e5-schedule-non-dry-run-poc-execution-path-implementation
対象 route: /__admin-staging-shell/musician-basic/

6.4 Execution path verification & 6.5 Final preflight
完了済み。DBは未変更。

6.6 First execution attempt
実行試行結果: ユーザーが手動で Run button を1回クリックしたが、SQL確認では DB未変更。

6.7 Diagnosis
最有力原因: Schedule PoC 側の mock allowlist admin role hard gate（auth.session.role !== "admin" で止まっていた可能性）

6.8 Fix implementation
完了済み（c5324aa）。mock gateの緩和、エラー表示改善など。

6.9 Fix verification
完了済み（a42a904）。readyForExplicitRetry: true（明示的 retry を行える状態）。

6.10 Explicit retry
完了済み。フェーズ: G-6-e5-schedule-non-dry-run-poc-explicit-retry-result
ユーザー手動 Run 1 回で description 更新成功。result doc: schedule-non-dry-run-poc-explicit-retry-result.md

6.11 Schedule CMS generalization planning
完了済み。フェーズ: G-6-f-schedule-cms-generalization-planning
planning doc: schedule-cms-generalization-planning.md

6.12 Schedule PoC isolation
完了済み。フェーズ: G-6-f1-schedule-poc-isolation-dry-run-default
- explicit rerun gate: PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true 必須
- completed notice UI 追加
- doc: schedule-poc-isolation-dry-run-default.md
- DB write / Run click: なし

6.13 Schedule read UI binding audit
完了済み。フェーズ: G-6-f2-schedule-read-ui-binding-audit
- `resolveScheduleAdminUiBinding()` — SSR SELECT via `loadSchedulesForDryRunUi`
- `ScheduleAdminUi` — readSource / description column / SELECT-only banner
- staging shell prototype で env gate 時に live schedules 表示
- doc: schedule-read-ui-binding-audit.md
- DB write / Run click / PoC re-arm: なし
- `schedule_months`: 未読

6.14 Schedule description dry-run prototype
完了済み。フェーズ: G-6-f3-schedule-description-edit-dry-run-prototype
- Plan A: description-only（G-6-f4 で UI 拡張）

6.15 Schedule safe-fields dry-run prototype
完了済み。フェーズ: G-6-f4-schedule-safe-fields-dry-run-prototype
- 対象: title, venue, open_time, start_time, price, description
- `AdminStagingScheduleSafeFieldsDryRunSection`
- operation: dry-run-update-preview
- doc: schedule-safe-fields-dry-run-prototype.md
- DB write / non-dry-run / PoC re-arm: なし

6.16 Schedule safe-fields non-dry-run preflight
完了済み。フェーズ: G-6-f5-schedule-safe-fields-non-dry-run-preflight
- doc: schedule-safe-fields-non-dry-run-preflight.md
- 推奨: G-6-e5 行再利用、初回 non-dry-run は venue + description（Option A 限定）
- approval ID 案: G-6-f6-schedule-safe-fields-non-dry-run-poc
- DB write / execution: なし

7. Current gates
scheduleNonDryRunPocCompleted: true
explicitRetrySucceeded: true
scheduleCmsGeneralizationPlanningComplete: true
hiddenPocTriggerDisarmedByDefault: true
explicitRerunGateRequired: true
dryRunDefaultDocumented: true
g6e5ApprovalIdReuseProhibited: true
scheduleReadUiBindingComplete: true
scheduleDescriptionDryRunPrototypeComplete: true
scheduleSafeFieldsDryRunPrototypeComplete: true
scheduleSafeFieldsNonDryRunPreflightComplete: true
readyForScheduleSafeFieldsNonDryRunImplementation: true
readyForScheduleGeneralUi: false
readyForExplicitRetry: false
rollbackNeeded: false

8. Absolute safety invariants
- production / Sariswing本番には触らない
- Supabase production projectには触らない
- service_role keyを使わない
- .env / .env.local をcommitしない
- output/ をcommitしない
- src/pages/admin/ は触らない
- Playwright / Chromium による自動クリック禁止

9. Environment expectations
明示的 retry で dev server を起動する場合は inline env のみ使用する。

10. Recommended next phase
次フェーズ推奨: G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation

詳細: tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-preflight.md

11. AI workflow transition
チャット履歴への依存を減らすため、リポジトリ側に AI開発文脈管理ファイルを作成。
今後は、Cursorが作業後にこれらを更新し、Git管理された文脈ファイルを source of truth とする。

AI workflow foundation setup completed:
- `.cursor/rules` added
- `tools/static-to-astro/docs/ai/00-current-state.md` added
- `tools/static-to-astro/docs/ai/03-next-actions.md` added
- `tools/static-to-astro/docs/ai/handoff-to-chatgpt.md` added
- commit `2b51bd5` — Add AI development workflow context files

AI workflow foundation refinement completed:
- `AGENTS.md` added at repository root
- `handoff-to-chatgpt.md` populated with current values
- root `README.md` updated with AI workflow files section
- latest commit: f3bf4dc — Refine AI development workflow handoff
