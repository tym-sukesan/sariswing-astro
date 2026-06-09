# gosaki Staging Runbook（Phase G-3）

**目的:** G-2b で成功した staging FTP deploy / QA / noindex / deploy-base 対応を、**再現可能な運用手順**として固定する。  
**作業ディレクトリ:** リポジトリ root（`sariswing-astro/`）  
**対象:** `tools/static-to-astro/` のみ  
**site profile:** `musician` / **site slug:** `gosaki`

**安全境界（必読）**

| 触ってよい | 触らない |
| --- | --- |
| gosaki staging Supabase | gosaki 本番 Supabase / FTP |
| `GOSAKI_STAGING_FTP_*` | `GOSAKI_PROD_FTP_*` / Sariswing 本番 |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki/` | `https://www.gosaki-piano.com/` 本番公開 |

関連: [gosaki-staging-secrets-checklist.md](./gosaki-staging-secrets-checklist.md) / [gosaki-staging-ftp-safety-check.md](./gosaki-staging-ftp-safety-check.md) / [gosaki-staging-operations.md](./gosaki-staging-operations.md) / [gosaki-admin-operations.md](./gosaki-admin-operations.md)

---

## 固定値（G-2b 成功時点）

| 項目 | 値 |
| --- | --- |
| Staging 公開 URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki/` |
| `--base-url` | `https://yskcreate.weblike.jp` |
| `--deploy-base` | `/cms-kit-staging/gosaki/` |
| FTP server dir（推奨） | `/cms-kit-staging/gosaki/` |
| FTP server（推奨） | `ftp.lolipop.jp` |
| mirror 方式 | **contents-only**（`public-dist/` の中身だけ → FTP ルート） |
| staging SEO | `noindex,nofollow,noarchive` + `robots.txt Disallow: /` |
| canonical（staging） | `canonicalMode: staging-url`（production URL は出さない） |

**リモートに置くべきパス**

```text
/cms-kit-staging/gosaki/index.html          ← OK
/cms-kit-staging/gosaki/public-dist/...     ← NG（フォルダごと上げない）
```

---

## 手順概要（1 本化）

```text
1. 前提確認（.env.local / secrets / production env なし）
2. 事前安全確認（safety + readiness）
3. build パイプライン（convert → export → build → static-public）
4. staging FTP apply
5. 目視 QA
6. Git 整理（output は commit しない）
```

---

## 1. 前提確認

### 1-1. `.env.local`

**場所:** `tools/static-to-astro/.env.local`（Git 管理外）

必須（staging 専用）:

```env
# Supabase（staging プロジェクトのみ）
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_ADMIN_EMAIL=
SUPABASE_ADMIN_PASSWORD=

# Staging FTP（GOSAKI_STAGING_* のみ — GOSAKI_PROD_* は置かない）
GOSAKI_STAGING_FTP_SERVER=ftp.lolipop.jp
GOSAKI_STAGING_FTP_USERNAME=
GOSAKI_STAGING_FTP_PASSWORD=
GOSAKI_STAGING_FTP_SERVER_DIR=/cms-kit-staging/gosaki/
```

| ルール | 理由 |
| --- | --- |
| FTP パスワードをログ・report に出さない | deployer / verifier は値をマスク |
| `GOSAKI_PROD_FTP_*` を `.env.local` に置かない | safety verifier が fail |
| `GOSAKI_STAGING_FTP_SERVER=ftp.lolipop.jp` を推奨 | FTPS 証明書不一致を避ける（後述トラブルシュート） |
| `GOSAKI_STAGING_FTP_SERVER_DIR=/cms-kit-staging/gosaki/` | contents-only mirror のアップロード先 |

詳細: [gosaki-staging-secrets-checklist.md](./gosaki-staging-secrets-checklist.md)

### 1-2. 作業前チェック

```bash
git status --short
git grep -n -i -E "ysktoyamax|bikusari" || true
git check-ignore -v tools/static-to-astro/.env.local
```

- `.env.local` が `git status` に出ないこと
- 個人メール文字列が tracked ファイルにないこと
- production FTP env が `.env.local` にないこと

### 1-3. ツール

```bash
which lftp
lftp --version
```

未インストール時: `brew install lftp`

---

## 2. 事前安全確認（dry-run — FTP 接続なし）

**順番:** safety → readiness（両方 PASS してから apply）

### 2-1. Staging FTP safety

```bash
node tools/static-to-astro/scripts/verify-staging-ftp-safety.mjs \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_SAFETY_REPORT.md
```

**期待:**

| 項目 | 期待値 |
| --- | --- |
| `STAGING_FTP_SAFE_TO_APPLY` | `yes` |
| `FTP connected` | `false`（dry-run では正常） |
| `apply performed` | `false` |
| `overall` | `PASS` |

