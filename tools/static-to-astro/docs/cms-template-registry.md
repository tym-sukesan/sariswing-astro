# CMS Template Registry (G-5d)

**Status:** metadata / read-only — does **not** drive Astro generation, schema migration, or deploy yet.

関連:

- [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md)
- [site-config-cli-usage.md](./site-config-cli-usage.md)
- Registry: [`config/templates/cms-template-registry.json`](../config/templates/cms-template-registry.json)
- Loader: [`scripts/lib/template-registry-loader.mjs`](../scripts/lib/template-registry-loader.mjs)

---

## Role

Template registry は **siteType / templateId ごとの CMS Kit テンプレート定義**です。

| 用途 | G-5d |
| --- | --- |
| contentModels / pages / storageAssetTypes の宣言 | yes |
| human review 要否の整理 | yes |
| site config との整合検証 | yes |
| Astro convert / Admin 生成 | **no**（G-5f 以降） |
| schema adapter 実装 | **G-5e**（[cms-schema-adapters.md](./cms-schema-adapters.md) — metadata のみ） |

---

## Template 一覧

| templateId | siteTypes | status | 備考 |
| --- | --- | --- | --- |
| `musician-basic` | `musician` | **proven-with-gosaki** | gosaki 実績 — G-4 画像移行済み |
| `music-school` | `music-school` | draft | ピアノ教室 / fermata 系 |
| `dance-school` | `dance-school` | draft | TLHA / ダンス教室 |
| `small-business` | `small-business`, `generic` | draft | 小規模事業者 / コーポレート |

---

## Registry 構造

各 template エントリ:

| フィールド | 説明 |
| --- | --- |
| `templateId` | 安定 ID（site config `templateId` と一致） |
| `siteTypes` | 対応する `siteType` 値 |
| `status` | `proven-with-gosaki` / `draft` |
| `contentModels` | CMS コンテンツモデル（required, source, humanReviewRequired） |
| `pages` | 想定静的ページ slug |
| `storageAssetTypes` | Storage 移行対象（table, column, humanReviewRequired） |
| `seoFeatures` / `deployFeatures` | 想定機能セット |
| `knownSiteExamples` | 実証サイト slug |

---

## humanReviewRequired

| 方針 | 例 |
| --- | --- |
| 自動 allowlist 可 | `discography_cover`（gosaki G-4b） |
| human review 必須 | `schedule_home`, `schedule_flyer`（日付不一致・home/flyer 分離） |
| draft テンプレ | 講師写真・イベント flyer は原則 `true` |

G-4 runbook の schedule human review フローは `musician-basic.storageAssetTypes` と一致。

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

`templateId` は任意だが、指定時は registry と `siteType` の整合を `validateSiteConfigTemplate()` で検証。

---

## Inspect CLI

```bash
node tools/static-to-astro/scripts/inspect-cms-template.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/inspect-cms-template.mjs --template-id musician-basic
```

```bash
node tools/static-to-astro/scripts/inspect-cms-template.mjs --site-type music-school
```

出力: contentModels, pages, storageAssetTypes, human review 対象, warnings。  
`uploadPerformed` / `dbUpdatePerformed` / `ftpDeployPerformed` は常に **false**。

---

## Schema adapter（G-5e）

Registry の `contentModels` / `storageAssetTypes` は [cms-schema-adapters.md](./cms-schema-adapters.md) の adapter が Supabase table / column / legacyId / storageMappings にマッピングします。

```bash
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

G-5e では metadata / validation のみ。DB 作成・upload / DB update には未接続。

---

*G-5d: template registry. G-5e: schema adapter draft. Generation wiring starts in G-5f.*
