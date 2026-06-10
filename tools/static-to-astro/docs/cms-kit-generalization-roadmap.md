# CMS Kit Generalization Roadmap (G-5)

**Phase:** G-5 — template / workflow generalization（設計・文書化）  
**Status:** G-5a〜**G-5u（local-only preview route）** 完了 — G-5v 以降は段階的に  
**境界:** production / Sariswing 本番非接触。G-5c も upload / DB update / FTP 未実施。

関連:

- [site-profile-system.md](./site-profile-system.md) — 既存 profile（module 切替の土台）
- [gosaki-storage-image-migration-runbook.md](./gosaki-storage-image-migration-runbook.md) — G-4 成功フロー
- [gosaki-staging-runbook.md](./gosaki-staging-runbook.md) — staging deploy
- [sariswing-vs-cms-kit-gap-analysis.md](./sariswing-vs-cms-kit-gap-analysis.md) — Sariswing 比較
- [cms-kit-architecture.md](./cms-kit-architecture.md) — 全体アーキテクチャ
- [site-config-cli-usage.md](./site-config-cli-usage.md) — **G-5c** `--site-config` 使い方
- [cms-template-registry.md](./cms-template-registry.md) — **G-5d** template registry
- [cms-schema-adapters.md](./cms-schema-adapters.md) — **G-5e** schema adapter registry
- [staging-generation-plan.md](./staging-generation-plan.md) — **G-5f** staging generation planner
- [site-generation-dry-run.md](./site-generation-dry-run.md) — **G-5g** dry-run generation package
- [cms-kit-onboarding-runbook.md](./cms-kit-onboarding-runbook.md) — **G-5h** customer onboarding runbook
- [admin-cms-template-extraction-plan.md](./admin-cms-template-extraction-plan.md) — **G-5i** Admin CMS extraction plan
- [admin-cms-code-inventory.md](./admin-cms-code-inventory.md) — **G-5j** Sariswing admin code inventory
- [admin-ui-components-registry.md](./admin-ui-components-registry.md) — **G-5k** Admin UI components registry
- [admin-ui-shell-scaffold.md](./admin-ui-shell-scaffold.md) — **G-5l** Admin UI shell scaffold
- [admin-crud-ui-scaffold.md](./admin-crud-ui-scaffold.md) — **G-5m-a** Admin CRUD UI scaffold
- [admin-publish-workflow-abstraction.md](./admin-publish-workflow-abstraction.md) — **G-5o** Admin Publish workflow abstraction

---

## 1. Purpose

gosaki / Sariswing で実証した **静的 HTML → Astro + Supabase CMS + Storage + staging deploy** の成功パターンを、別サイト（ミュージシャン / 教室 / 小規模事業者）でも再利用できる **CMS Kit template / generation workflow** として一般化する。

G-5 のスコープ（今回）:

- 現状の `tools/static-to-astro` を棚卸しし、汎用 vs サイト固有を分類
- **site config** / **schema adapter** / **template registry** の設計案を固定
- CLI 一般化方針と G-5a〜h の実装フェーズを定義
- 既存 G-4 フロー・gosaki CLI の**後方互換を維持**（破壊的 rename しない）

---

## 2. What has been proven

### gosaki（CMS Kit prototype）

| 領域 | 実証内容 |
| --- | --- |
| 静的 HTML 変換 | `convert-static-to-astro.mjs` — fixture → Astro + optional Admin CMS |
| Seed 抽出 | schedule / discography extractors → Supabase seed JSON |
| Supabase 運用 | seed insert / export JSON / Admin save / minimal loop verifier |
| SEO / staging | `deployBase`, noindex, robots Disallow, canonical / og:url |
| public-dist | Admin/API 除外 artifact + `verify-static-public-artifact.mjs` |
| Staging FTP | `deploy-public-dist-ftp.mjs` — mirror deploy, safety verifiers |
| Storage 画像 | G-4a〜g — review → allowlist → upload → DB update（分離） |
| Human review | schedule 画像の alt-date-conflict / home vs flyer 分離 |
| Site profile | `musician` / `dance-school` / `generic` JSON + loader（Phase 3-W） |

### Sariswing（本番参照事例・直接変更しない）

| 領域 | 実証内容 |
| --- | --- |
| NEWS / SCHEDULE / Instagram / ABOUT | 本番 CRUD + 運用 UX |
| Supabase Auth | 本番ログイン・RLS |
| 画像アップロード | Admin から Storage 連携 |
| GitHub Actions | workflow_dispatch → build → ロリポップ FTP |
| 本人運用 | 非エンジニアに近い更新フロー |

