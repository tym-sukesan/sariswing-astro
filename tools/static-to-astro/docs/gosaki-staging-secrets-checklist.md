# gosaki Staging Secrets Checklist（Phase G-1）

**目的:** gosaki staging 検証における secrets 管理ルール  
**原則:** secret 実値を doc / Git / レポートに書かない。本番 secrets を staging 検証に使わない。

関連: [gosaki-staging-operations.md](./gosaki-staging-operations.md)

---

## A. ローカル `.env.local`

**場所:** `tools/static-to-astro/.env.local`  
**Git:** 管理禁止（`.gitignore` 済み）

### 必要な項目（テンプレート — 値は空のまま設定）

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_ADMIN_EMAIL=
SUPABASE_ADMIN_PASSWORD=
```

### 運用注意

| ルール | 理由 |
| --- | --- |
| `.env.local` は Git 管理禁止 | 誤 push 防止 |
| service role key をブラウザに出さない | Admin UI / client bundle に含めない |
| password / token をログ出力しない | verifier / CLI は key leak scan 実施 |
| **staging 専用** の URL / keys のみ | 本番 Supabase を混同しない |
| スクショ・チャット共有しない | 画面に keys が映る可能性 |

### 確認コマンド

```bash
git check-ignore -v tools/static-to-astro/.env.local
git status --short
# .env.local が untracked に出ないこと（ignore されていること）
```

---

## B. GitHub Secrets 候補

root `.github/workflows/` は Phase G-1 では **変更・有効化しない**。将来 deploy 用の **命名候補** のみ。

### Staging（Phase G-2 以降）

| Secret 名 | 用途 |
| --- | --- |
| `GOSAKI_STAGING_SUPABASE_URL` | export / bootstrap（CI） |
| `GOSAKI_STAGING_SUPABASE_SERVICE_ROLE_KEY` | Auth / admin 操作（最小使用） |
| `GOSAKI_STAGING_SUPABASE_ANON_KEY` | build 時の参照（必要な場合） |
| `GOSAKI_STAGING_FTP_SERVER` | staging FTP ホスト |
| `GOSAKI_STAGING_FTP_USERNAME` | staging FTP ユーザー |
| `GOSAKI_STAGING_FTP_PASSWORD` | staging FTP パスワード |
| `GOSAKI_STAGING_FTP_SERVER_DIR` | staging 公開ディレクトリ |

### Production（本番化ゲート PASS 後）

| Secret 名 | 用途 |
| --- | --- |
| `GOSAKI_PROD_SUPABASE_URL` | 本番 CMS |
| `GOSAKI_PROD_SUPABASE_SERVICE_ROLE_KEY` | 本番 admin 操作 |
| `GOSAKI_PROD_SUPABASE_ANON_KEY` | 本番 anon |
| `GOSAKI_PROD_FTP_SERVER` | gosaki 本番 FTP |
| `GOSAKI_PROD_FTP_USERNAME` | 本番 FTP ユーザー |
| `GOSAKI_PROD_FTP_PASSWORD` | 本番 FTP パスワード |
| `GOSAKI_PROD_FTP_SERVER_DIR` | 本番公開ディレクトリ |

### Sariswing 本番 secrets

Sariswing 用 FTP / Supabase secrets は **gosaki staging 検証に流用しない**。別プロジェクト・別命名。

### Admin 運用（Phase G-3）

短期正式: **Local Admin**。詳細: [gosaki-admin-operations.md](./gosaki-admin-operations.md)

### Staging FTP deploy（Phase G-2）

deploy 前に `deploy-public-dist-ftp.mjs` dry-run で `safeForStaticFtp` と admin 除外を再確認。詳細: [gosaki-staging-ftp-deploy.md](./gosaki-staging-ftp-deploy.md)

### Staging FTP safety（Phase G-2b-prep）

apply 前に `verify-staging-ftp-safety.mjs` で env 命名・server dir を静的確認。**FTP 接続しない。**

| 命名 | 用途 |
| --- | --- |
| `GOSAKI_STAGING_FTP_SERVER` | staging FTP ホスト |
| `GOSAKI_STAGING_FTP_USERNAME` | staging FTP ユーザー |
| `GOSAKI_STAGING_FTP_PASSWORD` | staging FTP パスワード |
| `GOSAKI_STAGING_FTP_SERVER_DIR` | **検証用**ディレクトリ（`staging` / `test` / `preview` / `cms-kit` / `sandbox` を含む） |

**禁止事項:**

- `GOSAKI_PROD_FTP_*` を `.env.local` に置かない（verifier が fail）
- `public_html` / `www` / `gosaki-piano.com` / `sariswing` 等の危険語を server dir に含めない
- 本番 FTP credentials を staging apply に流用しない

詳細: [gosaki-staging-ftp-safety-check.md](./gosaki-staging-ftp-safety-check.md)

---

## C. 混同防止ルール

1. **staging と prod を同じ Secret 名にしない** — プレフィックス `GOSAKI_STAGING_` / `GOSAKI_PROD_` を必須化
2. **service role key は最小限の場所でのみ使用** — ローカル CLI、bootstrap、必要な CI ステップのみ
3. **prod secrets を staging 検証に使わない** — export / FTP dry-run も staging キーのみ
4. **`.env.local` をスクショ共有しない** — 1Password 等の secrets manager を推奨
5. **public-dist / dist に keys が含まれない** — 各 verifier の secret leak scan を PASS 必須
6. **gosaki 本番 FTP に Phase G-1〜G-2 で接続しない** — staging FTP のみ

---

## D. ローテーション方針

| トリガー | 対応 |
| --- | --- |
| **誤 push 疑い** | 該当 key を Supabase / FTP で即 rotate。`.env.local` 再配布。`git grep` で漏洩確認 |
| **担当者変更** | admin password rotate。service role は必要時のみ再発行 |
| **クライアント引き渡し** | 本番 admin はクライアント専用アカウントへ。開発用 staging admin は無効化またはパスワード変更 |
| **本番化時** | prod keys を新規発行。staging keys とは別セット。GitHub Secrets を prod 用に登録 |

---

## E. 最低限の監査コマンド

作業前・commit 前:

```bash
git grep -n -i -E "SUPABASE_SERVICE_ROLE_KEY|FTP_PASSWORD|EMAIL_PATTERN_PLACEHOLDER" || true
git status --short
```

secret **実値** パターン（doc に書かないことの確認）:

```bash
grep -R -n -i -E "SUPABASE_SERVICE_ROLE_KEY=.*[A-Za-z0-9]|FTP_PASSWORD=.*[A-Za-z0-9]|SUPABASE_ADMIN_PASSWORD=.*[A-Za-z0-9]" \
  tools/static-to-astro/docs/ \
  tools/static-to-astro/README.md || true
```

空テンプレート（`KEY=` のみ）は OK。JWT 形式・長いランダム文字列の代入は NG。

### verifier による scan

| スクリプト | scan 対象 |
| --- | --- |
| `verify-static-public-artifact.mjs` | public-dist / dist |
| `verify-cms-minimal-loop.mjs` | dist |
| `verify-admin-api-auth.mjs` | dist |

---

## F. チェックリスト（作業前）

- [ ] `.env.local` が Git ignore されている
- [ ] `.env.local` の `SUPABASE_URL` が **staging** プロジェクトである（本番 URL ではない）
- [ ] 本番 FTP ホスト名を `.env.local` に入れていない
- [ ] commit 対象に `output/` が含まれていない
- [ ] レポート / manifest に secret 実値がない

---

Phase G-1: secrets checklist のみ。keys の実値は doc に記載していません。
