# 本番公開時の注意

## 環境変数

| 変数 | 用途 |
|------|------|
| `PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `PUBLIC_SUPABASE_ANON_KEY` | 匿名（publishable）キー。ビルド時に静的 HTML/JS に埋め込まれる |

ローカル・CI・ホスティングでは `.env.example` をコピーして `.env` を作成し、値を設定してから `npm run build` してください。`.env` は Git に含めません。

## Supabase キー

- **anon key（`PUBLIC_SUPABASE_ANON_KEY`）** は公開前提です。フロントから参照されます。RLS 適用後はポリシーで読み取り範囲を制限します。
- **service_role key** は絶対にフロントコード・リポジトリ・公開ビルド成果物に含めないでください。サーバーサイドスクリプトや CI のみで使用します。

## `/admin/` 管理画面

- 本番では **Basic 認証（または同等のアクセス制限）を必須** にしてください。
- **Instagram 管理**（`/admin/instagram/`）は Supabase Auth + Edge Function `admin-instagram` 経由です。
- **About 管理**（`/admin/about/`）は Supabase Auth + Edge Function `admin-site-page` 経由です。
- いずれも共有 API シークレットは `dist/` に埋め込みません（JWT セッションのみ）。
- **NEWS / Schedule** は従来どおり anon key で Supabase に直接接続します（RLS 未適用の間は改ざんリスクに注意）。
- 可能であれば `dist/admin/` を公開ホストから除外するか、認証の後だけ配信してください。
- GitHub Actions で `dist/` をFTPデプロイする場合、`dist/admin/` もアップロード対象に含まれます。**必ず本番サーバー側で `/admin/` に Basic 認証を設定**してください。

## Instagram 管理（Supabase Auth + Edge Function）

### 概要

1. `/admin/login/` でメール・パスワード（Supabase Auth）にログイン
2. JWT 付きで `admin-instagram` Edge Function を呼び出し
3. Edge 内で `app_metadata.role === "admin"` を確認後、`service_role` で `instagram_posts` を CRUD
4. 公開サイトの Instagram は引き続き **ビルド時 anon SELECT**（`InstagramFeed.astro`）

`service_role` / `PUBLIC_ADMIN_API_SECRET` はフロント・GitHub Actions・リポジトリに置きません。

### Supabase Dashboard — Authentication

1. **Authentication → Providers → Email** を有効化
2. **Authentication → Settings** で **Enable sign ups** をオフ（管理者は手動作成のみ推奨）
3. **Authentication → Users → Add user** で管理者用メール・パスワードを作成

### 管理者ロール（`app_metadata.role = "admin"`）

Dashboard からユーザー作成後、SQL Editor で付与（メールを置き換え）:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'your-admin@example.com';
```

テンプレート: `scripts/supabase/admin-user-role.sql`

### Edge Function のデプロイ

`admin-instagram` は **JWT 検証あり**（`verify_jwt = true`）。`trigger-deploy` とは別です。

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-instagram
supabase functions deploy admin-site-page
```

`SUPABASE_SERVICE_ROLE_KEY` は Edge ランタイムに自動注入されます（手動で Secrets に service_role をコピーする必要は通常ありません）。

ローカル動作確認:

```bash
supabase functions serve admin-instagram
# 別ターミナル: /admin/login/ でログイン後、管理画面から操作するか、
# access_token を取得して curl（Authorization: Bearer <access_token>）
```

### `instagram_posts` RLS の適用タイミング

**Edge + 管理画面の動作確認が終わってから** 適用してください。

1. `scripts/supabase/instagram-rls-select-only.sql` を SQL Editor で実行
2. `npm run build` でトップページの Instagram が表示されることを確認
3. `/admin/instagram/` でログイン後、追加・編集・並び順・削除が引き続き動くことを確認

RLS 適用前でも、管理 CRUD は Edge（service_role）経由で動作します。適用後は anon からの直接 INSERT/UPDATE/DELETE が拒否されます。

### RLS 適用前後の確認

| 確認項目 | RLS 適用前 | RLS 適用後 |
|----------|------------|------------|
| `/admin/login/` → Instagram CRUD | OK（Edge） | OK（Edge） |
| トップ Instagram（静的ビルド） | OK（anon SELECT） | OK（anon SELECT） |
| ブラウザから anon 直 `insert` | 可能（RLS 無効/FOR ALL 時） | **拒否** |

### ロールバック

1. **管理だけ戻す**: 旧 `instagram.ts`（anon 直 CRUD）に戻して再デプロイ（非推奨・セキュリティ低下）
2. **RLS だけ戻す**: `instagram_posts` で `anon FOR ALL` ポリシーを一時復活、または `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`（緊急時のみ）
3. **Edge を残す**: RLS を戻しても Edge 経由の管理は動作し続けます

## About 管理（Supabase Auth + Edge Function）

### 概要

1. `/admin/login/` でログイン（未ログインで `/admin/about/` にアクセスすると `?next=/admin/about/` へリダイレクト）
2. JWT 付きで `admin-site-page` Edge Function を呼び出し
3. Edge 内で `app_metadata.role === "admin"` を確認後、`service_role` で `site_pages` / `site_page_revisions` を操作
4. 公開 `/about/` は引き続き **ビルド時 anon SELECT**（`src/lib/site-pages.ts`・変更なし）

バックアップ仕様（従来どおり）:

- 保存前に現在内容を `site_page_revisions` へ保存
- 復元前にも現在内容を保存
- `page_slug` ごと最新 **50 世代** を保持（超過分は削除）

### Edge Function のデプロイ

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-site-page
```