`STAGING_FTP_SAFE_TO_APPLY: no`（env 未設定）は **安全側の正常判定**。apply 前に env を設定する。

### 2-2. gosaki readiness

```bash
node tools/static-to-astro/scripts/verify-gosaki-readiness.mjs \
  --report tools/static-to-astro/output/readiness/gosaki/GOSAKI_READINESS_REPORT.md
```

**期待:**

| 項目 | 期待値 |
| --- | --- |
| `READY_FOR_STAGING_FTP_APPLY` | `yes` |
| `overall` | `PASS` |
| `FTP connected` | `false`（dry-run では正常） |
| `production touched` | `false` |
| convert / export / build / static-public | 各 `PASS` |

readiness は convert（`--deploy-base` 付き）→ export → build → static-public → deploy dry-run まで一括実行する。時間がかかる（数分）のは正常。

---

## 3. staging build / deploy

readiness が PASS 済みなら `public-dist/` は生成済み。手動で再 build する場合は以下。

### 3-1. Convert（staging base 付き）

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://yskcreate.weblike.jp \
  --deploy-base /cms-kit-staging/gosaki/ \
  --with-admin-cms \
  --site-profile musician
```

### 3-2. Export + build

```bash
node tools/static-to-astro/scripts/export-supabase-json.mjs \
  --out-astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/supabase-export/gosaki/SUPABASE_EXPORT_REPORT.md

cd tools/static-to-astro/output/generated-astro && npm install && npm run build && cd ../../..
```

### 3-3. static-public 検証

```bash
node tools/static-to-astro/scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/static-public/gosaki/STATIC_PUBLIC_ARTIFACT_REPORT.md
```

**manifest 確認（`static-public-manifest.json`）:**

| キー | staging 期待 |
| --- | --- |
| `safeForStaticFtp` | `true` |
| `deployBase` | `/cms-kit-staging/gosaki/` |
| `assetPathsIncludeBase` | `true` |
| `stagingNoindex` | `true` |
| `robotsDisallowAll` | `true` |
| `productionIndexable` | `false` |
| `canonicalMode` | `staging-url` |

### 3-4. staging FTP apply

**前提:** §2 の両 verifier PASS + §3-3 の `safeForStaticFtp: true`

```bash
node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
  --site-slug gosaki \
  --env staging \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_APPLY_REPORT.md \
  --manifest tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json \
  --apply
