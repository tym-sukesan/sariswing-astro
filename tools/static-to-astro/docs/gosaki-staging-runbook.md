# gosaki Staging Runbook（Phase G-1）

**目的:** gosaki staging 検証の **实际操作手順書**  
**作業ディレクトリ:** リポジトリ root（`sariswing-astro/`）  
**対象:** `tools/static-to-astro/`  
**site profile:** `musician` / **site slug:** `gosaki`

**Phase G-1 境界:** staging Supabase への export/build/verifier は doc 上の手順。**staging FTP 反映・本番 FTP・本番 Supabase には接続しない。**

関連: [gosaki-staging-operations.md](./gosaki-staging-operations.md) / [gosaki-staging-secrets-checklist.md](./gosaki-staging-secrets-checklist.md) / [gosaki-admin-operations.md](./gosaki-admin-operations.md)

---

## A. 前提

| 項目 | 値 |
| --- | --- |
| リポジトリ | `sariswing-astro` |
| 作業 cwd | プロジェクト root |
| fixture | `tools/static-to-astro/fixtures/gosaki-static-site` |
| 生成先 | `tools/static-to-astro/output/generated-astro` |
| profile | `musician` |
| secrets | `tools/static-to-astro/.env.local`（Git 管理外・**staging 向けのみ**） |

---

## B. 事前確認

作業開始前に実行:

```bash
git status
git grep -n -i -E "PERSONAL_EMAIL_PATTERN" || true
```

確認:

- working tree が意図どおりか
- 個人メール等が tracked ファイルに含まれていないか
- `.env.local` が `git status` に出ていないこと

---

## C. Admin CMS つき再生成

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --verify-build \
  --with-admin-cms \
  --site-profile musician
```

**確認:** `CONVERSION_REPORT.md` に Site profile / Admin CMS セクション。`npm run build` が `--verify-build` 内で成功。

---

## D. Local Admin 起動（短期正式運用）

**Phase G-3:** Pattern A（Local Admin）を gosaki の短期正式運用とする。  
**前提:** `tools/static-to-astro/.env.local` に **staging** Supabase の URL / keys が設定済み。

プロジェクト root から:

```bash
cd tools/static-to-astro
set -a && source .env.local && set +a
cd output/generated-astro
npm run dev
```

ターミナルに表示された URL を開く（例: `http://localhost:4321/`）。

### Admin URL

```text
http://localhost:4321/admin/
http://localhost:4321/admin/schedules/
http://localhost:4321/admin/discography/
```

### 注意

- 保存には Supabase session / admin login が必要
- 現行 Mock Editor は **localStorage** にトークンを保持する検証用実装
- 本格的なログイン UI は未実装（別フェーズ）
- **FTP 上の Admin は動かない** — 必ず local dev または将来の Node host

作業後、プロジェクト root に戻る:

```bash
cd ../../..
```

---

## D-2. Admin 保存後の公開反映手順

**Admin で保存しただけでは公開サイトは更新されない。** 以下を順に実行する。

```text
1. Admin 保存（セクション D）
2. export-supabase-json（セクション E）
3. npm run build（セクション F）
4. verify-static-public-artifact（セクション G）
5. deploy-public-dist-ftp dry-run（セクション M）
6. （将来 G-2b）staging FTP --apply
```

詳細: [gosaki-admin-operations.md](./gosaki-admin-operations.md) / [gosaki-admin-handoff-checklist.md](./gosaki-admin-handoff-checklist.md)

---

## E. Supabase export（staging → JSON）

**前提:** `tools/static-to-astro/.env.local` に staging Supabase の URL / keys が設定済み。**本番 Supabase URL を使わない。**

```bash
node tools/static-to-astro/scripts/export-supabase-json.mjs \
  --out-astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/supabase-export/gosaki/SUPABASE_EXPORT_REPORT.md
```

**確認:** `src/data/schedules.json`, `discography.json`, `schedule-months.json` が更新。レポートに secret 実値なし。

---

## F. Build

プロジェクト root から:

```bash
cd tools/static-to-astro/output/generated-astro && npm run build && cd ../../..
```

または:

```bash
npm run build --prefix tools/static-to-astro/output/generated-astro
```

**確認:** `dist/client/`（および hybrid 時 `dist/server/`）が生成。build エラーなし。

---

## G. static-public artifact 検証

```bash
node tools/static-to-astro/scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/static-public/gosaki/STATIC_PUBLIC_ARTIFACT_REPORT.md
```

**確認:**

- `output/static-public/gosaki/public-dist/` が生成
- `static-public-manifest.json` の `safeForStaticFtp: true`
- secret leak scan OK
- public-dist に admin HTML が含まれない

---

## H. CMS minimal loop 検証

**注意:** staging Supabase 接続・dev server 起動・一時的な DB 更新を含む。本番 Supabase では実行しない。

```bash
node tools/static-to-astro/scripts/verify-cms-minimal-loop.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/rls/gosaki/CMS_MINIMAL_LOOP_VERIFY_REPORT.md
```

**確認:** レポート overall PASS。対象 legacy_id（既定: `schedule-2026-03-011`, `discography-001`, track 1）で loop 完走。

---

## I. Storage asset plan（dry-run）

```bash
node tools/static-to-astro/scripts/plan-storage-assets.mjs \
  --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_PLAN_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json
```

**確認:** `uploads performed: no`。Wix/external は review-required のまま（自動再ホストなし）。

---

## J. deploy workflow template 検証

