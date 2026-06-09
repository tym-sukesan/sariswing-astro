# Admin CMS Template Extraction Plan

**Phase:** G-5i — extraction plan / runbook (documentation only)  
**Status:** no code extraction, no Sariswing moves, no production operations  
**Goal:** Sariswing で実証済みの Admin CMS を CMS Kit 標準テンプレートとして再利用するための設計メモ

関連:

- [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md)
- [cms-kit-onboarding-runbook.md](./cms-kit-onboarding-runbook.md)
- [admin-cms-code-inventory.md](./admin-cms-code-inventory.md) — G-5j inventory
- [admin-ui-components-registry.md](./admin-ui-components-registry.md) — **G-5k** Admin UI components registry
- [admin-ui-shell-scaffold.md](./admin-ui-shell-scaffold.md) — **G-5l** Admin UI shell scaffold
- [admin-crud-ui-scaffold.md](./admin-crud-ui-scaffold.md) — **G-5m-a** CRUD UI scaffold
- [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md) — **G-5m-b** Auth abstraction
- [admin-media-upload-abstraction.md](./admin-media-upload-abstraction.md) — **G-5n** Media upload abstraction
- [admin-publish-workflow-abstraction.md](./admin-publish-workflow-abstraction.md) — **G-5o** Publish workflow abstraction
- [sariswing-vs-cms-kit-gap-analysis.md](./sariswing-vs-cms-kit-gap-analysis.md)
- [cms-template-registry.md](./cms-template-registry.md)
- [cms-schema-adapters.md](./cms-schema-adapters.md)
- [site-generation-dry-run.md](./site-generation-dry-run.md)

---

## 1. Scope

### 対象

- Sariswing admin CMS で**実証済み**の機能棚卸し（参照・設計のみ）
- CMS Kit 標準 Admin の候補モジュール整理
- Supabase Auth / RLS / Storage / publish workflow の再利用設計
- `siteType` / `templateId` ごとの管理機能要件
- extraction roadmap（G-5i〜G-5p）

### 対象外

- 今回のコード抽出・共通化・移植
- 既存 Sariswing admin の移動・rename・大規模 refactor
- DB schema 変更・本番環境操作
- 顧客向け共有ダッシュボード実装
- 決済・サブスクリプション実装
- GitHub Actions `workflow_dispatch` の実実行
- production publish（**明示承認後のみ** — 本フェーズでは未実施）

---

## 2. Proven Sariswing admin features

Sariswing は本番運用中の参照事例。**コードは直接変更しない。**

### Auth / access control

| 機能 | 実証内容 |
| --- | --- |
| Supabase Auth | メール / パスワードログイン |
| Admin role | 管理者のみ CMS 操作 |
| `ADMIN_EMAILS` | 許可メールアドレスによる gate |
| Forgot / reset password | パスワード再設定フロー |
| Protected `/admin` | 未認証リダイレクト |
| Staging / production 分離 | 本番運用で secrets・host を分離 |

### CMS modules

| モジュール | 実証内容 |
| --- | --- |
| NEWS CRUD | 作成・編集・公開 / 非公開 |
| SCHEDULE CRUD | イベント管理・並び順・複製 |
| INSTAGRAM embed | 埋め込み / リンク管理 |
| ABOUT 管理 | プロフィール・紹介文 |
| SITEMAP / publish helper | 公開前のサイトマップ更新補助 |
| 拡張余地 | BLOG / PROFILE / LINKS への一般化可能性 |

### Data operations

- create / read / update
- publish / unpublish
- logical delete / restore
- duplicate schedule
- sort order
- `created_at` / `updated_at`
- future / past filtering（スケジュール表示制御）

### Media / Storage

- Supabase Storage upload（Admin から）
- long-side 1600px resize
- WebP / JPEG / PNG handling
- image preview
- storage public URL 生成
- image replacement
- placeholder handling

### Publish workflow

| ステップ | 実証内容 |
| --- | --- |
| Admin button | 「公開サイトを更新」 |
| Supabase Edge Function | publish トリガー |
| GitHub Actions | `workflow_dispatch` |
| Build + FTP | ロリポップへ deploy |
| Status polling | 進行状況表示 |
| Manual fallback | GitHub 手動 run |

### UX

