Last updated: 2026-06-19
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
現在フェーズ: **G-9g4a1c-venue-only-operational-restore-preflight**（G-9g4a1b1 manual execution 完了後）

G-9g4a1b1: venue-only manual execution **complete**（uncommitted）。target `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003`; venue smoke marker **remains** — restore required.

G-9g4a1 Save gate sync fix: **complete**（commit `78888f5`）。

G-9g4a1b: Schedule venue-only operational expansion **execution runbook complete**（commit `6564061`）。

G-9g4a1a: Schedule venue-only operational expansion **preflight complete**（commit `01e64af`）。

G-9g4a1: Schedule venue-only operational expansion **implementation complete**（commit `49986c1`）。

G-9g4a: Schedule text fields operational expansion planning **complete**（commit `9a38c11`）。

Git: 最新 push 済み commit `78888f5`（G-9g4a1 Save gate sync fix）。G-9g4a1b1 execution result **uncommitted**。

G-9g3h1: Save success re-click prevention **implemented**（commit `8780f84`）。

G-9g3g5b: operational restore preflight **complete**（commit `95ff18c`）。

G-9g3g5: post-execution hardening **complete**（commit `d202797`）。

G-9g3g4: operational Save **success**（commit `a58f5f9`）。**Do not re-click G-9g3g4 operational Save.**

G-9g3g1: operational Save path **implementation completed**（commit `025156f`）。**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.**

G-9g3g: operational general edit **planning completed**（commit `b10b09a`）。

G-9g3f3c: hardening **committed `f0fd3af`**.

G-9g3f3b: binding smoke **passed**（commit `8d277d8`）。

G-9g3f3: binding planning 完了（commit `bf27151`）。

G-9g3f2: row picker read-only smoke 完了（commit `94d4e61`）。

G-9g3 safe-field PoC slices: **all complete** on pilot row (G-9g2 title, G-9g3b venue+description, G-9g3c time+price). **Do not re-run slice Saves.**

G-9g3c execution 成功（commit `d53d167`）。`updated_at` → `2026-06-17T15:45:35.433566+00:00`。

G-9g3b execution 成功（commit `125d5d5`）。G-9g2 execution 成功（commit `d57dd5f`）。

G-9g3b implementation + preflight（commit `c2a6b0c`）。

G-9g3a smoke test 成功。host gate + multi-field dry-run 確認済み。

G-9g3a implementation（commit `54380a0`）。

G-9g3 planning（commit `51051c2`）。

G-9g2 execution（commit `d57dd5f`）。title PoC 成功。restore 不要（痕跡保持）。

G-9f: site_slug read-only binding（commit `8be88e7`）。

G-9e: site_slug schedule read 汎用化（commit `15cf29b`）。

G-9c2c: operator が staging で既存60行 UPDATE migration を手動実行完了（commit `2bd5b90`）。site_slug backfill、source_route 正規化、schedule-2026-07-010 PoC 復元、show_on_home/home_order 3件補正。rollback 未実行。Cursor/AI は SQL 未実行。

G-9c2b: 既存60行 UPDATE checklist（commit `479347a`）。

G-9c2a: 既存60行採用再計画（commit `d24376e`）。

G-9c0c: seed SQL template canonical route 対応（commit `d19149c`）

G-9c0b: legacy stub（commit `36e8c54`）

G-9c0a: canonical route（commit `c385a7f`）

G-9b3: Avenir Next 置換後の PC 見出し折り返し修正。DB・FTP なし。

G-9b2: HTML inline style / Header 内 Wix font 名除去。DB・FTP なし。

G-9b1: Wix proprietary font 監査 + `wix-font-safety.mjs` sanitizer。`@font-face` / futura / avenir Wix face を static export から除外・置換。DB・FTP なし。

G-9b: Gosaki Wix repeater schedule seed 設計 + dry-run extractor（60 events, site_slug=gosaki-piano）。DB・SQL・FTP なし。

G-9a: Gosaki CMS MVP スコープ整理（Schedule / Top YouTube embed / Bands 優先度）。実装・DB・FTP なし。

直近完了フェーズ:
G-9a-gosaki-cms-scope-and-schedule-youtube-planning (planning)
G-8g2〜G-8g8 gosaki staging preview fixes (commit `77b57b8`)
G-8g1 (commit `a78a8d8`)

