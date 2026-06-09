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

## 9. 次フェーズの切り分け

| フェーズ | 内容 |
| --- | --- |
| **G-4a（次）** | マッピング + copyright review + staging bucket 作成 |
| **G-4b** | staging Storage upload + DB URL 更新（apply 実装） |
| **G-4c** | export → build → staging FTP → 目視 QA（実画像表示） |
| **本番導入** | 別ゲート — production Supabase / FTP / `--deploy-base` なし build |

---

Phase G-4 prep: dry-run 完了。実アップロードは **TODO 完了後** に staging のみで実施する。
