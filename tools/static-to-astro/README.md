# static-to-astro

静的 HTML サイトを解析し、Astro プロジェクトのたたき台を生成するツール。

本番の `src/`・`public/`・`package.json`・`supabase/` には一切触れません。作業は `tools/static-to-astro/` 内のみです。生成物は `tools/static-to-astro/output/generated-astro/` に出力します。

## 目的

```text
URL → 静的 HTML → Astro → CMS → デプロイ
```

のうち **「静的 HTML → Astro」** を自動化する。

## スコープ

| Phase | 内容 | 状態 |
| --- | --- | --- |
| 1 | 設計・解析 CLI・フィクスチャ | 完了 |
| 2-A | 最小 Astro プロジェクト自動生成 | 完了 |
| 2-B | 実案件 fixture・`CONVERSION_REPORT.md`・`trailingSlash`・JS整理 | 完了 |
| 2-C | SEO/OGP/canonical/favicon、ナビ active、CONVERSION_REPORT SEO | 完了 |
| 2-D | `--base-url`、実サイト由来 HTML 検証枠 | 完了 |
| 2-E | gosaki 実サイト検証の正式化、`<main>` / Schedule 一覧仕様、品質レポート | 完了 |
| 2-F | `site` / robots.txt / `@astrojs/sitemap`、SEO 公開準備レポート | 完了 |
| 2-G | Playwright ビジュアル diff 下準備（スクリーンショット + 差分画像） | 完了 |
| 2-H | Visual diff 結果分析・修正優先度・再比較ワークフロー | 完了 |
| 2-I | High 差分目視・ソース CSS パス修正・再 diff | 完了 |
| 2-J | 意図的 visual diff の設定・High 除外 | 完了 |
| 2-K | CI 連携・自動合否判定、JSON-LD 等 | 予定 |
| 3-A | CMS 候補抽出・更新領域分析レポート | 完了 |
| 3-B | Schedule JSON seed 抽出・データ駆動表示プロトタイプ | 完了 |
| 3-C | Home Schedule データ駆動化（`show_on_home`） | 完了 |
| 3-D | Discography JSON seed・データ駆動表示 | 完了 |
| 3-E | Supabase schema draft / seed JSON 生成 | 完了 |
| 3-F | 画像 Storage 移行準備・URL 整理 | 完了 |
| 3-G | Storage upload dry-run・seed URL rewrite 準備 | 完了 |
| 3-H | JSON seed 管理 UI プロトタイプ（`/admin/`） | 完了 |
| 3-I | CMS 仕様固定・実装計画 | 完了 |
| 3-J | Staging Supabase seed insert（dry-run / --apply） | 完了 |
| 3-K | Supabase → Astro JSON export + build 確認 | 完了 |
| 3-L | Admin UI Supabase read-only 接続 | 完了 |
| 3-M | Auth / RLS SQL draft 生成 | 完了 |
| 3-N | RLS staging 適用・anon 公開読取検証 | 進行中 |
| 3-O+ | Admin save・Auth bootstrap | 予定 |

## ディレクトリ構成

```text
tools/static-to-astro/
├── README.md
├── docs/design.md
├── package.json
├── scripts/
│   ├── analyze-static-site.mjs
│   ├── analyze-cms-candidates.mjs
│   ├── extract-schedule-seed.mjs
│   ├── sync-home-schedule.mjs
│   ├── extract-discography-seed.mjs
│   ├── generate-supabase-seed.mjs
│   ├── prepare-storage-assets.mjs
│   ├── plan-storage-upload.mjs
│   ├── rewrite-seed-image-urls.mjs
│   ├── insert-supabase-seed.mjs
│   ├── export-supabase-json.mjs
│   ├── verify-admin-supabase-read.mjs
│   ├── generate-rls-draft.mjs
│   ├── verify-anon-rls.mjs
│   ├── analyze-visual-diff.mjs
│   ├── convert-static-to-astro.mjs
│   ├── visual-diff.mjs
│   └── lib/
│       ├── cms-candidates-analyzer.mjs
│       ├── schedule-seed-extractor.mjs
│       ├── home-schedule-sync.mjs
│       ├── discography-seed-extractor.mjs
│       ├── supabase-seed-generator.mjs
│       ├── storage-assets-preparer.mjs
│       ├── storage-upload-planner.mjs
│       ├── seed-url-rewriter.mjs
│       ├── supabase-seed-inserter.mjs
│       ├── supabase-json-exporter.mjs
│       ├── rls-draft-generator.mjs
│       ├── anon-rls-verifier.mjs
│       ├── visual-diff-analysis.mjs
│       ├── visual-diff-runner.mjs
│       └── ...
├── fixtures/
│   ├── sample-static-site/
│   ├── realistic-static-site/
│   └── gosaki-static-site/     # 手動配置（.gitignore 対象）
└── output/
    ├── gosaki-report.json
    └── generated-astro/
```

## 実行方法

リポジトリルート（`sariswing-astro/`）で実行。`cheerio` はルートの `package.json` を利用します。

### 解析（Markdown / JSON）

```bash
node tools/static-to-astro/scripts/analyze-static-site.mjs \
  tools/static-to-astro/fixtures/sample-static-site
```

