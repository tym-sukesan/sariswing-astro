# CMS Kit Onboarding Runbook

**Phase:** G-5h — product onboarding / customer handoff documentation  
**Status:** documentation only — no implementation, no production operations  
**Audience:** technical operators onboarding a new client site to CMS Kit

関連:

- [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md)
- [site-config-cli-usage.md](./site-config-cli-usage.md)
- [cms-template-registry.md](./cms-template-registry.md)
- [cms-schema-adapters.md](./cms-schema-adapters.md)
- [staging-generation-plan.md](./staging-generation-plan.md)
- [site-generation-dry-run.md](./site-generation-dry-run.md)
- [gosaki-storage-image-migration-runbook.md](./gosaki-storage-image-migration-runbook.md)

---

## End-to-end flow

```txt
site config
  ↓
template registry
  ↓
schema adapter
  ↓
staging generation plan
  ↓
dry-run generation package
  ↓
staging build / deploy / QA
  ↓
production readiness
```

---

## 1. Scope

### 対象

- Wix / Studio / Jimdo / WordPress / 静的 HTML サイトからの移行**検討**
- ミュージシャンサイト（ライブスケジュール・ディスコグラフィー等）
- 音楽教室サイト（コース・講師・料金等）
- ダンス教室サイト（クラス・イベント・講師等）
- 小規模事業者サイト（サービス・実績・スタッフ等）
- **Astro + Supabase + Storage + staging deploy** を使った CMS Kit 化

### 対象外

- production への即時反映（顧客承認なし）
- 顧客承認なしの DB 更新
- 権利確認なしの画像本番利用
- 顧客の既存サイトの破壊的変更
- 決済・月額課金の自動化実装（本 runbook では項目整理のみ）

---

## 2. Onboarding principles

| 原則 | 説明 |
| --- | --- |
| **staging-first** | すべての変更は staging で検証してから本番を検討する |
| **no production without explicit approval** | `deploy.production.enabled` は既定 false。本番切替は顧客・オーナー承認必須 |
| **no destructive operation on original site** | 元サイトは crawl / export のみ。既存 Wix 等は解約前に staging QA を完了する |
| **output/ is never committed** | レポート・plan・generation package はローカル / CI artifact のみ |
| **upload and DB update are separated** | Storage upload と DB URL 更新は別 CLI・別フェーズ |
| **ambiguous images require human review** | schedule 画像など自動 allowlist しない |
| **customer / owner confirmation required before production** | 権利・内容・DNS・メール影響を文書化して承認を得る |
| **secrets are never logged** | service role / FTP password は `.env.local` のみ。manifest に出さない |
| **customer-facing explanation should be simple** | 技術用語より「確認 URL」「更新できる項目」「承認が必要なこと」を平易に伝える |

---

## 3. Customer discovery checklist

新規顧客への初回ヒアリング項目。

| カテゴリ | 確認項目 |
| --- | --- |
| **サイト現状** | 現在のサイト URL |
| | 利用中サービス（Wix / Studio / Jimdo / WordPress / 独自 HTML 等） |
| | ドメイン管理会社・登録者情報 |
| | サーバー / ホスティング（ロリポップ / さくら / Cloudflare Pages 等） |
| | メール運用（ドメインメール / Gmail 転送等） |
| **費用** | 現在の月額・年額費用（制作・ホスティング・ドメイン・オプション） |
| **更新ニーズ** | 更新したい項目（スケジュール / ニュース / 料金 / ギャラリー等） |
| | 自分で更新したい項目 vs 代行希望の項目 |
| **コンテンツ権利** | 使用画像・音源・動画の権利（自作 / 購入 / クレジット表記 / 不明） |
| **外部連携** | SNS / YouTube / Spotify / Instagram 等の埋め込み・リンク |
| **ページ** | 必要なページ一覧（トップ / プロフィール / スケジュール / お問い合わせ等） |
| **フォーム** | 問い合わせフォームの有無・送信先メール |
| **機能** | 決済・予約・会員機能の有無 |
| **スケジュール** | 本番移行希望時期・イベントやリリースとの兼ね合い |

**成果物:** 顧客向け簡易サマリ（1ページ）+ 技術 intake への引き継ぎメモ

---

## 4. Site classification

[template registry](../config/templates/cms-template-registry.json) に基づく分類。

### musician-basic

