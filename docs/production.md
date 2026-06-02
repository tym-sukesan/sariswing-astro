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
- **NEWS 管理**（`/admin/news/`）は Supabase Auth + Edge Function `admin-news` 経由です。
- **Schedule 管理**（`/admin/schedule/`）は Supabase Auth + Edge Function `admin-schedule` 経由です。
- いずれも共有 API シークレットは `dist/` に埋め込みません（JWT セッションのみ）。
- 可能であれば `dist/admin/` を公開ホストから除外するか、認証の後だけ配信してください。
- GitHub Actions で `dist/` をFTPデプロイする場合、`dist/admin/` もアップロード対象に含まれます。**必ず本番サーバー側で `/admin/` に Basic 認証を設定**してください。

## Instagram 管理（Supabase Auth + Edge Function）

### 概要

1. `/admin/login/` でメール・パスワード（Supabase Auth）にログイン
2. JWT 付きで `admin-instagram` Edge Function を呼び出し
3. Edge 内で管理者 JWT を確認後（`app_metadata.role === "admin"` または `ADMIN_EMAILS`）、`service_role` で `instagram_posts` を CRUD
4. 公開サイトの Instagram は引き続き **ビルド時 anon SELECT**（`InstagramFeed.astro`）

`service_role` / `PUBLIC_ADMIN_API_SECRET` はフロント・GitHub Actions・リポジトリに置きません。

### Supabase Dashboard — Authentication

1. **Authentication → Providers → Email** を有効化
2. **Authentication → Settings** で **Enable sign ups** をオフ（管理者は手動作成のみ推奨）
3. **Authentication → Users → Add user** で管理者用メール・パスワードを作成
4. **Authentication → URL Configuration** で Site URL / Redirect URLs を設定（パスワード再設定用）

#### Site URL / Redirect URLs（パスワード再設定）

`/admin/forgot-password/` から送信する再設定メールは、Supabase Auth 経由で `/admin/reset-password/` へリダイレクトします。Dashboard の **Authentication → URL Configuration** に次を登録してください。

| 項目 | 値 |
|------|-----|
| **Site URL** | `https://sariswing.com` |
| **Redirect URLs** | `https://sariswing.com/admin/reset-password/` |
| （ローカル開発） | `http://localhost:4321/admin/reset-password/` |
| （ローカル開発） | `http://127.0.0.1:4321/admin/reset-password/` |

- メール内リンクは `resetPasswordForEmail` の `redirectTo`（`{origin}/admin/reset-password/`）に従います
- `/admin/login/`・`/admin/forgot-password/` は Redirect URLs に不要です（メールから直接遷移しないため）
- 本番・ローカルで origin が異なるため、開発時は上記 localhost URL も追加してください

### 管理者の付与（ロールまたはメール許可リスト）

管理用 Edge Function（`admin-instagram` / `admin-site-page` / `admin-news` / `admin-schedule`）は、ログイン済み JWT に対して次の **いずれか** を満たすユーザーのみ許可します。

| 方法 | 内容 |
|------|------|
| **A. ロール** | `app_metadata.role = "admin"` |
| **B. メール許可リスト** | Edge Secrets の `ADMIN_EMAILS`（カンマ区切り・複数可） |

未ログインは 401、ログイン済みだが管理者でない場合は **403 Forbidden**（ブラウザでは `Edge Function returned a non-2xx status code` と表示されることがあります）。

#### 方法 A: SQL で `role = admin` を付与（推奨）

Dashboard からユーザー作成後、SQL Editor で付与（メールを置き換え）:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'your-admin@example.com';
```

複数管理者:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email in ('your-admin@example.com', 'sari-admin@example.com');
```

テンプレート: `scripts/supabase/admin-user-role.sql`

#### 方法 B: `ADMIN_EMAILS`（Edge Secrets）

ロールを付けずにメールだけで許可する場合（JWT 検証は維持）:

```bash
supabase secrets set ADMIN_EMAILS="your-admin@example.com,sari-admin@example.com"
supabase functions deploy admin-instagram
supabase functions deploy admin-site-page
supabase functions deploy admin-news
supabase functions deploy admin-schedule
```

**注意:** `admin-auth.ts` を変更したあとは、上記 4 関数を再デプロイしないと本番に反映されません。

#### ログの確認（403 の切り分け）

Supabase Dashboard → **Edge Functions** → 対象関数 → **Logs**

- `403` + `Forbidden` … ログインはできているが管理者ではない（ロール未付与 / `ADMIN_EMAILS` 未登録）
- `401` … JWT 無効・未送信
- `500` + `Server configuration error` … `SUPABASE_URL` / `SUPABASE_ANON_KEY` 不足（本番では通常自動）

### Edge Function のデプロイ

`admin-instagram` は **JWT 検証あり**（`verify_jwt = true`）。`trigger-deploy` とは別です。

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-instagram
supabase functions deploy admin-site-page
supabase functions deploy admin-news
supabase functions deploy admin-schedule
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

