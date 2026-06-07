# Phase 3-R: 商品化・本番化前レビュー

**作成日:** 2026-06-05  
**対象:** `tools/static-to-astro/`（gosaki fixture / staging Supabase 検証済み）  
**前提:** Phase 3-Q まで CMS 最小ループ PASS。本番 Sariswing / 本番 Supabase / 本番 Storage には未接続。

---

## 1. 目的

ここまで構築した **静的 HTML → Astro → CMS 化 → Supabase → Admin UI → export/build** の最小 CMS ループを棚卸しし、商品化・本番化に進む前に以下を整理する。

- 何が **汎用ツール** として完成しているか
- 何が **`output/generated-astro` に直接実装** されており、generator 統合が必要か
- **ホスティング / SSR / adapter** の制約
- **Supabase / Storage / deploy** の未決事項
- **次フェーズの優先順位**

関連ドキュメント:

| ドキュメント | 内容 |
| --- | --- |
| [cms-kit-architecture.md](./cms-kit-architecture.md) | CMS Kit 分離・モジュール構成案 |
| [generated-astro-integration-plan.md](./generated-astro-integration-plan.md) | generator テンプレート化の具体計画 |
| [design.md](./design.md) | Phase 1 パイプライン設計 |
| [phase3-m-auth-rls.md](./phase3-m-auth-rls.md) | Auth / RLS draft 方針 |

---

## 2. リポジトリ構成スキャン（2026-06-05）

### 2.1 scripts（`tools/static-to-astro/scripts/`）

**CLI（22本）+ lib（28本）= 計 50 ファイル**

| カテゴリ | 代表スクリプト |
| --- | --- |
| 静的解析・変換 | `analyze-static-site.mjs`, `convert-static-to-astro.mjs`, `analyze-cms-candidates.mjs` |
| SEO / visual | `analyze-visual-diff.mjs`, `visual-diff.mjs`, `lib/seo-publish.mjs` |
| Seed 抽出 | `extract-schedule-seed.mjs`, `extract-discography-seed.mjs`, `generate-supabase-seed.mjs` |
| Supabase 投入 | `insert-supabase-seed.mjs`, `generate-rls-draft.mjs`, `bootstrap-admin-user.mjs` |
| Export | `export-supabase-json.mjs`, `sync-home-schedule.mjs` |
| Storage 準備 | `prepare-storage-assets.mjs`, `plan-storage-upload.mjs`, `rewrite-seed-image-urls.mjs` |
| 検証 | `verify-anon-rls.mjs`, `verify-admin-*`, `verify-cms-minimal-loop.mjs` |

### 2.2 docs（既存 + 本フェーズ追加）

```text
docs/design.md
docs/phase3-m-auth-rls.md
docs/phase3-r-productization-review.md   ← 本書
docs/cms-kit-architecture.md
docs/generated-astro-integration-plan.md
```

### 2.3 `output/generated-astro/src/`（38 ファイル）

```text
components/          Header, Footer, ScheduleList, HomeSchedule, DiscographyList
components/admin/    AdminLayout, ScheduleEditorMock, DiscographyEditorMock
data/                schedules.json, schedule-months.json, discography.json（export 生成物）
layouts/             BaseLayout.astro
lib/                 admin-auth.ts, admin-*-update.ts, home-featured-limit.ts, supabase-admin-read.ts
pages/               公開ページ + admin/* + api/admin/*
styles/              global.css, admin.css
```

**注意:** `output/` は `.gitignore` 対象。上記は検証用生成物であり、**generator から再生成できない Admin/API 実装が混在**している。

---

## A. 現在できていること

