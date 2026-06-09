# CMS Schema Adapters (G-5e)

**Status:** read-only metadata — does **not** create DB tables, upload Storage, apply DB updates, or drive Astro generation yet.

関連:

- [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md)
- [cms-template-registry.md](./cms-template-registry.md)
- [site-config-cli-usage.md](./site-config-cli-usage.md)
- Registry: [`config/schema-adapters/cms-schema-adapters.json`](../config/schema-adapters/cms-schema-adapters.json)
- Loader: [`scripts/lib/schema-adapter-loader.mjs`](../scripts/lib/schema-adapter-loader.mjs)

---

## Role

Schema adapter は **template registry の抽象モデルを Supabase 実装にマッピング**する層です。

| 層 | 役割 | G-5e |
| --- | --- | --- |
| **Template registry** | contentModels / pages / storageAssetTypes の宣言 | G-5d |
| **Schema adapter** | tables / columns / legacyId / storageMappings / humanReviewRules | **G-5e（本書）** |
| **Site config** | 案件単位の `templateId` + `schemaAdapterId` + paths | G-5c |

Template registry は「何を扱うか」、schema adapter は「Supabase のどの table / column に載せるか」を定義します。

---

## Site config との接続

[`gosaki.site-config.example.json`](../config/sites/gosaki.site-config.example.json):

```json
{
  "siteSlug": "gosaki",
  "siteType": "musician",
  "templateId": "musician-basic",
  "schemaAdapterId": "musician-basic-supabase-v1"
}
```

`schemaAdapterId` が無い場合、loader は `templateId` から候補 adapter を推測します（複数ある場合は明示指定を推奨）。

---

## Adapter 一覧

| adapterId | templateId | status | 備考 |
| --- | --- | --- | --- |
| `musician-basic-supabase-v1` | `musician-basic` | **proven-with-gosaki** | gosaki G-4 実績ベース |
| `music-school-supabase-v1` | `music-school` | draft | テーブル未作成 |
| `dance-school-supabase-v1` | `dance-school` | draft | テーブル未作成 |
| `small-business-supabase-v1` | `small-business` | draft | テーブル未作成 |

---

## musician-basic-supabase-v1（gosaki 実績）

### Tables / models

| table | model | required | legacyId strategy |
| --- | --- | --- | --- |
| `schedule_months` | schedule_months | yes | year-month (`schedule-YYYY-MM`) |
| `schedules` | schedules | yes | date-sequence (`schedule-YYYY-MM-NNN`) |
| `discography` | discography | no | sequence (`discography-NNN`) |
| `discography_tracks` | discography_tracks | no | parent-sequence |
| `profile` | profile | no | singleton (`profile-main`) |
| `links` | links | no | slug-or-sequence |
| `news` | news | no | date-or-slug |

gosaki staging では `schedule-2026-03-012` の `home_image_url` 移行が実証済み（G-4f/g）。

### Storage mappings

| assetType | target | humanReviewRequired | provenWith |
| --- | --- | --- | --- |
| `discography_cover` | `discography.cover_image_url` | no | gosaki |
| `schedule_home` | `schedules.home_image_url` | **yes** | gosaki |
| `schedule_flyer` | `schedules.image_url` | **yes** | — |

### Human review rules

| ruleId | appliesTo | defaultAction |
| --- | --- | --- |
| `schedule-date-conflict` | schedule_home, schedule_flyer | defer |
| `cross-page-inferred-schedule-image` | schedule_flyer | defer |
| `no-photo-placeholder` | schedule_home, schedule_flyer | reject |

---

## Draft adapters

`music-school` / `dance-school` / `small-business` は **構造のみ**の draft です。

- Supabase テーブルは staging に未作成
- `gallery` 等、template に無い補助 table を含む場合あり（warnings として inspect が報告）
- G-5f 以降で seed extractor / upload executor との接続を検討

---

## Inspect CLI

Read-only。upload / DB update / FTP は一切行いません。

```bash
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
  --adapter-id musician-basic-supabase-v1
```

```bash
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
  --template-id musician-basic
```

出力例: `siteSlug`, `templateId`, `schemaAdapterId`, `provider`, `status`, tables, legacyId rules, storage mappings, humanReviewRules, validation warnings, `uploadPerformed: false`, `dbUpdatePerformed: false`, `ftpDeployPerformed: false`.

Template registry 単体の確認は引き続き `inspect-cms-template.mjs` を使用します（schema adapter 未設定でもエラーにしません）。

---

## Validation（loader）

`validateTemplateSchemaAdapter` は以下を検証します（read-only）:

- template `contentModels` ↔ adapter `tables` の対応（missing / extra → warnings）
- template `storageAssetTypes` ↔ adapter `storageMappings` の対応
- targetTable / targetColumn の不一致 → errors
- site config `schemaAdapterId` と adapter の一致
- draft adapter status → warnings

---

## まだ接続しないもの（G-5e 境界）

| 操作 | G-5e |
| --- | --- |
| DB table 作成 | **no** |
| DB update (`apply-storage-db-updates.mjs`) | **no** |
| Storage upload (`upload-storage-assets.mjs`) | **no** |
| FTP deploy | **no** |
| Astro / Admin 生成 | **no** |

既存 G-4 write CLI は変更していません。

---

## 次フェーズ G-5f / G-5g

**G-5f（完了）:** [`plan-staging-generation.mjs`](../scripts/plan-staging-generation.mjs) が site config + template + schema adapter から read-only staging plan を出力。詳細: [staging-generation-plan.md](./staging-generation-plan.md)

**G-5g（予定）:**

- plan から **dry-run site generation** へ接続
- seed extractor / storage executor が adapter の `storageMappings` / `legacyId` を参照
- draft template の Supabase DDL は別途人間レビュー後に staging 適用

詳細: [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md) §13