## NEWS 管理（Supabase Auth + Edge Function）

### 概要

1. `/admin/login/` でログイン（未ログインで `/admin/news/` にアクセスすると `?next=/admin/news/` へリダイレクト）
2. JWT 付きで `admin-news` Edge Function を呼び出し
3. Edge 内で `app_metadata.role === "admin"` を確認後、`service_role` で `news` を CRUD
4. 公開 `/news/`・トップ NEWS は **ビルド時 anon SELECT**（`is_published = true` かつ `deleted_at IS NULL`）

画像アップロード（Storage `images`）は従来どおりブラウザから anon key で行います（NEWS 保存のみ Edge 経由）。

**論理削除:** 削除ボタンは `deleted_at = now()` に更新します。管理画面の「削除済みNEWS」から復元可能です（完全削除はありません）。

### 論理削除マイグレーション（NEWS / Schedule 共通）

1. Supabase SQL Editor で `scripts/supabase/soft-delete-news-schedules.sql` を実行
   - `news.deleted_at` / `schedules.deleted_at` 列を追加（既存行は NULL）
   - anon RLS を `is_published = true AND deleted_at IS NULL` に更新
2. Edge Function を再デプロイ:

```bash
supabase functions deploy admin-news
supabase functions deploy admin-schedule
```

3. フロント（`dist/admin/`）をデプロイ
4. 確認: 削除 → 通常一覧・公開サイトから消える / 削除済み一覧に表示 / 復元 → 通常一覧に戻る / `npm run build` 後も削除済みは公開されない

**注意:** マイグレーション前にフロントだけ先にデプロイすると、`.is("deleted_at", null)` 付きビルドが失敗する場合があります。**SQL → Edge 再デプロイ → フロント** の順を推奨します。

### Edge Function のデプロイ

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-news
```

`verify_jwt = true` です。Instagram / About と独立してデプロイできます。

### 本番確認手順（RLS 適用前）

1. `admin-news` をデプロイ
2. フロント（`dist/admin/`）をデプロイ
3. `/admin/login/` → `/admin/news/`
4. 一覧表示・追加・編集・公開/非公開・複製（非公開）・削除（論理削除）・削除済み一覧での復元
5. アイキャッチ画像のアップロード（Storage）が従来どおり動くこと
6. ログアウト後、`/admin/news/` 直アクセスでログインへ戻ること

### `news` RLS の適用タイミング

**Edge + NEWS 管理の動作確認後** に `scripts/supabase/news-rls-select-published.sql` を実行してください。

| 対象 | anon（適用後） |
|------|----------------|
| `news` | SELECT のみ、`is_published = true AND deleted_at IS NULL` の行 |

### RLS 適用前後の確認

| 確認項目 | RLS 適用前 | RLS 適用後 |
|----------|------------|------------|
| `/admin/login/` → NEWS CRUD | OK（Edge） | OK（Edge） |
| `/news/`・トップ NEWS（静的ビルド） | OK（anon SELECT 公開のみ） | OK（同上） |
| 管理画面で非公開記事の一覧 | OK（Edge は全件） | OK（Edge は全件） |
| ブラウザから anon 直 `insert` / `update` / `delete` | 可能（RLS 無効/FOR ALL 時） | **拒否** |

### ロールバック

1. **管理だけ戻す**: `news.ts` を anon 直 CRUD に戻して再デプロイ（非推奨）
2. **RLS だけ戻す**: `news` で anon `FOR ALL` ポリシーを一時復活、または `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`（緊急時のみ）
3. **Edge を残す**: RLS を緩めても Edge 経由の管理は継続可能

## Schedule 管理（Supabase Auth + Edge Function）

### 概要

1. `/admin/login/` でログイン（未ログインで `/admin/schedule/` にアクセスすると `?next=/admin/schedule/` へリダイレクト）
2. JWT 付きで `admin-schedule` Edge Function を呼び出し
3. Edge 内で `app_metadata.role === "admin"` を確認後、`service_role` で `schedules` を CRUD
4. 会場マスタ（`venues`）は Edge の `list` で **SELECT のみ**（管理画面の会場選択用）
5. 公開 `/schedule/` は **ビルド時 anon SELECT**（`is_published = true` かつ `deleted_at IS NULL`）

画像アップロード（Storage `images` / `schedule/` プレフィックス）は従来どおり。Schedule の保存のみ Edge 経由です。

**論理削除:** 削除ボタンは `deleted_at = now()` に更新します。管理画面の「削除済みスケジュール」から復元可能です。マイグレーション手順は上記 NEWS 節「論理削除マイグレーション」を参照してください。

**UI の分割（今後 / 過去）・検索・ページネーション**はフロント側の既存ロジックのままです（`list` で全件取得後にクライアントで分類）。

### Edge Function のデプロイ

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-schedule
```

