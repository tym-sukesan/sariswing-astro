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

## RLS（Row Level Security）

- **現時点では RLS は未適用** です。
- 適用案は `scripts/supabase/rls-policies.sql` にコメント付きで記載しています。ステージングで admin と公開ページの動作を確認してから本番に適用してください。

## 公開前チェックリスト

- [ ] `.env` に本番用 URL / anon key を設定し、ビルドが成功する
- [ ] `/admin/` に Basic 認証を設定した
- [ ] テスト用の未公開データが本番 DB に残っていないか確認した
- [ ] service_role key がリポジトリ・`dist/` に含まれていない
- [ ] RLS 適用のタイミングと手順を決めた（`scripts/supabase/rls-policies.sql`）
