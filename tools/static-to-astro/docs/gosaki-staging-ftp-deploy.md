# gosaki Staging FTP Deploy（Phase G-2）

**目的:** `public-dist/` のみを **staging FTP** に安全 deploy できるか検証する仕組みを整備する。  
**Phase G-2 境界:** dry-run 検証まで。**本番 FTP / gosaki 本番 FTP / Sariswing FTP は未使用。**

関連:

- [gosaki-staging-operations.md](./gosaki-staging-operations.md)
- [gosaki-staging-runbook.md](./gosaki-staging-runbook.md)
- [public-dist-ftp-deploy.md](./public-dist-ftp-deploy.md)

---

## なぜ public-dist だけか

| 禁止 | 理由 |
| --- | --- |
| `dist/client` 直 deploy | hybrid build 時 `admin/` HTML が混在する |
| `dist/server` deploy | Node SSR / API のみ。静的 FTP では動かない |
| `admin/` / `api/` 含む artifact | 認証 API が静的ホストで動作しない |

`verify-static-public-artifact.mjs` が生成する **`public-dist/`** は Admin/API を除外済み。  
`static-public-manifest.json` の `safeForStaticFtp: true` を deploy 前ゲートとする。

---

## staging / prod secrets 分離

deploy は **staging 専用 env** のみ:

```env
GOSAKI_STAGING_FTP_SERVER=
GOSAKI_STAGING_FTP_USERNAME=
GOSAKI_STAGING_FTP_PASSWORD=
GOSAKI_STAGING_FTP_SERVER_DIR=
```

- `FTP_PASSWORD` 等の汎用名は使わない
- `GOSAKI_PROD_*` は deploy スクリプトが拒否
- password はログ・レポート・manifest に出さない（host 名は可）

---

## dry-run → apply の流れ

```text
1. convert + build + verify-static-public-artifact
2. public-dist + static-public-manifest 確認
3. deploy-public-dist-ftp.mjs（デフォルト dry-run）
4. verify-staging-ftp-deploy-plan.mjs
5. （将来）staging FTP backup → --apply --env staging
6. （本番化ゲート後のみ）GOSAKI_PROD_* で production deploy
```

### CLI

```bash
# dry-run（FTP 接続なし）
node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
  --site-slug gosaki \
  --env staging \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_REPORT.md \
  --manifest tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json

# apply（Phase G-2 検証では未実行 — staging のみ・lftp 必要）
# node ... --env staging --apply
```

**制約:**

- `--env staging` のみ許可
- `--env production` / `prod` は明示拒否
- `--apply` なしでは FTP 接続しない
- 本番らしい FTP ディレクトリ（例: `gosaki-piano.com` パス）はブロック

---

## deploy 前検証（自動）

| チェック | 内容 |
| --- | --- |
| public-dir exists | ディレクトリ存在 |
| index.html | ルート HTML |
| admin/ api/ server/ | 存在しないこと |
| .env* | 含まれないこと |
| safeForStaticFtp | manifest が true |
| secret leak scan | dist 内 keys なし |
| file count | > 0 |

---

## rollback / backup

| タイミング | 手段 |
| --- | --- |
| apply 前 | staging FTP 現状を tarball 退避（手動） |
| apply 前 | `public-dist` + deploy manifest を保存 |
| 各 deploy | `staging-ftp-deploy-manifest.previous.json` に前世代を自動コピー |
| 障害時 | 前世代 `public-dist` を lftp で再 mirror |
| **production** | backup 必須（Phase G-2 では未実施） |

---

## production 適用前の追加条件

- [ ] Phase G-2 staging FTP dry-run PASS
- [ ] staging FTP `--apply` 検証 PASS（別フェーズ）
- [ ] CMS minimal loop / static-public / secret leak すべて PASS
- [ ] `GOSAKI_PROD_*` secrets を staging 検証に使っていない
- [ ] クライアント・画像権利・SEO チェックリスト完了
- [ ] rollback Runbook の合意

---

## スクリプト一覧

| スクリプト | 役割 |
| --- | --- |
| `deploy-public-dist-ftp.mjs` | deploy dry-run / apply（staging のみ） |
| `verify-staging-ftp-deploy-plan.mjs` | dry-run plan 総合検証 |

---

Phase G-2: staging FTP deploy 設計・dry-run のみ。本番未実行。