`verify_jwt = true` です。

### 本番確認手順（RLS 適用前）

1. `admin-schedule` をデプロイ
2. フロント（`dist/admin/`）をデプロイ
3. `/admin/login/` → `/admin/schedule/`
4. 一覧（今後 / 過去）・検索・追加・編集・複製・削除（論理削除）・削除済み一覧での復元・公開/非公開
5. 会場選択・自由入力会場・画像アップロード
6. ログアウト後、`/admin/schedule/` 直アクセスでログインへ戻ること

### `schedules` RLS の適用タイミング

**Edge + Schedule 管理の動作確認後** に `scripts/supabase/schedules-rls-select-published.sql` を実行してください。

| 対象 | anon（適用後） |
|------|----------------|
| `schedules` | SELECT のみ、`is_published = true AND deleted_at IS NULL` |
| `venues` | 既存 `venues-rls.sql` のまま（anon SELECT） |

### RLS 適用前後の確認

| 確認項目 | RLS 適用前 | RLS 適用後 |
|----------|------------|------------|
| `/admin/login/` → Schedule CRUD | OK（Edge） | OK（Edge） |
| `/live-schedule/`（静的ビルド） | OK（anon SELECT 公開のみ） | OK（同上） |
| 管理画面で非公開の一覧 | OK（Edge は全件） | OK（Edge は全件） |
| ブラウザから anon 直 `insert` / `update` / `delete` | 可能（RLS 無効/FOR ALL 時） | **拒否** |

### ロールバック

1. **管理だけ戻す**: `schedule.ts` を anon 直 CRUD に戻して再デプロイ（非推奨）
2. **RLS だけ戻す**: `schedules` で anon `FOR ALL` ポリシーを一時復活、または RLS 無効化（緊急時のみ）
3. **Edge を残す**: RLS を緩めても Edge 経由の管理は継続可能

### 注意点

- **複製**は DB 上の id 指定で行います（フォームの未保存内容は含みません）。タイトルは「〇〇 のコピー」/「無題のコピー」、`is_published` 等は元行の値を引き継ぎます（従来のフォーム複製と同様の公開状態）。
- `venues` は Edge 経由で取得します（`venues` RLS が anon SELECT のみでも管理画面は問題ありません）。
- Schedule はフィールドが多いため、Edge デプロイ後は **追加・更新・複製** をそれぞれ一度ずつ確認してください。

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
## 管理画面からデプロイを起動（Supabase Edge Function）

管理画面上部の **「公開サイトを更新」** ボタンから、GitHub Actions の `deploy.yml`（`workflow_dispatch`）を起動できます。GitHub Token はブラウザに露出しません。

### アーキテクチャ

1. 管理画面で Supabase Auth にログイン済みの管理者が、JWT 付きで `trigger-deploy` / `deploy-status` を呼ぶ
2. Edge Function 内で `requireAdminUser`（`role=admin` または `ADMIN_EMAILS`）を検証
3. 検証後、Supabase Secrets の `GITHUB_TOKEN` で GitHub API `workflow_dispatch` を実行
4. 既存の build + FTP デプロイが走る

未ログイン・管理者でないユーザーは Edge が 401 / 403 を返し、デプロイは開始されません。

### Supabase Secrets（Dashboard → Project Settings → Edge Functions → Secrets）

| Secret 名 | 例・説明 |
|-----------|----------|
| `GITHUB_TOKEN` | Fine-grained PAT（下記権限） |
| `GITHUB_REPO` | `your-user/sariswing-astro` |
| `GITHUB_WORKFLOW_FILE` | `deploy.yml` |
| `GITHUB_REF` | `main`（デプロイ対象ブランチ） |

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
supabase functions deploy trigger-deploy
supabase functions deploy deploy-status
supabase functions deploy admin-instagram
supabase functions deploy admin-site-page
supabase functions deploy admin-news
supabase functions deploy admin-schedule
```

- `trigger-deploy` / `deploy-status` / 各 `admin-*`: いずれも `verify_jwt = true`。ログイン後の **access_token**（Supabase Auth）で呼び出し。管理者判定は Edge 内 `requireAdminUser`。
- **再デプロイ必須:** 本変更前に `--no-verify-jwt` でデプロイしていた場合、必ず上記 2 関数を再デプロイしてください（旧版は secret のみで起動可能）。

Secrets の設定（CLI）例:

```bash
supabase secrets set GITHUB_TOKEN=ghp_xxxx \
  GITHUB_REPO=owner/sariswing-astro \
  GITHUB_WORKFLOW_FILE=deploy.yml \
  GITHUB_REF=main
```

（`DEPLOY_SHARED_SECRET` は不要です。Dashboard に残っていても無視されます。）

### 注意

- `/admin/` の Basic 認証は引き続き必須です（静的 HTML の露出対策）。
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
