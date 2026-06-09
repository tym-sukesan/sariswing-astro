# Gosaki Storage Image Migration Runbook

**Phase:** G-4h（runbook freeze）  
**Status:** G-4a〜G-4g 完了・staging QA 済み  
**境界:** staging Supabase / staging FTP のみ。production / Sariswing 本番には触らない。

関連:

- [gosaki-storage-g4-prep.md](./gosaki-storage-g4-prep.md) — G-4 設計・分類・準備メモ
- [gosaki-staging-runbook.md](./gosaki-staging-runbook.md) — export → build → FTP deploy 共通手順
- [storage-image-pipeline.md](./storage-image-pipeline.md) — パイプライン設計
- [sql/staging-site-assets-bucket.sql](./sql/staging-site-assets-bucket.sql) — bucket 作成 SQL

---

## Scope

この runbook は、**gosaki staging** における画像移行の手順を固定する。別サイトへ展開する場合も、同じフェーズ分割（review → allowlist → upload → DB update → export/deploy）を踏襲する。

### 対象

| テーブル | カラム | 現状（G-4g 後） |
| --- | --- | --- |
| `discography` | `cover_image_url` | **4件完了**（staging Storage URL） |
| `schedules` | `home_image_url` | **1件完了**（Golden PODs / `schedule-2026-03-012`） |
| `schedules` | `image_url` | **未処理**（flyer / monthly schedule 用） |

### 対象外

- production Supabase / Sariswing 本番 FTP
- 未承認画像の自動 upload
- alt-date-conflict の自動承認（例: `20260327.png` vs DB `2026-03-25`）
- 権利確認前の production 反映（`copyrightStatus: needs-owner-confirmation-before-production`）

---

## Safety rules

作業前・commit 前に必ず確認する。

| ルール | 内容 |
| --- | --- |
| 本番非接触 | production Supabase / Sariswing 本番 FTP に触らない |
| Staging host | `kmjqppxjdnwwrtaeqjta.supabase.co` のみ |
| Bucket | `site-assets`（public read） |
| Secrets | service role key / FTP password をログ・report・manifest に出さない |
| `output/` | Git に commit しない |
| フェーズ分離 | Storage upload と DB update は**必ず別コマンド** |
| Backup | DB update 前に backup JSON を保存（`--backup` 必須） |
| Verify | DB update 後に再読み取りで `newValue` と一致することを確認 |
| 公開パイプライン | DB update 後は **export → build → verify-static-public-artifact → staging FTP → QA** |
| Placeholder 除去 | `public-dist` HTML に `example.supabase.co` が残らないこと |
| Secret scan | commit 前: `git grep -n -i -E "ysktoyamax|bikusari" \|\| true` |
| Schedule gate | schedule 画像は **human review なしで promote しない** |

環境変数は `tools/static-to-astro/.env.local`（Git 管理外）に staging のみ設定する。

---

## Phase summary

| Phase | Purpose | Upload | DB update | Result |
| --- | --- | ---: | ---: | --- |
| G-4a | asset review manifest | no | no | candidates classified |
| G-4b-prep | discography allowlist | no | no | 4 discography approved |
| G-4b | discography Storage upload | yes | no | 4 files uploaded |
| G-4c | discography DB update | no | yes | 4 `cover_image_url` updated |
| G-4d | schedule human review | no | no | candidates pending / decision template |
| G-4e | schedule allowlist promote | no | no | Golden PODs home approved |
| G-4f | schedule home Storage upload | yes | no | 1 file uploaded |
| G-4g | schedule home DB update | no | yes | 1 `home_image_url` updated |
| G-4h | runbook freeze | no | no | procedure documented |

**原則:** upload フェーズでは `dbUpdatePerformed: false`。DB update フェーズでは `storageUploadPerformed: false`。

---

## CLI reference

すべての成果物は `tools/static-to-astro/output/` 配下（**commit 対象外**）。