| 領域 | 状態 | 根拠 |
| --- | --- | --- |
| **静的 HTML 解析** | ✅ | `analyze-static-site.mjs`, `static-site-analyzer.mjs` |
| **Astro 生成** | ✅ | `convert-static-to-astro.mjs`, `astro-generator.mjs`（公開ページ・レイアウト・CSS/JS コピー） |
| **SEO / OGP / sitemap / robots** | ✅ | `--base-url` 時 `seo-publish.mjs`, `@astrojs/sitemap`, `robots.txt` |
| **visual diff** | ✅ | Playwright `visual-diff.mjs`, Phase 2-I/J intentional diff |
| **CMS 候補検出** | ✅ | `analyze-cms-candidates.mjs` |
| **Schedule seed 化** | ✅ | `extract-schedule-seed.mjs`, gosaki 60 件 |
| **Discography seed 化** | ✅ | `extract-discography-seed.mjs`, 4 本体 + 16 tracks |
| **Supabase schema / seed 生成** | ✅ | `generate-supabase-seed.mjs`, `schema-draft.sql` |
| **Storage asset plan** | ✅（dry-run） | `prepare-storage-assets.mjs`, `plan-storage-upload.mjs` |
| **staging Supabase insert** | ✅ | `insert-supabase-seed.mjs`（staging のみ） |
| **Supabase → JSON export** | ✅ | `export-supabase-json.mjs` → `src/data/*.json` |
| **Admin read** | ✅ | `supabase-admin-read.ts`, `/admin/*` read-only → Supabase read |
| **Auth / RLS** | ✅（staging 手動適用） | `rls-draft.sql`, `is_admin()`, `admin_users` |
| **anon 公開 read** | ✅ | `verify-anon-rls.mjs` PASS |
| **admin user bootstrap** | ✅ | `bootstrap-admin-user.mjs` |
| **Admin API auth** | ✅ | `/api/admin/me.json`, `requireAdminAuth` |
| **Schedule save** | ✅ | API + UI save, 9 フィールド, home featured limit |
| **Discography save** | ✅ | 本体 11 フィールド |
| **Tracks save** | ✅ | 既存行 `title` / `sort_order` のみ |
| **CMS minimal loop** | ✅ | Phase 3-Q PASS（export → build → HTML → cleanup → restore） |
| **key leak scan** | ✅ | 各 verifier + Phase 3-Q `dist/` scan |

**未実装（本番化ブロッカー候補）:**

- Storage 実アップロード
- deploy 自動化（GitHub Actions / FTP upload）
- News / 汎用ページ CMS
- track 追加・削除
- 本番 Supabase / 本番ドメイン反映
- generator からの Admin/API 再生成

---

## B. `output/generated-astro` に直接実装されているもの

