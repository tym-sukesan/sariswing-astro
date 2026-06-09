# gosaki Storage 画像移行 — G-4 準備（dry-run）

**目的:** HomeSchedule / Discography の placeholder を解消するため、Supabase Storage 移行の **設計・分類・TODO** を固定する。  
**境界:** **実アップロード・DB update・本番 Supabase には触らない。** staging Supabase のみが将来の apply 対象。

関連: [storage-image-pipeline.md](./storage-image-pipeline.md) / [gosaki-staging-runbook.md](./gosaki-staging-runbook.md)

---

## G-4 dry-run 実行結果（2026-06-09）

### コマンド

```bash
# 事前: export で src/data を生成（read-only）
node tools/static-to-astro/scripts/export-supabase-json.mjs \
  --out-astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/supabase-export/gosaki/SUPABASE_EXPORT_REPORT.md \
  --skip-build

node tools/static-to-astro/scripts/plan-storage-assets.mjs \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_PLAN_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json
```

### 成果物（`output/` — Git 管理外）

| ファイル | パス |
| --- | --- |
| Plan report | `tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_PLAN_REPORT.md` |
| Plan manifest | `tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json` |

**validation:** PASS / **uploads performed:** no

---

## 1. 現在の source data

| ソース | 件数 | 備考 |
| --- | ---: | --- |
| `generated-astro/src/data/schedules.json` | 60 events | export 後（staging Supabase read-only） |
| `generated-astro/src/data/discography.json` | 4 releases | 同上 |
| 画像フィールド × 種別 | **124 rows** | 60×2 + 4×1（`image_url`, `home_image_url`, `cover_image_url`） |

### staging DB の現状（export 経由で確認）

- staging Supabase には **`example.supabase.co` プレースホルダ URL** が入っている行がある
- `export-supabase-json` の `sanitizePublicImageUrl()` により **JSON 出力では `null`** になる
- そのため **plan の入力がすべて `empty`** となり、upload candidate は 0 件

### 静的 fixture に残る実画像候補（著作権 review 対象）

| 種別 | 所在 | 例 |
| --- | --- | --- |
| Discography cover（Wix） | `fixtures/gosaki-static-site/discography.html` | 4 枚 — `static.wixstatic.com/...` |
| Home schedule flyer（Wix） | `fixtures/gosaki-static-site/index.html` | `20260327.png`, `20260327(お店).png` 等 |
| Hero / About / Contact | 各 HTML | Wix CDN（G-4 優先度は cover/flyer より低） |

詳細: `fixtures/gosaki-static-site/README.md`（alt-date-conflict 注記あり）

---

## 2. 画像候補の分類（plan ロジック）

`plan-storage-assets.mjs` / `classifySourceType()` の分類:

| sourceType | 条件 | action |
| --- | --- | --- |
| **supabase** | `*.supabase.co/storage/...` | `keep` |
| **wix** | `wixstatic.com` / `parastorage.com` | `review-required` |
| **external** | その他 `https://` | `review-required` |
| **local** | `/path` または相対パス | `download-and-upload` |
| **empty** | null / 空文字 | `skip` |

**今回の export 入力:** 124 件すべて **empty (skip)** — DB 上は placeholder だが export 時に除去済み。

**G-4 で追加検討:** `example.supabase.co` を planner 上 **placeholder** として明示分類（export 前の raw DB 読み取り用）。現行は empty と同扱い。

---

## 3. upload candidate 数（今回 dry-run）

| Metric | Count |
| --- | ---: |
| Total asset rows | 124 |
| supabase (keep) | 0 |
| wix (review-required) | 0 |
| external (review-required) | 0 |
| local (download-and-upload) | 0 |
| empty (skip) | **124** |

**解釈:** 実アップロード前に、**著作権 review 済み URL を staging DB または seed に載せる**か、**fixture → legacy_id マッピング**で planner 入力を enriched する必要がある。

---

## 4. Storage path 想定

Bucket: **`site-assets`**（public read — staging で先に作成）