**要点:** gosaki は**再現性・自動化・verifier**、Sariswing は**本番 UX・運用実績**。CMS Kit 商品化は gosaki パイプラインを汎用化し、Sariswing から UX パターンを借りる。

---

## 3. What is still site-specific

### gosaki 固有（G-5 で config / adapter に移す候補）

| 種別 | 例 |
| --- | --- |
| 識別子 | `siteSlug: gosaki`, fixture `gosaki-static-site` |
| Deploy | `deployBase: /cms-kit-staging/gosaki/`, staging public URL |
| Supabase | staging host `kmjqppxjdnwwrtaeqjta.supabase.co`（executor 内定数） |
| Schema / legacy_id | `discography-001`〜`004`, `schedule-2026-03-012`, Golden PODs |
| 安全ゲート | `schedule-2026-03-012` のみ upload 許可、`discography` 4件のみ DB batch |
| CLI フラグ | `--apply-gosaki-g4e`（promote 専用） |
| Verifier | `verify-gosaki-readiness.mjs`, `gosaki-readiness-verifier.mjs` |
| レポートパス | `output/storage/gosaki/`, `output/deploy/gosaki/` 等（手動指定） |
| 設定 | `config/intentional-diffs.gosaki.json` |
| ドキュメント | `gosaki-*.md` runbook 群（内容はテンプレ化可能） |

### Sariswing 固有

| 種別 | 例 |
| --- | --- |
| コードベース | リポジトリ root `src/` — CMS Kit から直接変更しない |
| コンテンツ model | NEWS / Instagram — musician profile とは別 |
| Deploy | 本番 GitHub Actions + ロリポップ FTP |
| 運用 | 「公開サイトを更新」ボタン、sitemap 手動更新 |

### 既に汎用化の土台があるもの

- `--site-slug`（多数の Storage / deploy CLI）
- `--site-profile`（convert / report）
- `config/site-profiles/*.json`（module / storage fields / admin pages）
- `templates/admin-cms/`（generator からコピー）
- `templates/github-actions/`（FTP deploy workflow 雛形）

---

## 4. Inventory classification (G-5a)

### A. 汎用化できるもの

| カテゴリ | モジュール / CLI |
| --- | --- |
| HTML 解析・変換 | `convert-static-to-astro.mjs`, `analyze-cms-candidates.mjs`, `lib/astro-generator.mjs`, `lib/header-transform.mjs` |
| Seed 抽出（profile 駆動化余地） | `extract-schedule-seed.mjs`, `extract-discography-seed.mjs`, `generate-supabase-seed.mjs` |
| Supabase I/O | `export-supabase-json.mjs`, `insert-supabase-seed.mjs`, `lib/supabase-json-exporter.mjs` |
| Storage パイプライン | `review-storage-assets.mjs`, `prepare-storage-upload-allowlist.mjs`, `upload-storage-assets.mjs`, `apply-storage-db-updates.mjs`, `review-schedule-storage-assets.mjs`, `promote-schedule-storage-allowlist.mjs` |
| Deploy / artifact | `verify-static-public-artifact.mjs`, `deploy-public-dist-ftp.mjs`, `lib/deploy-base.mjs`, `lib/seo-publish.mjs` |
| Staging 安全 | `verify-staging-ftp-safety.mjs`, `verify-staging-ftp-deploy-plan.mjs` |
| Admin / Auth 検証 | `verify-admin-api-auth.mjs`, `verify-cms-minimal-loop.mjs`, `bootstrap-admin-user.mjs` |
| Visual QA | `visual-diff.mjs`, `analyze-visual-diff.mjs` |
| Profile | `site-profile-loader.mjs`, `verify-site-profiles.mjs` |

### B. gosaki 固有（config 化・adapter 化が必要）

- Staging Supabase host / allowed legacy_id リスト（storage executors）
- `--apply-gosaki-g4e` と Golden PODs promote ロジック
- `STAGING_DEPLOY_BASE` in `gosaki-readiness-verifier.mjs`
- README / runbook 内の gosaki URL・パス例
- `discography` + `schedules` テーブル前提の seed / export / Admin UI

### C. Sariswing 由来・再利用候補

