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
- 管理画面は anon key で Supabase に接続します。RLS 未適用の間は、キーが漏れた場合にデータ改ざんのリスクがあります。
- 可能であれば `dist/admin/` を公開ホストから除外するか、認証の後だけ配信してください。
- GitHub Actions で `dist/` をFTPデプロイする場合、`dist/admin/` もアップロード対象に含まれます。**必ず本番サーバー側で `/admin/` に Basic 認証を設定**してください。

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
```

`supabase/config.toml` で `verify_jwt = false` にしているため、管理画面からは `x-deploy-secret` と anon key で呼び出します。

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