```

**期待:**

| 項目 | 期待値 |
| --- | --- |
| `applied` | `true` |
| `FTP connected` | `true` |
| `overall` | `PASS` |
| `mirror mode` | `contents-only` |
| `uploaded contents of public-dist` | `yes` |
| `remote root receives index.html` | `yes` |

**mirror ルール:** `public-dist/` **の中身だけ**を `/cms-kit-staging/gosaki/` に配置。`public-dist/` フォルダ自体をリモートに作らない。

### 3-5. Admin 保存後の反映

Admin で保存しただけでは公開サイトは更新されない。

```text
Admin 保存 → export → build → verify-static-public-artifact → FTP apply
```

詳細: [gosaki-admin-operations.md](./gosaki-admin-operations.md)

---

## 4. 目視 QA

### 4-1. 確認 URL

| URL | 確認ポイント |
| --- | --- |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki/ | CSS / hamburger / home schedule placeholder |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki/schedule/ | 月別リンクが staging 配下 |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki/schedule-2026-07/ | 月別ページ表示 |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki/discography/ | ジャケット placeholder |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki/link/ | 長い URL が折り返される（iPhone SE 幅） |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki/robots.txt | `Disallow: /` |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki/sitemap-index.xml | QA 用に存在可（noindex と併用） |

### 4-2. チェックリスト

- [ ] CSS が当たっている（`_astro/*.css` が 200）
- [ ] スマホ幅で MENU / hamburger が開閉する
- [ ] ナビリンクが `/cms-kit-staging/gosaki/` 配下に飛ぶ
- [ ] Schedule 月別リンクが `https://yskcreate.weblike.jp/schedule-...` 等ドメイン直下へ飛ばない
- [ ] Link ページの長い URL が画面外にはみ出さない（横スクロールなし）
- [ ] 画像未移行部分は placeholder（`Flyer / Image pending` / `Cover pending`）
- [ ] `example.supabase.co` が public HTML に残っていない
- [ ] `robots.txt` が `User-agent: *` + `Disallow: /`
- [ ] head に `<meta name="robots" content="noindex,nofollow,noarchive">`
- [ ] canonical / og:url が staging URL（`yskcreate.weblike.jp/cms-kit-staging/gosaki/...`）— `gosaki-piano.com` が残っていない

### 4-3. ローカル HTML スポットチェック（任意）

```bash
grep -E 'gosaki-piano|example\.supabase' \
  tools/static-to-astro/output/static-public/gosaki/public-dist/index.html \
  tools/static-to-astro/output/static-public/gosaki/public-dist/link/index.html \
  || echo "OK: no production canonical or placeholder URLs in sample pages"
```

---

## 5. Git 整理

**原則:** `output/` 生成物は **commit しない**。

```bash
git status --short
git grep -n -i -E "ysktoyamax|bikusari" || true

rm -rf output
rm -rf tools/static-to-astro/output
git restore tools/static-to-astro/output/.gitkeep

git status --short
```

commit 対象の例: `tools/static-to-astro/docs/`、`tools/static-to-astro/scripts/`、`tools/static-to-astro/templates/`  
commit 対象外: `tools/static-to-astro/output/**`（`.gitkeep` のみ tracked）

```bash
git add tools/static-to-astro/docs tools/static-to-astro/README.md
git commit -m "Document gosaki staging deploy runbook"
git push
git status
```

---

## 6. トラブルシュート（G-2b 実績）

| 症状 | 原因 / 対処 |
| --- | --- |
| **`lftp: command not found`** | `brew install lftp` → `which lftp` → `lftp --version` |
| **ロリポップ FTPS 証明書不一致** | `ftp.yskcreate.weblike.jp` だと `*.lolipop.jp` 証明書と一致せず失敗することがある。**`ftp.lolipop.jp` を使う** |
| **ssl:verify-certificate エラー** | staging 限定で deployer が `set ssl:verify-certificate no` を使う場合あり。本番 FTP では使わない |
| **`530 Login incorrect`** | FTP ユーザー名・パスワード不一致。デバッグログにパスワードを出さない。**一度ログに出たら FTP パスワードを変更** |
| **403 Forbidden** | `index.html` が `/cms-kit-staging/gosaki/` 直下にない。`public-dist/` フォルダごと上がっていないか確認（contents-only mirror） |
| **CSS が当たらない** | `--deploy-base /cms-kit-staging/gosaki/` なし build。`_astro` パスに base  prefix がない |
| **リンクがドメイン直下へ飛ぶ** | `withBase()` 未適用 or deployBase 不一致。convert / export 後の `refreshPublicCmsViews` を確認 |
| **画像リンク切れ** | `example.supabase.co` placeholder URL が JSON/HTML に残存。Storage 移行前は placeholder 表示で OK |
| **staging が検索される懸念** | staging は noindex + robots Disallow。長期・顧客案件では Basic 認証も検討 |
| **readiness FAIL** | レポートの failed セクションを確認。`npm install` 未実行で build 失敗することがある |
| **secret leak FAIL** | `.env.local` が dist / public-dist に混入していないか。再 build |

---

## 7. G-3 完了条件

以下を満たした時点で **Phase G-3 完了**:

- [ ] staging deploy 手順が **1 本化**されている（本 doc §手順概要）
- [ ] safety → readiness → build → apply → QA → Git 整理の **順番が明文化**されている
- [ ] G-2b で起きた **よくある失敗と対処**が記録されている（§6）
- [ ] production / Sariswing 本番に触れない **安全条件**が明文化されている（冒頭 + secrets checklist）
- [ ] 次フェーズが切り分けられている:
  - **G-4 / Storage:** 画像を Supabase Storage へ移行（placeholder → 実 URL）
  - **本番導入テンプレ化:** `--deploy-base` なし + production URL + production FTP（別ゲート）

---

## 8. 参考: Local Admin（短期正式運用）

CMS 編集は local dev + staging Supabase。FTP apply とは別フロー。

```bash
cd tools/static-to-astro
set -a && source .env.local && set +a
cd output/generated-astro
npm run dev
# → http://localhost:4321/admin/
```

保存後は §3-5 の export → build → apply を実行。

---

## 9. 関連 CLI 早見表

| 用途 | コマンド |
| --- | --- |
| FTP safety（apply 前） | `verify-staging-ftp-safety.mjs` |
| 一括 readiness | `verify-gosaki-readiness.mjs` |
| static-public 検証 | `verify-static-public-artifact.mjs` |
| FTP apply | `deploy-public-dist-ftp.mjs --apply --env staging` |
| CMS loop | `verify-cms-minimal-loop.mjs` |
| Storage plan（dry-run） | `plan-storage-assets.mjs` |

---

Phase G-3: gosaki staging 運用 runbook。**production / Sariswing 本番には接続しない。**