| パターン | CMS Kit への取り込み方針 |
| --- | --- |
| NEWS CRUD | `dance-school` / `generic` profile の `news` module として schema adapter 追加 |
| Instagram / 外部 embed | 将来 `externalLinks` / `socialFeed` module — Sariswing から UI パターン参照のみ |
| Admin 公開ボタン | onboarding runbook + Admin template に「export トリガー」UX を設計 |
| GitHub Actions deploy | 既存 `templates/github-actions/public-dist-ftp-deploy.yml` を site-config 変数化 |
| 画像 resize / upload | Admin 側実装は Sariswing 参照；バッチ移行は G-4 パイプラインを再利用 |
| Auth / RLS | `generate-rls-draft.mjs` + verifier 群を profile 単位で再利用 |

### D. 商品化にまだ足りないもの

| ギャップ | 備考 |
| --- | --- |
| **Site config（単一入口）** | profile は module 宣言のみ。slug / FTP / Supabase / output paths は未統合 |
| **Schema adapter** | siteType ごとのテーブル・フィールド・legacy_id 規則の抽象化 |
| **Template registry** | `musician-basic` 等のテンプレ選択と generator 連携 |
| **CMS Admin template 分岐** | dance-school / generic の Admin ページは JSON のみで未実装 |
| **Onboarding / wizard** | 顧客向けセットアップ UI なし（CLI + doc のみ） |
| **Tenant separation** | 1 Supabase project 複数サイト vs 顧客ごと project — 未決定 |
| **Payment / subscription** | Stripe 等なし |
| **Rights confirmation flow** | `copyrightStatus` はラベルのみ。production gate 未実装 |
| **Production deploy gate** | staging は実績あり。本番 FTP / 本番 Supabase apply は明示承認ゲートのみ設計 |

---

## 5. Target product concept

**Wix / Studio / Jimdo 等からの乗り換え**を想定した、低コスト・高速・CMS 付きサイト生成キット。

| 価値 | 内容 |
| --- | --- |
| 移行 | 既存静的 HTML / Wix export を crawl → Astro 化 |
| CMS | Supabase バックエンド + 軽量 Admin（profile 別 module） |
| メディア | Storage バッチ移行 + human review（著作権・日付不一致） |
| 安全な staging | noindex / robots / public-dist 分離 / verifier 群 |
| 段階的本番化 | staging で QA → owner / rights 確認後に production gate |

**今回やらないこと:** 本番 SaaS 課金、マルチテナントダッシュボード、顧客 self-service の全面実装。

---

## 6. Proposed architecture

```txt
                    ┌─────────────────────┐
                    │   site.config.json   │  ← G-5b: slug, source, deploy, seo
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ site profile     │  │ schema adapter   │  │ template registry│
│ (modules/admin)  │  │ (tables/fields)  │  │ (Astro+Admin)    │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
              ┌───────────────────────────────┐
              │  tools/static-to-astro/scripts │
              │  convert | seed | export |     │
              │  storage | verify | deploy     │
              └───────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   fixtures/            output/ (gitignored)   templates/
   per-site HTML        generated-astro         admin-cms, GHA
```

レイヤー:

1. **Site config** — 案件単位の単一 JSON（slug, paths, env prefix, staging host）
2. **Site profile** — vertical 単位の module 宣言（既存 `config/site-profiles/`）
3. **Schema adapter** — profile → Supabase tables / Storage fields / legacy_id 規則
4. **Templates** — Astro レイアウト + Admin CMS コピー元
5. **Migration scripts** — 既存 CLI（段階的に `--site-config` 対応）
6. **Runbooks** — staging-first、G-4 画像、G-3 deploy

---

## 7. Suggested repo structure（段階的・破壊的変更なし）

**方針:** いきなり `cms-kit/` ルートを切らない。`tools/static-to-astro/` を拡張する。

```txt
tools/static-to-astro/
  config/
    site-profiles/          # 既存 — vertical module 宣言
    sites/                  # G-5b 追加 — 案件別 site.config 例
      gosaki.site-config.example.json
    schemas/                # G-5b 以降 — site-config JSON schema（draft）
  fixtures/
    {siteSlug}-static-site/ # サイトごと（gitignore 可）
  templates/
    admin-cms/              # 既存
    github-actions/         # 既存
    musician-basic/         # G-5d 以降 — フロントテンプレ分割候補
  scripts/                  # 既存 CLI（後方互換維持）
  docs/
    cms-kit-generalization-roadmap.md   # 本書
    gosaki-*.md                         # 参照実装 runbook
    onboarding-runbook.md               # G-5h 候補
  output/                   # 常に gitignore
```