```text
site-assets/gosaki/schedule/{legacy_id}/flyer.webp   ← schedules.image_url
site-assets/gosaki/schedule/{legacy_id}/home.webp    ← schedules.home_image_url
site-assets/gosaki/discography/{legacy_id}/cover.webp ← discography.cover_image_url
```

manifest 各 row の `targetPath` / `targetField` に同内容が記録される（empty 時は `targetPath: null`）。

---

## 5. DB 更新対象カラム

| テーブル | カラム | Astro / export 互換名 |
| --- | --- | --- |
| `schedules` | `image_url` | `image` |
| `schedules` | `home_image_url` | `home_image` |
| `discography` | `cover_image_url` | `cover_image` |

**G-4 apply 時（未実施）:** upload 成功後、staging Supabase 上の上記カラムを **public Storage URL** に更新 → `export-supabase-json` → build → FTP apply。

---

## 6. 実アップロード前の env / bucket / policy / RLS

| 項目 | staging のみ | 確認方法 |
| --- | --- | --- |
| `SUPABASE_URL` | staging プロジェクト | `.env.local` — 本番 URL でないこと |
| `SUPABASE_SERVICE_ROLE_KEY` | staging | upload CLI のみ使用（ブラウザに出さない） |
| Bucket `site-assets` | staging で作成 | Supabase Dashboard / migration |
| Bucket public read | anon GET 可 | Storage policy（公開サイト用） |
| Admin write | service role / 将来 authenticated | RLS — [storage-image-pipeline.md](./storage-image-pipeline.md) §7 |
| `GOSAKI_PROD_*` | **使わない** | readiness / safety verifier |

**Phase 3-U 方針:** Wix / external は **copyright review 完了まで自動 upload 禁止**。

---

## 7. G-4 実アップロード前 TODO

### A. データ準備

- [ ] fixture HTML から **legacy_id ↔ Wix URL** マッピング表を作成（Discography 4 + Home `show_on_home` 3 優先）
- [ ] alt-date-conflict（`20260327.png`）を人間 review — `fixtures/gosaki-static-site/README.md` 参照
- [ ] 著作権・再ホスト許諾のクライアント確認（チェックリスト: [storage-image-pipeline.md](./storage-image-pipeline.md) §3）

### B. staging Supabase

- [ ] staging に bucket `site-assets` 作成（public read policy）
- [ ] placeholder `example.supabase.co` 行を、review OK 済み source URL または Storage URL に置換する **migration 手順**を決める
- [ ] DB update スクリプト方針（service role・staging のみ・1 legacy_id ずつ auditable）

### C. ツール / パイプライン

- [ ] `plan-storage-assets.mjs` を enriched 入力（raw DB または mapping JSON）で再実行し **review-required / download-and-upload 件数 > 0** を確認
- [ ] `storage-asset-uploader.mjs` の `--apply` 実装（**staging only** ガード必須 — 現状 blocked）
- [ ] WebP リサイズパイプライン要否を決定
- [ ] upload 後: `export-supabase-json` → build（`--deploy-base`）→ `verify-static-public-artifact` → staging FTP apply

### D. QA

- [ ] public HTML に `example.supabase.co` が残らない
- [ ] HomeSchedule / Discography で実画像または意図的 placeholder
- [ ] Storage URL が staging Supabase ホストを指す
- [ ] production / Sariswing 本番 Storage・DB には接続しない

---

## 8. 安全条件（再掲）

- production / Sariswing 本番 Supabase・Storage・FTP には触らない
- **G-4 準備段階:** plan / manifest / report のみ — upload・DB update なし
- password / service role key / secret はログ・report に出さない
- `output/` 生成物は commit しない

---

## 9. G-4a — fixture 画像 review manifest（read-only）

fixture HTML から実画像候補を抽出し、`legacy_id` へマッピングした **人間 review 用 manifest / report** を生成する。Supabase upload / DB update は行わない。

### コマンド

```bash
node tools/static-to-astro/scripts/review-storage-assets.mjs \
  --site-slug gosaki \
  --fixture-dir tools/static-to-astro/fixtures/gosaki-static-site \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_REVIEW_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json
```

