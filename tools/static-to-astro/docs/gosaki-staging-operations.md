# gosaki Staging Operations（Phase G-1）

**作成日:** 2026-06-05  
**目的:** gosaki を CMS Kit 実用化プロトタイプとして進めるための **staging 運用設計**  
**方針:** 本番 FTP / 本番 Supabase / 本番 Storage / Sariswing 本番には触れない。Phase G-1 では **実デプロイ・本番公開は行わない**。

関連:

- [gosaki-production-readiness-roadmap.md](./gosaki-production-readiness-roadmap.md)
- [gosaki-staging-runbook.md](./gosaki-staging-runbook.md)
- [gosaki-staging-secrets-checklist.md](./gosaki-staging-secrets-checklist.md)
- [admin-hosting-strategy.md](./admin-hosting-strategy.md)
- [public-dist-ftp-deploy.md](./public-dist-ftp-deploy.md)

---

## A. 目的

gosaki **staging** は、CMS Kit の実用化検証用環境です。以下を **本番影響なく** 確認します。

| 検証項目 | 内容 |
| --- | --- |
| Admin 編集 | Schedule / Discography / Tracks の save |
| Supabase 保存 | staging プロジェクトへの read/write |
| JSON export | `export-supabase-json.mjs` → `src/data/*.json` |
| Astro build | hybrid build（public + server artifact） |
| static-public artifact | Admin 除外の `public-dist/` 生成 |
| public-dist FTP 公開準備 | workflow template + verifier（実行は Phase G-2 以降） |
| rollback | export JSON / public-dist 世代管理 |
| client handoff 前確認 | チェックリスト・説明資料の前提整理 |

**staging ≠ production。** 検証に失敗しても gosaki 本番サイト・Sariswing 本番には影響しない設計とする。

---

## B. 環境の役割

### 一覧

| 環境 | 用途 | 触ってよい人 | 必要な secrets | 失敗時の影響 | 本番との差 |
| --- | --- | --- | --- | --- | --- |
| **local dev** | convert / `npm run dev`（Admin） / export / build / verifier | 開発担当 | `tools/static-to-astro/.env.local`（staging 向け） | ローカルのみ。output 再生成で復旧 | 本番 URL 未接続 |
| **staging Supabase** | CMS データ保存・Auth・RLS 検証 | 開発担当（service role は最小人数） | `SUPABASE_URL`, keys, admin credentials | staging データのみ。seed 再投入で復旧可能 | 本番 Supabase とは別プロジェクト |
| **generated-astro** | `output/generated-astro` — 生成 Astro プロジェクト | 開発担当 | 同上（export/build 時） | output 削除・再 convert で復旧 | 本番 deploy 先ではない |
| **public-dist** | `output/static-public/gosaki/public-dist/` — FTP 用静的 artifact | 開発担当 | 通常不要（静的 HTML のみ） | 再 build + verifier で再生成 | Admin / api パス除外済み |
| **staging FTP 候補** | 将来の staging 公開先（Phase G-2 dry-run 済み） | 開発担当 | `GOSAKI_STAGING_FTP_*` | staging サイトのみ | gosaki 本番 FTP とは別 |
| **production FTP 候補** | gosaki 本番公開先（**Phase G-1 では未使用**） | 公開責任者のみ | `GOSAKI_PROD_FTP_*` | **本番サイト影響** | 公開前ゲート必須 |

### 補足

- **local dev** で Admin を動かす場合、`npm run dev` は Node 環境が必要（`/api/admin/*`）。
- **generated-astro** は Git 管理対象外（`output/`）。再現性は convert CLI + `.env.local` + staging Supabase で担保。
- **public-dist** は `verify-static-public-artifact.mjs` が生成。`dist/client/` をそのまま FTP に上げない。
- **staging FTP** は Phase G-2 で用意・検証。Phase G-1 では **FTP 反映を実行しない**。

---

## C. 推奨運用フロー（短期）

```text
1. Local Admin（npm run dev）または将来の Node host Admin で編集
2. staging Supabase に保存（Admin API → Supabase）
3. export-supabase-json（staging → src/data JSON）
4. npm run build
5. verify-static-public-artifact（public-dist 生成 + 安全確認）
6. public-dist を目視 / レポート確認
7. deploy-public-dist-ftp dry-run → G-2b で staging FTP apply
8. 問題なければ production 適用を別フェーズで検討
```

**Phase G-3 確定:** 短期 Admin 運用 = **Local Admin**（[gosaki-admin-operations.md](./gosaki-admin-operations.md)）

### Phase G-1 の境界

| 実施 | 未実施 |
| --- | --- |
| 運用 doc / Runbook / secrets checklist | FTP deploy 実行 |
| コマンド手順の文書化 | Storage upload 実行 |
| staging / prod 分離ルール | GitHub Actions 有効化 |
| rollback 方針の定義 | gosaki 本番公開 |

---

## D. Admin 運用方法

### 前提

| 項目 | 内容 |
| --- | --- |
| Admin / API | Node 環境必須（`@astrojs/node`） |
| 静的 FTP | `/api/admin/*` は動作しない |
| 短期推奨 | **Local Admin** + export/build |
| 公開サイト | **public-dist のみ**（Admin パス除外） |

### 比較