| 項目 | 内容 |
| --- | --- |
| **向いているサイト** | ソロミュージシャン、ピアニスト、バンドの基本公式サイト |
| **主なページ** | home, about, schedule, schedule-month, discography, contact, links |
| **主な CMS モデル** | profile, schedules, discography, links, news |
| **human review しやすい箇所** | schedule 画像（home / flyer）、日付不一致、別ページ推測画像 |
| **注意点** | gosaki で proven。flyer 画像は未移行のまま human review 待ちの事例あり |
| **schema adapter** | `musician-basic-supabase-v1`（proven-with-gosaki） |

### music-school

| 項目 | 内容 |
| --- | --- |
| **向いているサイト** | ピアノ教室、音楽教室、個人レッスンスタジオ |
| **主なページ** | profile, courses, instructors, pricing, schedule, faq, contact |
| **主な CMS モデル** | profile, courses, instructors, pricing, schedule, faq, testimonials, contact |
| **human review しやすい箇所** | 講師写真、レッスン画像、ギャラリー（肖像権） |
| **注意点** | template / adapter は **draft**。Supabase テーブル未作成 |
| **schema adapter** | `music-school-supabase-v1`（draft） |

### dance-school

| 項目 | 内容 |
| --- | --- |
| **向いているサイト** | ダンス教室、スタジオ、イベント告知中心のサイト |
| **主なページ** | classes, instructors, schedule, events, news, faq, contact |
| **主な CMS モデル** | classes, instructors, schedule, pricing, events, news, faq, contact |
| **human review しやすい箇所** | クラス画像、イベント flyer、講師写真 |
| **注意点** | draft。イベント flyer は日付・クラス対応の曖昧さに注意 |
| **schema adapter** | `dance-school-supabase-v1`（draft） |

### small-business

| 項目 | 内容 |
| --- | --- |
| **向いているサイト** | 小規模事業者、コーポレート、サービス紹介サイト |
| **主なページ** | services, works, staff, news, faq, company profile, contact |
| **主な CMS モデル** | services, works, staff, news, faq, company_profile, contact |
| **human review しやすい箇所** | スタッフ写真、実績サムネイル、OG 画像 |
| **注意点** | draft。`generic` siteType も対応候補 |
| **schema adapter** | `small-business-supabase-v1`（draft） |

---

## 5. Technical intake checklist

| カテゴリ | 確認項目 |
| --- | --- |
| **取得** | crawl 可能か（公開ページのみ / 会員限定ページの有無） |
| | robots.txt / meta robots でブロックされていないか |
| | Basic 認証 / Cloudflare challenge / IP 制限 |
| | 画像の直接取得可否（hotlink 制限、CDN） |
| **構造** | ページ構造・ナビゲーション・内部リンク |
| | OGP / title / description の一貫性 |
| | sitemap.xml / robots.txt の有無 |
| **機能** | フォーム（action / method / 外部サービス） |
| | 外部埋め込み（YouTube, Instagram, Google Maps 等） |
| | PDF / 音源 / 動画のホスティング先 |
| | 予約・決済・会員機能（移行対象外の可能性） |
| **インフラ** | メール / DNS / SSL の現状 |
| | FTP / SFTP / hosting 条件（staging 先の有無） |
| | 既存 analytics / Search Console |

**成果物:** technical intake メモ + crawl 方針（手動 export vs 自動 crawl）

---

## 6. Standard workflow

標準 27 ステップ。操作種別: `read-only` / `write-local` / `upload` / `db-update` / `deploy`