### Astro たたき台生成（`--base-url` 推奨）

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/realistic-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://studio-sakura.example.com
```

`--verify-build` を付けると、生成後に `npm install` → `npm run build` を実行し、結果（sitemap 含む）を `CONVERSION_REPORT.md` に記録します。

`--base-url` 指定時は `astro.config.mjs` の `site`、`public/robots.txt`、`@astrojs/sitemap` も自動設定します。

---

## Phase 2-E: gosaki-static-site 実サイト検証

### フィクスチャの用意

以下が **存在する場合**、実サイト由来 HTML として検証します。存在しない場合はエラーにせず、手動でコピーしてから再実行してください。

| 項目 | パス |
| --- | --- |
| コピー元（例） | `tools/site-audit/prototype-static-gosaki-v4/` |
| コピー先 | `tools/static-to-astro/fixtures/gosaki-static-site/` |

```bash
cp -R tools/site-audit/prototype-static-gosaki-v4/* \
  tools/static-to-astro/fixtures/gosaki-static-site/
```

`gosaki-static-site/` は `.gitignore` 対象です。ダミーは自動生成しません。

### 検証手順（推奨コマンド）

```bash
# 1. 解析 + baseUrl プレビュー JSON
node tools/static-to-astro/scripts/analyze-static-site.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  --json \
  --base-url https://www.gosaki-piano.com \
  --out tools/static-to-astro/output/gosaki-report.json

# 2. 変換（build 結果もレポートに記録する場合）
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --verify-build

# 3. 生成物のビルド（--verify-build 未使用時）
cd tools/static-to-astro/output/generated-astro
npm install   # 初回のみ
npm run build

# 4. dev（ブラウザ確認）
npm run dev
```

### dev 確認時の注意

**ターミナルに表示された URL を必ず使う**こと（例: `http://localhost:4321/` や `http://127.0.0.1:4325/`）。過去セッションのポートを開くと 404 になることがあります。

確認ルート例: `/`, `/schedule/`, `/schedule-2026-07/` … `/link/`

---

## Phase 2-G: Visual diff（Playwright）

依存関係は **`tools/static-to-astro/package.json`** に閉じ込めています（ルート `package.json` は変更しません）。

```bash
cd tools/static-to-astro
npm install
npx playwright install chromium
```

### 手順

```bash
# 1. 変換 + build（dist を用意）
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-static-site \
  output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --verify-build

# 2. ビジュアル diff（リポジトリルートからでも可）
node tools/static-to-astro/scripts/visual-diff.mjs \
  --source-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --out-dir tools/static-to-astro/output/visual-diff/gosaki \
  --routes /,/about/,/schedule/,/schedule-2026-07/,/contact/
```

| 項目 | 内容 |
| --- | --- |
| ソース側 | フィクスチャをローカル HTTP で配信（`/about/` → `about.html`） |
| Astro 側 | **`dist/`** を静的配信（`npm run preview` ではなく build 成果物で安定比較） |
| viewport | desktop 1440×1200、mobile 390×1200 |
| 出力 | `output/visual-diff/gosaki/{source,astro,diff}/` + `VISUAL_DIFF_REPORT.md` |
| レポート追記 | `output/generated-astro/CONVERSION_REPORT.md` に概要セクション |

`--no-diff` でスクリーンショットのみ。`/schedule/` はソースに HTML が無い場合があり、Astro のみ撮影されます。

`visual-diff.mjs` 完了時に **`VISUAL_DIFF_ANALYSIS.md`** も自動生成します（Phase 2-H）。既存成果物だけ分析する場合:

```bash
node tools/static-to-astro/scripts/analyze-visual-diff.mjs \
  --out-dir tools/static-to-astro/output/visual-diff/gosaki \
  --astro-dir tools/static-to-astro/output/generated-astro
```

---

## Phase 2-H: Visual diff 結果分析・修正ワークフロー

### 生成物

| ファイル | 内容 |
| --- | --- |
| `VISUAL_DIFF_REPORT.md` | 撮影ログ・mismatch %（Phase 2-G） |
| `VISUAL_DIFF_ANALYSIS.md` | 優先度・原因候補 A–H・画像リンク表（Phase 2-H） |
| `CONVERSION_REPORT.md` | Visual diff / analysis 概要セクション追記 |

### 原因カテゴリ（候補）

- **A** 画像欠損・サイズ差
- **B** フォント・外部フォント
- **C** Header / nav 構造差
- **D** main / section / wrapper
- **E** レスポンシブ CSS
- **F** JS / インライン script
- **G** フォーム・iframe
- **H** Astro 意図的改善（例: `/schedule/` 一覧）

### 優先度

| 優先度 | 目安 |
| --- | --- |
| **High** | mismatch ≥ 25%、または mobile ≥ 35% |
| **Medium** | mismatch 10–25% |
| **Low** | &lt; 10%、または astro-only |

自動判定のみ — **公開前の最終判断は目視**。

### Visual diff 後の修正ワークフロー

1. `VISUAL_DIFF_REPORT.md` を確認
2. `VISUAL_DIFF_ANALYSIS.md` を確認（スクリーンショットリンク表）
3. **High** 優先の source / astro / diff 画像を目視
4. 原因カテゴリ（A–H）を確定
5. 必要なら **`tools/static-to-astro/`** 内の変換ツール・fixture を修正（本番 `src/` には触れない）
6. 再度 `convert-static-to-astro.mjs`（`--verify-build` 推奨）
7. 再度 `visual-diff.mjs`（分析は自動再生成）
8. mismatch % が改善したか `VISUAL_DIFF_ANALYSIS.md` で比較

### Phase 2-I: High 差分の目視・再 diff

gosaki で判明した主因の一つは、**visual diff 用ソースサーバー**が `/about/` 等で `css/style.css` を誤った相対パスに解決し、ソースのみ無スタイルになっていたこと（偽陽性）。`rewriteSourceHtmlForRootServe()` で修正。

```bash
node tools/static-to-astro/scripts/visual-diff.mjs ...  # 再撮影
node tools/static-to-astro/scripts/complete-phase2i-review.mjs \
  --out-dir tools/static-to-astro/output/visual-diff/gosaki \
  --astro-dir tools/static-to-astro/output/generated-astro
```

`VISUAL_DIFF_ANALYSIS.md` の **Phase 2-I** セクションに Fix/Accept/Intentional/Review と再 diff 表を追記。

### Phase 2-J: Intentional visual differences

Astro 化では元サイトを完全コピーせず、運用改善のために意図的に変更する場合があります（例: Schedule 月別プルダウン → `/schedule/` 一覧 + 単一 Schedule リンク）。visual diff では、こうした意図差分を設定ファイルで管理し、**High 件数からは除外**しつつレポート上は **Known intentional difference** として別枠表示します。意図差分でも、同一画面に他の崩れが混ざる可能性があるため **目視確認は省略しません**。

設定: `config/intentional-diffs.gosaki.json`

```bash
node tools/static-to-astro/scripts/analyze-visual-diff.mjs \
  --out-dir tools/static-to-astro/output/visual-diff/gosaki \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --intentional-diffs tools/static-to-astro/config/intentional-diffs.gosaki.json

node tools/static-to-astro/scripts/visual-diff.mjs \
  --source-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --out-dir tools/static-to-astro/output/visual-diff/gosaki \
  --routes /,/about/,/schedule/,/schedule-2026-07/,/contact/ \
  --intentional-diffs tools/static-to-astro/config/intentional-diffs.gosaki.json
```

`VISUAL_DIFF_ANALYSIS.md` の **Intentional differences** セクションと、`CONVERSION_REPORT.md` の **Visual diff intentional differences** を参照してください。

---

## Phase 3-A: CMS 候補抽出・更新領域分析

静的 HTML（任意で生成 Astro）から、**CMS 化すべき領域**を抽出し `CMS_CANDIDATES_REPORT.md` にまとめます。目的は Supabase CMS や管理画面につなぐ前段階として、「どのページ・セクションが更新対象か」を可視化することです。

### CMS化優先度

| 優先度 | 目安 |
| --- | --- |
| **High** | 更新頻度が高く CMS 化の価値が大きい（例: 月別 Schedule、Home 週間ライブ） |
| **Medium** | たまに更新（例: Discography、Profile） |
| **Low** | 静的のままでよい可能性（例: Link 一覧、フッター SNS） |
| **Manual** | 人間判断が必要（例: Contact フォーム・外部 embed） |

`<!-- CMS_TARGET: ... -->` コメント、ファイル名、DOM パターン（`schedule-card` 等）から候補を分類します。

### コマンド

```bash
node tools/static-to-astro/scripts/analyze-cms-candidates.mjs \
  --input-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --out tools/static-to-astro/output/cms-candidates/gosaki/CMS_CANDIDATES_REPORT.md
```

`--astro-dir` は省略可（静的 HTML のみ解析）。Supabase テーブル案はレポート内の**設計提案**のみで、DB 作成・接続は **Phase 3-C 以降**です。

---

## Phase 3-B: Schedule JSON seed・データ駆動表示

`schedule-YYYY-MM.html` からライブ情報を抽出し、生成 Astro の `src/data/` に JSON seed を書き込みます。`/schedule/` 一覧と月別ページは `ScheduleList.astro` で JSON を表示します（Supabase 接続は**まだ行いません**）。

### 推奨実行順

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --verify-build

node tools/static-to-astro/scripts/extract-schedule-seed.mjs \
  --input-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --out-dir tools/static-to-astro/output/generated-astro/src/data \
  --report tools/static-to-astro/output/cms-candidates/gosaki/SCHEDULE_SEED_REPORT.md

cd tools/static-to-astro/output/generated-astro && npm run build
```

### 出力

| ファイル | 内容 |
| --- | --- |
| `src/data/schedules.json` | イベント一覧 |
| `src/data/schedule-months.json` | 月別インデックス |
| `src/components/ScheduleList.astro` | カード一覧コンポーネント |
| `SCHEDULE_SEED_REPORT.md` | 抽出統計・Supabase スキーマ案 |

### JSON → Supabase の考え方

Phase 3-B の JSON は **移行前のローカル seed** です。将来は同じフィールドを `schedules` / `schedule_months` テーブルに投入し、Astro はビルド時 fetch または SSR で読み込みます。フライヤー画像 URL は Storage 移行後に差し替えが必要です。

### 人間確認が必要な項目

- 空の `時間：` / `料金：` 行
- 非標準時間表記（`17:00〜19:00` 等）は `description` に含まれる場合あり
- フライヤー未設定（placeholder のみ）が大半
- Home の週間スケジュールは **Phase 3-C で JSON 化**（下記 `sync-home-schedule`）

### Phase 3-C: Home Schedule データ駆動化

`index.html` の `HOME_LIVE_SCHEDULE` 領域を検出し、既存 `schedules.json` のイベントと照合して `show_on_home` / `home_order` を付与します。トップページは `HomeSchedule.astro` で表示します。

```bash
node tools/static-to-astro/scripts/sync-home-schedule.mjs \
  --input-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --schedules tools/static-to-astro/output/generated-astro/src/data/schedules.json \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/cms-candidates/gosaki/SCHEDULE_SEED_REPORT.md

cd tools/static-to-astro/output/generated-astro && npm run build
```

| フィールド | 用途 |
| --- | --- |
| `show_on_home` | Home に掲載するか |
| `home_order` | Home 内の表示順 |
| `home_date_display` | Home 用日付表記（例: `3月25日(水)　LIVE`） |
| `home_performers` / `home_address` / `home_image` | Home カード専用表示（index.html からコピー） |

**Supabase 化の想定:** 同一テーブル `schedules` に `show_on_home`, `home_sort_order` 列を追加。管理画面でトグル・並べ替え。

**手動確認:** 日付表記の年（デフォルト 2026）、alt-date-conflict フライヤー、未一致時の案B仮選定。

### Phase 3-D: Discography JSON seed・データ駆動表示

`discography.html` からリリース情報を抽出し、`discography.json` と `DiscographyList.astro` で `/discography/` をデータ駆動表示します。Supabase 接続は**まだ行いません**。

```bash
node tools/static-to-astro/scripts/extract-discography-seed.mjs \
  --input-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --out-dir tools/static-to-astro/output/generated-astro/src/data \
  --report tools/static-to-astro/output/cms-candidates/gosaki/DISCOGRAPHY_SEED_REPORT.md \
  --astro-dir tools/static-to-astro/output/generated-astro

cd tools/static-to-astro/output/generated-astro && npm run build
```

| 出力 | 内容 |
| --- | --- |
| `src/data/discography.json` | リリース + `tracks[]` |
| `src/components/DiscographyList.astro` | 一覧コンポーネント |
| `DISCOGRAPHY_SEED_REPORT.md` | 抽出統計・`discography` / `discography_tracks` テーブル案 |

**JSON → Supabase:** `discography` 親テーブル + `discography_tracks` 子テーブル。`cover_image` は Storage 移行後に `cover_image_url` へ。

**手動確認:** Release 行の価格・SOLD OUT 表記、会場販売のみのリリース、Wix 画像 URL。

### Phase 3-E: Supabase schema draft / seed JSON

既存の Astro 用 JSON seed から、**本番 Supabase には接続せず** 投入準備用の draft を生成します。

```bash
node tools/static-to-astro/scripts/generate-supabase-seed.mjs \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --out-dir tools/static-to-astro/output/supabase-seed/gosaki \
  --report tools/static-to-astro/output/supabase-seed/gosaki/SUPABASE_SEED_REPORT.md \
  --astro-dir tools/static-to-astro/output/generated-astro
```

| 出力 (`output/supabase-seed/gosaki/`) | 内容 |
| --- | --- |
| `schema-draft.sql` | テーブル定義 draft（**そのまま本番適用しない**） |
| `seed-schedules.json` | schedules 行 |
| `seed-schedule-months.json` | 月インデックス |
| `seed-discography.json` | リリース（tracks 除く） |
| `seed-discography-tracks.json` | トラック行 |
| `SUPABASE_SEED_REPORT.md` | 件数・null 統計・Storage 注意 |

**RLS / Auth / ルート `supabase/` への migration 追加は Phase 3-G 以降。** 入力 JSON が無い場合はエラーにせずレポートに「未生成」と記録します。

### Phase 3-F: Storage 画像移行準備

seed / data JSON 内の画像 URL を分類し、Supabase Storage 移行用マニフェストを生成します。**本番 Storage へのアップロードは行いません。**

```bash
node tools/static-to-astro/scripts/prepare-storage-assets.mjs \
  --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --out-dir tools/static-to-astro/output/storage-assets/gosaki \
  --report tools/static-to-astro/output/storage-assets/gosaki/STORAGE_ASSETS_REPORT.md \
  --astro-dir tools/static-to-astro/output/generated-astro
```

`--download` を付けた場合のみ `downloads/` にローカル保存（失敗しても続行）。seed JSON の URL **自動上書きはしません** — `storage-url-rewrite-plan.json` が差し替え案です。

**著作権・利用許諾は人間確認必須。** Wix 由来画像の再ホスト可否を確認してから Phase 3-H でアップロードしてください。

### Phase 3-G: Storage upload dry-run・seed URL rewrite 準備

Phase 3-F のマニフェストをもとに、**本番 Supabase Storage へはアップロードせず** アップロード計画と seed JSON の URL 差し替え dry-run を行います。デフォルトは常に dry-run です。

#### アップロード計画（dry-run）

```bash
node tools/static-to-astro/scripts/plan-storage-upload.mjs \
  --manifest tools/static-to-astro/output/storage-assets/gosaki/storage-assets-manifest.json \
  --out tools/static-to-astro/output/storage-assets/gosaki/STORAGE_UPLOAD_PLAN.md \
  --bucket site-assets \
  --public-base-url https://example.supabase.co/storage/v1/object/public/site-assets \
  --astro-dir tools/static-to-astro/output/generated-astro
```

`storage-assets-manifest.json` を読み、`target_path` / `expected_public_url` / `local_file` の有無をレポートします。**実際のアップロードは行いません。**

#### seed URL 差し替え（dry-run / `--apply`）

```bash
# dry-run（デフォルト — seed JSON は変更しない）
node tools/static-to-astro/scripts/rewrite-seed-image-urls.mjs \
  --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
  --rewrite-plan tools/static-to-astro/output/storage-assets/gosaki/storage-url-rewrite-plan.json \
  --public-base-url https://example.supabase.co/storage/v1/object/public/site-assets \
  --report tools/static-to-astro/output/storage-assets/gosaki/SEED_REWRITE_REPORT.md \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --supabase-report tools/static-to-astro/output/supabase-seed/gosaki/SUPABASE_SEED_REPORT.md

# 実書き換え（`--apply` 必須 — バックアップ `seed-*.json.bak-YYYYMMDD-HHmmss` を作成）
node tools/static-to-astro/scripts/rewrite-seed-image-urls.mjs \
  ...同上... \
  --apply
```

| 項目 | 内容 |
| --- | --- |
| 入力 | `storage-url-rewrite-plan.json` |
| 変換例 | Wix `cover_image_url` → `{public-base-url}/gosaki/discography/discography-001.png` |
| デフォルト | dry-run（seed 不変） |
| `--apply` | seed JSON を書き換え + タイムスタンプ付きバックアップ |
| 本番 Storage | **まだアップロードしない** |
| 本番 Sariswing | **影響なし**（`tools/static-to-astro/output/` のみ） |

#### `home_image_url`（schedules seed）

Phase 3-G で `generate-supabase-seed.mjs` が Astro `schedules.json` の **`home_image`** を seed の **`home_image_url`** にマップします。`schema-draft.sql` の `schedules` テーブル案にも `home_image_url text` を追加済みです。本番 DB には未適用です。

seed 再生成:

```bash
node tools/static-to-astro/scripts/generate-supabase-seed.mjs \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --out-dir tools/static-to-astro/output/supabase-seed/gosaki \
  --report tools/static-to-astro/output/supabase-seed/gosaki/SUPABASE_SEED_REPORT.md \
  --astro-dir tools/static-to-astro/output/generated-astro
```

rewrite plan を更新する場合は Phase 3-F の `prepare-storage-assets.mjs` を再実行してください。

### Phase 3-H: Admin prototype（JSON seed 管理 UI）

生成 Astro サイト内に **Supabase 接続前** の管理画面プロトタイプを追加します。Schedule / Discography の編集 UI・項目・操作感を確認するためのものです。

**配置:** `tools/static-to-astro/output/generated-astro/` のみ（本番 Sariswing には未適用）

| URL | 内容 |
| --- | --- |
| `/admin/` | ダッシュボード（件数・リンク） |
| `/admin/schedules/` | Schedule 一覧・月別/Home フィルタ・編集フォーム mock |
| `/admin/discography/` | Discography 一覧・tracks 表示・編集フォーム mock |

**データ:** `src/data/schedules.json`, `schedule-months.json`, `discography.json`（Supabase seed 相当のフィールド名で表示）

**保存:** 案A — 保存ボタン **disabled**。「Phase 3-I で Supabase 保存に接続」。本番 DB には書き込みません。

**未実装:** Auth、RLS、Basic 認証、Supabase 接続。本番公開前は **必ず `/admin/` を保護** してください。

```bash
cd tools/static-to-astro/output/generated-astro
npm run dev
# → http://localhost:4321/admin/
```

レポート: `output/cms-candidates/gosaki/ADMIN_PROTOTYPE_REPORT.md`

Supabase 接続・実保存は **Phase 3-J 以降**（Phase 3-I で仕様を先に固定）。

### Phase 3-I: CMS 仕様固定・実装計画

Supabase 接続**前**に、DB 設計・管理 UI 項目・Storage / Auth / RLS・公開サイト更新フローを文書化します。コード接続や本番 DB 保存は行いません。

**成果物:** `output/cms-candidates/gosaki/CMS_IMPLEMENTATION_PLAN.md`

| 固定した内容 |
| --- |
| Schedule / Discography テーブル・UI 項目分類（必須 / 通常 / 高度 / 読取専用） |
| Home 表示仕様（`show_on_home`, `home_order`, 最大3件, 過去イベント扱い） |
| Storage パス・bucket・URL 保存方針 |
| Auth / RLS 原則（公開 read = published, 管理 write = admin role） |
| 公開サイト更新フロー（Supabase → JSON export → build → deploy） |
| デプロイ先比較（ロリポップ FTP / Vercel / Netlify / Cloudflare Pages） |
| Phase 3-J〜O 実装順序 |

**なぜ接続前に仕様固定か:** Admin プロトタイプ（3-H）で UI を確認した段階で、RLS・Storage・Auth の順序を誤ると安全に進められないため。Sariswing で得た知見を Kit 一般化してから staging 接続する。

**次フェーズ:** Phase 3-J — tooling 用 staging Supabase + seed insert（service role CLI のみ）。

### Phase 3-J: Staging Supabase seed insert

`output/supabase-seed/gosaki/` の seed JSON を検証し、staging Supabase へ投入する CLI。**デフォルトは dry-run**（Supabase 未接続）。`--apply` 時のみ upsert します。

#### 必要ファイル

```text
tools/static-to-astro/
├── .env.example              # 認証情報テンプレート（コミット可）
├── .env.local                # 実認証情報（.gitignore、コミット禁止）
└── scripts/
    ├── insert-supabase-seed.mjs
    └── lib/
        └── supabase-seed-inserter.mjs
```

#### 実行方法

リポジトリルート（`sariswing-astro/`）から実行:

```bash
# dry-run（デフォルト）— .env.local 不要、Supabase 未接続
node tools/static-to-astro/scripts/insert-supabase-seed.mjs \
  --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
  --report tools/static-to-astro/output/supabase-seed/gosaki/INSERT_SEED_REPORT.md

# staging へ実書き込み（事前に schema-draft.sql を staging SQL Editor で手動適用）
cd tools/static-to-astro && npm install @supabase/supabase-js
cp .env.example .env.local   # staging の URL / service role key を記入

node tools/static-to-astro/scripts/insert-supabase-seed.mjs \
  --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
  --report tools/static-to-astro/output/supabase-seed/gosaki/INSERT_SEED_REPORT.md \
  --apply
```

| 項目 | 内容 |
| --- | --- |
| 投入順 | `schedule_months` → `schedules` → `discography` → `discography_tracks` |
| upsert キー | `schedule_months.month`, `schedules.legacy_id`, `discography.legacy_id` |
| tracks | composite UNIQUE なし → 対象 `discography_legacy_id` の既存行削除後に insert |
| DDL | `schema-draft.sql` は**手動適用のみ**（DROP TABLE の有無・UNIQUE 制約を人間が確認） |
| `--apply` preflight | `https://` URL、末尾スラッシュ正規化、空キー拒否、prod/production URL 拒否 |
| 出力 | `INSERT_SEED_REPORT.md`（`output/` は .gitignore） |

#### schema-draft.sql 適用前の確認

- この CLI は **DDL を自動適用しない**
- staging Supabase SQL Editor で人間が内容を確認してから適用する
- `DROP TABLE` が含まれていないか確認する
- upsert に必要な UNIQUE: `schedule_months.month`, `schedules.legacy_id`, `discography.legacy_id`
- `discography_tracks` は現状 delete-then-insert（本番ではトランザクション必須）

#### 投入後確認 SQL（staging SQL Editor）

`--apply` 成功後、件数・参照整合性を確認:

```sql
-- 件数確認
SELECT 'schedule_months' AS tbl, COUNT(*) FROM schedule_months
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL
SELECT 'discography', COUNT(*) FROM discography
UNION ALL
SELECT 'discography_tracks', COUNT(*) FROM discography_tracks;

-- Home掲載確認
SELECT legacy_id, title, show_on_home, home_order
FROM schedules
WHERE show_on_home = true
ORDER BY home_order;

-- orphan schedules確認
SELECT s.legacy_id, s.title, s.month
FROM schedules s
LEFT JOIN schedule_months m ON s.month = m.month
WHERE m.month IS NULL;

-- orphan tracks確認
SELECT t.discography_legacy_id, t.track_number, t.title
FROM discography_tracks t
LEFT JOIN discography d ON t.discography_legacy_id = d.legacy_id
WHERE d.legacy_id IS NULL;

-- published確認
SELECT published, COUNT(*) FROM schedules GROUP BY published;
SELECT published, COUNT(*) FROM discography GROUP BY published;
```

#### 安全ルール

- `--apply` なしは完全 dry-run（Supabase 未接続）
- `.env` / `.env.local` / `.env.*.local` は `.gitignore` 対象
- service role key は `.env.local` のみ。フロント・Git に出さない
- 本番 Supabase / Storage には接続しない
- ルート `supabase/` や本番 `src/` には触れない

### Phase 3-K: Supabase → Astro JSON export

staging Supabase に投入済みの CMS データを **read-only** で読み取り、生成 Astro サイト（`output/generated-astro/`）の `src/data/*.json` を上書きします。export 後に `npm run build` で Schedule / Discography / HomeSchedule が壊れないことを確認します。

**書き込み禁止:** insert / update / delete / upsert は行いません。

#### 実行方法

```bash
node tools/static-to-astro/scripts/export-supabase-json.mjs \
  --out-astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/supabase-export/gosaki/SUPABASE_EXPORT_REPORT.md
```

| 項目 | 内容 |
| --- | --- |
| 認証 | `tools/static-to-astro/.env.local`（staging のみ） |
| 読取テーブル | `schedule_months`, `schedules`, `discography`, `discography_tracks` |
| 出力 JSON | `src/data/schedule-months.json`, `schedules.json`, `discography.json` |
| 互換フィールド | `id`, `image`, `home_image`, `cover_image` 等（Astro コンポーネント向け） |
| build | export 後に `npm run build` を自動実行（`--skip-build` で省略可） |
| レポート | `SUPABASE_EXPORT_REPORT.md` + `CONVERSION_REPORT.md` 追記 |
| コミット | `output/` は `.gitignore` 対象 |

#### build 確認（手動）

```bash
cd tools/static-to-astro/output/generated-astro
npm run build
```

#### 投入後確認 SQL（staging SQL Editor）

export 前後で staging DB の件数・整合性を確認する場合:

```sql
-- 件数確認
SELECT 'schedule_months' AS tbl, COUNT(*) FROM schedule_months
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL
SELECT 'discography', COUNT(*) FROM discography
UNION ALL
SELECT 'discography_tracks', COUNT(*) FROM discography_tracks;

-- Home掲載確認
SELECT legacy_id, title, show_on_home, home_order
FROM schedules
WHERE show_on_home = true
ORDER BY home_order;

-- orphan schedules確認
SELECT s.legacy_id, s.title, s.month
FROM schedules s
LEFT JOIN schedule_months m ON s.month = m.month
WHERE m.month IS NULL;

-- orphan tracks確認
SELECT t.discography_legacy_id, t.track_number, t.title
FROM discography_tracks t
LEFT JOIN discography d ON t.discography_legacy_id = d.legacy_id
WHERE d.legacy_id IS NULL;

-- published確認
SELECT published, COUNT(*) FROM schedules GROUP BY published;
SELECT published, COUNT(*) FROM discography GROUP BY published;
```

### Phase 3-L: Admin UI Supabase read-only

`output/generated-astro/` 内の Admin プロトタイプ（`/admin/`）を **staging Supabase から read-only** で読み込みます。Astro ページの frontmatter（server-side / build-time）で `@supabase/supabase-js` を使い、**service role key をブラウザに出しません**。

公開サイトの `src/data/*.json`（Phase 3-K export）はそのまま。Admin のみ Supabase direct read です。

| 項目 | 内容 |
| --- | --- |
| 方式 | **Supabase direct read**（Astro frontmatter、非 API route） |
| 認証 | `process.env.SUPABASE_URL` + `process.env.SUPABASE_SERVICE_ROLE_KEY` |
| 書き込み | **禁止** — 保存ボタンは disabled のまま |
| 配置 | `output/generated-astro/src/lib/supabase-admin-read.ts` |

#### 実行手順（dev）

```bash
cd tools/static-to-astro
set -a && source .env.local && set +a
cd output/generated-astro
npm install
npm run dev
```

確認 URL: `/admin/`, `/admin/schedules/`, `/admin/discography/`

#### build 確認

```bash
cd tools/static-to-astro
node scripts/verify-admin-supabase-read.mjs
```

または手動:

```bash
cd tools/static-to-astro
set -a && source .env.local && set +a
cd output/generated-astro && npm run build
```

#### 成果物（output/ — .gitignore）

- `output/generated-astro/src/lib/supabase-admin-read.ts`
- `output/generated-astro/src/pages/admin/*.astro`（Supabase read 対応）
- `output/cms-candidates/gosaki/ADMIN_SUPABASE_READ_REPORT.md`
- `output/generated-astro/CONVERSION_REPORT.md`（Phase 3-L 追記）

tooling 側（コミット可）: `scripts/verify-admin-supabase-read.mjs`, README

### Phase 3-M: Auth / RLS SQL draft

CMS テーブル向け **Auth / RLS policy draft** を生成します。**Supabase には接続・適用しません。** staging SQL Editor で人間がレビューしてから適用してください。

| 項目 | 内容 |
| --- | --- |
| 管理者モデル（推奨候補） | `admin_users` テーブル + `is_admin()` |
| Public read | `published = true`（tracks は親 discography も published） |
| Table GRANT | `GRANT SELECT` on CMS tables to anon / authenticated（policy とセット必須） |
| Admin write | `is_admin()` で CMS テーブル CRUD（draft のみ） |
| Admin UI 保存 | **まだ無効** |
| service role | RLS バイパス — ブラウザに出さない |

#### 実行

```bash
node tools/static-to-astro/scripts/generate-rls-draft.mjs \
  --out-dir tools/static-to-astro/output/rls/gosaki
```

#### 生成ファイル（`output/rls/gosaki/` — .gitignore）

| ファイル | 内容 |
| --- | --- |
| `rls-draft.sql` | `admin_users`, `is_admin()`, GRANT SELECT, RLS enable, policies |
| `rls-verify.sql` | 適用後確認 SQL |
| `RLS_IMPLEMENTATION_REPORT.md` | 概要・安全スキャン・次ステップ |

**GRANT SELECT:** RLS policy だけでは Data API 経由の anon `select` が `permission denied for table` になる場合があります。public read には **GRANT + policy の両方**が必要です。`service_role` は RLS バイパス、`anon` / `authenticated` は grant + policy がセットです。詳細: `docs/phase3-m-auth-rls.md`

#### 危険 SQL チェック（生成後）

```bash
grep -Ei "drop table|drop schema|truncate|delete from" \
  tools/static-to-astro/output/rls/gosaki/rls-draft.sql
```

`drop policy if exists` のみ OK。`DROP TABLE` / `TRUNCATE` / `DELETE FROM` は含めません。

#### staging 適用（手動 — Phase 3-M では実行しない）

1. `rls-draft.sql` を staging SQL Editor で実行（**GRANT SELECT 含む**）
2. Auth ユーザー作成 → service role で `admin_users` に 1 行 insert
3. `rls-verify.sql` で確認

### Phase 3-N continued: anon 公開読取 RLS 検証

staging で RLS 適用後、**anon / publishable key** が `published = true` の行のみ読めることを検証します。テスト行は `rls-test-*` のみ作成・削除します。

**前提:** `rls-draft.sql` の **GRANT SELECT** が適用済みであること。policy のみだと `permission denied for table schedules` となる（Phase 3-N 初回で確認済み）。`rls-draft.sql` 再生成後は GRANT も同ファイルに含まれます。

| 項目 | 内容 |
| --- | --- |
| デフォルト | dry-run（読取のみ、書込なし） |
| `--apply` | service role でテスト行作成 → anon 検証 → cleanup |
| 既存 seed | **変更・削除しない** |
| 削除対象 | `rls-test-*` のみ |

#### 実行

```bash
# dry-run
node tools/static-to-astro/scripts/verify-anon-rls.mjs \
  --report tools/static-to-astro/output/rls/gosaki/ANON_RLS_VERIFY_REPORT.md

# apply（staging のみ — 本番では実行しない）
node tools/static-to-astro/scripts/verify-anon-rls.mjs \
  --report tools/static-to-astro/output/rls/gosaki/ANON_RLS_VERIFY_REPORT.md \
  --apply
```

`.env.local` に `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`（`sb_publishable_...` 可）が必要です。**キーはログ出力しません。**

出力: `output/rls/gosaki/ANON_RLS_VERIFY_REPORT.md`

---

### Phase 3-O: Auth user bootstrap + admin_users 登録

staging で管理者 Auth ユーザーを作成（または既存再利用）し、`admin_users` に登録します。**Admin UI 保存はまだ無効**。**CMS テーブルには書き込みません。**

| 項目 | 内容 |
| --- | --- |
| デフォルト | dry-run（読取のみ） |
| `--apply` | Auth ユーザー作成/再利用 + `admin_users` upsert |
| 書込対象 | Auth + `admin_users` のみ |
| CMS テーブル | **変更なし** |
| 既存 Auth ユーザー | 削除しない・パスワード変更しない |

#### 実行

```bash
# dry-run
node tools/static-to-astro/scripts/bootstrap-admin-user.mjs \
  --email your-admin@example.com \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_USER_BOOTSTRAP_REPORT.md

# apply（staging のみ — 本番では実行しない）
# パスワードは .env.local の SUPABASE_ADMIN_PASSWORD 推奨（シェル履歴に残さない）
node tools/static-to-astro/scripts/bootstrap-admin-user.mjs \
  --email your-admin@example.com \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_USER_BOOTSTRAP_REPORT.md \
  --apply
```

`.env.local`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`（apply 時）, `SUPABASE_ADMIN_PASSWORD`（新規ユーザー時推奨）。

**service role key** は Auth 作成・`admin_users` 登録のみ。**password / token / key はログ出力しません。**

出力: `output/rls/gosaki/ADMIN_USER_BOOTSTRAP_REPORT.md`

---

### Phase 3-P-A: Admin API route 認証確認

generated-astro に `GET /api/admin/me.json` を追加し、**Authorization: Bearer access_token** で admin 判定を返します。**保存 API は未実装**。**CMS / admin_users への書込なし。**

| 項目 | 内容 |
| --- | --- |
| エンドポイント | `GET /api/admin/me.json` |
| 認証 | `Authorization: Bearer <access_token>` |
| service role | server-side のみ（`admin_users` 照会・`getUser(token)` 補助） |
| Admin UI 保存 | **まだ無効** |

#### 検証

```bash
node tools/static-to-astro/scripts/verify-admin-api-auth.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_API_AUTH_VERIFY_REPORT.md
```

`.env.local`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_ADMIN_PASSWORD`（必須）。email は `--email` / `SUPABASE_ADMIN_EMAIL` / git `user.email`。

**key leak scan:** `dist/` に service role key / password / token が含まれないことを確認。**秘密値はログに出しません。**

出力: `output/rls/gosaki/ADMIN_API_AUTH_VERIFY_REPORT.md`

---

### Phase 3-P-B: Schedule 1件 update API

`POST /api/admin/schedules/update.json` で **`legacy_id` 指定の1件だけ** `schedules` を update します。insert / delete / upsert / 一括更新は**禁止**。**Admin UI 保存ボタンは disabled のまま**（案A）。

| 項目 | 内容 |
| --- | --- |
| エンドポイント | `POST /api/admin/schedules/update.json` |
| 認証 | `Authorization: Bearer <access_token>` 必須 |
| 未ログイン | HTTP 401 `error: unauthenticated` |
| 非 admin | HTTP 403 `error: forbidden` |
| 許可フィールド | `title`, `venue`, `published`, …（最小: title/venue/published） |
| 禁止フィールド | `legacy_id`, `date`, `month`, `source_*`, `image_url`, … |

#### 検証

```bash
node tools/static-to-astro/scripts/verify-admin-schedule-update.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --legacy-id schedule-2026-03-011 \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UPDATE_VERIFY_REPORT.md
```

検証 CLI は **1件だけ一時更新 → cleanup で元の title/venue/published に復元** します。件数変化なし・key leak scan 実施。

出力: `output/rls/gosaki/ADMIN_SCHEDULE_UPDATE_VERIFY_REPORT.md`

---

### Phase 3-P-C: Admin UI Schedule 1件 save

`/admin/schedules/` から**選択中の1件だけ** `POST /api/admin/schedules/update.json` で保存します。保存前に `confirm()` あり。**Discography / insert / delete は未実装。**

| 項目 | 内容 |
| --- | --- |
| UI保存対象 | 選択中 `legacy_id` 1件のみ |
| 許可フィールド | `title`, `venue`, `published` |
| 認証 | browser localStorage の Supabase session → Bearer token |
| 保存ボタン | 未選択 / 未ログイン / 保存中は disabled |

#### 検証

```bash
node tools/static-to-astro/scripts/verify-admin-schedule-ui-save.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --legacy-id schedule-2026-03-011 \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md
```

Playwright で UI click E2E → cleanup で元の title/venue/published に復元。`--no-browser` で API fallback 可。

出力: `output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md`

---

### Phase 3-P-D: Schedule 保存対象フィールド拡張

Phase 3-P-C の UI 1件 save を拡張し、実運用で必要な Schedule フィールドも保存できるようにします。**insert / delete / upsert / Discography / Storage は未実装。**

| 項目 | 内容 |
| --- | --- |
| UI保存対象 | 選択中 `legacy_id` 1件のみ |
| 許可フィールド | `title`, `venue`, `open_time`, `start_time`, `price`, `description`, `show_on_home`, `home_order`, `published` |
| 禁止フィールド | `legacy_id`, `date`, `year`, `month`, `source_file`, `source_route`, `image_url`, `home_image_url`, `created_at`, `updated_at` |
| Home 掲載 | `show_on_home` / `home_order` も保存可。最大3件運用を想定（**今回は超過制限なし**、Phase 3-P-E で追加予定） |
| `home_order` | 空欄は **null** として正規化 |
| 認証 | browser localStorage の Supabase session → Bearer token |

#### 検証

```bash
node tools/static-to-astro/scripts/verify-admin-schedule-ui-save.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --legacy-id schedule-2026-03-011 \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md
```

Playwright で UI click E2E → 拡張フィールドを一時更新 → **cleanup で元の全フィールドに復元**。`published` は検証中も元値維持（anon 公開への影響回避）。`--no-browser` で API fallback 可。

出力: `output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md`

---

### Phase 3-P-E: Home featured 掲載数チェック（最大3件）

Admin UI から Schedule を保存する際、`schedules.show_on_home = true` の件数が **最大3件** を超えないよう API で拒否します。設計上は **featured on home** モジュールの上限チェックとして整理しており、将来 `news.featured_on_home` / `events.show_on_home` などへ拡張可能です。**Discography / News 実装 / Storage は未実装。**

| 項目 | 内容 |
| --- | --- |
| 定数 | `HOME_FEATURED_LIMIT = 3` |
| 今回の対象 | `schedules.show_on_home` |
| 将来の拡張 | `news.featured_on_home`, `events.show_on_home`, `works.featured_on_home` 等 |
| 4件目の追加 | HTTP 400 `home_featured_limit_exceeded` |
| 整合性 | `show_on_home = true` は `published = true` 必須 |
| UI表示 | `Home featured: N / 3`、上限時の注意書き |

#### 検証

```bash
node tools/static-to-astro/scripts/verify-admin-schedule-ui-save.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --legacy-id schedule-2026-03-011 \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md
```

通常 UI save → cleanup restore → **4件目掲載を API で拒否**（limit validation は API 経由）→ final home featured count = 3 を確認。

出力: `output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md`

---

### Phase 3-P-F: Discography 1件 update API + UI save

`/admin/discography/` から**選択中の1件だけ** `POST /api/admin/discography/update.json` で保存します。保存前に `confirm()` あり。**tracks / insert / delete / Storage は未実装。**

| 項目 | 内容 |
| --- | --- |
| エンドポイント | `POST /api/admin/discography/update.json` |
| UI保存対象 | 選択中 `legacy_id` 1件のみ |
| 許可フィールド | `title`, `artist`, `release_date`, `year`, `label`, `catalog_number`, `description`, `purchase_url`, `streaming_url`, `published`, `sort_order` |
| 禁止フィールド | `legacy_id`, `cover_image_url`, `tracks`, `source_*`, `created_at`, `updated_at` |
| tracks | **読取専用** — `discography_tracks` テーブルには触れない |
| 認証 | browser localStorage の Supabase session → Bearer token |

#### 検証

```bash
node tools/static-to-astro/scripts/verify-admin-discography-ui-save.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --legacy-id discography-001 \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_DISCOGRAPHY_UI_SAVE_VERIFY_REPORT.md
```

Playwright で UI click E2E → 一時更新 → **cleanup で元の全フィールドに復元**。`discography_tracks` 不変・件数不変を確認。`--no-browser` で API fallback 可。

出力: `output/rls/gosaki/ADMIN_DISCOGRAPHY_UI_SAVE_VERIFY_REPORT.md`

---

### Phase 3-P-G: Discography tracks update API + UI save

`/admin/discography/` から**選択中 Discography の既存 tracks だけ** `POST /api/admin/discography/tracks/update.json` で保存します。**track 追加・削除・track_number 変更・discography 本体更新は禁止。**

| 項目 | 内容 |
| --- | --- |
| エンドポイント | `POST /api/admin/discography/tracks/update.json` |
| 識別キー | `discography_legacy_id` + `track_number` |
| 許可フィールド | `title`, `sort_order`（各 track 内） |
| 禁止 | insert / delete / upsert / track_number 変更 / discography 本体更新 |
| UI | 「Tracksを保存」ボタン（Discography 本体保存と分離）、保存前 `confirm()` |
| 認証 | browser localStorage の Supabase session → Bearer token |

#### 検証

```bash
node tools/static-to-astro/scripts/verify-admin-discography-tracks-ui-save.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --legacy-id discography-001 \
  --report tools/static-to-astro/output/rls/gosaki/ADMIN_DISCOGRAPHY_TRACKS_UI_SAVE_VERIFY_REPORT.md
```

Playwright で tracks 1〜2件を一時更新 → **cleanup で元 tracks に復元**。discography 本体不変・tracks 件数不変を確認。`--no-browser` で API fallback 可。

出力: `output/rls/gosaki/ADMIN_DISCOGRAPHY_TRACKS_UI_SAVE_VERIFY_REPORT.md`

---

### Phase 3-Q: CMS最小ループ統合確認

Phase 3-P まで個別に検証してきた CMS 機能を、**実運用に近い一連の流れ**として統合確認します。

| ステップ | 内容 |
| --- | --- |
| 1 | staging Supabase の既存データを Admin API で一時編集 |
| 2 | Supabase → JSON export（`export-supabase-json.mjs` 相当） |
| 3 | generated-astro を `npm run build` |
| 4 | build 後の公開 HTML に一時編集内容（`[CMS LOOP TEST]`）が反映されることを確認 |
| 5 | cleanup で Supabase の値を baseline に復元 |
| 6 | 再度 export / rebuild |
| 7 | HTML から `[CMS LOOP TEST]` が消え、件数・レコードが baseline と一致することを確認 |
| 8 | `dist/` key leak scan |

#### 検証対象（update は各 1 件のみ）

| 種別 | legacy_id / track | 一時変更 |
| --- | --- | --- |
| Schedule | `schedule-2026-03-011` | title / venue / description |
| Discography 本体 | `discography-001` | title / artist / description |
| Discography track | `discography-001` track 1 | title |

#### 検証 CLI

```bash
node tools/static-to-astro/scripts/verify-cms-minimal-loop.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/rls/gosaki/CMS_MINIMAL_LOOP_VERIFY_REPORT.md
```

オプション: `--schedule-legacy-id`, `--discography-legacy-id`, `--track-number`, `--skip-build`, `--help`

- **update 方式:** 既存 Admin API route 経由（`POST /api/admin/schedules/update.json` 等）
- **禁止:** insert / delete / upsert / 一括 update / track 追加・削除 / Storage upload
- **必須:** cleanup で必ず baseline に復元（失敗時はエラー）
- **本番では実行しない**（staging Supabase / generated-astro のみ）
- **未実装:** Storage upload / deploy 自動化

出力: `output/rls/gosaki/CMS_MINIMAL_LOOP_VERIFY_REPORT.md`

---

### Phase 3-R: 商品化・本番化前レビュー

Phase 3-Q までで **CMS 最小ループは staging 上で成立** していますが、Admin/API/adapter の多くは **`output/generated-astro` に直接実装** されており、generator 統合前の状態です。本フェーズでは **実装を増やさず**、商品化・本番化前の棚卸しと次フェーズ設計を行います。

| 項目 | 内容 |
| --- | --- |
| 目的 | 汎用ツール / サイトテンプレート / CMS Kit / gosaki fixture の境界整理 |
| レビュー本編 | [`docs/phase3-r-productization-review.md`](docs/phase3-r-productization-review.md) |
| CMS Kit 構成案 | [`docs/cms-kit-architecture.md`](docs/cms-kit-architecture.md) |
| generator 統合計画 | [`docs/generated-astro-integration-plan.md`](docs/generated-astro-integration-plan.md) |

**現時点の結論（要約）:**

- CMS 最小ループ（Admin → Supabase → export → build → HTML → cleanup）は PASS
- **Storage upload / deploy 自動化 / 本番 Supabase 接続は未実装**
- **Sariswing / ロリポップ FTP 型**では公開サイトは **完全静的**、Admin は **別ホスト or CLI** が現実的
- 次優先: **Phase 3-S**（generator テンプレート化）→ **3-T**（Admin 分離）→ **3-U**（Storage）

**本番では実行しない:** 本レビューはドキュメント作成のみ。本番 Sariswing / Supabase / Storage には触れません。

---

### Phase 3-S: Admin/API generator テンプレート化

Phase 3-P〜Q で `output/generated-astro` に直接実装してきた Admin UI / API / save logic を **`templates/admin-cms/`** として固定し、`convert-static-to-astro` から再生成できるようにします。

| 項目 | 内容 |
| --- | --- |
| テンプレート | `tools/static-to-astro/templates/admin-cms/` |
| CLI オプション | `--with-admin-cms`（未指定時は従来どおり Admin/API なし） |
| adapter | `@astrojs/node` + `@supabase/supabase-js` を generated-astro の `package.json` / `astro.config.mjs` に追加 |
| データ JSON | テンプレートは空配列 stub → **`export-supabase-json.mjs` で上書き** |

#### convert（Admin CMS あり）

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --verify-build \
  --with-admin-cms
```

#### 生成される主なファイル

- `src/pages/admin/*`, `src/pages/api/admin/*`
- `src/lib/admin-*.ts`, `supabase-admin-read.ts`, `home-featured-limit.ts`
- `src/components/admin/*`, `src/styles/admin.css`
- データ駆動公開 CMS: `ScheduleList`, `HomeSchedule`, `DiscographyList` + 対応 page overrides
- `.env.example`（secret 実値なし）

#### static FTP hosting 注意

- **ロリポップ等の静的 FTP では `/api/admin/*` は動きません**（Node server 不在）
- 公開は `dist/client/` のみ FTP、Admin は **別ホスト** または **ローカル dev + export CLI** を検討（Phase 3-R / 3-T）
- CMS 最小ループ検証: `verify-cms-minimal-loop.mjs`（export 後に実行）

出力レポート: `output/generated-astro/CONVERSION_REPORT.md`（Admin CMS template セクション）、`output/admin-cms-template/gosaki/ADMIN_CMS_TEMPLATE_REPORT.md`

---

### Phase 3-T: Admin別ホスト / static-only公開 build分離

`--with-admin-cms` の hybrid build 出力を **静的 FTP 公開** と **Admin/API（Node）** に分離できるか検証・整理します。

| パス | 役割 | FTP |
| --- | --- | --- |
| `dist/client/` | 公開 HTML/CSS（**`admin/` HTML が混在しうる**） | 直アップロード非推奨 |
| `dist/server/` | Node SSR + `/api/admin/*` | **不可** |
| `output/static-public/gosaki/public-dist/` | admin 除外済み静的 artifact | **FTP 推奨** |

#### 検証 CLI

```bash
node tools/static-to-astro/scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/static-public/gosaki/STATIC_PUBLIC_ARTIFACT_REPORT.md
```

- `--public-dir` 未指定時: `dist/client` → `dist` の順で自動検出
- **secret leak scan**、Admin/API 混在チェック、**除外コピー + manifest** 生成
- `static-public-manifest.json`: `safeForStaticFtp`, `excluded: ["admin"]` 等

#### 運用方針

- **公開サイト:** `public-dist/` をロリポップ FTP 等へ
- **Admin/API:** Node 対応ホスト、ローカル dev、または将来別アプリ（[docs/admin-hosting-strategy.md](docs/admin-hosting-strategy.md)）
- 公開 HTML は `src/data/*.json` から静的生成 → **Supabase key 不要**

---

### Phase 3-V: Deploy workflow（public-dist 対象 FTP CI）

Phase 3-T の `public-dist/` を **FTP 公開対象** とする GitHub Actions **テンプレート** と dry-run verifier を用意します。**本番 FTP 実行・root workflow 有効化は行いません。**

| 項目 | 内容 |
| --- | --- |
| Workflow テンプレート | `templates/github-actions/public-dist-ftp-deploy.yml` |
| Deploy 対象 | `output/static-public/<site>/public-dist/` **のみ** |
| 禁止 | `dist/client/` 直 deploy、`dist/server/`、`/admin/`、`/api/admin/`、`.env.local` |
| Gate | `verify-static-public-artifact.mjs` + `safeForStaticFtp` assert |

#### Workflow テンプレート検証

```bash
node tools/static-to-astro/scripts/verify-public-dist-deploy-workflow.mjs \
  --workflow-template tools/static-to-astro/templates/github-actions/public-dist-ftp-deploy.yml \
  --report tools/static-to-astro/output/deploy/gosaki/PUBLIC_DIST_DEPLOY_WORKFLOW_REPORT.md
```

#### GitHub Secrets（テンプレート参照名のみ）

`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_SERVER_DIR`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

詳細: [docs/public-dist-ftp-deploy.md](docs/public-dist-ftp-deploy.md)

**未実装:** 本番 FTP deploy、Storage upload、Admin 別ホスト実 deploy

---

### CMS Kit generalization roadmap（G-5）

gosaki / Sariswing で実証した移行フローを、**別サイト向け CMS Kit template** として一般化する設計・ロードマップです。今回は doc 固定のみ（upload / DB / FTP 未実施）。

| 項目 | 内容 |
| --- | --- |
| **Roadmap** | [docs/cms-kit-generalization-roadmap.md](docs/cms-kit-generalization-roadmap.md) |
| Site config draft | [config/sites/gosaki.site-config.example.json](config/sites/gosaki.site-config.example.json) |
| 方針 | **site-config driven migration**（G-5c 以降）、**template registry**、**schema adapter** |
| Workflow | **staging-first** — G-4 成功フローは後方互換維持 |
| 実装フェーズ | G-5a〜**G-5n admin Media** → G-5o〜q |
| **G-5c usage** | [docs/site-config-cli-usage.md](docs/site-config-cli-usage.md) |
| **G-5d registry** | [docs/cms-template-registry.md](docs/cms-template-registry.md) |
| **G-5e adapters** | [docs/cms-schema-adapters.md](docs/cms-schema-adapters.md) |
| **G-5f staging plan** | [docs/staging-generation-plan.md](docs/staging-generation-plan.md) |
| **G-5g dry-run** | [docs/site-generation-dry-run.md](docs/site-generation-dry-run.md) |
| **G-5h onboarding** | [docs/cms-kit-onboarding-runbook.md](docs/cms-kit-onboarding-runbook.md) |
| **G-5i Admin CMS** | [docs/admin-cms-template-extraction-plan.md](docs/admin-cms-template-extraction-plan.md) |
| **G-5j inventory** | [docs/admin-cms-code-inventory.md](docs/admin-cms-code-inventory.md) |
| **G-5k UI registry** | [docs/admin-ui-components-registry.md](docs/admin-ui-components-registry.md) |
| **G-5l UI shell** | [docs/admin-ui-shell-scaffold.md](docs/admin-ui-shell-scaffold.md) |
| **G-5m-a CRUD UI** | [docs/admin-crud-ui-scaffold.md](docs/admin-crud-ui-scaffold.md) |
| **G-5m-b Auth** | [docs/admin-auth-abstraction-scaffold.md](docs/admin-auth-abstraction-scaffold.md) |
| **G-5n Media** | [docs/admin-media-upload-abstraction.md](docs/admin-media-upload-abstraction.md) |

**G-5c（完了）:** read-only CLI が `--site-config` を受け取り、path を補完。明示引数優先。

**G-5d（完了）:** CMS template registry — `musician-basic`（gosaki 実績）+ 3 draft templates。`inspect-cms-template.mjs` で read-only 検証。

**G-5e（完了）:** CMS schema adapter — `musician-basic-supabase-v1`（gosaki 実績）+ 3 draft adapters。`inspect-schema-adapter.mjs` で read-only 検証。

**G-5f（完了）:** `plan-staging-generation.mjs` — staging generation plan（read-only）。

**G-5g（完了）:** `generate-site-dry-run.mjs` — plan から dry-run generation package。実 Astro / DB / Storage / FTP は未実施。

**G-5h（完了）:** [CMS Kit onboarding runbook](docs/cms-kit-onboarding-runbook.md) — 新規顧客サイト導入。**production requires explicit approval**。

**G-5i（完了）:** [Admin CMS template extraction plan](docs/admin-cms-template-extraction-plan.md) — extraction roadmap（G-5l〜q）。

**G-5j（完了）:** [Sariswing admin code inventory](docs/admin-cms-code-inventory.md) — read-only scan（55 files）。**no code extraction**。

**G-5k（完了）:** [Admin UI components registry](docs/admin-ui-components-registry.md) — 28 components registry。

**G-5l（完了）:** [Admin UI shell scaffold](docs/admin-ui-shell-scaffold.md) — 10 low-risk shell components。

**G-5m-a（完了）:** [Admin CRUD UI scaffold](docs/admin-crud-ui-scaffold.md) — CRUD primitives + module UIs。

**G-5n（完了）:** [Admin Media upload abstraction](docs/admin-media-upload-abstraction.md) — Media UI + storageMappings policy。Supabase Storage 未接続。次: **G-5o** Publish workflow。

```bash
node tools/static-to-astro/scripts/inventory-admin-cms.mjs --root .
```

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5m-a
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5m-b
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5n
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category media
```

```bash
node tools/static-to-astro/scripts/inspect-cms-template.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/plan-staging-generation.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/review-storage-assets.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

関連: [site-profile-system.md](docs/site-profile-system.md)（既存 module 宣言）/ [gosaki-storage-image-migration-runbook.md](docs/gosaki-storage-image-migration-runbook.md)

---

### Gosaki storage image migration runbook（G-4h）

G-4a〜G-4g で確立した **gosaki staging 画像移行**の正式手順です。

| 項目 | 内容 |
| --- | --- |
| **Runbook** | [docs/gosaki-storage-image-migration-runbook.md](docs/gosaki-storage-image-migration-runbook.md) |
| 境界 | **staging-only** — upload と DB update は分離 |
| Schedule | **human review 必須**（自動 promote しない） |
| 現状 | discography cover 4件 + Golden PODs home 1件 完了 |

---

### Phase 3-U: Storage upload / image pipeline（dry-run plan）

CMS 画像（Schedule flyer / home image / Discography cover）の **Supabase Storage 載せ替え計画** を dry-run で生成します。**実アップロード・bucket 作成・RLS 適用は行いません。**

| 項目 | 内容 |
| --- | --- |
| 設計 doc | [docs/storage-image-pipeline.md](docs/storage-image-pipeline.md) |
| Plan CLI | `plan-storage-assets.mjs` |
| Upload CLI | `upload-storage-assets.mjs`（G-4b: `--apply` で staging upload、DB update なし） |
| 対象フィールド | `schedules.image_url`, `schedules.home_image_url`, `discography.cover_image_url` |
| Bucket 案 | `site-assets` / `{siteSlug}/schedule|discography/...` |

#### Plan 実行

```bash
node tools/static-to-astro/scripts/plan-storage-assets.mjs \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_PLAN_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json
```

`--seed-dir`（`seed-*.json`）と `--data-dir`（`schedules.json` / `discography.json`）は併用可。readiness は export 済み `src/data` を使用。

**action 分類:** `supabase` → keep / `wix|external` → **review-required** / `local` → download-and-upload 候補（dry-run）/ `empty` → skip

**禁止（Phase 3-U）:** Wix/external の自動再ホスト、本番 Storage 接続、Storage policy 適用

#### G-4a: Review manifest（fixture → legacy_id、read-only）

staging export では `example.supabase.co` が sanitize され plan 入力がすべて empty になるため、**fixture HTML から実画像候補を抽出**する review manifest を別途生成します。

| 項目 | 内容 |
| --- | --- |
| CLI | `review-storage-assets.mjs` |
| 設計 doc | [docs/gosaki-storage-g4-prep.md](docs/gosaki-storage-g4-prep.md) §9 / [runbook](docs/gosaki-storage-image-migration-runbook.md) |
| Site config | `--site-config` でも実行可 — [site-config-cli-usage.md](docs/site-config-cli-usage.md) |
| 出力 | `storage-asset-review-manifest.json` / `STORAGE_ASSET_REVIEW_REPORT.md` |

```bash
node tools/static-to-astro/scripts/review-storage-assets.mjs \
  --site-slug gosaki \
  --fixture-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_REVIEW_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json
```

**禁止（G-4a）:** Supabase Storage upload、DB update、FTP deploy。全 entry は `reviewRequired: true`。

#### G-4b-prep: Upload allowlist（review manifest → staging gate、read-only）

G-4a manifest から **staging upload 候補のみ**を allowlist 化します。本番使用許諾は未確定です。

| 項目 | 内容 |
| --- | --- |
| CLI | `prepare-storage-upload-allowlist.mjs` |
| 設計 doc | [docs/gosaki-storage-g4-prep.md](docs/gosaki-storage-g4-prep.md) §10 |
| 出力 | `storage-upload-allowlist.json` / `STORAGE_UPLOAD_ALLOWLIST_REPORT.md` |

```bash
node tools/static-to-astro/scripts/prepare-storage-upload-allowlist.mjs \
  --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_ALLOWLIST_REPORT.md \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json
```

**判定:** discography cover（high confidence）→ `approvedForStagingUpload` / schedule 系 → `needsHumanReview` / empty・unknown・G-4 対象外 → `rejectedOrDeferred`

**禁止（G-4b-prep）:** Supabase Storage upload、DB update。`uploadAllowed: false` / `dbUpdateAllowed: false`。

#### G-4b: Staging Storage upload（approved のみ、DB update なし）

allowlist の `approvedForStagingUpload`（gosaki: discography cover 4件）のみ staging bucket へ upload。DB update は G-4c。

| 項目 | 内容 |
| --- | --- |
| CLI | `upload-storage-assets.mjs` |
| Bucket SQL | [docs/sql/staging-site-assets-bucket.sql](docs/sql/staging-site-assets-bucket.sql) |
| 設計 doc | [docs/gosaki-storage-g4-prep.md](docs/gosaki-storage-g4-prep.md) §11 |

```bash
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
  --site-slug gosaki \
  --bucket site-assets \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-upload-result.json \
  --db-update-plan tools/static-to-astro/output/storage/gosaki/storage-db-update-plan.json \
  --apply
```

**デフォルト:** dry-run。**`--apply`** で staging upload（`approvedForStagingUpload` のみ）。**DB update は常に未実施。** `--overwrite` で既存 object 上書き（省略時は skip）。

#### G-4c: Staging DB update（discography.cover_image_url、Storage upload なし）

`storage-db-update-plan.json` から staging DB の `discography.cover_image_url` 4件のみ更新。`--apply` 時は事前 backup 必須。

| 項目 | 内容 |
| --- | --- |
| CLI | `apply-storage-db-updates.mjs` |
| 設計 doc | [docs/gosaki-storage-g4-prep.md](docs/gosaki-storage-g4-prep.md) §12 |

```bash
node tools/static-to-astro/scripts/apply-storage-db-updates.mjs \
  --plan tools/static-to-astro/output/storage/gosaki/storage-db-update-plan.json \
  --site-slug gosaki \
  --table discography \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_DB_UPDATE_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-db-update-result.json \
  --backup tools/static-to-astro/output/storage/gosaki/storage-db-update-backup.json \
  --apply
```

Apply 後: `export-supabase-json` → build → `verify-static-public-artifact` → staging FTP `--apply`（[gosaki-staging-runbook.md](docs/gosaki-staging-runbook.md)）。

**禁止（G-4c）:** Storage upload、`schedules` テーブル更新、production Supabase。

#### G-4d: Schedule 画像 human review（read-only、自動承認なし）

`needsHumanReview` の schedule 候補を review table / decision template に整理。upload / DB update は行わない。

| 項目 | 内容 |
| --- | --- |
| CLI | `review-schedule-storage-assets.mjs` |
| 設計 doc | [docs/gosaki-storage-g4-prep.md](docs/gosaki-storage-g4-prep.md) §14 |

```bash
node tools/static-to-astro/scripts/review-schedule-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
  --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/schedule-image-human-review.json
```

`schedule-image-human-decision-template.json` が同ディレクトリに生成される。

#### G-4e: Schedule allowlist promote（Golden PODs home のみ）

`approve_home_only` + `schedule_home` + `home_image_url` のみ `schedule-upload-allowlist.json` へ promote。flyer / `image_url` / alt-date-conflict は defer。

| 項目 | 内容 |
| --- | --- |
| CLI | `promote-schedule-storage-allowlist.mjs` |
| 設計 doc | [docs/gosaki-storage-g4-prep.md](docs/gosaki-storage-g4-prep.md) §15 |

```bash
node tools/static-to-astro/scripts/promote-schedule-storage-allowlist.mjs \
  --decision-template tools/static-to-astro/output/storage/gosaki/schedule-image-human-decision-template.json \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_UPLOAD_ALLOWLIST_REPORT.md \
  --allowlist tools/static-to-astro/output/storage/gosaki/schedule-upload-allowlist.json \
  --apply-gosaki-g4e
```

**G-4f / G-4g:** 完了 — 手順・QA は [gosaki-storage-image-migration-runbook.md](docs/gosaki-storage-image-migration-runbook.md)

```bash
# G-4f — schedule home Storage upload（DB update なし）
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/schedule-upload-allowlist.json \
  --site-slug gosaki --bucket site-assets \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_STORAGE_UPLOAD_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/schedule-storage-upload-result.json \
  --db-update-plan tools/static-to-astro/output/storage/gosaki/schedule-db-update-plan.json \
  --apply

# G-4g — schedules.home_image_url のみ（Storage upload なし）
node tools/static-to-astro/scripts/apply-storage-db-updates.mjs \
  --plan tools/static-to-astro/output/storage/gosaki/schedule-db-update-plan.json \
  --site-slug gosaki --table schedules \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_DB_UPDATE_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/schedule-db-update-result.json \
  --backup tools/static-to-astro/output/storage/gosaki/schedule-db-update-backup.json \
  --apply
```

---

### Phase 3-W: Site profile system（設計・dry-run 検証）

複数サイト種別（musician / dance-school / generic 等）向けに **CMS module・Admin pages・Home featured・Storage fields** を profile JSON で宣言し、convert CLI から参照できる土台を追加します。**dance-school / generic の CMS 本実装は未着手**です。

| 項目 | 内容 |
| --- | --- |
| 設計 doc | [docs/site-profile-system.md](docs/site-profile-system.md) |
| Profile 設定 | `config/site-profiles/*.json` |
| Loader | `scripts/lib/site-profile-loader.mjs` |
| Verifier | `verify-site-profiles.mjs` |

#### Profile 一覧（Phase 3-W）

| ID | 状態 | 概要 |
| --- | --- | --- |
| `musician` | **実装済み（gosaki 互換）** | schedule + discography + tracks |
| `dance-school` | 設計のみ | classes + news + instructors（将来） |
| `generic` | 設計のみ | news + profile（将来） |

#### Convert（profile 指定）

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --verify-build \
  --with-admin-cms \
  --site-profile musician
```

**デフォルト:** `--with-admin-cms` 使用時、profile 未指定 → `musician`。Admin CMS なし convert は従来どおり（profile 未適用）。

`CONVERSION_REPORT.md` に **Site profile** セクション（enabled modules / admin pages / home featured / storage fields）を追記します。

#### 検証

```bash
node tools/static-to-astro/scripts/verify-site-profiles.mjs \
  --report tools/static-to-astro/output/site-profiles/SITE_PROFILE_VERIFY_REPORT.md
```

**未実装（Phase 3-W）:** profile による CMS template 分岐、dance-school/generic Admin 本実装、Storage upload、deploy 実行

---

### Phase 3-X-A: Sariswing 差分整理 + gosaki 実用化ロードマップ

本番運用中の **Sariswing CMS** と **CMS Kit / gosaki** の差分を整理し、CMS Kit 実用化検証を **gosaki 主戦場** で進める方針を doc 化しました。**Sariswing 本体・本番 Supabase / FTP / Storage には触れません。**

| ドキュメント | 内容 |
| --- | --- |
| [docs/sariswing-vs-cms-kit-gap-analysis.md](docs/sariswing-vs-cms-kit-gap-analysis.md) | 位置づけ・機能比較・移植注意・結論 |
| [docs/gosaki-production-readiness-roadmap.md](docs/gosaki-production-readiness-roadmap.md) | 残タスク・Phase G-1〜G-7・公開前チェックリスト |

**方針:**

- **Sariswing** = 成功事例・比較対象・将来移植先（本番は直接触らない）
- **gosaki + musician profile** = CMS Kit 商品化プロトタイプの検証主戦場
- **次フェーズ推奨:** Phase G-1（gosaki staging 運用設計）または Phase 3-Y（readiness verifier）

---

### Phase G-1: gosaki staging 運用設計

CMS Kit 実用化プロトタイプとして **gosaki staging** の役割・secrets・Admin 運用・export/build/public-dist・rollback を doc 化しました。**本番 FTP / 本番 Supabase / gosaki 本番 FTP には接続しません。**

| ドキュメント | 内容 |
| --- | --- |
| [docs/gosaki-staging-operations.md](docs/gosaki-staging-operations.md) | 環境役割・運用フロー・Admin 比較・分離・rollback・本番化ゲート |
| [docs/gosaki-staging-runbook.md](docs/gosaki-staging-runbook.md) | **G-3:** staging deploy 運用手順（safety → readiness → apply → QA） |
| [docs/gosaki-storage-g4-prep.md](docs/gosaki-storage-g4-prep.md) | **G-4:** Storage 画像移行準備（設計・分類メモ） |
| [docs/gosaki-storage-image-migration-runbook.md](docs/gosaki-storage-image-migration-runbook.md) | **G-4h:** Storage 画像移行正式 runbook（G-4a〜G-4g 手順・QA） |
| [docs/cms-kit-generalization-roadmap.md](docs/cms-kit-generalization-roadmap.md) | **G-5:** CMS Kit template 一般化ロードマップ（site config / schema adapter） |
| [docs/cms-template-registry.md](docs/cms-template-registry.md) | **G-5d:** CMS template registry（musician-basic + drafts） |
| [docs/cms-schema-adapters.md](docs/cms-schema-adapters.md) | **G-5e:** CMS schema adapters（Supabase mapping metadata） |
| [docs/staging-generation-plan.md](docs/staging-generation-plan.md) | **G-5f:** Staging generation plan（read-only workflow planner） |
| [docs/site-generation-dry-run.md](docs/site-generation-dry-run.md) | **G-5g:** Dry-run generation package（planned files / schema skeleton） |
| [docs/cms-kit-onboarding-runbook.md](docs/cms-kit-onboarding-runbook.md) | **G-5h:** CMS Kit onboarding runbook（new client / site onboarding） |
| [docs/admin-cms-template-extraction-plan.md](docs/admin-cms-template-extraction-plan.md) | **G-5i:** Admin CMS template extraction plan（Sariswing → CMS Kit reusable admin） |
| [docs/admin-cms-code-inventory.md](docs/admin-cms-code-inventory.md) | **G-5j:** Sariswing admin CMS code inventory（read-only classification） |
| [docs/admin-ui-components-registry.md](docs/admin-ui-components-registry.md) | **G-5k:** Admin UI components extraction registry（28 candidates） |
| [docs/admin-ui-shell-scaffold.md](docs/admin-ui-shell-scaffold.md) | **G-5l:** Admin UI shell scaffold（10 low-risk components） |
| [docs/admin-crud-ui-scaffold.md](docs/admin-crud-ui-scaffold.md) | **G-5m-a:** Admin CRUD UI scaffold（5 primitives + 4 modules） |
| [docs/admin-auth-abstraction-scaffold.md](docs/admin-auth-abstraction-scaffold.md) | **G-5m-b:** Admin Auth abstraction scaffold（UI + permissions draft） |
| [docs/admin-media-upload-abstraction.md](docs/admin-media-upload-abstraction.md) | **G-5n:** Admin Media upload abstraction scaffold（UI + policy） |

**短期運用:** Local Admin（`npm run dev`）→ staging Supabase 保存 → export → build → `verify-static-public-artifact` → public-dist 確認

**Phase G-1 未実施:** FTP deploy 実行、Storage upload、GitHub Actions 有効化、本番公開

**secrets:** staging / prod は `GOSAKI_STAGING_*` / `GOSAKI_PROD_*` で分離

**次フェーズ:** G-4 discography + Golden PODs home **完了** / **G-4h runbook 固定** / 次は **G-4i〜j（schedule flyer）** または **本番導入テンプレ化**

---

### Phase G-2: public-dist staging FTP deploy（dry-run）

`public-dist/` のみを **staging FTP** へ deploy するための CLI と plan verifier を追加。**Phase G-2 検証は dry-run のみ（FTP 未接続）。**

| 項目 | 内容 |
| --- | --- |
| Deploy CLI | `deploy-public-dist-ftp.mjs` |
| Plan verifier | `verify-staging-ftp-deploy-plan.mjs` |
| Doc | [docs/gosaki-staging-ftp-deploy.md](docs/gosaki-staging-ftp-deploy.md) |

#### Deploy dry-run

```bash
node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
  --site-slug gosaki \
  --env staging \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_REPORT.md \
  --manifest tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json
```

#### Plan 検証

```bash
node tools/static-to-astro/scripts/verify-staging-ftp-deploy-plan.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_PLAN_VERIFY_REPORT.md
```

**安全制約:** `--env staging` のみ / `--apply` なしでは FTP 接続しない / `production`・`prod` は拒否 / 本番 FTP 未実行

**rollback:** deploy manifest + `public-dist` tarball 退避 → 前世代 manifest を `.previous.json` に保存

**次フェーズ:** G-2b（staging FTP `--apply`）または G-4（Storage / Node host Admin）

---

### Admin 運用フロー確定（Local Admin — G-3 前期）

gosaki の **Admin 利用方法を確定**しました。Node host 実 deploy・本番接続は行いません。  
**staging FTP apply 手順は** [docs/gosaki-staging-runbook.md](docs/gosaki-staging-runbook.md) **を参照。**

| 期間 | 採用 | 内容 |
| --- | --- | --- |
| **短期（正式）** | Local Admin | `npm run dev` + staging Supabase + export/build/public-dist |
| **中期** | Node host Admin/API | Render / Railway 等 + public-dist FTP |
| **長期** | Separate Admin app | マルチサイト + site profile |

| ドキュメント | 内容 |
| --- | --- |
| [docs/gosaki-admin-operations.md](docs/gosaki-admin-operations.md) | 3 パターン比較・gosaki 採用方針 |
| [docs/gosaki-admin-handoff-checklist.md](docs/gosaki-admin-handoff-checklist.md) | 編集項目・公開手順・引き渡しチェック |

**重要:** Admin 保存だけでは公開サイトに反映されない。`export → build → public-dist → deploy` が必要。

**次フェーズ:** Phase 3-Y readiness verifier → **完了** / G-2b apply → **完了** / **G-3 staging runbook** → 次は **G-4 Storage**

---

### Phase 3-Y: gosaki readiness verifier

G-2b（staging FTP apply）前に、gosaki CMS Kit パイプライン全体を **一括 readiness 判定**する verifier を追加。**FTP 接続・本番 deploy は行いません。**

```bash
node tools/static-to-astro/scripts/verify-gosaki-readiness.mjs \
  --report tools/static-to-astro/output/readiness/gosaki/GOSAKI_READINESS_REPORT.md
```

| 項目 | 内容 |
| --- | --- |
| CLI | `verify-gosaki-readiness.mjs` |
| Doc | [docs/gosaki-readiness-verifier.md](docs/gosaki-readiness-verifier.md) |
| ゲート | `READY_FOR_STAGING_FTP_APPLY: yes/no` |

**チェック:** site profile / convert / export / build / static-public / deploy dry-run / CMS loop / storage plan / secret scan

**次フェーズ:** Phase G-2b-prep（staging FTP safety verifier）→ G-2b apply

---

### Phase G-2b-prep: staging FTP safety verifier

G-2b（staging FTP `--apply`）の前に、`GOSAKI_STAGING_FTP_*` 接続先が staging 専用であることを **静的に** 確認する。**FTP 接続しない。`--apply` しない。**

```bash
node tools/static-to-astro/scripts/verify-staging-ftp-safety.mjs \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_SAFETY_REPORT.md
```

| 項目 | 内容 |
| --- | --- |
| CLI | `verify-staging-ftp-safety.mjs` |
| Doc | [docs/gosaki-staging-ftp-safety-check.md](docs/gosaki-staging-ftp-safety-check.md) |
| ゲート | `STAGING_FTP_SAFE_TO_APPLY: yes/no` |

**チェック:** 必須 staging env / prod FTP env 混入禁止 / server dir 危険語 / staging キーワード / secret leak scan

**G-2b 条件:** `READY_FOR_STAGING_FTP_APPLY: yes` **かつ** `STAGING_FTP_SAFE_TO_APPLY: yes` **かつ** 人間チェックリスト PASS

**secrets 未設定時:** `STAGING_FTP_SAFE_TO_APPLY: no` は正常（安全側の判定）

**次フェーズ:** G-2b（staging FTP `--apply`、両 verifier PASS 後）— **G-2b 完了**

---

### Phase G-3: gosaki staging 運用 runbook 固定

G-2b で成功した staging FTP deploy / QA / noindex / deploy-base / hamburger / canonical staging-url 対応を、**再現可能な運用手順**として doc 化しました。

| 項目 | 内容 |
| --- | --- |
| **Runbook** | [docs/gosaki-staging-runbook.md](docs/gosaki-staging-runbook.md) |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki/` |
| deployBase | `/cms-kit-staging/gosaki/` |
| mirror | contents-only（`public-dist/` 中身のみ） |

**手順（1 本化）:** 前提確認 → `verify-staging-ftp-safety` → `verify-gosaki-readiness` → build / static-public → `deploy-public-dist-ftp --apply` → 目視 QA → Git 整理

**apply 期待:** `applied: true`, `FTP connected: true`, `overall: PASS`, `stagingNoindex: yes`, `canonicalMode: staging-url`

**安全:** production / Sariswing 本番 FTP・Supabase には接続しない。`output/` は commit しない。

**次フェーズ:** G-4h runbook — [docs/gosaki-storage-image-migration-runbook.md](docs/gosaki-storage-image-migration-runbook.md)（G-4a〜G-4g 完了・staging QA 済み）

---

## Phase 2-F: SEO 公開準備（site / robots / sitemap）

`--base-url` **指定時のみ** 以下を生成します。未指定時は sitemap 連携・robots.txt は行いません（レポートに記録）。

| 出力 | 内容 |
| --- | --- |
| `astro.config.mjs` | `site: '{baseUrl}'`、`integrations: [sitemap()]` |
| `package.json` | `@astrojs/sitemap` を dependencies に追加 |
| `public/robots.txt` | `Allow: /` + `Sitemap: {baseUrl}/sitemap-index.xml` |
| `CONVERSION_REPORT.md` | **SEO publish readiness** セクション |

`npm run build` 後、`dist/sitemap-index.xml` 等が生成されます（`--verify-build` で確認）。

### gosaki 検証コマンド

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --verify-build
```

### realistic 回帰

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/realistic-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://studio-sakura.example.com \
  --verify-build
```

---

## 正式仕様（Phase 2-E）

### `<main>` ラッパー復元

| 項目 | 内容 |
| --- | --- |
| 問題 | `extractMainHtml()` はソース `<main>` の**内側のみ**を抽出するため、`main { max-width }` が効かず本文が全幅になる |
| 対策 | `BaseLayout.astro` で `<Header />` → `<main><slot /></main>` → `<Footer />` |
| CSS | 統合 `global.css` に `main { max-width: ... }` がある場合、レポートに検出を記録 |
| 未実装 | ソース `<main>` の `class` / `id` / `data-*` / `aria-*` のマージ（gosaki は属性なし `<main>`） |

### Schedule 一覧ページ

| 項目 | 内容 |
| --- | --- |
| 検出 | `schedule-YYYY-MM.html`（正規表現） |
| 月別出力 | `src/pages/schedule-2026-03/index.astro` 等（従来どおり） |
| 一覧出力 | `src/pages/schedule/index.astro` → ルート `/schedule/` |
| 一覧の並び | 新しい月順（例: 2026.07 → 2026.03） |
| CMS 向け | 一覧 HTML に `<!-- CMS_TARGET: SCHEDULE_INDEX -->` |

### Header（月別リンク除外）

| 項目 | 内容 |
| --- | --- |
| 方針 | 元サイトの Schedule プルダウンは**復元しない** |
| Header | `Home / About / Schedule / Discography / Contact / Link` |
| Schedule リンク先 | `/schedule/` のみ |
| active | `scheduleNavActive()` — `/schedule/` と `/schedule-YYYY-MM/` で Schedule が active |

`--base-url` 指定時:

- `canonical` / `og:url` → `{baseUrl}{route}`
- ローカル `og:image` → 絶対 URL

---

## 生成される Astro 構成

```text
output/generated-astro/
├── CONVERSION_REPORT.md    # 実サイト検証 + SEO publish readiness
├── package.json            # @astrojs/sitemap（baseUrl 指定時）
├── astro.config.mjs        # site + trailingSlash + sitemap（baseUrl 指定時）
├── public/
│   ├── robots.txt          # baseUrl 指定時
│   ├── images/
│   └── assets/js/
└── src/
    ├── layouts/BaseLayout.astro
    ├── components/Header.astro, Footer.astro
    ├── pages/
    │   ├── schedule/index.astro      # 自動生成（月別ページがある場合）
    │   ├── schedule-2026-07/index.astro
    │   └── ...
    └── styles/global.css
```

## 今後の課題（Phase 2-I 以降）

- ビジュアル diff の自動合否閾値・CI 連携（GitHub Actions）
- JSON-LD（構造化データ）
- フォームバックエンド接続
- ソース `<main>` 属性の保持
- CMS / Supabase 連携
- **本番 Sariswing への適用は別作業**（ルート `src/` には触れない）

## 関連

- `tools/site-audit/` — 公開 URL 調査と静的 HTML プロトタイプ作成
- 推奨フロー: site-audit → 静的再構築 → **static-to-astro**