- mobile-friendly admin
- 日本語ラベル（非エンジニア向け）
- confirmation prompts
- clear success / error states

**gosaki 側の現状:** Mock editor + Schedule / Discography save、Storage は G-4 バッチ移行パイプライン。Sariswing の「公開ボタン」UX は未接続。

---

## 3. CMS Kit standard admin modules

CMS Kit 標準として切り出す候補モジュール。

| Module | Purpose | Required | siteTypes | Supabase tables (例) | Storage asset types | Human review | Production risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Auth** | ログイン・権限 | **required** | all | auth.users, admin allowlist | — | — | 中（RLS ミス） |
| **Dashboard** | 概要・クイックリンク | optional | all | — | — | — | 低 |
| **Publish Site** | build + deploy トリガー | optional→required | all | publish_log (将来) | — | **要**（本番） | **高** |
| **Media Library** | 画像一覧・アップロード | optional | all | — | all mapped types | 要 | 中 |
| **News** | お知らせ CRUD | optional | musician, school, business | `news` | — | 低 | 中 |
| **Schedule / Events** | 公演・レッスン・イベント | **required** (musician) | musician, schools | `schedules`, `schedule` | schedule_home, schedule_flyer | **高** | 中 |
| **Profile / About** | プロフィール・紹介 | **required** | all | `profile` | venue_image (school) | 中 | 低 |
| **Links** | 外部リンク | optional | musician | `links` | — | 低 | 低 |
| **Gallery** | ギャラリー | optional | schools | `gallery` | gallery_image | 高 | 中 |
| **Discography** | 作品一覧 | optional | musician | `discography`, `discography_tracks` | discography_cover | 低 | 低 |
| **SEO Settings** | title / og / canonical | optional | all | site_settings (将来) | og_image | 低 | 中 |
| **Contact Settings** | 問い合わせブロック | optional | all | `contact_blocks` | — | 低 | 低 |
| **Site Settings** | staging / production URL | optional | all | — | — | — | 高 |

---

## 4. Template-specific admin needs

[template registry](../config/templates/cms-template-registry.json) + [schema adapters](../config/schema-adapters/cms-schema-adapters.json) に基づく。

### musician-basic

| Admin 候補 | schema / storage | Sariswing 対応 | gosaki 対応 |
| --- | --- | --- | --- |
| Profile / About | `profile` | ABOUT | 静的 + 将来 CMS |
| Schedule / Live | `schedules`, `schedule_months` | SCHEDULE CRUD | Admin save + G-4 Storage |
| Discography | `discography`, `discography_tracks` | — | Admin save + cover migration |
| Links | `links` | — | 静的 |
| News | `news` | NEWS CRUD | cms-ready（未実装） |
| Media | storageMappings | Storage upload | G-4 batch + review |
| Publish | workflow | 公開ボタン proven | staging FTP template only |

**Human review 重点:** `schedule_home`, `schedule_flyer`

### music-school

| Admin 候補 | schema |
| --- | --- |
| Courses / Lessons | `courses` + `lesson_image` |
| Instructors | `instructors` + `instructor_photo` |
| Pricing | `pricing` |
| Schedule | `schedule` |
| FAQ | `faq` |
| Access / Contact | `contact_blocks` |
| News | `news` |

**Status:** template / adapter は **draft**。Admin は G-5o 以降の prototype 対象。

### dance-school

| Admin 候補 | schema |
| --- | --- |
| Classes | `classes` + `class_image` |
| Instructors | `instructors` |
| Pricing | `pricing` |
| Events | `events` + `event_flyer` |
| Schedule | `schedule` |
| FAQ / News | `faq`, `news` |
| Trial lesson CTA | 静的 or `contact_blocks` 拡張 |

**Sariswing 参照:** SCHEDULE + NEWS + Instagram パターン。

### small-business

| Admin 候補 | schema |
| --- | --- |
| Services | `services` + `service_image` |
| Works | `works` + `work_thumbnail` |
| Staff | `staff` + `staff_photo` |
| Company profile | `company_profile` + `og_image` |
| News / FAQ / Contact | `news`, `faq`, `contact_blocks` |
| SEO / OGP | `company_profile`, SEO module |

---

## 5. Admin architecture proposal

**設計案のみ — 今回実装しない。**

