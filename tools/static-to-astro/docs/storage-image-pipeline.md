# Storage Image Pipeline（Phase 3-U）

CMS で扱う画像（Schedule flyer / home thumbnail / Discography cover）を **Supabase Storage** へ安全に載せ替えるための設計と dry-run pipeline です。

**Phase 3-U では plan のみ。実アップロード・bucket 作成・RLS 適用は行いません。**

---

## 1. なぜ Storage が必要か

| 問題 | 説明 |
| --- | --- |
| **外部依存** | Wix CDN URL はサイト移行・契約終了で消える |
| **CMS 一貫性** | Admin 保存 → export → build の source of truth を Supabase に揃える |
| **公開パフォーマンス** | 自前 CDN / Storage public URL でサイズ・形式を制御 |
| **セキュリティ** | 管理用画像と公開画像の path 分離 |

---

## 2. Wix 等の外部 URL をそのまま使う場合の問題

- **著作権・利用許諾:** Wix ホスト画像の再ホストはクライアント確認必須
- **URL 寿命:** `static.wixstatic.com` は Wix 契約に依存
- **変換不可:** WebP 化・リサイズを build パイプラインに組み込めない
- **CMS ループ:** export 時に外部 URL が残ると staging / 本番で再現性が低い

**Phase 3-U 方針:** Wix / external → **`review-required`**（自動アップロード禁止）

---

## 3. 再ホスト時の著作権・利用許諾

チェックリスト（人間確認）:

- [ ] 画像の著作権者・使用許諾範囲をクライアントが確認
- [ ] Wix 利用規約上の再ホスト可否
- [ ] 演奏会 flyer / ジャケットの権利関係
- [ ] 再ホスト OK の記録（メール・契約書）

`plan-storage-assets.mjs` は **`review-required` 一覧** をレポートに出力します。

---

## 4. Supabase Storage bucket 設計（推奨案）

| 項目 | 値 |
| --- | --- |
| **Bucket 名** | `site-assets` |
| **公開方針** | 公開サイト用画像は **public bucket**（anon read） |
| **Admin upload** | service role または authenticated admin（将来） |

### Path レイアウト（Phase 3-U 推奨）

```text
site-assets/
  {siteSlug}/schedule/{legacy_id}/flyer.webp    ← schedules.image_url
  {siteSlug}/schedule/{legacy_id}/home.webp     ← schedules.home_image_url
  {siteSlug}/discography/{legacy_id}/cover.webp ← discography.cover_image_url
```

例:

```text
site-assets/gosaki/schedule/schedule-2026-03-011/flyer.webp
site-assets/gosaki/schedule/schedule-2026-03-011/home.webp
site-assets/gosaki/discography/discography-001/cover.webp
```

---

## 5. path 保存 vs public URL 保存

| 方式 | メリット | デメリット |
| --- | --- | --- |
| **path のみ DB** | project 移行・CDN 変更に強い | export/build で URL 合成が必要 |
| **public URL DB（現行）** | seed/export 互換が簡単 | URL 変更時に seed 一括更新 |

**短期（現 seed/export）:** `image_url` / `home_image_url` / `cover_image_url` に **public URL 維持**

**中期:** DB に `storage_path` 列を追加し export 時に URL 合成

---

## 6. フィールドの違い

| フィールド | 用途 | 表示箇所 |
| --- | --- | --- |
| `schedules.image_url` | 月別 Schedule flyer | 月ページ・詳細 |
| `schedules.home_image_url` | Home 掲載サムネ | `index.html` HomeSchedule |
| `discography.cover_image_url` | ジャケット | Discography 一覧 |

---

## 7. 画像リサイズ / WebP 化方針（将来）

- Upload 前に max width（例: flyer 1200px, cover 520px, home 400px）
- 出力形式: **WebP**（fallback JPEG は必要に応じて）
- sharp / imagemagick を CI または upload CLI 内で実行
- **Phase 3-U では未実装**

---

## 8. Storage RLS 方針（docs のみ — 未適用）

```sql
-- DO NOT APPLY YET (Phase 3-U)
-- Bucket: site-assets
-- Strategy TBD: public read vs signed URL for covers

-- Example draft (not applied):
-- 1. Public read for published site assets under {siteSlug}/*
-- 2. Admin write via service role or authenticated is_admin()
-- 3. No anon write
```

---

## 9. 段階設計

```text
Phase 3-U (now)     plan-storage-assets.mjs dry-run
Phase 3-U+          staging bucket create + copyright-approved upload only
Phase 3-U++         rewrite-seed-image-urls / export URL sync
Production          separate approval gate; never auto-upload Wix
```

---

## 10. Sariswing 移植時の注意

- 現行 Sariswing は Wix 由来 URL が残る可能性 → **review-required 一覧を先に解消**
- ロリポップ FTP 公開は **画像 URL が HTML に埋め込まれる** — Storage public URL へ置換後に build
- 既存 GitHub Actions FTP deploy は `public-dist` 対象（Phase 3-V）— 画像自体は HTML 内 URL
- Admin cover upload UI は別フェーズ

---

## 11. CLI

### Plan（dry-run）

```bash
node tools/static-to-astro/scripts/plan-storage-assets.mjs \
  --seed-dir tools/static-to-astro/output/supabase-seed/gosaki \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_PLAN_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json
```

### Upload stub（未実装）

```bash
node tools/static-to-astro/scripts/upload-storage-assets.mjs \
  --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-plan.json
```

`--apply` は Phase 3-U では **拒否**（未実装）。

---

## 12. 関連（Phase 3-F / 3-G）

| ツール | 役割 |
| --- | --- |
| `prepare-storage-assets.mjs` | 旧 manifest + optional download（Phase 3-F） |
| `plan-storage-upload.mjs` | manifest から upload plan（Phase 3-G） |
| **`plan-storage-assets.mjs`** | **seed 直読み + action 分類（Phase 3-U）** |

Phase 3-U は seed フィールド直結の **商品化向け plan** として位置づけます。

---

## 13. 次フェーズ候補

- Phase 3-U+ : staging Storage upload（copyright 承認後）
- WebP / resize pipeline
- Storage RLS apply（staging）
- Admin UI 画像アップロード
- DB path 列 + export URL 合成