将来、商品として分離する場合のみ `cms-kit/` パッケージ化を検討（G-5 では doc のみ）。

---

## 8. Site config draft

### 例（gosaki）

[`config/sites/gosaki.site-config.example.json`](../config/sites/gosaki.site-config.example.json)

```json
{
  "siteSlug": "gosaki",
  "siteName": "Saki Goto",
  "siteType": "musician",
  "siteProfile": "musician",
  "source": { "type": "static-html", "fixtureDir": "fixtures/gosaki-static-site" },
  "cms": {
    "provider": "supabase",
    "stagingHost": "kmjqppxjdnwwrtaeqjta.supabase.co",
    "tables": ["schedule_months", "schedules", "discography", "discography_tracks"]
  },
  "storage": {
    "bucket": "site-assets",
    "pathPrefix": "gosaki",
    "imageFields": ["schedules.image_url", "schedules.home_image_url", "discography.cover_image_url"]
  },
  "deploy": {
    "staging": {
      "base": "/cms-kit-staging/gosaki/",
      "publicUrl": "https://yskcreate.weblike.jp/cms-kit-staging/gosaki/",
      "ftpEnvPrefix": "GOSAKI_STAGING_FTP"
    },
    "production": { "enabled": false, "baseUrl": "https://www.gosaki-piano.com" }
  },
  "seo": {
    "stagingNoindex": true,
    "robotsDisallowAll": true,
    "productionBaseUrl": "https://www.gosaki-piano.com"
  },
  "output": {
    "root": "output",
    "generatedAstro": "output/generated-astro",
    "reports": {
      "storage": "output/storage/gosaki",
      "export": "output/supabase-export/gosaki",
      "staticPublic": "output/static-public/gosaki",
      "deploy": "output/deploy/gosaki"
    }
  }
}
```

### 必須項目（案）

| フィールド | 理由 |
| --- | --- |
| `siteSlug` | Storage path / FTP subdir / report ディレクトリ |
| `siteType` or `siteProfile` | schema adapter / template 選択 |
| `source.fixtureDir` | convert 入力 |
| `cms.provider` | 現状は `supabase` 固定 |
| `deploy.staging.base` | Astro `deployBase` / asset path |
| `seo.stagingNoindex` | staging artifact 検証 |

### 任意項目（案）

| フィールド | 用途 |
| --- | --- |
| `siteName` | レポート・Admin タイトル |
| `cms.stagingHost` | preflight（apply 系 CLI） |
| `storage.*` | G-4 パイプライン |
| `deploy.staging.ftpEnvPrefix` | FTP 認証 env 変数名 |
| `deploy.production` | 本番 gate（デフォルト `enabled: false`） |
| `output.reports.*` | レポート出力先の convention |

### siteType ごとの違い（概要）

| siteType | siteProfile | 主テーブル | Home featured |
| --- | --- | --- | --- |
| `musician` | `musician` | schedules, discography, tracks | `show_on_home` |
| `music-school` | 将来 `music-school` | classes, instructors, schedule, news | news / classes |
| `dance-school` | `dance-school` | classes, instructors, news, schedule | `featured_on_home` |
| `small-business` | `generic` | news, profile, links | `featured_on_home` |

---

## 9. Schema adapter draft

Schema adapter は **site profile + site config** から、Supabase テーブル・JSON export 名・Storage 対象フィールド・legacy_id 規則を解決する層（G-5e で lib 化）。

### 共通モデル（全 siteType）

| 概念 | 説明 |
| --- | --- |
| `legacy_id` | 安定キー（`{entity}-{date}-{seq}` 等） |
| `published` | 公開フラグ |
| `sort_order` | 一覧順 |
| `image_url` 系 | Storage 移行対象になりうる URL フィールド |
| `featured` 系 | トップ掲載（フィールド名は adapter で mapping） |

### siteType 別モデル

#### musician（gosaki 実装済み）

| モデル | テーブル | 主フィールド | HTML 抽出 | Human review | Storage |
| --- | --- | --- | --- | --- | --- |
| Live schedule | `schedules` | date, venue, title, `image_url`, `home_image_url` | ◎ fixture | ◎ home/flyer 分離・日付不一致 | ◎ |
| Discography | `discography` | title, `cover_image_url` | ◎ | △ 著作権 | ◎ |
| Tracks | `discography_tracks` | track list | ◎ | — | — |
| Profile / Links | 静的 or 将来 table | — | △ | — | △ |