Gosaki staging:
- staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- client preview ready (`readyForGosakiClientPreview: true`)
- deploy: manual upload only; FTP auto deploy disabled
- Doc: `tools/static-to-astro/docs/gosaki-font-and-wix-asset-license-safety-audit.md`
- Font sanitizer: `wix-font-safety.mjs` — verify:gosaki-font-safety 21 passed
- Schedule extractor: `gosaki-wix-schedule-extractor.mjs` — 60 events dry-run verified
- Route docs:
  - `tools/static-to-astro/docs/gosaki-schedule-route-canonical-planning.md`
  - `tools/static-to-astro/docs/gosaki-schedule-canonical-route-implementation.md`
  - `tools/static-to-astro/docs/gosaki-schedule-legacy-month-route-stub.md`
- G-9g3c planning doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md`
- G-9g3c implementation doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md`
- G-9g3c preflight doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight.md`
- G-9g3c execution result doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md`
- G-9g3b execution result doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md`
- G-9g3b impl doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md`
- G-9g3a smoke test doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md`
- G-9g3a impl doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-implementation.md`
- G-9g3 planning doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-edit-planning.md`
- G-9g2 execution result doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md`
- G-9g2 preflight doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight.md`
- G-9g2 impl doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation.md`
- G-9g2 planning doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-planning.md`
- G-9g1 doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-edit-dry-run-preview.md`
- G-9g doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-edit-planning.md`
- G-9f doc: `tools/static-to-astro/docs/staging-shell-schedule-site-slug-read-binding.md`
- Staging shell route: `/__admin-staging-shell/musician-basic/#schedule`
- staging URL live: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`（G-9d2 operator upload 反映済み）
- Result doc: `tools/static-to-astro/docs/gosaki-existing-schedule-rows-manual-sql-execution-result.md`
- Staging DB: 60 rows `site_slug=gosaki-piano`, canonical `source_route`, PoC row restored
- Schedule read: anon key only; env なし時は static-fallback（fixture extractor）

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

6.17 Schedule safe-fields non-dry-run PoC implementation
完了済み。フェーズ: G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation
- `AdminStagingScheduleSafeFieldsNonDryRunPocSection` — G-6-e5 から分離した G-6-f6 専用 section
- arm gate: `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED=true`（G-6-e5 EXPLICIT_RERUN は不使用）
- approval ID: G-6-f6-schedule-safe-fields-non-dry-run-poc
- payload: venue + description 固定（assertG6F6SafeFieldsPayloadOnly）
- doc: schedule-safe-fields-non-dry-run-poc-implementation.md
- DB write / Run click / non-dry-run execution: なし

6.18 Schedule safe-fields non-dry-run final preflight
完了済み。フェーズ: G-6-f6-schedule-safe-fields-non-dry-run-final-preflight
- doc: schedule-safe-fields-non-dry-run-final-preflight.md
- beforeSnapshot SQL / dev command / UI checklist / afterVerification / rollback 再提示
- DB write / Run click / non-dry-run execution: なし

6.19 Schedule safe-fields non-dry-run execution
完了済み。フェーズ: G-6-f6-schedule-safe-fields-non-dry-run-execution
- doc: schedule-safe-fields-non-dry-run-execution-result.md
- venue + description UPDATE 成功
- rollbackNeeded: false

6.20 Schedule write hardening and updated_at planning
完了済み。フェーズ: G-6-f7-schedule-write-hardening-and-updated-at-planning
- doc: schedule-write-hardening-and-updated-at-planning.md
- updated_at 推奨: staging 先行 DB trigger (Option A)

6.21 Schedule updated_at staging migration preflight
完了済み。フェーズ: G-6-f8-schedule-updated-at-staging-migration-preflight
- doc: schedule-updated-at-staging-migration-preflight.md

6.22 Schedule updated_at staging migration execution
完了済み。フェーズ: G-6-f8-schedule-updated-at-staging-migration-execution
- doc: schedule-updated-at-staging-migration-execution-result.md
- script: scripts/supabase/schedules-updated-at-trigger.sql
- trigger active on staging schedules
- updated_at 検証: 2026-06-05 → 2026-06-14（no-op UPDATE）
- operator 手動 SQL; Cursor SQL 実行なし
- rollbackNeeded: false

6.23 Schedule optimistic lock enablement planning
完了済み。フェーズ: G-6-f9-schedule-optimistic-lock-enablement-planning
- doc: schedule-optimistic-lock-enablement-planning.md

6.24 Schedule optimistic lock enablement implementation
完了済み。フェーズ: G-6-f10-schedule-optimistic-lock-enablement-implementation
- doc: schedule-optimistic-lock-enablement-implementation.md
- optimisticLockWiredInProductPath: true
- nonDryRunSaveUiExposed: false

6.25 Schedule general edit UI planning
完了済み。フェーズ: G-6-g-schedule-general-edit-ui-planning
- doc: schedule-general-edit-ui-planning.md
- 新 section 案: AdminStagingScheduleGeneralEditSection（#schedule、ScheduleAdminUi 直下）
- G-6-g1 第一 slice: title / approval G-6-g1-schedule-title-non-dry-run-slice
- dry-run preview 必須 → Save; stale 時 non-dry-run 無効
- PoC (G-6-e5/f6): 凍結維持
- readyForScheduleGeneralEditUiImplementation: true
- DB write / Save / Run click: なし

6.26 Schedule title non-dry-run slice preflight
完了済み。フェーズ: G-6-g1-schedule-title-non-dry-run-slice-preflight
- doc: schedule-title-non-dry-run-slice-preflight.md
- target row: aa440e29-5be8-402e-9190-0d81c48434c0（title: <>、G-6-f6 venue/description 保持）
- payload: title のみ `[CMS Kit staging] G-6-g1 title PoC`
- approval ID: G-6-g1-schedule-title-non-dry-run-slice（実装時に types/guards へ登録）
- env arm: PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
- guard 方針: assertG6G1TitlePayloadOnly（新規、G-6-f6 パターン踏襲）
- rollback SQL: title を `<>` に戻す（staging only、未実行）
- readyForG6G1ScheduleTitleNonDryRunSliceImplementation: true
- DB write / Save / Run click: なし

6.27 Schedule title non-dry-run slice implementation
完了済み。フェーズ: G-6-g1-schedule-title-non-dry-run-slice-implementation
- doc: schedule-title-non-dry-run-slice-implementation.md
- section: AdminStagingScheduleGeneralEditSection（#schedule、ScheduleAdminUi 直下）
- approval ID: G-6-g1-schedule-title-non-dry-run-slice（SCHEDULE_WRITE_APPROVAL_IDS 登録済み）
- guard: assertG6G1TitlePayloadOnly
- env arm: PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED
- save path: executeG6G1TitleNonDryRunSave → executeScheduleGeneralUpdateWrite
- nonDryRunSaveUiExposed: true（gated off by default）
- readyForG6G1ScheduleTitleNonDryRunSliceFinalPreflight: true
- DB write / Save click: なし

6.28 Schedule title non-dry-run slice final preflight
完了済み。フェーズ: G-6-g1-schedule-title-non-dry-run-slice-final-preflight
- doc: schedule-title-non-dry-run-slice-final-preflight.md
- beforeSnapshot / afterVerification / rollback SQL 提示
- dev 起動コマンド（G-6-g1 arm stack）
- UI 手順（Preview → Save gates; Save は execution のみ）
- readyForG6G1ScheduleTitleNonDryRunSliceExecution: true
- DB write / Save click: なし

6.29 Schedule title non-dry-run slice execution
完了済み。フェーズ: G-6-g1-schedule-title-non-dry-run-slice-execution
- doc: schedule-title-non-dry-run-slice-execution-result.md
- commit: cce3f97
- ユーザー手動 Save 1回; Cursor Save/Run/SQL なし
- title: <> → [CMS Kit staging] G-6-g1 title PoC
- changedFields: title のみ; rowsAffected: 1
- optimistic lock: expectedBeforeUpdatedAt matched; updated_at 進行
- client fix cf24c09 で readSource supabase 確認後に実行
- rollbackNeeded: false
- scheduleTitleNonDryRunSliceExecutionSucceeded: true
- nonDryRunSaveExecuted: true
- G-6-g1 approval / env arm: 凍結（再利用禁止）

6.30 Schedule general edit next slice planning
完了済み。フェーズ: G-6-g2-schedule-general-edit-next-slice-planning
- doc: schedule-general-edit-next-slice-planning.md
- commit: b3cd295
- 推奨次 slice: G-6-g2-schedule-time-fields-non-dry-run-slice（open_time + start_time）
- DB write / Save / Run click: なし

6.31 Schedule time fields non-dry-run slice preflight
完了済み。フェーズ: G-6-g2-schedule-time-fields-non-dry-run-slice-preflight
- doc: schedule-time-fields-non-dry-run-slice-preflight.md
- commit: e5fa9ba
- DB write / Save / Run click: なし

6.32 Schedule time fields non-dry-run slice implementation
完了済み。フェーズ: G-6-g2-schedule-time-fields-non-dry-run-slice-implementation
- doc: schedule-time-fields-non-dry-run-slice-implementation.md
- commit: e461155
- DB write / Save / Preview click: なし

6.33 Schedule time fields non-dry-run slice final preflight
完了済み。フェーズ: G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight
- doc: schedule-time-fields-non-dry-run-slice-final-preflight.md
- commit: 499aa37
- DB write / Preview / Save click: なし

6.34 Schedule time fields non-dry-run slice execution
完了済み。フェーズ: G-6-g2-schedule-time-fields-non-dry-run-slice-execution
- doc: schedule-time-fields-non-dry-run-slice-execution-result.md
- commit: 1be0a27
- G-6-g3 price slice: deferred（G-7 優先）

6.35 URL → staging automation sprint planning
完了済み。フェーズ: G-7-url-to-staging-automation-sprint-planning
- doc: url-to-staging-automation-sprint-planning.md
- commit: cb5d517

6.36 Crawl static site implementation
完了済み。フェーズ: G-7a-crawl-static-site-implementation
- doc: crawl-static-site-implementation.md
- CLI: crawl-static-site.mjs; verify: verify-crawl-static-site.mjs (30 passed)
- cheerio added to tools/static-to-astro/package.json
- external crawl / gosaki-piano.com crawl: なし
- crawlStaticSiteImplementationComplete: true
- readyForG7bUrlToStagingOrchestratorImplementation: true

7. Current gates
scheduleWriteHardeningPlanningComplete: true
scheduleUpdatedAtStagingMigrationPreflightComplete: true
scheduleUpdatedAtStagingMigrationSucceeded: true
scheduleUpdatedAtTriggerActiveOnStaging: true
scheduleOptimisticLockPlanningComplete: true
scheduleOptimisticLockImplementationComplete: true
scheduleGeneralEditUiPlanningComplete: true
scheduleTitleNonDryRunSlicePreflightComplete: true
scheduleTitleNonDryRunSliceImplementationComplete: true
scheduleTitleNonDryRunSliceFinalPreflightComplete: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
scheduleGeneralEditNextSlicePlanningComplete: true
scheduleTimeFieldsNonDryRunSlicePreflightComplete: true
scheduleTimeFieldsNonDryRunSliceImplementationComplete: true
scheduleTimeFieldsNonDryRunSliceFinalPreflightComplete: true
scheduleTimeFieldsNonDryRunSliceExecutionSucceeded: true
urlToStagingAutomationSprintPlanningComplete: true
crawlStaticSiteImplementationComplete: true
readyForG7aCrawlStaticSiteImplementation: false
readyForG7bUrlToStagingOrchestratorImplementation: true
g6g3PriceSliceDeferred: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceImplementation: false
readyForG6G2ScheduleTimeFieldsNonDryRunSliceFinalPreflight: false
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: false
readyForScheduleGeneralEditUiImplementation: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: false
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: true
nonDryRunSaveExecuted: true
scheduleSafeFieldsNonDryRunExecutionSucceeded: true
hiddenPocTriggerDisarmedByDefault: true
dryRunDefaultDocumented: true
readyForScheduleUpdatedAtStagingMigrationExecution: false
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
明示的 retry / G-9g3b execution で dev server を起動する場合は inline env のみ使用する（`.env` / `.env.local` へ書き込まない）。

Routine dev safety（default）:
```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