| CLI | 目的 | 主な入力 | 主な出力 | `--apply` | Upload | DB update | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `review-storage-assets.mjs` | G-4a: fixture → legacy_id 候補抽出 | fixture HTML, `src/data` | `storage-asset-review-manifest.json`, report | no | no | no | scripts のみ |
| `prepare-storage-upload-allowlist.mjs` | G-4b-prep: review → allowlist | review manifest | `storage-upload-allowlist.json`, report | no | no | no | scripts のみ |
| `upload-storage-assets.mjs` | G-4b / G-4f: approved のみ Storage upload | allowlist | upload result, DB update **plan** | **yes**（upload） | **yes**（apply 時） | **no** | scripts のみ |
| `apply-storage-db-updates.mjs` | G-4c / G-4g: plan から DB 更新 | DB update plan, `--table` | result manifest, backup, report | **yes**（DB） | no | **yes**（apply 時） | scripts のみ |
| `review-schedule-storage-assets.mjs` | G-4d: schedule human review 表 | allowlist, review manifest | human review JSON, **decision template** | no | no | no | scripts のみ |
| `promote-schedule-storage-allowlist.mjs` | G-4e: decision → schedule allowlist | decision template | `schedule-upload-allowlist.json`, report | optional flag | no | no | scripts のみ |
| `export-supabase-json.mjs` | staging → `src/data/*.json` | `.env.local` staging | JSON + export report | n/a（read-only） | no | no | scripts のみ |
| `verify-static-public-artifact.mjs` | `public-dist` 生成・安全確認 | built astro dir | manifest, report | n/a | no | no | scripts のみ |
| `deploy-public-dist-ftp.mjs` | staging FTP mirror | `public-dist` | deploy report, manifest | **yes**（FTP） | no | no | scripts のみ |

---

## Discography image migration procedure

**対象:** `discography-001`〜`004` の `cover_image_url` のみ。schedule テーブルは触らない。

### 1. G-4a — Review manifest

```bash
node tools/static-to-astro/scripts/review-storage-assets.mjs \
  --site-slug gosaki \
  --fixture-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_REVIEW_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json
```

### 2. G-4b-prep — Upload allowlist（discography 4件 approved）

```bash
node tools/static-to-astro/scripts/prepare-storage-upload-allowlist.mjs \
  --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_ALLOWLIST_REPORT.md \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json
```

確認: `approvedForStagingUpload` が discography cover **4件のみ**。schedule は `needsHumanReview`。

### 3. G-4b — Storage upload（DB update なし）

```bash
# Dry-run 推奨 → 問題なければ --apply
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
  --site-slug gosaki \
  --bucket site-assets \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-upload-result.json \
  --db-update-plan tools/static-to-astro/output/storage/gosaki/storage-db-update-plan.json \
  --apply
```

成果物:

- `storage-upload-result.json` — `uploadPerformed: true`, `dbUpdatePerformed: false`
- `storage-db-update-plan.json` — G-4c 用（`currentValue` / `newValue`）

Bucket 未作成時: `docs/sql/staging-site-assets-bucket.sql` または初回のみ `--create-bucket --apply`。

### 4. G-4c — DB update（Storage upload なし）

```bash
node tools/static-to-astro/scripts/apply-storage-db-updates.mjs \
  --plan tools/static-to-astro/output/storage/gosaki/storage-db-update-plan.json \
  --site-slug gosaki \
  --table discography \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_DB_UPDATE_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-db-update-result.json \
  --backup tools/static-to-astro/output/storage/gosaki/storage-db-update-backup.json \
  --apply
```

確認: preflight で plan **4件** / staging public URL / HTTP 200。更新後 `verified: true`。

### 5. Export / build / deploy / QA

[Gosaki staging runbook §3](./gosaki-staging-runbook.md) と同様:

```bash
node tools/static-to-astro/scripts/export-supabase-json.mjs \
  --out-astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/supabase-export/gosaki/SUPABASE_EXPORT_REPORT.md

cd tools/static-to-astro/output/generated-astro && npm install && npm run build && cd ../../..

node tools/static-to-astro/scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/static-public/gosaki/STATIC_PUBLIC_ARTIFACT_REPORT.md

node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki/public-dist \
  --site-slug gosaki --env staging --apply \
  --report tools/static-to-astro/output/deploy/gosaki/STAGING_FTP_DEPLOY_APPLY_REPORT.md \
  --manifest tools/static-to-astro/output/deploy/gosaki/staging-ftp-deploy-manifest.json
```

QA: https://yskcreate.weblike.jp/cms-kit-staging/gosaki/discography/ — cover 4件表示。

---

## Schedule image migration procedure

**原則:** discography と異なり、schedule 画像は **必ず G-4d human review から開始**する。自動 promote しない。

### Human decision の意味

`schedule-image-human-decision-template.json` の `humanDecision` 値:

| 値 | 意味 |
| --- | --- |
| `approve_home_only` | `schedules.home_image_url` のみ staging 候補（トップ表示用） |
| `approve_flyer_only` | `schedules.image_url` のみ staging 候補（月別・詳細 flyer） |
| `approve_both` | home + flyer の両方を候補にする |
| `reject` | 移行しない |
| `defer` | 判断保留（alt-date-conflict 等） |

**gosaki 実績（G-4e）:** `schedule-2026-03-012`（Golden PODs）のみ `approve_home_only`。他は `defer`。

### 1. G-4d — Human review（read-only）

```bash
node tools/static-to-astro/scripts/review-schedule-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
  --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/schedule-image-human-review.json
```

人間が `schedule-image-human-decision-template.json` を編集する。

**alt-date-conflict 例:** `20260327.png` が `schedule-2026-03-011`（DB date `2026-03-25`）に紐づく疑い → **自動承認しない** → `defer` のまま。

### 2. G-4e — Allowlist promote

```bash
node tools/static-to-astro/scripts/promote-schedule-storage-allowlist.mjs \
  --decision-template tools/static-to-astro/output/storage/gosaki/schedule-image-human-decision-template.json \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_UPLOAD_ALLOWLIST_REPORT.md \
  --allowlist tools/static-to-astro/output/storage/gosaki/schedule-upload-allowlist.json \
  --apply-gosaki-g4e
```

確認: `schedule-upload-allowlist.json` の `approvedForStagingUpload` が **1件**（`home_image_url` only）。`image_url` / flyer は含めない。

### 3. G-4f — Schedule home Storage upload（DB update なし）

```bash
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/schedule-upload-allowlist.json \
  --site-slug gosaki \
  --bucket site-assets \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_STORAGE_UPLOAD_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/schedule-storage-upload-result.json \
  --db-update-plan tools/static-to-astro/output/storage/gosaki/schedule-db-update-plan.json \
  --apply
```

確認: `schedule-2026-03-012` / `assetType: schedule_home` / `targetColumn: home_image_url` のみ。

### 4. G-4g — Schedule home DB update（Storage upload なし）

```bash
node tools/static-to-astro/scripts/apply-storage-db-updates.mjs \
  --plan tools/static-to-astro/output/storage/gosaki/schedule-db-update-plan.json \
  --site-slug gosaki \
  --table schedules \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_DB_UPDATE_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/schedule-db-update-result.json \
  --backup tools/static-to-astro/output/storage/gosaki/schedule-db-update-backup.json \
  --apply
```

確認: plan **1件** / `schedule-2026-03-012` / `home_image_url` のみ。`schedule-2026-03-011` は plan に含まれない。

### 5. Export / build / deploy / QA

Discography と同じパイプライン（上記 §Discography step 5）。トップページ QA を追加。

---

## Current state after G-4g