#### music-school / dance-school（設計のみ）

| モデル | テーブル（案） | 抽出 | Human review | Storage |
| --- | --- | --- | --- | --- |
| Classes / Courses | `classes` | ページ構造依存 | ◎ 料金・写真 | ◎ |
| Instructors | `instructors` | プロフィール HTML | ◎ 肖像権 | ◎ |
| Schedule | `schedule` or `events` | カレンダー HTML | ◎ | ◎ |
| News | `news` | ブログ風 HTML | △ | ◎ |
| FAQ / Pricing | 静的 or CMS | テーブル抽出難 | △ | — |

#### small-business（generic ベース）

| モデル | テーブル（案） | 抽出 | Human review | Storage |
| --- | --- | --- | --- | --- |
| Services / Works | `services`, `works` | サービス一覧 HTML | △ | ◎ |
| Staff / Profile | `profile` | about ページ | ◎ | ◎ |
| News | `news` | お知らせ | △ | ◎ |
| Contact | 静的 + form | フォームは別途 | — | — |

### Adapter インターフェース（案・G-5e）

```js
// scripts/lib/schema-adapter.mjs（未実装）
resolveTables(siteConfig)       // → ["schedules", "discography", ...]
resolveStorageFields(siteConfig) // → from profile.storage.fields
resolveLegacyIdRules(entity)    // → pattern + validation
resolveDbUpdateProfile(table)   // → replaces hardcoded DISCOGRAPHY_LEGACY_IDS
```

**後方互換:** gosaki 用の hardcoded リストは adapter の `musician` 実装に内包し、既存 CLI はデフォルトで現行挙動を維持。

---

## 10. CLI generalization plan

### 現状の主要 CLI 引数（抜粋）

| CLI | 主要引数 | apply | Upload | DB |
| --- | --- | --- | --- | --- |
| `convert-static-to-astro.mjs` | input, output, `--base-url`, `--deploy-base`, `--site-profile`, `--with-admin-cms` | convert | — | — |
| `export-supabase-json.mjs` | `--out-astro-dir`, `--report`, `--env-file` | — | — | read |
| `review-storage-assets.mjs` | `--site-slug`, `--fixture-dir`, … or **`--site-config`** (G-5c) | — | — | — |
| `prepare-storage-upload-allowlist.mjs` | `--review-manifest`, `--site-slug`, `--allowlist` | — | — | — |
| `upload-storage-assets.mjs` | `--allowlist`, `--site-slug`, `--bucket`, `--report`, `--manifest`, `--db-update-plan`, `--apply` | upload | yes | no |
| `apply-storage-db-updates.mjs` | `--plan`, `--site-slug`, `--table`, `--backup`, `--apply` | DB | no | yes |
| `deploy-public-dist-ftp.mjs` | `--public-dir`, `--site-slug`, `--env staging`, `--apply` | FTP | — | — |
| `verify-static-public-artifact.mjs` | `--astro-dir`, `--report` | — | — | — |

### `--site-config`（G-5c 実装済み — read-only CLI のみ）