| # | ステップ | 目的 | 関連 CLI / 作業 | 操作 | Human review | 顧客確認 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Customer discovery | 要件・権利・予算・希望時期を把握 | ヒアリングシート | read-only | — | **必須** |
| 2 | Technical intake | crawl / hosting / DNS 制約を把握 | チェックリスト（§5） | read-only | — | 推奨 |
| 3 | Static crawl / export | 元サイトの静的コピーを取得 | 手動 save / wget / 外部 crawl | write-local | — | — |
| 4 | Static HTML analysis | ページ構造・画像候補を把握 | `analyze-static-site.mjs` | write-local | — | — |
| 5 | Choose templateId | registry からテンプレ選定 | `inspect-cms-template.mjs` | read-only | — | 推奨 |
| 6 | Choose schemaAdapterId | Supabase マッピング選定 | `inspect-schema-adapter.mjs` | read-only | — | — |
| 7 | Create site config | 案件設定 JSON 作成 | `config/sites/{slug}.site-config.json` | write-local | — | — |
| 8 | Inspect template | template / siteType 整合 | `inspect-cms-template.mjs` | read-only | — | — |
| 9 | Inspect schema adapter | adapter / storage 整合 | `inspect-schema-adapter.mjs` | read-only | — | — |
| 10 | Plan staging generation | 移行計画を機械出力 | `plan-staging-generation.mjs` | read-only | — | — |
| 11 | Generate dry-run package | 生成予定ファイル・schema 雛形 | `generate-site-dry-run.mjs` | read-only | — | — |
| 12 | Review planned artifacts | pages / schema / storage / HR を確認 | `generation-package.json` 等 | read-only | 要 | 推奨 |
| 13 | Convert static HTML to Astro | Astro スキャフォールド生成 | `convert-static-to-astro.mjs` | write-local | — | — |
| 14 | Setup staging Supabase | staging DDL / RLS（人間レビュー後） | SQL Editor 手動 | write-local | 要 | — |
| 15 | Export / seed data | seed JSON 生成・投入 | `generate-supabase-seed.mjs` 等 | write-local | — | — |
| 16 | Review storage assets | 画像候補レビュー | `review-storage-assets.mjs` | read-only | — | — |
| 17 | Human review for images | 曖昧画像の判断 | `review-schedule-storage-assets.mjs` | read-only | **必須** | 推奨 |
| 18 | Storage upload | staging Storage のみ | `upload-storage-assets.mjs` | upload | 要 | — |
| 19 | DB update | image URL を DB 反映 | `apply-storage-db-updates.mjs` | db-update | 要 | — |
| 20 | Build | 静的サイトビルド | `npm run build` | write-local | — | — |
| 21 | Verify public artifact | admin/API 除外確認 | `verify-static-public-artifact.mjs` | read-only | — | — |
| 22 | Staging deploy | staging FTP のみ | `deploy-public-dist-ftp.mjs` | deploy | — | — |
| 23 | Staging QA | noindex / 画像 / リンク確認 | `qa-checklist.md`（package 出力） | read-only | 要 | **必須** |
| 24 | Customer review | 顧客が staging URL を確認 | staging URL 共有 | read-only | — | **必須** |
| 25 | Production readiness gate | 本番移行条件を満たすか判定 | `plan-staging-generation` / checklist §11 | read-only | **必須** | **必須** |
| 26 | Production migration | DNS / deploy / noindex 解除 | 別 runbook（G-5l 予定） | deploy | 要 | **必須** |
| 27 | Maintenance / subscription | 保守・課金・サポート引き継ぎ | §12 | — | — | **必須** |

---

## 7. CLI flow

G-5 時点の導入順 CLI 一覧。

### Read-only planning（安全・最初に実行）

| 順 | CLI | 用途 |
| --- | --- | --- |
| 1 | `inspect-cms-template.mjs` | template registry 検証 |
| 2 | `inspect-schema-adapter.mjs` | schema adapter 検証 |
| 3 | `plan-staging-generation.mjs` | staging generation plan |
| 4 | `generate-site-dry-run.mjs` | dry-run generation package |
| 5 | `review-storage-assets.mjs` | Storage 候補レビュー |
| 6 | `prepare-storage-upload-allowlist.mjs` | upload allowlist 準備 |
| 7 | `review-schedule-storage-assets.mjs` | schedule 画像 human review |
| 8 | `promote-schedule-storage-allowlist.mjs` | 承認済み allowlist へ promote |
| 9 | `verify-static-public-artifact.mjs` | public-dist 安全性確認 |

### Write operations — **requires explicit approval**

| CLI | 操作 | 承認前に確認すること |
| --- | --- | --- |
| `convert-static-to-astro.mjs` | write-local | fixture 内容・既存 generated-astro 上書き方針 |
| `generate-supabase-seed.mjs` | write-local | legacy_id 規則・件数 |
| `upload-storage-assets.mjs` | **upload** | allowlist・staging host・件数 preflight |
| `apply-storage-db-updates.mjs` | **db-update** | upload manifest・legacy_id allowlist |
| `deploy-public-dist-ftp.mjs` | **deploy** | staging base path・noindex・FTP 先 |

**例（gosaki、read-only）:**