`admin-instagram` と同様、`verify_jwt = true` です。Instagram 用と独立してデプロイできます。

### 本番確認手順（RLS 適用前）

1. `admin-site-page` をデプロイ
2. フロント（`dist/admin/`）をデプロイ
3. `/admin/login/` → `/admin/about/`
4. HTML 編集・プレビュー・保存
5. バックアップ履歴の表示・「内容を見る」・「この版を復元」
6. ログアウト後、`/admin/about/` 直アクセスでログインへ戻ること

### `site_pages` RLS の適用タイミング

**Edge + About 管理の動作確認後** に `scripts/supabase/site-pages-rls-select-only.sql` を実行してください。

| テーブル | anon（適用後） |
|----------|----------------|
| `site_pages` | SELECT のみ（公開ビルド） |
| `site_page_revisions` | 一切不可（管理は Edge のみ） |

### RLS 適用後の確認

1. `npm run build` で `/about/` が表示されること
2. `/admin/about/` で保存・履歴・復元が引き続き動くこと
3. ブラウザから anon 直で `site_page_revisions` に insert できないこと（任意・検証）

### ロールバック

1. **管理だけ戻す**: `about.ts` を anon 直 CRUD に戻して再デプロイ（非推奨）
2. **RLS だけ戻す**: `scripts/supabase/site-pages-rls-policies.sql`（anon FOR ALL）を再実行
3. **Edge を残す**: RLS を緩めても Edge 経由の管理は継続可能

## GitHub Actions 手動デプロイ（workflow_dispatch）

`/.github/workflows/deploy.yml` で、GitHub Actions の手動実行による build + FTP deploy を行います。

処理内容:

1. リポジトリ checkout
2. Node.js セットアップ
3. `npm ci`
4. `npm run build`
5. `dist/` を FTP で `LOLIPOP_FTP_REMOTE_DIR` へアップロード

### GitHub Secrets に設定する値

| Secret 名 | 用途 |
|------|------|
| `PUBLIC_SUPABASE_URL` | ビルド時に参照する Supabase URL |
| `PUBLIC_SUPABASE_ANON_KEY` | ビルド時に参照する Supabase anon key |
| `LOLIPOP_FTP_HOST` | ロリポップ FTP ホスト名 |
| `LOLIPOP_FTP_USER` | ロリポップ FTP ユーザー名 |
| `LOLIPOP_FTP_PASSWORD` | ロリポップ FTP パスワード |
| `LOLIPOP_FTP_REMOTE_DIR` | `dist/` のアップロード先ディレクトリ（例: `/public_html/`） |
| `PUBLIC_DEPLOY_SHARED_SECRET` | 管理画面「公開サイトを更新」用（ビルド時に埋め込み。Supabase の `DEPLOY_SHARED_SECRET` と同じ値） |

## 管理画面からデプロイを起動（Supabase Edge Function）

