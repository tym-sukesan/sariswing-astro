# 静的 HTML → Astro 自動変換 — 設計（Phase 1）

## 目的

小規模な静的 HTML サイトを入力とし、Astro プロジェクトのたたき台を自動生成するパイプラインの**第一段階**として、構造解析と移行方針のレポートを行う。

本ドキュメントは `tools/static-to-astro/` 内の実装・検証のみを対象とし、本番の `src/`・`public/`・`package.json` には触れない。

---

## パイプライン全体像（将来）

```text
URL
  ↓  site-audit / 手動再構築
静的 HTML ディレクトリ
  ↓  static-to-astro（本ツール）
Astro プロジェクト
  ↓  後続フェーズ
CMS / Supabase / デプロイ
```

Phase 1 のスコープは **静的 HTML の解析とレポート** のみ。ファイル生成は Phase 2 以降。

---

## 入力

### 想定入力

| 種別 | 例 |
| --- | --- |
| トップ・下層ページ | `index.html`, `about.html`, `contact.html` |
| スタイル | `css/`, `<link rel="stylesheet">`, 埋め込み `<style>` |
| スクリプト | `js/`, `<script src>`、インライン script |
| 画像・その他 | `images/`, `assets/`, `src` / `srcset` / `picture` |
| ナビ・フッター | 全ページで繰り返す `<header>` / `<footer>` / `<nav>` |

サンプル: `fixtures/sample-static-site/`

### 前提条件

- **静的配布可能**な HTML（ビルド不要で `file://` または静的サーバで表示できる）
- ページ間で **ヘッダー・フッターが概ね同一**（差分は `is-current` 等の軽微なクラスのみ想定）
- 相対パスによるアセット参照（`css/style.css`, `images/logo.svg`）
- 文字コードは UTF-8 想定
- 1 サイト = 1 入力ディレクトリ（サブフォルダに HTML があっても可）

### 入力として不向き（Phase 1 でフラグ）

- SPA（`#root`, `__NEXT_DATA__` 等）
- ログイン必須・動的 API だけで描画されるページ
- Wix / STUDIO 等の **プラットフォーム固有 DOM** をそのまま移植した HTML（再構築済み静的 HTML を推奨）

---

## 出力（将来の Astro 構成案）

Phase 2 以降で生成する想定レイアウト（sariswing-astro 本番と同型のパターン）:

```text
src/
  layouts/
    BaseLayout.astro      # <html>, head, OGP, 共通 CSS/JS
  components/
    Header.astro          # 全ページ共通ナビ
    Footer.astro          # SNS・コピーライト
  pages/
    index.astro           # index.html
    about/
      index.astro         # about.html
    contact/
      index.astro
public/
  css/
  js/
  images/
  ogp.jpg                 # 必要に応じて
robots.txt
sitemap-index.xml         # @astrojs/sitemap 等
```

`BaseLayout.astro` の props 案（sariswing 実装より一般化）:

- `title`, `description`, `canonical`, `ogImage`, `ogType`
- 管理画面用 `admin` / `noindex` は後続フェーズ

---

## 共通部分抽出方針

### Header 検出

優先順:

1. セマンティック `<header>`
2. `role="banner"`
3. id/class: `site-header`, `global-header`, `#header` 等
4. **全ページ横断**: 候補 DOM の正規化ハッシュ（fingerprint）が最多のブロックを `Header.astro` 原稿とする

ナビ内の `is-current` / `aria-current` はページごとに差し替え可能なスロットとして残す。

### Footer 検出

優先順:

1. `<footer>`
2. `role="contentinfo"`
3. `#site-footer`, `.site-footer` 等
4. 横断 fingerprint で共通フッターを確定

SNS リンク一覧は Footer コンポーネントに集約（sariswing では Instagram 等をフッターに統一）。

### BaseLayout 化

各 HTML の `<head>` から抽出:

- `title`, `meta description`, `viewport`, `charset`
- OGP / Twitter Card（あれば props 化）
- 共通 `<link rel="stylesheet">` → Layout または `public/css`
- 共通 `<script>` → `is:inline` で `public/js` 参照（既存 sariswing と同様）

ページ固有の CSS（例: `index.css` のみ）は各 `.astro` または Layout の条件付き link。

---

## Main 抽出方針

### ページ固有領域

優先順:

1. `<main>`
2. `role="main"`
3. `#main`, `.main-content`, `.content-area`
4. 上記が無い場合: `body` から header/footer 候補を除いた残り（Phase 2 で実装）

抽出した HTML 断片は `src/pages/**/index.astro` の `<slot />` 内コンテンツ相当に配置。

### CMS 候補のマーキング（Phase 3+）

静的再構築時に付与したコメント（例: `<!-- CMS_TARGET: ... -->`）を優先的にコンポーネント境界とする。site-audit / 手動プロトタイプで使った命名を継承する。