`--data-dir` は `schedules.json` / `discography.json` から `legacy_id` マッピングに使用（export 済み `src/data` 推奨）。

### 成果物（`output/` — Git 管理外）

| ファイル | パス |
| --- | --- |
| Review report | `tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_REVIEW_REPORT.md` |
| Review manifest | `tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json` |

### gosaki fixture スキャン結果（参考）

| チェック | 結果 |
| --- | --- |
| Discography cover（Wix） | 4 / 4 — `discography-001`〜`004` |
| Home schedule image（Wix） | 2 — `schedule-2026-03-011`, `012` |
| Home schedule empty | 1 — `schedule-2026-03-013`（NO PHOTO） |
| Schedule flyer（cross-page 候補） | 2 — 月別ページは placeholder |
| 全 entry | `reviewRequired: true` |

**注意:** `20260327.png` は alt-date-conflict（rendered 2026-03-25 vs filename）。著作権 review 完了まで自動 upload 不可。

---

## 10. G-4b-prep — staging upload allowlist（read-only）

G-4a review manifest から、**G-4b で Supabase Storage に upload してよい候補だけ**を allowlist 化する。upload / DB update は行わない。

### コマンド

```bash
node tools/static-to-astro/scripts/prepare-storage-upload-allowlist.mjs \
  --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_ALLOWLIST_REPORT.md \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json
```

### 成果物（`output/` — Git 管理外）

| ファイル | パス |
| --- | --- |
| Allowlist report | `tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_ALLOWLIST_REPORT.md` |
| Allowlist JSON | `tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json` |

### 判定方針

| バケット | 条件 | gosaki 期待件数 |
| --- | --- | ---: |
| **approvedForStagingUpload** | `discography_cover` + `confidence: high` + `legacyId` + `wix_image\|external_image` + 非 empty | 4 |
| **needsHumanReview** | `schedule_home` / `schedule_flyer`、medium/low confidence、alt-date-conflict、cross-page 候補 | 4 |
| **rejectedOrDeferred** | `empty` / `unknown` / hero・about・contact 等 G-4 対象外、NO PHOTO | 8 |

**重要:**

- `uploadAllowed: false` / `dbUpdateAllowed: false`（G-4b-prep 時点）
- 全 entry `approvalScope: staging-only`
- `copyrightStatus: needs-owner-confirmation-before-production` — **本番使用許諾は未確定**

### G-4b gate（upload apply 前）

1. staging Supabase のみ（本番 URL / key 不使用）
2. bucket `site-assets` + public read policy 作成済み
3. 初回 upload バッチは `approvedForStagingUpload` のみ
4. schedule 画像は human review 後に allowlist へ promote
5. DB update 前に staging 行バックアップ

---

## 11. G-4b — staging Storage upload（discography cover 4件）

allowlist の `approvedForStagingUpload` のみ staging bucket `site-assets` へ upload。**DB update は行わない**（G-4c で実施）。

### 事前確認

| 項目 | 確認 |
| --- | --- |
| `SUPABASE_URL` | staging project（`prod` / `production` を含まない） |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` にあり（ログに出さない） |
| Bucket `site-assets` | staging に存在 + public read |
| Bucket 未作成時 | `docs/sql/staging-site-assets-bucket.sql` または `--create-bucket --apply` |

### コマンド

```bash
# Dry-run（接続・bucket・source URL 到達性のみ）
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
  --site-slug gosaki \
  --bucket site-assets \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-upload-result.json \
  --db-update-plan tools/static-to-astro/output/storage/gosaki/storage-db-update-plan.json

# Staging apply（approved 4件のみ）
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  ...同上... \
  --apply

# Bucket 未作成時（staging のみ）
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  ...同上... \
  --apply --create-bucket