```bash
node tools/static-to-astro/scripts/verify-public-dist-deploy-workflow.mjs \
  --workflow-template tools/static-to-astro/templates/github-actions/public-dist-ftp-deploy.yml \
  --report tools/static-to-astro/output/deploy/gosaki/PUBLIC_DIST_DEPLOY_WORKFLOW_REPORT.md
```

**確認:** template が public-dist のみを deploy 対象としている。root `.github/workflows/` は変更しない。

---

## K. site profile 検証（任意）

```bash
node tools/static-to-astro/scripts/verify-site-profiles.mjs \
  --report tools/static-to-astro/output/site-profiles/SITE_PROFILE_VERIFY_REPORT.md
```

---

## L. output 削除（任意）

生成物は **基本コミットしない**。レポート確認後:

```bash
rm -rf tools/static-to-astro/output
git status --short
```

**注意:** 削除前に必要な verifier レポートをローカル保存または共有。  
ルート `output/` がある場合も同様に削除可:

```bash
rm -rf output
```

---

## M. staging FTP deploy（dry-run）

**Phase G-2:** dry-run のみ。FTP 接続・本番反映は行わない。

前提: セクション G で `public-dist/` が生成済みであること。

```bash
node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
  --site-slug gosaki \
  --env staging \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_REPORT.md \
  --manifest tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json
```

deploy plan 検証:

```bash
node tools/static-to-astro/scripts/verify-staging-ftp-deploy-plan.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_PLAN_VERIFY_REPORT.md
```

**確認:** `applied: false`, `FTP connected: false`, `production` env は CLI が拒否。

---

## N. gosaki readiness verifier（G-2b 前必須）

**Phase 3-Y:** staging FTP `--apply` の前に一括 readiness チェックを実行する。

```bash
node tools/static-to-astro/scripts/verify-gosaki-readiness.mjs \
  --report tools/static-to-astro/output/readiness/gosaki/GOSAKI_READINESS_REPORT.md
```

**確認:** `READY_FOR_STAGING_FTP_APPLY: yes`、`FTP connected: false`

時間短縮（非推奨・ゲート用途では通常版を使用）:

```bash
node tools/static-to-astro/scripts/verify-gosaki-readiness.mjs \
  --report tools/static-to-astro/output/readiness/gosaki/GOSAKI_READINESS_REPORT.md \
  --skip-cms-loop
```

詳細: [gosaki-readiness-verifier.md](./gosaki-readiness-verifier.md)

---

## N-2. staging FTP safety verifier（G-2b 前必須）

**Phase G-2b-prep:** staging FTP `--apply` の前に、接続先 env が staging 専用であることを **静的に** 確認する。FTP 接続しない。

```bash
node tools/static-to-astro/scripts/verify-staging-ftp-safety.mjs \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_SAFETY_REPORT.md
```

**確認:** `STAGING_FTP_SAFE_TO_APPLY: yes`、`FTP connected: false`、`apply performed: false`

**secrets 未設定時:** `STAGING_FTP_SAFE_TO_APPLY: no`（`missing staging FTP env`）は **正常な安全判定**。

詳細: [gosaki-staging-ftp-safety-check.md](./gosaki-staging-ftp-safety-check.md)

### G-2b へ進む条件（両方 yes）

```bash
# 1. Readiness
node tools/static-to-astro/scripts/verify-gosaki-readiness.mjs \
  --report tools/static-to-astro/output/readiness/gosaki/GOSAKI_READINESS_REPORT.md

# 2. Staging FTP safety
node tools/static-to-astro/scripts/verify-staging-ftp-safety.mjs \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_SAFETY_REPORT.md
```

`READY_FOR_STAGING_FTP_APPLY: yes` **かつ** `STAGING_FTP_SAFE_TO_APPLY: yes`、および人間チェックリスト PASS の場合のみ `--apply` へ進む。

---

## O. staging FTP 反映（apply）

**Phase G-2 では実行しない。** Phase G-2b または別フェーズで:

1. readiness verifier PASS（`READY_FOR_STAGING_FTP_APPLY: yes`）
2. staging FTP safety verifier PASS（`STAGING_FTP_SAFE_TO_APPLY: yes`）
3. 人間チェックリスト確認（[gosaki-staging-ftp-safety-check.md](./gosaki-staging-ftp-safety-check.md) §E）
4. staging FTP を tarball 退避
5. `GOSAKI_STAGING_FTP_*` を `.env.local` に設定
6. `--apply --env staging` で lftp mirror

gosaki **本番 FTP** への接続は本番化ゲート PASS 後の別フェーズ。

---

## P. output 削除（任意）

```text
B 事前確認
→ C 再生成
→ H CMS minimal loop（または D 手動 Admin → E export）
→ F build
→ G static-public
→ M staging FTP deploy dry-run
→ N readiness verifier（G-2b 前）
→ I storage plan
→ J deploy template
→ L output 削除（任意）
```

---

## トラブル時

| 症状 | 対処 |
| --- | --- |
| export が permission denied | staging RLS / GRANT を確認。`verify-anon-rls.mjs` 参照 |
| build 失敗 | `CONVERSION_REPORT.md` Build verification セクション |
| public-dist に admin | `verify-static-public-artifact` を再実行。`dist/client` 直 mirror 禁止 |
| secret leak FAIL | `.env.local` が dist に混入していないか確認。再 build |

---

Phase G-1 Runbook。FTP deploy 実行・本番接続は含まない。