---

## Asset 変換方針

| 種別 | 方針 |
| --- | --- |
| **CSS** | `css/` → `public/css/`。パスは `/css/...` に統一。外部 CDN はレポートに列挙し手動判断 |
| **JS** | `js/` → `public/js/`。jQuery 等は当面 `is:inline` で既存互換（sariswing 踏襲） |
| **images** | `images/`, `assets/` → `public/images/` 等。欠損ファイルは解析レポートで警告 |
| **外部 URL 画像** | そのまま `src` 維持かダウンロードかをレポートで分類（Wix static 等） |
| **favicon / OGP** | `public/` 直下。BaseLayout の props と連動 |

---

## ルーティング変換方針

| 静的 HTML | Astro ページ（ファイルベースルーティング） |
| --- | --- |
| `index.html` | `src/pages/index.astro` |
| `about.html` | `src/pages/about/index.astro` |
| `schedule-2026-07.html` | `src/pages/schedule-2026-07/index.astro` または `src/pages/schedule/[month]/`（正規化は別判断） |
| `foo/index.html` | `src/pages/foo/index.astro` |

内部リンクは `.html` → ディレクトリ形式 URL（`/about/`）へ書き換え。レガシー URL 互換が必要な場合は `astro.config` の `redirects`（Phase 3+）。

---

## 自動判定できないケース

| ケース | 理由 | Phase 1 の扱い |
| --- | --- | --- |
| **JS 依存 UI** | タブ・モーダル・ドロップダウンが script 必須 | 手動確認リストへ |
| **SPA** | 単一 HTML + クライアントルーティング | 変換困難として警告 |
| **フォーム** | `action` が外部 SaaS / メール送信 | 手動（Formrun, Netlify Forms 等へ再配線） |
| **iframe** | 地図・動画・予約ウィジェット | コンポーネント化または `is:inline` 維持 |
| **外部ウィジェット** | Instagram 埋め込み、Wix ウィジェット | リンク化 or 公式 embed に置換 |
| **インライン style 大量** | Wix 由来など | CSS 整理が別工程 |
| **プラットフォーム固有 class** | `wix-`, `rb_wixui` 等 | 静的再構築後の HTML を入力にすること |

---

## Sariswing / Gosaki 案件で得た知見（一般化）

| 知見 | 一般化 |
| --- | --- |
| site-audit で URL → HTML/JSON/スクショ取得 | 入力は **再構築済み静的 HTML** に限定すると変換が安定 |
| migration-brief のルート表 | `*.html` → `src/pages/**` の機械的マッピング表を先に出す |
| 共通ヘッダー・フッターを手で切り出し | fingerprint 一致率で自動候補 + 人間確認 |
| BaseLayout に OGP・canonical・favicon 集約 | head 要素を props テンプレート化 |
| CSS は `common.css` + ページ別 | link タグをページ単位で分類してレポート |
| jQuery + inview は `public/js` + `is:inline` | レガシー JS は最初から ESM 化せず互換優先 |
| スケジュール月ページはレガシー URL 維持 | 正規化ルートは別フラグで提案（`/2026-07/` vs `/schedule/2026-07/`） |
| `<!-- CMS_TARGET -->` コメント | 後続 CMS 化の境界として解析時に検出（Phase 3） |
| 外部画像（Wix CDN） | ローカル化 or URL 維持を asset レポートで列挙 |
| robots / sitemap / llms.txt | 静的サイト完成後に Astro 統合（Phase 3+） |
| Supabase / Auth / RLS | 本ツールのスコープ外（別フェーズ） |

---

## Phase 1 実装

| 成果物 | 説明 |
| --- | --- |
| `scripts/analyze-static-site.mjs` | 上記方針に基づくレポート生成 |
| `scripts/convert-static-to-astro.mjs` | CLI 入口（スタブ） |
| `docs/design.md` | 本ドキュメント |
| `fixtures/sample-static-site/` | 最小入力サンプル |

## Phase 2 以降（ロードマップ）

1. **Phase 2**: Astro ファイル生成（Layout / Header / Footer / pages）、asset コピー、パス書き換え
2. **Phase 3**: sitemap / robots / OGP 一括、ビジュアル diff、redirects
3. **Phase 4**: CMS 候補抽出、`CMS_TARGET` コメント → コンポーネント / コレクション
4. **Phase 5**: Supabase 連携・管理画面（本番 sariswing-astro とは別出力先推奨）

---

## 関連ツール

- `tools/site-audit/` — 公開 URL の調査・静的プロトタイプ生成
- 本ツール — **静的 HTML ディレクトリ** を入力に Astro 化方針を立てる

推奨フロー: `site-audit` → 静的 HTML 再構築 → **`static-to-astro` 解析** → Phase 2 生成