管理画面上部の **「公開サイトを更新」** ボタンから、GitHub Actions の `deploy.yml`（`workflow_dispatch`）を起動できます。GitHub Token はブラウザに露出しません。

### アーキテクチャ

1. 管理画面（Basic 認証下）が `PUBLIC_DEPLOY_SHARED_SECRET` をヘッダ `x-deploy-secret` に付与して Edge Function を呼ぶ
2. Edge Function が Supabase Secrets の `GITHUB_TOKEN` で GitHub API `workflow_dispatch` を実行
3. 既存の build + FTP デプロイが走る

### Supabase Secrets（Dashboard → Project Settings → Edge Functions → Secrets）

| Secret 名 | 例・説明 |
|-----------|----------|
| `GITHUB_TOKEN` | Fine-grained PAT（下記権限） |
| `GITHUB_REPO` | `your-user/sariswing-astro` |
| `GITHUB_WORKFLOW_FILE` | `deploy.yml` |
| `GITHUB_REF` | `main`（デプロイ対象ブランチ） |
| `DEPLOY_SHARED_SECRET` | ランダムな長い文字列（`.env` の `PUBLIC_DEPLOY_SHARED_SECRET` と同一） |

### ローカル `.env` / GitHub Actions Secrets

| 変数 | 用途 |
|------|------|
| `PUBLIC_DEPLOY_SHARED_SECRET` | 管理画面 JS にビルド時埋め込み（anon key と同様に公開前提。Basic 認証とセットで運用） |

### GitHub Fine-grained PAT の権限

1. GitHub → Settings → Developer settings → Fine-grained personal access tokens → Generate
2. **Repository access**: Only select repositories → `sariswing-astro`（対象リポジトリ）
3. **Repository permissions**:
   - **Actions**: Read and write（`workflow_dispatch` に必須）
   - **Contents**: Read（ワークフロー実行に必要な場合あり）
   - **Metadata**: Read（デフォルトで付与）
4. 生成したトークンを Supabase Secret `GITHUB_TOKEN` に保存（リポジトリやチャットに貼らない）

### Supabase CLI で Edge Function をデプロイ

初回のみプロジェクトとリンク:

```bash
npm install -g supabase   # 未導入の場合
supabase login
cd /path/to/sariswing-astro
supabase link --project-ref YOUR_PROJECT_REF
```

関数のデプロイ:

```bash
supabase functions deploy trigger-deploy --no-verify-jwt
supabase functions deploy deploy-status --no-verify-jwt
supabase functions deploy admin-instagram
```

- `trigger-deploy` / `deploy-status`: `verify_jwt = false`。`x-deploy-secret` と anon key で呼び出し。
- `admin-instagram` / `admin-site-page`: `verify_jwt = true`。ログイン後の **access_token**（Supabase Auth）で呼び出し。

Secrets の設定（CLI）例:

```bash
supabase secrets set GITHUB_TOKEN=ghp_xxxx \
  GITHUB_REPO=owner/sariswing-astro \
  GITHUB_WORKFLOW_FILE=deploy.yml \
  GITHUB_REF=main \
  DEPLOY_SHARED_SECRET=your-long-random-secret
```

動作確認（ローカル）:

```bash
supabase functions serve trigger-deploy --no-verify-jwt
curl -X POST "http://127.0.0.1:54321/functions/v1/trigger-deploy" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "x-deploy-secret: your-long-random-secret"
```

### 注意

- `PUBLIC_DEPLOY_SHARED_SECRET` はビルド成果物に含まれます。完全秘匿ではないため、`/admin/` の Basic 認証を必ず有効にしてください。
- 連打防止のため `deploy.yml` に `concurrency: production-deploy` を設定済みです。

## RLS（Row Level Security）

- **現時点では RLS は未適用** です。
- 適用案は `scripts/supabase/rls-policies.sql` にコメント付きで記載しています。ステージングで admin と公開ページの動作を確認してから本番に適用してください。

## 公開前チェックリスト

- [ ] `.env` に本番用 URL / anon key を設定し、ビルドが成功する
- [ ] `/admin/` に Basic 認証を設定した
- [ ] テスト用の未公開データが本番 DB に残っていないか確認した
- [ ] service_role key がリポジトリ・`dist/` に含まれていない
- [ ] RLS 適用のタイミングと手順を決めた（`scripts/supabase/rls-policies.sql`）