```bash
node tools/static-to-astro/scripts/plan-staging-generation.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json

node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

詳細: [site-config-cli-usage.md](./site-config-cli-usage.md)

---

## 8. Site config creation guide

新規案件用 `config/sites/{siteSlug}.site-config.json` の作成手順。

**参照例:** [`gosaki.site-config.example.json`](../config/sites/gosaki.site-config.example.json)

| フィールド | 説明 | 例 |
| --- | --- | --- |
| `siteSlug` | 安定識別子（Storage path・output パス） | `gosaki` |
| `siteName` | 表示名 | `Saki Goto` |
| `siteType` | template registry の siteTypes と一致 | `musician` |
| `templateId` | CMS template | `musician-basic` |
| `schemaAdapterId` | Supabase adapter | `musician-basic-supabase-v1` |
| `source.fixtureDir` | 静的 HTML fixture（tool  root 相対） | `fixtures/gosaki-static-site` |
| `output.storageDir` | Storage レビュー出力 | `output/storage/{slug}` |
| `output.generatedAstroDir` | Astro 生成先 | `output/generated-astro` |
| `storage.bucket` | Supabase Storage bucket | `site-assets` |
| `storage.pathPrefix` | オブジェクト path 接頭辞 | `{siteSlug}` |
| `deploy.staging.base` | staging deploy base path | `/cms-kit-staging/{slug}/` |
| `deploy.staging.publicUrl` | staging 公開 URL | 顧客確認用 |
| `deploy.production.enabled` | **必ず false から開始** | `false` |
| `deploy.production.baseUrl` | 本番 URL（参照のみ） | 顧客ドメイン |
| `seo.stagingNoindex` | staging は noindex | `true` |
| `seo.robotsDisallowAll` | staging robots | `true` |

**禁止:** secrets（Supabase service role、FTP password）を JSON に書かない。

作成後:

```bash
node tools/static-to-astro/scripts/inspect-cms-template.mjs --site-config config/sites/{slug}.site-config.json
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs --site-config config/sites/{slug}.site-config.json
node tools/static-to-astro/scripts/plan-staging-generation.mjs --site-config config/sites/{slug}.site-config.json
node tools/static-to-astro/scripts/generate-site-dry-run.mjs --site-config config/sites/{slug}.site-config.json
```

---

## 9. Human review guide

### 基本方針

- 画像候補は**自動承認しない**（confidence が高くても owner 確認が必要な場合あり）
- **schedule 画像**は特に human review 必須（日付・イベント対応が曖昧になりやすい）

### 典型ルール（musician-basic / gosaki 実績）

| ruleId | 条件 | 推奨 action |
| --- | --- | --- |
| `schedule-date-conflict` | ファイル名の日付が schedule.date と不一致 | defer |
| `cross-page-inferred-schedule-image` | 別ページ・別月から推測した画像 | defer |
| `no-photo-placeholder` | NO PHOTO / 空 / placeholder | reject |

### 権利・本番

- 本番移行前に**画像・文章・音源・動画の権利**を owner と確認
- production 前の **owner confirmation** を文書化（メール / 署名 / チャットログ）

### decision values（schedule 画像）

| 値 | 意味 |
| --- | --- |
| `approve_home_only` | home_image_url のみ upload 許可 |
| `approve_flyer_only` | image_url（flyer）のみ許可 |
| `approve_both` | 両方許可 |
| `reject` | 却下 |
| `defer` | 判断保留（本番・upload 対象外） |

関連: [gosaki-storage-image-migration-runbook.md](./gosaki-storage-image-migration-runbook.md)

---

## 10. Staging QA checklist

staging deploy 後の確認項目（顧客レビュー前に技術担当が実施）。

| カテゴリ | チェック |
| --- | --- |
| **SEO / safety** | noindex が有効 |
| | robots.txt Disallow（staging） |
| | canonical / og:url が production に向いていない |
| | sitemap に admin パスが含まれない |
| **Layout** | deploy base path で CSS が読める |
| | ハンバーガー / モバイルナビ |
| | 内部リンク切れなし |
| **コンテンツ** | 問い合わせフォーム（staging では送信先要確認） |
| | discography cover 表示 |
| | schedule home 画像（移行済み分） |
| | pending / placeholder 画像でレイアウト崩れなし |
| **Storage** | `example.supabase.co` プレースホルダーが残っていない |
| | 公開 Storage URL が HTTP 200 |
| **UX** | 基本ページ速度・スクロール・タップ領域 |
| **顧客** | staging URL を顧客に共有しフィードバック取得 |

dry-run package の `qa-checklist.md` も併用: `output/generation-packages/{siteSlug}/qa-checklist.md`

---

## 11. Production readiness gate

本番移行前に**すべて**満たすこと。1 つでも未達なら production に進まない。

| # | 条件 |
| --- | --- |
| 1 | **顧客承認**（staging QA 完了・修正反映済み） |
| 2 | **画像・文章・音源・動画の権利確認**（文書化） |
| 3 | production domain の確定 |
| 4 | DNS / SSL 切替計画（ダウンタイム・TTL） |
| 5 | **メール影響確認**（MX 変更でメール停止しないか） |
| 6 | contact form 本番送信先の確認 |
| 7 | analytics / Search Console 移行方針 |
| 8 | **backup / rollback plan**（旧サイト・旧 DNS の復旧手順） |
| 9 | production secrets（`.env`）の確認 — ログに出さない |
| 10 | noindex 解除方針（いつ・誰が承認するか） |
| 11 | sitemap / robots の production 化 |
| 12 | final QA（本番 URL での smoke test） |

`plan-staging-generation.mjs` の `productionReadiness` は既定 `ready: false`。gate 通過後にのみ `deploy.production.enabled` を検討。

---

## 12. Maintenance / subscription handoff

商品化・運用引き継ぎ項目（**決済実装は本フェーズでは行わない**）。

| カテゴリ | 整理項目 |
| --- | --- |
| **料金** | 月額保守 / CMS 利用料 / Supabase 利用料 / hosting・domain 費用 |
| **範囲** | 更新代行の範囲（テキスト / 画像 / スケジュール / 緊急対応） |
| **運用** | 障害対応 SLA、バックアップ頻度、セキュリティパッチ |
| **解約** | 解約時のデータエクスポート・ドメイン・Storage の扱い |
| **顧客向け** | 管理画面マニュアル（非エンジニア向け・スクリーンショット付き） |
| **支払い候補** | Stripe / PayPal / 会費ペイ 等（将来実装・契約設計用メモ） |

---

## 13. Gosaki proven path

gosaki を参考事例とした実証済みフロー（**production 未接触**）。

| 項目 | 値 |
| --- | --- |
| template | `musician-basic` |
| schema adapter | `musician-basic-supabase-v1` |
| staging base | `/cms-kit-staging/gosaki/` |
| Storage bucket | `site-assets`（prefix: `gosaki`） |
| discography cover | 4 件移行 proven（G-4b） |
| schedule home | Golden POD `schedule-2026-03-012` home 画像 proven（G-4f/g） |
| schedule flyer | human review 待ち・未本番移行 |
| production | `deploy.production.enabled: false` |
| runbook | [gosaki-storage-image-migration-runbook.md](./gosaki-storage-image-migration-runbook.md) |

**再現コマンド（read-only）:**

```bash
node tools/static-to-astro/scripts/plan-staging-generation.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json