**Note:** `tools/static-to-astro/.env.local` に `SUPABASE_SERVICE_ROLE_KEY` が local only（gitignored）で存在する場合がある。G-9g3b execution では使用禁止・参照禁止。anon key + authenticated session のみ。

10. Recommended next phase
次フェーズ推奨: **G-9g4a1c-venue-only-operational-restore-preflight**

G-9g4a1b1 Schedule venue-only manual execution: **complete**（uncommitted）。venue smoke marker remains on `eb1f1898-5107-4deb-a6d5-a792e0ec3f69`.

G-9g4a1 Save gate sync fix: **complete**（commit `78888f5`）。

Phase sequence:
```txt
G-9g4a1-venue-only-operational-expansion-implementation ← complete (49986c1)
G-9g4a1a-venue-only-operational-expansion-preflight ← complete (01e64af)
G-9g4a1b-venue-only-operational-expansion-execution-runbook ← complete (6564061)
G-9g4a1b1-venue-only-operational-expansion-manual-execution ← complete (uncommitted)
G-9g4a1c-venue-only-operational-restore-preflight ← next
```

G-9g4a1b1 gates:
```txt
stagingShellScheduleVenueOnlyOperationalExpansionManualExecutionComplete: true
readyForG9g4a1cVenueOnlyOperationalRestorePreflight: true
targetRowSelected: true
targetRowId: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
markerRemainsInStagingDb: true
currentVenue: 学芸大学 珈琲美学 [G-9g4a1 venue smoke]
restoreTargetVenue: 学芸大学 珈琲美学
afterUpdatedAt: 2026-06-19T05:12:41.853845+00:00
activeRestoreExceptionsCount: 1
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

Routine dev: dry-run on / all non-dry-run arms off. **Do not re-click G-9g3h1a smoke Save or G-9g3h1c restore Save.**

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