```bash
node tools/static-to-astro/scripts/review-storage-assets.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

Write 系（将来 G-5d 以降）:

```bash
# 未対応 — 明示引数のまま使用
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  --allowlist ... --site-slug gosaki --apply
```

[`site-config-loader.mjs`](../scripts/lib/site-config-loader.mjs) が以下を解決:

- `siteSlug`, `fixtureDir`, `output.reports.storage`, `storage.bucket`, `deploy.staging.base`
- 既存 `--site-slug` / `--allowlist` は**併用可能**（明示引数が優先）

### 後方互換方針

1. **既存フラグは削除しない** — gosaki runbook のコマンドはそのまま動く
2. `--site-config` は**オプション追加** — 未指定時は現行デフォルト（`gosaki` 等）
3. gosaki 専用フラグ（`--apply-gosaki-g4e`）は当面維持 → 将来 `--decision-preset golden-pods-home-only` 等にエイリアス化可能
4. hardcoded legacy_id は adapter 導入後も **opt-in** で切替（デフォルトは現行リスト）
5. 新サイトは site config + profile から開始；gosaki は参照実装

### 実装優先度

| 優先 | 項目 | フェーズ |
| ---: | --- | --- |
| 高 | site-config JSON + loader（read-only） | G-5b, **G-5c 完了** |
| 高 | read-only CLI の path 解決 | **G-5c 完了** — [site-config-cli-usage.md](./site-config-cli-usage.md) |
| 中 | schema adapter draft lib | G-5e |
| 中 | template registry + convert 連携 | **G-5d 完了**（metadata）, G-5f（生成） |
| 低 | apply 系 CLI の site-config 一本化 | G-5c 後半〜G-5f |
| 低 | onboarding wizard / Stripe | G-5h 以降 |

---

## 11. Migration workflow（標準フロー）

```txt
 1. crawl / static export          # 顧客サイト or Wix → fixtures/{siteSlug}-static-site
 2. analyze static HTML            # analyze-cms-candidates, review-storage-assets (G-4a)
 3. site config + profile 選択     # config/sites/*.json + site-profiles/*.json
 4. generate Astro                 # convert-static-to-astro --site-profile ...
 5. map content schema             # seed extractors + schema adapter (G-5e)
 6. setup Supabase                 # seed insert, RLS draft, admin bootstrap (staging only)
 7. export JSON                    # export-supabase-json
 8. review Storage assets          # allowlist, human review (schedule)
 9. human review                   # decision template — 自動承認しない
