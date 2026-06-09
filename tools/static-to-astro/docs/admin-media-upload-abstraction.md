# Admin Media Upload Abstraction Scaffold

**Phase:** G-5n — Media upload UI + policy scaffold  
**Status:** scaffold only — not connected to Supabase Storage or runtime  
**Location:** `templates/admin-cms/components/`, `media/`, `examples/media-example.astro`

関連:

- [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md) — G-5m-b Auth
- [cms-schema-adapters.md](./cms-schema-adapters.md) — `storageMappings` metadata
- Registry: [`config/admin/admin-ui-components-registry.json`](../config/admin/admin-ui-components-registry.json)

---

## 1. Purpose

G-5m-b の Auth scaffold の上に、CMS Kit Admin 用の **Media upload abstraction** UI と policy 例を追加しました。

- Supabase Storage 実アップロード・image resize・DB update は**未実施**
- 既存 Sariswing `image-upload.ts` は**未変更**
- schema adapter `storageMappings` と接続しやすい `assetType` / `pathPattern` 設計

---

## 2. Scope

### 対象

| 種別 | 内容 |
| --- | --- |
| Media UI | ImageUploader, MediaLibrary, Preview, RightsNotice, StorageMappingBadge |
| Policy | `media/media-upload-policy.example.json` |
| Asset types | `media/media-asset-types.example.json` — aligned with storageMappings |

### 対象外

- Supabase Storage 実アップロード
- image resize 実処理
- DB update / RLS / bucket policy 変更
- production media operation
- Auth permission enforcement（G-5m-b UI のみ）

---

## 3. Components

| Component | Purpose | Key props |
| --- | --- | --- |
| **AdminImageUploader** | Upload UI + mapping badge | `assetType`, `targetTable`, `targetColumn`, `pathPattern`, `requiresHumanReview`, `stagingOnly` |
| **AdminMediaLibrary** | Static asset list | `items[]`, `readonly` |
| **AdminMediaPreview** | Preview states | `status`: ready / pending / placeholder / missing / review-required |
| **AdminMediaRightsNotice** | Rights confirmation | `rightsStatus`: staging-only / owner-confirmed / blocked |
| **AdminStorageMappingBadge** | storageMappings display | `assetType`, `targetTable`, `targetColumn`, `humanReviewRequired` |

すべて `disabled` / `type="button"` — 実 upload なし。

---

## 4. Media policy

`templates/admin-cms/media/media-upload-policy.example.json`

| Field | 値 |
| --- | --- |
| `provider` | `supabase-storage`（将来） |
| `defaultBucket` | `site-assets` |
| `maxLongSidePx` | 1600（Sariswing 実績に合わせた目安） |
| `acceptedTypes` | JPEG / PNG / WebP |
| `defaultRightsStatus` | `staging-only` |
| `uploadPerformed` | **false** |

---

## 5. Asset types

`templates/admin-cms/media/media-asset-types.example.json`

schema adapter [`cms-schema-adapters.json`](../config/schema-adapters/cms-schema-adapters.json) の `storageMappings` と同型:

| assetType | targetTable | targetColumn | humanReview |
| --- | --- | --- | --- |
| discography_cover | discography | cover_image_url | no |
| schedule_home | schedules | home_image_url | **yes** |
| schedule_flyer | schedules | image_url | **yes** |

`pathPattern`: `{siteSlug}/…/{legacyId}/….{ext}` — site config + adapter で解決（将来）

---

## 6. Human review / rights confirmation

| ルール | UI 表現 |
| --- | --- |
| Schedule 画像 human review 必須 | `requiresHumanReview`, status `review-required` |
| alt-date-conflict / cross-page inferred | `rightsStatus: blocked` + custom message |
| NO PHOTO / placeholder | `AdminMediaPreview status="placeholder"` |
| staging-only | `AdminMediaRightsNotice`, `stagingOnly` prop |
| owner confirmation before production | `requiresOwnerConfirmationBeforeProduction` in policy JSON |

Auth scaffold（G-5m-b）の `permissions.media` と将来接続 — **現時点では enforcement なし**。

---

## 7. Future integration plan

| Step | 内容 |
| --- | --- |
| Supabase Storage adapter | Upload via Edge Function（service role 隔離） |
| Image resize adapter | Client-side 1600px long-side（Sariswing パターン参考、コード移動なし） |
| assetType-driven target | `media-asset-types` + schema adapter → upload path |
| Media DB update plan | `targetColumn` update after upload（staging only） |
| Rights confirmation UI | Owner checkbox + production gate |
| Production-ready media gate | `humanReviewRequired` + explicit approval |

---

## 8. Example

`templates/admin-cms/examples/media-example.astro`

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5n
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category media
```

---

## 9. Safety

| Flag | Value |
| --- | --- |
| Sariswing admin / image-upload.ts modified | **false** |
| Supabase Storage connected | **false** |
| RLS / bucket policy changed | **none** |
| DB update | **none** |
| Upload / resize performed | **false** |
| Publish dispatch | **none** |
| `productionReady` | **false** |
| `connectedToRuntime` | **false** |

---

## 10. Next phase

**G-5o（完了）:** [admin-publish-workflow-abstraction.md](./admin-publish-workflow-abstraction.md) — Publish workflow UI + staging/production separation

**G-5p（完了）:** [musician-basic-admin-prototype.md](./musician-basic-admin-prototype.md) — musician-basic admin prototype。scaffold 統合。Runtime 未接続。

**G-5q:** customer admin manual

---

*G-5n: Media UI scaffold. G-5o: Publish workflow scaffold. G-5p: musician-basic prototype. Sariswing untouched.*