node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

---

## 14. Risks and mitigations

| リスク | 緩和策 |
| --- | --- |
| 画像権利不明 | human review + owner 署名。不明画像は本番利用しない |
| ドメイン移管トラブル | 移管前に staging で完結 QA。移管は maintenance フェーズで計画 |
| メール停止（MX 変更） | 本番 gate でメール影響を必須確認。切替は低トラフィック帯 |
| SEO 順位変動 | canonical / 301 / sitemap を production 化前にレビュー |
| 顧客の更新習慣 | Admin CMS マニュアル + 初期トレーニング（G-5j 予定） |
| 外部サービス埋め込み | intake で一覧化。embed URL 変更の影響を staging で確認 |
| サーバー制限（FTP / 容量） | deploy 前に hosting 条件確認。artifact サイズ計測 |
| Supabase 無料枠 / 課金 | 案件ごとに staging / prod プロジェクト分離方針を文書化 |
| FTP 失敗 | mirror deploy + verifier。本番前は staging のみで練習 |
| 本番切替ロールバック | DNS TTL 短縮・旧サイト保持・rollback runbook（G-5l） |
| Wix 等の早期解約 | **staging QA + 顧客承認前に解約しない**ことを契約・口頭で固定 |

---

## 15. Next phases

| Phase | 内容 |
| --- | --- |
| **G-5i** | Admin CMS extraction plan（**完了** — [admin-cms-template-extraction-plan.md](./admin-cms-template-extraction-plan.md)） |
| **G-5j** | Sariswing admin code inventory（**完了** — [admin-cms-code-inventory.md](./admin-cms-code-inventory.md)） |
| **G-5k〜G-5p** | Admin UI / Auth / Media / Publish 抽出 → musician-basic prototype → customer admin manual |
| **Later** | customer-facing onboarding checklist、pricing model、production migration runbook、first external pilot |

Admin CMS は **G-5i 時点で未実装・未抽出**。production publish は **explicit approval** 後のみ。

---

*G-5h: onboarding documentation only. No Astro generation, DB, Storage upload, FTP, or production operations.*