```txt
src/pages/admin/
  index.astro          # Dashboard
  login.astro
  news/
  schedules/
  discography/
  media/
  profile/
  links/
  settings/
  publish.astro        # Publish Site (gated)

src/components/admin/
  AdminLayout.astro
  AdminNav.astro       # driven by templateId modules
  DataTable.astro
  EditForm.astro
  ImageUploader.astro
  PublishButton.astro
  HumanReviewBanner.astro

src/lib/admin/
  auth.ts
  supabase.ts          # anon client + RLS
  permissions.ts       # ADMIN_EMAILS / roles
  publish.ts           # Edge Function client
  storage.ts           # upload + resize
  validation.ts
  module-registry.ts   # templateId → enabled modules
```

`planned-files.json`（G-5g）の admin エントリは `future-planned` — 本 architecture はその実装設計先。

---

## 6. Supabase schema / RLS considerations

| 論点 | 選択肢 | 現時点の推奨 |
| --- | --- | --- |
| Tenancy | client ごと project vs shared + `tenant_id` | **client ごと Supabase project**（初期商品化は安全） |
| Multi-tenant | 1 project 複数サイト | **後回し**（RLS 複雑化） |
| Admin users | `ADMIN_EMAILS` vs `admin_users` テーブル | 小規模は `ADMIN_EMAILS`、拡張時に roles テーブル |
| RLS | public read / authenticated write | **Admin UI は anon key + RLS 基本** |
| Storage policy | authenticated upload / public read | assetType ごと path prefix（schema adapter） |
| Service role | server / CI / Edge Function のみ | **Admin UI からは使わない** |
| Edge Function | publish trigger | Sariswing パターンを staging で先に複製 |
| Backup | point-in-time / export JSON | 案件ごとに onboarding runbook §11 と連携 |

---

## 7. Publish workflow extraction

Sariswing「公開サイトを更新」→ CMS Kit 標準への抽出方針。

```txt
Admin PublishButton
  → Supabase Edge Function (publish-site)
    → GitHub Actions workflow_dispatch
      → npm run build (public-dist)
        → FTP deploy (staging or production)
          → status callback / polling
```

| 項目 | 方針 |
| --- | --- |
| Admin button | 顧客向けラベル（「サイトを更新」） |
| Staging / production | **別 workflow / 別 secrets**。production は `deploy.production.enabled` + 明示承認 |
| Status polling | job id を Admin に表示 |
| Failure handling | エラーメッセージ + manual GitHub run 手順 |
| Manual fallback | onboarding runbook に記載 |
| 今回 | **実 dispatch しない** |

gosaki: `deploy-public-dist-ftp.mjs` + staging verifier が deploy 側の土台。Sariswing の GHA 連携は **G-5n** で抽象化。

---

## 8. Media library extraction

| 項目 | 方針 |
| --- | --- |
| Upload target | `schemaAdapter.storageMappings` の `targetTable` / `targetColumn` |
| Path pattern | `{siteSlug}/...` from adapter |
| Resize | long-side 1600px（Sariswing 実績） |
| File types | WebP / JPEG / PNG validation |
| Preview | Admin 内 thumbnail |
| Replace / remove | 既存 URL 上書きは human review gate 通過後 |
| Alt text | SEO module 連携（将来） |
| Rights confirmation | `humanReviewRules` + owner flag before production |
| Staging-only state | `stagingReady` vs `productionReady`（将来フィールド） |
| Human review | G-4 バッチ移行と Admin upload の境界を文書化 |

**gosaki 実績:** バッチ移行（`review-storage-assets` → upload → DB update）と Admin 直 upload は**別フェーズ**で統合設計。

---

## 9. Configuration-driven Admin

site config + template registry + schema adapter による Admin 切り替え（**将来実装**）。

| 設定源 | Admin への効果 |
| --- | --- |
| `templateId` | 表示モジュール（News / Schedule / Discography 等） |
| `schemaAdapterId` | 編集対象 table / column / legacy_id 規則 |
| `storageMappings` | 画像アップロード先・pathPattern |
| `humanReviewRules` | 警告バナー・承認フロー・defer 理由 |
| `site config` deploy / seo | staging URL、noindex、production gate |
| `site config` cms.stagingHost | Supabase 接続先（staging only） |

**Read-only 検証（現時点）:**