10. upload Storage assets          # upload-storage-assets --apply（DB なし）
11. DB update                      # apply-storage-db-updates --apply + backup
12. build                          # npm run build in generated-astro
13. staging deploy                 # verify-static-public-artifact → deploy-public-dist-ftp
14. QA                             # noindex, robots, images, example.supabase.co なし
15. production readiness           # owner / rights gate — 明示承認まで本番不可
```

gosaki では 1〜14 のうち **discography + schedule home** まで実証済み（[storage runbook](./gosaki-storage-image-migration-runbook.md)）。

---

## 12. Safety gates

| Gate | ルール |
| --- | --- |
| Production | 明示承認まで Supabase / FTP / Storage apply 禁止 |
| Staging | noindex + robots Disallow 必須 |
| Artifacts | `output/` は commit しない |
| Storage | upload と DB update は別フェーズ |
| Images | 曖昧な schedule 画像は human review 必須 |
| Secrets | ログ・report・manifest に key/password を出さない |
| Preflight | staging host 一致、plan 件数、legacy_id allowlist |
| Verify | DB update 後再読み取り、public URL HTTP 200 |
| Commit前 | `git grep -iE "ysktoyamax|bikusari"` |

---

## 13. G-5 implementation phases

| Phase | 内容 | 破壊的変更 |
| --- | --- | --- |
| **G-5a** | Inventory and classify（本書 + 分類表） | なし |
| **G-5b** | site-config draft + example JSON | なし |
| **G-5c** | read-only CLIs + `site-config-loader.mjs`（**完了**） | なし（`--site-config` 追加のみ） |
| **G-5d** | template registry JSON + `inspect-cms-template.mjs`（**完了**） | なし |
| **G-5e** | schema adapter registry + `inspect-schema-adapter.mjs`（**完了**） | なし |
| **G-5f** | staging generation plan CLI（**完了**） | なし |
| **G-5g** | dry-run generation package CLI（**完了**） | なし |
| **G-5h** | Product onboarding runbook（**完了**） | doc のみ |
| **G-5i** | Admin CMS extraction plan / runbook（**完了**） | doc のみ |
| **G-5j** | Sariswing admin code inventory（**完了**） | なし |
| **G-5k** | Admin UI components registry / plan（**完了**） | doc + registry JSON のみ |
| **G-5l** | Low-risk UI shell components scaffold（**完了**） | `templates/admin-cms/components/` のみ |
| **G-5m-a** | CRUD primitives + module UI scaffold（**完了**） | `components/` + `modules/` のみ |
| **G-5m-b** | Auth abstraction scaffold（**完了**） | `components/` + `auth/` のみ |
| **G-5n** | Media upload abstraction scaffold（**完了**） | `components/` + `media/` のみ |
| **G-5o** | Publish workflow abstraction scaffold（**完了**） | `components/` + `publish/` のみ |
| **G-5p** | musician-basic admin prototype（**完了**） | `prototypes/` + `DiscographyAdminUi` |
| **G-5q** | Customer admin manual（**完了**） | doc |
| **G-5r** | Prototype preview harness（**完了**） | `preview/` + inspect CLI |
| **G-5s** | Site-config driven admin scaffold generator（**完了**） | dry-run CLI |
| **G-5t** | Runtime integration plan（**完了**） | doc + gates JSON |
| **G-5u** | Local-only preview route（**完了**） | `src/pages/__admin-preview/` |
| **G-5v** | Customer demo package（**完了**） | `customer-demo-package-musician-basic/` |
| **G-5w-a** | Admin scaffold writer plan（**完了**） | doc + `admin-scaffold-writer-policy.json` |
| **G-5w-b** | Writer dry-run CLI（**完了**） | `write-admin-scaffold.mjs` |
| **G-5w-d** | Generated scaffold review（**完了**） | `review-generated-admin-scaffold.mjs` |

**G-5c（完了）:** `site-config-loader.mjs` + 4 read-only CLIs。明示引数優先・G-4 runbook 後方互換。upload / DB / FTP CLI は未対応。

**G-5d（完了）:** [`cms-template-registry.json`](../config/templates/cms-template-registry.json) + `template-registry-loader.mjs` + `inspect-cms-template.mjs`。`musician-basic` = gosaki 実績。`music-school` / `dance-school` / `small-business` = draft。実生成・upload / DB / FTP には未接続。

**G-5e（完了）:** [`cms-schema-adapters.json`](../config/schema-adapters/cms-schema-adapters.json) + `schema-adapter-loader.mjs` + `inspect-schema-adapter.mjs`。`musician-basic-supabase-v1` = gosaki 実績ベース。draft adapter 3件。site config `schemaAdapterId` で接続。DB 作成・upload / DB update / FTP には未接続。

**G-5f（完了）:** `staging-generation-planner.mjs` + `plan-staging-generation.mjs`。site config + template + schema adapter から read-only plan（manifest + report）を `output/plans/{siteSlug}/` に出力。recommendedWorkflow / humanReviewGates / productionReadiness を含む。Astro 生成・DB・upload・FTP は未実施。

**G-5g（完了）:** `site-generation-dry-runner.mjs` + `generate-site-dry-run.mjs`。plan（または site config）から dry-run generation package を `output/generation-packages/{siteSlug}/` に出力。planned-files / schema skeleton / seed skeleton / storage tasks / human review / QA checklist。実 Astro 生成・DB・upload・FTP は未実施。既存 `generated-astro` は上書きしない。

**G-5h（完了）:** [cms-kit-onboarding-runbook.md](./cms-kit-onboarding-runbook.md) — 新規顧客導入の標準手順（discovery → staging → QA → production readiness → maintenance）。実装・実操作なし。

**G-5i（完了）:** [admin-cms-template-extraction-plan.md](./admin-cms-template-extraction-plan.md) — Sariswing admin → CMS Kit 標準 Admin の extraction plan。

**G-5j（完了）:** [admin-cms-code-inventory.md](./admin-cms-code-inventory.md) + `inventory-admin-cms.mjs` — 55 admin-related files を reusable / site-specific / risky に分類。

**G-5k（完了）:** [admin-ui-components-registry.md](./admin-ui-components-registry.md) + registry JSON + `inspect-admin-ui-components.mjs` — 28 UI components registry。

**G-5l（完了）:** [admin-ui-shell-scaffold.md](./admin-ui-shell-scaffold.md) — 10 low-risk shell components。

**G-5m-a（完了）:** [admin-crud-ui-scaffold.md](./admin-crud-ui-scaffold.md) — CRUD / module scaffolds。

**G-5m-b（完了）:** [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md) — Auth UI + permissions draft。

**G-5n（完了）:** [admin-media-upload-abstraction.md](./admin-media-upload-abstraction.md) — Media upload UI。

**G-5q（完了）:** [customer-admin-manual-musician-basic.md](./customer-admin-manual-musician-basic.md) — 顧客向け Admin Manual + [Quick Checklist](./customer-admin-quick-checklist-musician-basic.md)。G-5p prototype は開発者向け、G-5q manual は顧客向け。

**G-5r（完了）:** [admin-prototype-preview-harness.md](./admin-prototype-preview-harness.md) — preview manifest + safety checklist。`musician-basic-admin-prototype` 登録。`customerDemoReady: false`。

**G-5s（完了）:** [site-config-driven-admin-scaffold-generator.md](./site-config-driven-admin-scaffold-generator.md) — dry-run admin scaffold package from site config。runtime / Auth / DB / Storage / Publish 未接続。`output/` not committed。

**G-5t（完了）:** [admin-runtime-integration-plan.md](./admin-runtime-integration-plan.md) — Auth / CRUD / Media / Publish 統合順序、approval gates、forbidden automation。実接続なし。

**G-5u（完了）:** [local-only-admin-preview-route.md](./local-only-admin-preview-route.md) — `/__admin-preview/musician-basic/`。`ENABLE_ADMIN_PREVIEW=true` + dev only。`customerDemoReady: false`。

**G-5v（完了）:** [customer-demo-package-musician-basic/](./customer-demo-package-musician-basic/README.md) — demo script / checklist / explanation / feedback form / screenshot guide / safety notes / post-demo next steps。G-5u local preview route と組み合わせて使用。mock / scaffold のみ、runtime / Auth / DB / Storage / Publish 未接続。

**G-5w-a（完了）:** [admin-scaffold-writer-plan.md](./admin-scaffold-writer-plan.md) — explicit opt-in writer plan。dry-run default / `--apply` required / Sariswing existing admin excluded。writer CLI 未実装、ファイル生成なし。

**G-5w-b（完了）:** [admin-scaffold-writer-dry-run-cli.md](./admin-scaffold-writer-dry-run-cli.md) — `write-admin-scaffold.mjs`。package 読み込み・target safety check・planned manifest・rollback draft・report。`--apply` 未実装、target-dir への実書き込みなし。

**G-5w-c（完了）:** [admin-scaffold-writer-sandbox-apply.md](./admin-scaffold-writer-sandbox-apply.md) — `--apply` + `--approval-id`。sandbox only、上書き禁止、`src/pages/admin` 禁止。

**G-5w-d（完了）:** [generated-admin-scaffold-review.md](./generated-admin-scaffold-review.md) — read-only review CLI、`readyForG5x` 判定。G-5x 前に必須。

**G-5x（完了）:** [staging-runtime-shell-integration.md](./staging-runtime-shell-integration.md) — `/__admin-staging-shell/musician-basic/`。`ENABLE_ADMIN_STAGING_SHELL=true` + dev only。shell-only / actions disabled。

**G-5y-a（完了）:** [supabase-auth-staging-integration-plan.md](./supabase-auth-staging-integration-plan.md) — Supabase Auth staging integration **plan only**。Auth 実接続なし / DB・RLS 変更なし / production Auth 未変更。次: **G-5y-b** Auth adapter scaffold / dry-run only。

### G-5c 対象 CLI

- `review-storage-assets.mjs`
- `prepare-storage-upload-allowlist.mjs`
- `review-schedule-storage-assets.mjs`
- `promote-schedule-storage-allowlist.mjs`

詳細: [site-config-cli-usage.md](./site-config-cli-usage.md)

---

## 14. Open questions

| 論点 | 選択肢 | 現時点の推奨 |
| --- | --- | --- |
| Supabase project | 顧客ごと vs 共有 multi-tenant | 検証は **staging 共有 + path prefix**；本番は顧客ごとを推奨 |
| Stripe subscription | SaaS 課金 | G-5h 以降。まず staging ワークフロー完成 |
| Domain / FTP | 顧客保有 vs 代行 | site config の `deploy.*` で抽象化 |
| Git repo | サイトごと vs 中央 generator | 中央 `static-to-astro` + `output/` per site |
| Admin UI | サイトごと vs 共有 dashboard | テンプレコピー（現状）→ 将来 shared Admin |
| Image rights | production 前の確認フロー | `copyrightStatus` + human review 必須を runbook 化済み |
| Pricing tiers | musician / school / business | 商品化フェーズで profile 単位に紐付け |

---

## 15. Related runbooks（再利用）

| Runbook | 用途 |
| --- | --- |
| [gosaki-staging-runbook.md](./gosaki-staging-runbook.md) | export → build → FTP |
| [gosaki-storage-image-migration-runbook.md](./gosaki-storage-image-migration-runbook.md) | G-4 画像移行 |
| [site-profile-system.md](./site-profile-system.md) | module / profile |
| [public-dist-ftp-deploy.md](./public-dist-ftp-deploy.md) | FTP 設計 |

---

*G-5: CMS Kit template generalization — design freeze. Implementation starts at G-5c without breaking gosaki G-4 flows.*
