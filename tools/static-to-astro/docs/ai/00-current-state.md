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
現在は、Schedule CMS の初回 non-dry-run write PoC の途中。
直近までに、hidden staging trigger の初回実行を試みたが、DBは未変更だった。
診断の結果、Schedule PoC 側の mock allowlist admin gate が原因候補として特定され、修正・検証まで完了済み。

現在の直近完了フェーズ:
G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification-result
直近commit:
a42a904 — Record schedule PoC fix verification result
現在の次フェーズ候補:
G-6-e5-schedule-non-dry-run-poc-explicit-retry
ただし、このスレッドではその前に AI開発ワークフロー整備フェーズを挟む方針に変更した。

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
description: 出演：
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
現時点では rollback は不要。DBはまだ未変更。

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

7. Current gates
readyForExplicitRetry: true
readyForNonDryRunSchedulePoC: false

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
次フェーズ: G-6-e5-schedule-non-dry-run-poc-explicit-retry

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
