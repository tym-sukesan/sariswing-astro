# Public-dist FTP Deploy（Phase 3-V）

Phase 3-T で確立した **`public-dist/` のみを FTP 公開** する GitHub Actions workflow テンプレートと運用方針です。

**本番 FTP / 本番 GitHub Actions の有効化は Phase 3-V では行いません。**

---

## 1. なぜ `dist/client` 直 deploy が危険か

`--with-admin-cms` の hybrid build では:

| パス | 問題 |
| --- | --- |
| `dist/client/admin/` | Admin UI の静的 HTML が混在（FTP 公開すると管理画面 HTML が露出） |
| `dist/client/` 全体 | 上記を含むため **ロリポップ FTP 直アップロード非推奨** |
| `dist/server/` | Node SSR + `/api/admin/*` — **FTP では動作しない** |

Phase 3-T の `verify-static-public-artifact.mjs` が `admin/` を除外した **`public-dist/`** を生成します。

---

## 2. なぜ `public-dist/` を deploy 対象にするか

- 公開に必要な HTML/CSS/sitemap のみ
- **`admin/` 除外済み**
- **`/api/admin/*` 非含有**（API は server 側のみ）
- `static-public-manifest.json` の `safeForStaticFtp: true` で gate 可能
- key leak scan 済み artifact を deploy 可能

---

## 3. Admin/API を FTP に置けない理由

- 静的 FTP ホストに Node ランタイムがない
- `/api/admin/*` は `dist/server/` でのみ提供
- Admin 保存は **ローカル dev** または **将来 Node 別ホスト**（[admin-hosting-strategy.md](./admin-hosting-strategy.md)）

---

## 4. GitHub Actions テンプレート

**場所（テンプレートのみ — 未有効化）:**

```text
tools/static-to-astro/templates/github-actions/public-dist-ftp-deploy.yml
```

**有効化手順（本番前）:**

1. チェックリスト（§8）を完了
2. テンプレートを `.github/workflows/` にコピーし、パス・`site_slug` を調整
3. GitHub Secrets を設定（§5）
4. **staging FTP** または dry-run で mirror コマンドを検証
5. 本番 FTP は最終承認後

**フロー概要:**

```text
checkout
  → convert (--with-admin-cms)
  → export-supabase-json
  → npm run build (generated-astro)
  → verify-static-public-artifact
  → assert safeForStaticFtp
  → lftp mirror public-dist/ ONLY
```

---

## 5. 必要な GitHub Secrets

| Secret | 用途 |
| --- | --- |
| `FTP_SERVER` | FTP ホスト名 |
| `FTP_USERNAME` | FTP ユーザー |
| `FTP_PASSWORD` | FTP パスワード |
| `FTP_SERVER_DIR` | リモート配置ディレクトリ |
| `SUPABASE_URL` | export CLI（staging / 将来本番） |
| `SUPABASE_SERVICE_ROLE_KEY` | export CLI（read-only） |
| `SUPABASE_ANON_KEY` | build 時 env（Admin ページ prerender 用） |

Optional（deploy には基本不要）: `SUPABASE_ADMIN_EMAIL`, `SUPABASE_ADMIN_PASSWORD`

**テンプレート・docs に secret 実値を書かないこと。**

---

## 6. 運用パターン

### 短期（現行推奨）

**Local Admin + export/build + public-dist FTP**

```text
1. ローカル npm run dev で Admin 編集
2. export-supabase-json.mjs
3. npm run build
4. verify-static-public-artifact.mjs
5. public-dist/ を FTP（手動または CI）
```

### 中期

**Node host Admin/API + public-dist FTP**

- Admin: 別サブドメイン + `dist/server`
- 公開: CI が `public-dist/` のみ FTP

---

## 7. Sariswing 移植時の注意

Sariswing 現行 CI（`.github/workflows/deploy.yml`）は **`dist/` 全体を mirror** しています。

移植時の整合性:

| 項目 | 現行 Sariswing | 新テンプレート |
| --- | --- | --- |
| Deploy 対象 | `dist/` | `public-dist/` のみ |
| CMS Admin HTML | 該当なし（現行） | `dist/client/admin/` 混在 → **直 deploy 禁止** |
| Supabase export | なし | CI 内 export ステップ |

**必須:** 既存 deploy workflow を置き換える前に staging で `public-dist` mirror を検証。

---

## 8. 本番適用前チェックリスト

- [ ] `verify-public-dist-deploy-workflow.mjs` PASS
- [ ] `verify-static-public-artifact.mjs` PASS（`safeForStaticFtp: true`）
- [ ] GitHub Secrets 設定（実値は repo にコミットしない）
- [ ] staging FTP で `public-dist/` mirror dry-run
- [ ] `dist/client/` / `dist/server/` / `.env.local` が upload されないことを確認
- [ ] ロールバック手順（前回 `public-dist` 退避）
- [ ] Sariswing 本番ドメイン・パス確認
- [ ] クライアント運用説明（Admin は FTP 上では動かない）

---

## 9. 検証 CLI

### Workflow テンプレート検証

```bash
node tools/static-to-astro/scripts/verify-public-dist-deploy-workflow.mjs \
  --workflow-template tools/static-to-astro/templates/github-actions/public-dist-ftp-deploy.yml \
  --report tools/static-to-astro/output/deploy/gosaki/PUBLIC_DIST_DEPLOY_WORKFLOW_REPORT.md
```

### Static public artifact（deploy 前 gate）

```bash
node tools/static-to-astro/scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/static-public/gosaki/STATIC_PUBLIC_ARTIFACT_REPORT.md
```

---

## 10. 関連ドキュメント

- [admin-hosting-strategy.md](./admin-hosting-strategy.md)
- [phase3-r-productization-review.md](./phase3-r-productization-review.md)