```bash
node tools/static-to-astro/scripts/inspect-cms-template.mjs --site-config ...
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs --site-config ...
node tools/static-to-astro/scripts/generate-site-dry-run.mjs --site-config ...
```

`human-review-tasks.json`（G-5g package）が Admin UX の gate 設計入力になる。

---

## 10. Extraction roadmap

| Phase | 内容 | Write 操作 |
| --- | --- | --- |
| **G-5i** | Admin CMS extraction plan / runbook（**本書・完了**） | なし |
| **G-5j** | Sariswing admin **code inventory**（read-only 棚卸し） | なし |
| **G-5k** | Admin UI components **registry / plan**（**完了**） | doc + registry JSON のみ |
| **G-5l** | Low-risk UI shell components scaffold（**完了**） | CMS Kit `templates/admin-cms/components/` のみ |
| **G-5m-a** | CRUD primitives + module UI scaffold（**完了**） | `components/` + `modules/` のみ |
| **G-5m-b** | Auth abstraction scaffold（**完了**） | `components/` + `auth/` のみ |
| **G-5n** | Media upload abstraction scaffold（**完了**） | `components/` + `media/` のみ |
| **G-5o** | Publish workflow abstraction scaffold（**完了**） | `components/` + `publish/` のみ |
| **G-5p** | musician-basic admin prototype（**完了**） | `prototypes/` + `DiscographyAdminUi` |
| **G-5q** | Customer admin manual（**完了**） | doc |
| **G-5r** | Prototype preview harness（**完了**） | `preview/` + inspect CLI |

**Admin CMS は G-5i 時点では未実装・未抽出。** production publish は各フェーズで **explicit approval** 必須。

**並行トラック（商品化）:** customer-facing onboarding checklist、pricing model、production migration runbook、first external pilot — [onboarding runbook](./cms-kit-onboarding-runbook.md) 参照。

---

## 11. Risks and mitigations

| リスク | 緩和策 |
| --- | --- |
| 既存 Sariswing admin を壊す | 移動・rename 禁止。独立 branch + inventory から開始 |
| 汎用化で複雑化 | template ごと module registry。共通は Auth / Media / Publish のみ |
| RLS 設計ミス | client ごと project。staging で policy テスト + verifier |
| Storage 誤更新 | schema adapter pathPattern + allowlist。service role は UI から隔離 |
| production publish 誤実行 | 別 workflow、`production.enabled` gate、二重確認 UI |
| 顧客の操作ミス | 確認ダイアログ + undo（logical delete）+ マニュアル（G-5p） |
| 画像権利確認漏れ | humanReviewRules + production gate + onboarding §9 |
| GitHub Actions / FTP failure | polling + manual fallback + rollback runbook |
| サイトごとの例外増加 | template registry / schema adapter で宣言。コード分岐を最小化 |

---

## 12. Immediate next step — G-5o / G-5p

**G-5n（完了）:** [admin-media-upload-abstraction.md](./admin-media-upload-abstraction.md) — Media upload UI + storageMappings policy。

**G-5o（完了）:** [admin-publish-workflow-abstraction.md](./admin-publish-workflow-abstraction.md) — Publish workflow UI + staging/production separation。GitHub / Edge / FTP 未接続。

**G-5p（完了）:** [musician-basic-admin-prototype.md](./musician-basic-admin-prototype.md) — musician-basic admin prototype。G-5l〜G-5o scaffold 統合。Runtime / Auth / DB / Storage / Publish 未接続。

**G-5q（完了）:** [customer-admin-manual-musician-basic.md](./customer-admin-manual-musician-basic.md) — 顧客向け Admin Manual + [Quick Checklist](./customer-admin-quick-checklist-musician-basic.md)

**G-5r（完了）:** [admin-prototype-preview-harness.md](./admin-prototype-preview-harness.md) — preview manifest + safety checklist。`musician-basic-admin-prototype` 登録済み。`customerDemoReady: false`。

**G-5s（次）:** site-config driven admin scaffold generator

**禁止（継続）:** Sariswing 本番 touch、DB update、Storage upload、FTP、GHA dispatch

---

*G-5l: shell. G-5m: CRUD/Auth. G-5n: Media. G-5o: Publish. G-5p: prototype. G-5q: manual. G-5r: preview harness. G-5s: generator.*
