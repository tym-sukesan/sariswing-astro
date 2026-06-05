# Site Audit Tool

Musician CMS Kit / Sariswing 商品化に向けた調査用ツールです。

Wix、STUDIO、Squarespace、WordPress などで公開されている**既存サイトの公開ページ**を、ブラウザから見える範囲で調査し、Astro + CMS への再構築計画用の資料（スクリーンショット・HTML・テキスト・メタデータ）を生成します。

> **重要:** このツールは既存サイトのソースコードをコピーして移植するためのものではありません。  
> サイト所有者の許可を得たうえで、公開情報・構成・見た目を把握するための**調査資料作成**を目的としています。  
> robots.txt の指示やログイン必須ページにはアクセスしません。公開ページのみを対象にしてください。

## セットアップ

```bash
# リポジトリルートで
npm install
npx playwright install chromium
```

## 使い方

1. `tools/site-audit/urls.txt` に調査対象 URL を1行ずつ記載（`#` 始まりはコメント）
2. 実行:

```bash
npm run audit:site
```

### プロトタイプのスクリーンショット撮影

生成済み静的プロトタイプ（既定: `prototype-static-gosaki-v4/`）を Playwright で撮影します。

```bash
npm run capture:prototype
```

`tools/site-audit/output/prototype-screenshots/`（desktop / mobile）と `tools/site-audit/output/prototype-capture-report.md` を生成します。`audit:site` とは別コマンドで、`output/` 全体は削除しません（既存の `asset-map.md` や `prototype-comparison.md` を保持）。

環境変数（任意）:

- `PROTOTYPE_DIR` — プロトタイプディレクトリ
- `PROTOTYPE_NAME` — 出力ファイル名のプレフィックス（例: `gosaki-v4`）
- `PROTOTYPE_PORT` — ローカル静的サーバーのポート（既定: `8090`）

## 出力

`npm run audit:site` を実行するたびに、既存の `tools/site-audit/output/` は**削除されてから**新しく生成されます。前回の調査結果（別サイトの screenshot など）が残らないよう、実行ごとに output は上書きされます。

`tools/site-audit/output/` に以下が生成されます。

```text
output/
  screenshots/
    desktop/   # 1440×1200 viewport, full page
    mobile/    # 390×844 viewport, full page
  html/        # raw HTML
  text/        # body.innerText（空行整理済み）
  json/        # メタデータ JSON
  report.md    # audit 結果（ページ単位の取得サマリー）
  migration-brief.md  # Astro/CMS 移行の設計メモ（ルールベース）
  implementation-brief.md  # HTML/CSS構造・スタイル傾向の解析メモ
  rebuild-prompt.md # 静的HTML再構築用 Cursor プロンプト
  asset-map.json    # 画像URLとコンテンツ対応（構造化・rendered DOM含む）
  asset-map.md      # 画像役割・信頼度・rendered位置レポート
```

- **report.md** … 調査結果の記録
- **migration-brief.md** … 再構築・CMS化の判断用メモ（ChatGPT / Cursor に渡しやすい構成）
- **implementation-brief.md** … DOM / class / CSS 傾向の解析（コピー用ではなく再構築精度向上用）
- **rebuild-prompt.md** … 静的 HTML/CSS プロトタイプ作成用プロンプト（`implementation-brief.md` を参照）
- **asset-map.md** / **asset-map.json** … 画像の推定役割（hero / schedule-flyer / album-jacket 等）と近接テキストの対応表

`migration-brief.md` / `implementation-brief.md` / `rebuild-prompt.md` / `asset-map.md` は `npm run audit:site` 完了時に、`report.md` と HTML / JSON / テキスト / スクリーンショット情報から自動生成されます。

静的プロトタイプの出力先（Cursor 作業時）: `tools/site-audit/prototype-static/`

### JSON に含まれる項目

- `url`, `finalUrl`, `title`, `metaDescription`
- `h1`, `h2`, `h3`
- `images`（src, alt, width, height）
- `renderedAssets`（lazy-load 後の DOM から取得した画像: currentSrc, 表示サイズ, 位置, 近接テキスト）
- `renderedEventBlocks`（Home / Schedule Month のライブイベントブロック: 日付・会場・表示位置 y/h）
- `links`（href, text）
- `iframes`（src, title）
- `possibleEmbeds`（`detectedEmbeds` + `detectedExternalLinks` の統合。後方互換用）
- `detectedEmbeds`（iframe / script / 埋め込みコードから検出）
- `detectedExternalLinks`（SNS・外部サービスへの通常リンク）
- `capturedAt`

### スクリーンショット品質

各 viewport（desktop / mobile）ごとに以下を行います。

1. `domcontentloaded` 後、`networkidle` まで待機（タイムアウト時は警告して続行）
2. ページ全体を段階的にスクロール（lazy load 対策）
3. 約 3 秒待機
4. 主要 `img` の読み込み完了を待機（タイムアウト時は続行）
5. `window.scrollTo(0, 0)` でトップに戻してから fullPage screenshot

HubSpot フォームは Astro 化時に再実装せず、既存埋め込み継続を想定します。audit では `hbspt` / `hubspot` / `hsforms` 等から存在の可能性を検出します。

### ファイル名（slug）

`https://example.com/profile/` → `example-com-profile`

## エラー処理

- 1 URL の失敗で全体は停止しません
- 失敗 URL は `report.md` に **Failed** として記録されます
- コンソールにもエラーを出力します

## ファイル構成

```text
tools/site-audit/
  audit-site.ts          # エントリ（Playwright 実行）
  audit-config.ts        # タイムアウト・viewport 設定
  page-prepare.ts        # networkidle / スクロール / 画像待機
  detect-services.ts     # 埋め込み・外部リンク検出
  generate-migration-brief.ts  # migration-brief.md 生成
  generate-implementation-brief.ts  # implementation-brief.md 生成
  generate-rebuild-prompt.ts   # rebuild-prompt.md 生成
  generate-asset-map.ts        # asset-map.md / asset-map.json 生成
  rendered-assets.ts           # Playwright DOM から rendered 画像取得
  browser/extract-rendered-assets.js  # ブラウザ内 asset 抽出
  asset-context.ts             # img 周辺テキスト抽出（保存HTML）
  asset-inference.ts           # 画像役割のルールベース推定・統合
  event-image-matching.ts      # イベント↔画像対応・cross-page・NO PHOTO 検出
  asset-map-types.ts           # asset-map 型定義
  html-analysis.ts             # HTML/CSS 簡易解析
  page-analysis.ts             # ページ分類・パス解決（共有）
  audit-site-types.ts  # 型定義
  extract-metadata.ts  # HTML からメタデータ抽出（cheerio）
  urls.txt             # 調査対象 URL 一覧
  README.md
  output/              # 生成物（gitignore 対象）
```

- 本文テキストはブラウザ上の `body.innerText` を取得
- メタデータ（見出し・リンク・画像など）は取得した HTML を Node 側で解析

## Sariswing 本体への影響

このツールは `tools/site-audit/` 配下に独立しています。  
公開サイト・CMS・Supabase・GitHub Actions の既存挙動には影響しません。