| 項目 | 状態 |
| --- | --- |
| discography cover 4件 | **完了** — staging Storage URL・discography ページ表示済み |
| Golden PODs home 画像 | **完了** — `schedule-2026-03-012` / staging トップ表示済み |
| `schedule-2026-03-012.home_image_url` | staging Storage public URL |
| `schedule-2026-03-012.image_url` | **未変更**（null） |
| `schedule-2026-03-011` | **未変更**（home / flyer とも null）— alt-date-conflict defer |
| `schedule-2026-03-013` | pending（NO PHOTO） |
| schedule flyer / `image_url` | **未処理・未承認** |
| production Supabase / Sariswing | **未処理** |
| `copyrightStatus` | `needs-owner-confirmation-before-production` |
| `approvalScope` | `staging-only` |

Storage path 例（Golden PODs）:

`site-assets/gosaki/schedule/schedule-2026-03-012/home.png`

---

## QA checklist

### URLs

- https://yskcreate.weblike.jp/cms-kit-staging/gosaki/
- https://yskcreate.weblike.jp/cms-kit-staging/gosaki/schedule/
- https://yskcreate.weblike.jp/cms-kit-staging/gosaki/discography/
- https://yskcreate.weblike.jp/cms-kit-staging/gosaki/robots.txt

### 確認項目

| 項目 | 期待 |
| --- | --- |
| noindex | 維持（staging） |
| robots Disallow | 維持 |
| CSS / base path / hamburger | 維持 |
| discography cover | 4件表示 |
| Golden PODs home 画像 | トップに表示 |
| pending 画像 | pending 表示のまま（011 flyer、013 等） |
| `example.supabase.co` | HTML に残っていない |
| staging Storage URL | HTTP 200（画像が実際に読める） |
| production URL | 向いていない（staging host のみ） |

Artifact 確認: `static-public-manifest.json` で `safeForStaticFtp: true`, `stagingNoindex: true`, `robotsDisallowAll: true`。

---

## Troubleshooting

| 症状 | 対処 |
| --- | --- |
| Bucket がない | `docs/sql/staging-site-assets-bucket.sql` を staging SQL Editor で実行、または upload に `--create-bucket --apply`（初回のみ） |
| Public URL が 403/404 | bucket public 設定、object path（拡張子 `.png`/`.webp` 解決）を upload report で確認 |
| `sourceUrl` fetch 失敗 | Wix URL の到達性・ネットワーク。dry-run で `sourceReachable` を確認 |
| upload skipped existing | 既に object あり（安全）。`skippedExisting` の `publicUrl` を DB plan に使用可 |
| DB update verification failed | staging DB の現値と plan `newValue` を照合。backup から復元可能 |
| exported JSON が古い | DB update 後に `export-supabase-json` を再実行（build 前） |
| `public-dist` に `example.supabase.co` | export 元 DB が未更新、または sanitize 漏れ — DB update → 再 export |
| FTP apply 後に画像が出ない | `public-dist` を deploy したか（`dist/client` 直アップ禁止）、キャッシュ、Storage URL の HTTP 200 |
| schedule 日付不一致 | alt-date-conflict — **自動承認しない**。human review で `defer`、ファイル名と DB `date` を突合 |

復元: `storage-db-update-backup.json` / `schedule-db-update-backup.json` の `rows` から該当カラムを手動またはスクリプトで戻す。

---

## Next phases

| フェーズ | 内容 |
| --- | --- |
| **G-4i** | remaining schedule flyer human review（`image_url` 候補の判断） |
| **G-4j** | approved schedule flyer upload + `schedules.image_url` DB update |
| **G-5** | [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md) — template / site config 一般化 |
| **Production migration** | owner confirmation / rights confirmation 後の別ゲート |

---

## Commit 前チェック

```bash
git status --short          # output/ が含まれていないこと
git grep -n -i -E "ysktoyamax|bikusari" || true
```

**commit 対象:** `tools/static-to-astro/scripts`, `docs`, `README.md` のみ。`output/` は常に除外。

---

*G-4h: 本 runbook 固定。以降の upload / DB / FTP は本書の Phase summary に従い、未承認・本番は触らない。*