| 方式 | 概要 | メリット | デメリット | gosaki |
| --- | --- | --- | --- | --- |
| **Local Admin（短期正式）** | 担当者 PC で `npm run dev` → 編集 → export → build | コスト低・secrets 限定 | 非エンジニアには難しい | **Phase G-3 採用** |
| **Node host Admin（中期）** | Admin/API を Render / Railway 等に常時配置 | ブラウザ編集可能 | 月額・secrets 管理 | G-4 以降検討 |
| **Separate Admin app（長期）** | Admin 専用 repo / マルチサイト | 商品化・profile 切替 | 構築コスト高 | G-7 方向 |

詳細: [gosaki-admin-operations.md](./gosaki-admin-operations.md) / [admin-hosting-strategy.md](./admin-hosting-strategy.md)

---

## E. staging と production の分離

### 分離対象

| リソース | staging | production |
| --- | --- | --- |
| Supabase URL | staging プロジェクト | 本番プロジェクト（将来） |
| anon key | staging 用 | 本番用 |
| service role key | staging 用（CLI / bootstrap のみ） | 本番用（厳格管理） |
| admin user | staging テスト用 | クライアント / 本番用 |
| Storage bucket | staging bucket（将来） | 本番 bucket |
| FTP server / dir | staging 先（Phase G-2） | gosaki 本番 FTP |
| GitHub Secrets | `GOSAKI_STAGING_*` | `GOSAKI_PROD_*` |

### 命名ルール（推奨）

ローカル `.env.local` は **staging 専用** とし、本番値を入れない。

GitHub Actions / CI では環境ごとにプレフィックスを付ける:

```text
GOSAKI_STAGING_SUPABASE_URL
GOSAKI_STAGING_SUPABASE_SERVICE_ROLE_KEY
GOSAKI_STAGING_SUPABASE_ANON_KEY
GOSAKI_STAGING_FTP_SERVER
GOSAKI_STAGING_FTP_USERNAME
GOSAKI_STAGING_FTP_PASSWORD
GOSAKI_STAGING_FTP_SERVER_DIR

GOSAKI_PROD_SUPABASE_URL
GOSAKI_PROD_SUPABASE_SERVICE_ROLE_KEY
GOSAKI_PROD_SUPABASE_ANON_KEY
GOSAKI_PROD_FTP_SERVER
GOSAKI_PROD_FTP_USERNAME
GOSAKI_PROD_FTP_PASSWORD
GOSAKI_PROD_FTP_SERVER_DIR
```

**混同防止:**

- staging 検証に prod secrets を使わない
- prod workflow は staging branch から実行しない
- FTP 反映前に deploy 先ホスト名を Runbook で口頭確認（将来）

詳細: [gosaki-staging-secrets-checklist.md](./gosaki-staging-secrets-checklist.md)

---

## F. rollback 方針

| 対象 | rollback 手段 | 保存推奨 |
| --- | --- | --- |
| **Supabase データ** | seed JSON 再投入 / export 前スナップショット / Supabase dashboard backup | `output/supabase-seed/gosaki/` + 日付付き export |
| **public-dist** | 前世代 `public-dist` ディレクトリを退避して再アップロード | `output/static-public/gosaki/` を tarball 化 |
| **FTP 公開後** | 前世代 public-dist を FTP へ再 mirror（Phase G-2 以降） | FTP 反映前の manifest + タイムスタンプ |
| **Git commit / tag** | ツール変更のみ Git 管理。output は tag しない | 重要マイルストーンで `tools/static-to-astro` 変更を commit |
| **export 済み JSON** | `src/data/*.json` を git 外バックアップ | export レポートとセットで保存 |
| **DB backup** | Supabase staging の定期 backup（dashboard / CLI） | 本番化前に手順文書化 |

**原則:** FTP 反映前に必ず public-dist manifest と export JSON の世代を 1 つ残す。

---

## G. 本番化前のゲート

production FTP / 本番 Supabase へ進む前に、以下を **すべて PASS** すること。

### 自動検証

- [ ] CMS minimal loop PASS（`verify-cms-minimal-loop.mjs`）
- [ ] static-public artifact PASS（`verify-static-public-artifact.mjs`）
- [ ] secret leak scan PASS（dist / public-dist / レポート）
- [ ] staging FTP deploy PASS（Phase G-2 完了後）
- [ ] public-dist に `admin/` / `api/admin` が含まれない

### 手動確認

- [ ] SEO / canonical / OGP / sitemap が本番 URL と一致
- [ ] 画像権利・再ホスト（Storage plan の review-required 解消）
- [ ] 問い合わせフォーム等の外部連携（本番 action URL）
- [ ] クライアント確認（編集項目・更新頻度）
- [ ] rollback 手順確認（担当者が口述できる）

### 環境

- [ ] staging と prod secrets が分離されている
- [ ] prod secrets を staging 検証に使用していない
- [ ] `.env.local` が Git に含まれていない

---

## 次フェーズ

| Phase | 内容 |
| --- | --- |
| **G-2** | public-dist deploy dry-run + plan verifier（**完了**） |
| **G-2b** | staging FTP `--apply` 実接続検証（未実施） |
| **G-3** | Admin 運用フロー確定（**完了** — Local Admin 短期正式） |
| **3-Y** | readiness verifier 自動化（任意） |

---

Phase G-1: 運用設計 doc のみ。実デプロイ・本番接続は行っていません。
