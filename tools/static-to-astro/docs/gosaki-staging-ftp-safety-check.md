# gosaki Staging FTP Safety Check（Phase G-2b-prep）

**目的:** staging FTP `--apply`（G-2b）の前に、接続先が **staging 専用**であり、本番・Sariswing・gosaki 本番に影響しないことを確認する。  
**境界:** 静的チェックのみ。**FTP 接続しない。`--apply` しない。**

関連:

- [gosaki-staging-ftp-deploy.md](./gosaki-staging-ftp-deploy.md)
- [gosaki-readiness-verifier.md](./gosaki-readiness-verifier.md)
- [gosaki-staging-secrets-checklist.md](./gosaki-staging-secrets-checklist.md)

---

## A. 目的

確認対象（`.env.local` または環境変数）:

```env
GOSAKI_STAGING_FTP_SERVER=
GOSAKI_STAGING_FTP_USERNAME=
GOSAKI_STAGING_FTP_PASSWORD=
GOSAKI_STAGING_FTP_SERVER_DIR=
```

**禁止:** `GOSAKI_PROD_FTP_*` をローカルに置かない。

---

## B. staging FTP の条件

staging FTP は以下を満たすこと。

| 条件 | 説明 |
| --- | --- |
| 本番ドメイン公開ルートではない | `public_html/` 直下等を避ける |
| Sariswing 本番 FTP ではない | 本番ホスト・本番ディレクトリと混同しない |
| gosaki 本番 FTP ではない | `gosaki-piano.com` 関連パス禁止 |
| 既存クライアント公開領域ではない | 上書き・削除で本番影響が出ない |
| 検証用ディレクトリ | 空または削除しても困らない |
| 命名 | `staging` / `test` / `preview` / `cms-kit` / `sandbox` 等を含む |

---

## C. 禁止される接続先

以下は staging として使わない。

```text
/
public_html/
www/
htdocs/
sariswing.com/
gosaki-piano.com/
production/
prod/
live/
本番ドメイン直下
既存サイト公開ディレクトリ
```

---

## D. 推奨ディレクトリ名

```text
/cms-kit-staging/gosaki/
/staging/gosaki-cms-kit/
/preview/gosaki/
/test/gosaki-static/
/sandbox/gosaki-cms-kit/
```

---

## E. apply 前の人間確認チェックリスト

- [ ] 接続先サーバーは staging 用か
- [ ] 接続先ディレクトリは本番公開ルートではないか
- [ ] ディレクトリ名に `staging` / `test` / `preview` / `cms-kit` / `sandbox` が含まれるか
- [ ] 既存ファイルを消しても問題ないか
- [ ] rollback 用に現在の状態を tarball 退避する方針があるか
- [ ] FTP credentials は `GOSAKI_STAGING_FTP_*` のみか
- [ ] `GOSAKI_PROD_FTP_*` を使っていないか
- [ ] `.env.local` を Git 管理していないか

---

## F. G-2b apply へ進む条件

以下を **すべて** 満たす場合のみ G-2b へ進める。

| ゲート | コマンド / 条件 |
| --- | --- |
| Readiness | `verify-gosaki-readiness.mjs` → `READY_FOR_STAGING_FTP_APPLY: yes` |
| FTP safety | `verify-staging-ftp-safety.mjs` → `STAGING_FTP_SAFE_TO_APPLY: yes` |
| 人間確認 | チェックリスト E を担当者が確認 |
| Rollback | manifest + tarball 方針あり |
| Secrets | 本番 FTP / Supabase 値が `.env.local` に混在していない |

---

## 実行コマンド

```bash
node tools/static-to-astro/scripts/verify-staging-ftp-safety.mjs \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_SAFETY_REPORT.md
```

**secrets 未設定時:** `STAGING_FTP_SAFE_TO_APPLY: no`（`missing staging FTP env`）は **正常な安全判定**。

**設定済み + 安全なパス:** `STAGING_FTP_SAFE_TO_APPLY: yes`、`FTP connected: false`

---

Phase G-2b-prep: 静的 safety check のみ。FTP 接続・apply 未実施。