```

### 成果物（`output/` — Git 管理外）

| ファイル | パス |
| --- | --- |
| Upload report | `STORAGE_UPLOAD_REPORT.md` |
| Upload result | `storage-upload-result.json` |
| DB update plan（G-4c用） | `storage-db-update-plan.json` |

### gosaki G-4b 結果（参考）

| 項目 | 結果 |
| --- | --- |
| Uploaded | 4 / 4 discography cover |
| Failed | 0 |
| DB update | **未実施** |
| Schedule 画像 | **未処理**（needsHumanReview のまま） |
| resolvedStoragePath | 元形式維持（`.png` / `.jpg` — allowlist の `.webp` は実体に合わせて解決） |

**注意:** `approvalScope: staging-only` / production 使用許諾は未確定。

---

## 12. G-4c — staging DB update（discography.cover_image_url 4件）

G-4b upload 後の public URL を staging DB `discography.cover_image_url` に反映。Storage upload は行わない。`schedules` は触らない。

### コマンド

```bash
# Dry-run
node tools/static-to-astro/scripts/apply-storage-db-updates.mjs \
  --plan tools/static-to-astro/output/storage/gosaki/storage-db-update-plan.json \
  --site-slug gosaki \
  --table discography \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_DB_UPDATE_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-db-update-result.json \
  --backup tools/static-to-astro/output/storage/gosaki/storage-db-update-backup.json

# Apply（更新前 backup 必須）
node tools/static-to-astro/scripts/apply-storage-db-updates.mjs \
  ...同上... \
  --apply
```

### 成果物（`output/` — Git 管理外）

| ファイル | パス |
| --- | --- |
| DB update report | `STORAGE_DB_UPDATE_REPORT.md` |
| DB update result | `storage-db-update-result.json` |
| Pre-update backup | `storage-db-update-backup.json` |

### Apply 後パイプライン

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

### 目視 QA

- https://yskcreate.weblike.jp/cms-kit-staging/gosaki/discography/
- 4件 cover 画像表示 / `example.supabase.co` なし / noindex 維持
- schedule 画像は pending のままで OK

---

## 13. 次フェーズの切り分け

| フェーズ | 内容 |
| --- | --- |
| **G-4a** | fixture → legacy_id review manifest（**完了**） |
| **G-4b-prep** | review manifest → upload allowlist（**完了**） |
| **G-4b** | allowlist approved のみ staging Storage upload（**完了**） |
| **G-4c** | staging DB `cover_image_url` 更新 + export → build → FTP QA（**完了**） |
| **G-4d** | schedule 画像 human review table / decision template（**完了** — 下記 CLI） |
| **G-4e** | human decision 後 — allowlist promote → upload + DB |
| **本番導入** | 別ゲート — production Supabase / FTP |

---

## 13. G-4d — schedule 画像 human review（read-only）

`needsHumanReview` の schedule 候補について、人間が判断するための review table / decision template を生成。**自動承認しない。** upload / DB update / FTP は行わない。

### コマンド

```bash
node tools/static-to-astro/scripts/review-schedule-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
  --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/schedule-image-human-review.json
```

### 成果物（`output/` — Git 管理外）

| ファイル | パス |
| --- | --- |
| Human review report | `SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md` |
| Review manifest | `schedule-image-human-review.json` |
| Decision template | `schedule-image-human-decision-template.json` |

### gosaki 候補（参考）

| 項目 | 件数 |
| --- | ---: |
| schedule_home | 2 |
| schedule_flyer | 2 |
| alt-date-conflict (`20260327.png`) | 2 rows（同一 legacy_id） |
| excluded NO PHOTO | 1（`schedule-2026-03-013`） |

### Decision template の使い方

1. `schedule-image-human-decision-template.json` を開く
2. 各行の `humanDecision` を `approve_home_only` / `approve_flyer_only` / `approve_both` / `reject` / `defer` に設定
3. `decisionReason` を記入（特に alt-date-conflict）
4. G-4e で allowlist へ promote → upload → DB update

### G-4e gate

- [ ] 全候補の `humanDecision` ≠ `pending`
- [ ] `20260327.png` の日付不一致を理由付きで解決
- [ ] copyright / staging-only 確認
- [ ] 承認行のみ allowlist `approvedForStagingUpload` へ移動

---

Phase G-4 discography cover path: **完了**。Schedule 画像は G-4d review 完了 → **G-4e** で human decision 後に upload/DB。