| ファイル / 領域 | 現状 | generator 生成 | サイトテンプレート | 商品共通 CMS Kit |
| --- | --- | --- | --- | --- |
| **Admin pages** (`pages/admin/*`) | generated-astro 直書き | 将来 ○ | ○（musician 型） | レイアウト骨格のみ Kit |
| **Admin components** (`components/admin/*`) | 直書き | 将来 ○ | ○（Schedule/Discography UI） | 共通フォーム部品は Kit |
| **Admin CSS** (`styles/admin.css`) | 直書き | 将来 ○ | △ テーマ差分 | ベーススタイル Kit |
| **API routes** (`pages/api/admin/**`) | 直書き + `prerender = false` | 将来 ○ | △ ルート名は共通可 | ○ 認証・レスポンス枠 |
| **admin-auth.ts** | 直書き | **必須 ○** | — | **○ CMS Kit コア** |
| **admin-schedule-update.ts** | 直書き | 将来 ○ | ○ event/schedule module | △ フィールド定義は module |
| **admin-discography-update.ts** | 直書き | 将来 ○ | ○ musician module | △ 同上 |
| **admin-discography-tracks-update.ts** | 直書き | 将来 ○ | ○ musician module | △ 同上 |
| **home-featured-limit.ts** | 直書き（limit=3） | 将来 ○ | ○ site profile 設定 | ○ featured module |
| **supabase-admin-read.ts** | 直書き | 将来 ○ | ○ table select 定義 | △ read ヘルパー Kit |
| **astro.config `@astrojs/node`** | 直書き（Phase 2-F + 3-P-A） | **必須 ○**（CMS 同梱時） | プロファイルで on/off | adapter 方針 Kit |
| **package.json `@astrojs/node`** | 直書き | **必須 ○** | 同上 | 同上 |
| **公開 components** (ScheduleList 等) | 一部 generator、一部 Phase 3 手追加 | ○ | ○ gosaki レイアウト | △ data-driven 部品 Kit |
| **src/data/*.json** | export CLI 生成 | —（export はツール） | — | — |

**要点:** 公開サイトの HTML→Astro 変換は generator 側。CMS/Admin/API は **Phase 3-H 以降 generated-astro に手で積み上げ** ており、**再生成すると消える** 状態。

---

## C. 汎用ツール側に統合すべきもの

分類: **必ず汎用化** / **サイト種別テンプレート** / **gosaki 固有 fixture** / **後回し**

| 項目 | 分類 | 理由 |
| --- | --- | --- |
| Admin API auth (`admin-auth.ts`, `/api/admin/me.json`) | **必ず汎用化** | 全サイト共通の認証ゲート |
| `requireAdminAuth` + service role write パターン | **必ず汎用化** | update API の共通骨格 |
| Supabase → JSON export CLI | **必ず汎用化** | 静的公開の中核ワークフロー |
| RLS draft 生成 / anon 検証 CLI | **必ず汎用化** | staging セットアップ標準手順 |
| admin user bootstrap CLI | **必ず汎用化** | 初回セットアップ |
| CMS minimal loop verifier | **必ず汎用化** | 回帰テストの標準 |
| Schedule CMS（tables + UI + API） | **サイト種別テンプレート**（event/schedule module） | ミュージシャン・イベントサイト向け |
| Discography CMS | **サイト種別テンプレート**（musician module） | レーベル・トラック構造は業種依存 |
| Home featured limit | **必ず汎用化**（設定値は profile） | `HOME_FEATURED_LIMIT` を site profile で指定 |
| Discography tracks | **サイト種別テンプレート** | track 追加 UI は後フェーズ |
| Schedule month ページ群 | **gosaki 固有 → テンプレート化** | 月別 URL パターンは gosaki 由来 |
| HomeSchedule コンポーネント | **gosaki 固有 → テンプレート化** | 「This Week's Live Schedule」文案・DOM |
| Header / Footer / about / contact | **gosaki fixture**（他サイトは各 fixture） | 静的 HTML 由来のサイト固有 |
| visual diff intentional list | **gosaki fixture** | サイトごとに異なる |
| seed JSON 中身（60 schedules 等） | **gosaki fixture** | 実データ |
| `@astrojs/node` adapter 同梱 | **サイト種別テンプレート + profile フラグ** | 静的 FTP のみサイトでは off |
| Storage upload 実装 | **後回し** | Phase 3-U 以降 |
| Deploy / GitHub Actions | **後回し** | Phase 3-V |
| News CMS | **後回し** | 最小ループ外 |
| site profile system | **後回し（設計先行）** | Phase 3-W |

---

## D. SSR / adapter / hosting 整理

### D.1 3 つの運用モデル

| モデル | 公開サイト | Admin / API | 向くホスト | gosaki / Sariswing 整合 |
| --- | --- | --- | --- | --- |
| **A. 完全静的** | `astro build` → `dist/client/` のみ FTP | **なし**（Supabase Dashboard / 外部 CMS / CLI のみ） | ロリポップ FTP, Netlify static, CF Pages static | ◎ FTP 運用と一致 |
| **B. 単一 Astro（現状）** | 静的 prerender + dynamic API | 同一 origin の `/admin`, `/api/admin/*` | **Node SSR 必須**（Vercel serverless, Railway, Node VPS） | △ ロリポップ静的 FTP だけでは API 不可 |
| **C. 公開静的 + Admin 分離** | `dist/client/` を FTP | Admin は別サブドメイン / 別 Astro app | 公開: FTP / Admin: Vercel 等 | ◎ **推奨候補**（Sariswing 型） |

### D.2 Phase 3-P-A で判明した技術要件

- Astro API route は `export const prerender = false` が必要
- `@astrojs/node` adapter が必要（`output: 'static'` のみでは API 不可）
- `npm run build` 後: 静的ページ → `dist/client/`, サーバー → `dist/server/`
- **ロリポップ FTP に `dist/client/` だけ置いても `/api/admin/*` は動かない**

### D.3 ホスティング別メモ

| ホスト | 静的 `dist/client/` | Astro API route | 推奨 CMS 運用 |
| --- | --- | --- | --- |
| **ロリポップ FTP** | ◎ | ✗ | モデル A または C |
| **Netlify / CF Pages（static）** | ◎ | ✗（Functions 別途必要） | モデル A または C |
| **Vercel（SSR adapter）** | ○ | ○ | モデル B または C |
| **自前 Node / Docker** | ○ | ○ | モデル B |

### D.4 Sariswing 型（静的 FTP）との推奨ワークフロー

```text
[Admin 別ホスト or ローカル dev]
  Admin UI → Supabase 更新
       ↓
[開発者 / CI]
  export-supabase-json.mjs
  npm run build（adapter なし static でも可）
       ↓
[ロリポップ FTP]
  dist/client/ のみアップロード
```

**商品化時のデフォルト提案:** 公開サイトは **static output**、Admin は **オプションで CMS Kit + Node host** または **CLI + Dashboard**。

---

## E. Supabase 設計整理

### E.1 キーと用途

| キー | 用途 | 置き場所 | 公開 HTML に出してはいけない |
| --- | --- | --- | --- |
| **service role** | server-side Admin API write, export read, bootstrap, verifier | `.env.local`, CI secret, Admin ホストのみ | **必須 NG** |
| **anon / publishable** | Admin UI の browser sign-in, `getUser(token)` | `.env.local`, Admin フロント（Vite/Astro env） | client bundle 注意 |
| **admin password** | bootstrap / E2E のみ | `.env.local` | NG |

### E.2 RLS / GRANT / policy（staging 検証済み）

- **public read:** `published = true` + `GRANT SELECT TO anon, authenticated`
- **admin write（RLS 上）:** `is_admin()` → `admin_users` テーブル参照
- **service role:** RLS バイパス（export CLI, Admin API の DB write に現状使用）

### E.3 現状の Admin write 方式

**実装:** `requireAdminAuth` → Bearer token で user 検証 → **`getServiceRoleClient()` で UPDATE**

| 方式 | 概要 | メリット | デメリット |
| --- | --- | --- | --- |
| **現状: service role + requireAdminAuth** | API route が admin 判定後 service role で書込 | 実装が単純; RLS policy 未整備でも動く; フィールド allowlist を TS で厳密制御 | service role を server に載せる責任; RLS admin write policy が「本番の最終防衛線」にならない |
| **代替: authenticated + RLS write** | user JWT のまま Supabase client で UPDATE | DB が最終防衛; service role 露出面積減 | 全 write path で RLS テスト必須; クライアント直 POST 化のリスク（Admin UI から anon key 使用時） |
| **ハイブリッド（推奨検討）** | Admin UI は anon + session; **server API のみ** authenticated client または service role; 段階的に RLS write へ | 段階移行可能 | 2 系統のメンテ |

**商品化推奨（中長期）:**

1. **短期（現行維持）:** server-side API + service role + 厳格 allowlist（Phase 3-Q 実績あり）
2. **中期:** Admin API を authenticated Supabase client + RLS `is_admin()` write に移行し、service role は export/bootstrap のみ
3. **長期:** Admin を別 app に分離し、公開 repo から service role を完全排除

### E.4 export workflow

```text
Supabase (source of truth)
  → export-supabase-json.mjs (service role read-only)
  → src/data/*.json
  → astro build
  → dist/client/ (public)
```

- export は **insert/update/delete しない**（検証済み）
- 本番でも **「Supabase → build → 静的 deploy」** が Sariswing FTP と整合

---

## F. Storage 対応の前に決めること

Phase 3-P-H / 3-U 前に決定すべき項目:

| 論点 | 現状 / 候補 | 決定事項（提案） |
| --- | --- | --- |
| **bucket 命名** | `site-assets`（README / planner 既定） | `{project-ref}-assets` または `site-assets/{site-slug}/` |
| **public bucket** | planner は public URL 前提 | musician サイトは **public read** + path 規約で十分（cover/flyer） |
| **path vs URL 保存** | seed は `cover_image_url`, `home_image_url` に **full public URL** | DB は **storage path** + build/export 時 URL 合成も検討（移行コストあり） |
| **リサイズ / WebP** | 未実装 | upload pipeline で max width + WebP 派生を標準化 |
| **著作権・再ホスト** | Wix URL 検出あり、人間確認必須と明記 | **クライアント確認チェックリスト** を本番前 gate に |
| **既存 Wix URL** | staging seed に Wix URL 残存可能性 | 本番前に rewrite + upload 完了を gate |
| **Schedule flyer / home_image / discography cover** | フィールド分離済み、upload planner で `source_field` 区別 | 用途別 path: `/{site}/home/`, `/{site}/discography/`, `/{site}/flyer/` |
| **Storage RLS** | 未実装 | public read bucket + admin write policy（service role upload vs signed URL） |

---

## G. 本番化前チェックリスト

### G.1 本番 Supabase を作る前

- [ ] staging で Phase 3-Q minimal loop PASS を再確認
- [ ] `schema-draft.sql` を本番用に凍結（migration 番号・rollback 文書）
- [ ] service role / anon key の保管場所（CI, 1Password 等）を決定
- [ ] `admin_users` 運用（誰が admin か、退職時 revoke）を決定
- [ ] RLS + GRANT を本番 SQL Editor で適用し `verify-anon-rls.mjs` 相当を実行
- [ ] 本番 project ref / URL を `.env.production` テンプレート化（Git 非コミット）

### G.2 本番 Storage を作る前

- [ ] Wix / 外部 URL の著作権確認完了
- [ ] bucket 名・path 規約・public URL 形式を固定
- [ ] upload dry-run レポート確認（`plan-storage-upload.mjs`）
- [ ] seed rewrite 後の visual diff 再実行
- [ ] Storage RLS / admin upload 方式決定

### G.3 本番ドメインに反映する前

- [ ] `dist/client/` only deploy 手順確認（FTP path, キャッシュ）
- [ ] Admin/API を公開 FTP に含めていないこと確認
- [ ] key leak scan（Phase 3-Q 同様）を本番 build で実行
- [ ] sitemap / robots / OGP / canonical が `--base-url` 本番 URL
- [ ] trailing slash 設定とサーバ rewrite の整合
- [ ] rollback 手順（前 build の dist 退避）

### G.4 クライアントに渡す前

- [ ] Admin ログイン手順・パスワード初期化手順
- [ ] 「編集 → export → build → deploy が必要」の運用説明（FTP 型）
- [ ] 対応範囲外（News, track 追加, Storage 自己 upload 等）の明示
- [ ] staging / production の違い

### G.5 料金化する前

- [ ] サイト profile（musician / 他）ごとの機能差・価格表
- [ ] Supabase / hosting / 保守のランニングコスト試算
- [ ] export+deploy を代行するか CLI 自助か
- [ ] SLA（更新反映時間、バックアップ頻度）

---

## H. 次フェーズ案と優先順位

| 優先 | フェーズ | 内容 | 理由 |
| --- | --- | --- | --- |
| **1** | **Phase 3-S** | generated-astro 内 Admin/API を generator テンプレート化 | 再生成で CMS が消える最大リスクの解消 |
| **2** | **Phase 3-T** | Admin 別ホスト / static-only 公開の設計確定 | Sariswing FTP 運用との整合 |
| **3** | **Phase 3-U** | Storage upload / image pipeline | 本番画像のブロッカー |
| **4** | **Phase 3-V** | Deploy workflow / GitHub Actions | 人手 export+FTP の自動化 |
| **5** | **Phase 3-W** | site profile system | 複数業種展開の前提 |
| **6** | **Phase 3-X** | Sariswing 本体への安全移植 | 上記 S〜V 完了後 |

**Phase 3-S と 3-T は並行設計可能** だが、実装は **3-S（テンプレート化）→ 3-T（分離）** が安全。

---

## 9. 結論（Executive Summary）

1. **CMS 最小ループは staging 上で成立**（Admin → Supabase → export → build → HTML → cleanup）。
2. **generator は「静的サイト変換」まで**。**Admin/API/adapter は generated-astro 直書き**で、商品化前の最大技術的負債。
3. **Sariswing / ロリポップ FTP 型**では **公開は完全静的**、Admin は **別ホスト or CLI** が現実的。
4. **Supabase write** は現状 service role + server API が動作実績あり; 本番商品化では **RLS write への段階移行**を検討。
5. **Storage / deploy / 本番 Supabase** は未実装。本番化前チェックリスト（§G）を gate に使う。

---

*本書は Phase 3-R の棚卸しドキュメント。実装・本番接続は Phase 3-S 以降で行う。*
