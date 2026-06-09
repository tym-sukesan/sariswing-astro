# Staging Generation Plan (G-5f)

**Status:** read-only plan output — does **not** run Astro generation, DB create/update, Storage upload, or FTP deploy.

関連:

- [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md)
- [site-config-cli-usage.md](./site-config-cli-usage.md)
- [cms-template-registry.md](./cms-template-registry.md)
- [cms-schema-adapters.md](./cms-schema-adapters.md)
- Planner: [`scripts/lib/staging-generation-planner.mjs`](../scripts/lib/staging-generation-planner.mjs)
- CLI: [`scripts/plan-staging-generation.mjs`](../scripts/plan-staging-generation.mjs)

---

## Purpose

G-5f は site config + template registry + schema adapter の **3層を統合**し、staging 移行に必要な手順を機械的に整理した plan を出力します。

```txt
site config
  ↓
template registry
  ↓
schema adapter
  ↓
staging generation plan (manifest + report)
```

実操作は一切行いません。

---

## CLI usage

```bash
node tools/static-to-astro/scripts/plan-staging-generation.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

明示出力先:

```bash
node tools/static-to-astro/scripts/plan-staging-generation.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json \
  --report tools/static-to-astro/output/plans/gosaki/STAGING_GENERATION_PLAN.md \
  --manifest tools/static-to-astro/output/plans/gosaki/staging-generation-plan.json
```

`--report` / `--manifest` 未指定時のデフォルト:

```txt
tools/static-to-astro/output/plans/{siteSlug}/STAGING_GENERATION_PLAN.md
tools/static-to-astro/output/plans/{siteSlug}/staging-generation-plan.json
```

`output/` は **commit しない**。

---

## Manifest contents

| セクション | 内容 |
| --- | --- |
| `siteSlug` / `siteType` / `templateId` / `schemaAdapterId` | 案件識別 |
| `safety` | 全操作フラグ `false`（read-only plan） |
| `template` | pages, contentModels, storageAssetTypes |
| `schema` | Supabase tables, legacyId, storage columns |
| `storageMigrationPlan` | assetType → table.column, humanReview, pathPattern |
| `humanReviewRequired` / `humanReviewGates` | 人間レビュー境界 |
| `recommendedWorkflow` | CLI 実行順序と safety gate |
| `productionReadiness` | `ready: false` + blocking items |
| `warnings` | template / adapter 差分、draft、noindex 等 |

---

## Safety flags（常に false）

| Flag | G-5f |
| --- | --- |
| `uploadPerformed` | false |
| `dbCreatePerformed` | false |
| `dbUpdatePerformed` | false |
| `ftpDeployPerformed` | false |
| `astroGenerationPerformed` | false |

---

## Recommended workflow

plan は標準的な 18 ステップを出力します（crawl → convert → inspect → seed → storage review → human review → upload → DB update → build → verify → FTP → QA → production gate）。

各ステップに付与:

- `cli` — 実行するスクリプト名（該当なしは null）
- `operation` — `read-only` / `read/write-local` / `upload` / `db-update` / `deploy`
- `requiresHumanReview` — 人間判断が必要か
- `safetyGate` — 実行前チェック

G-5f では workflow は **計画として出力するのみ**。write CLI は実行しません。

---

## Gosaki example

gosaki site config では plan に以下の site notes が含まれます:

- `musician-basic` proven with gosaki
- discography cover migration proven
- schedule home image migration proven
- schedule flyer は human-review 依存
- production disabled

`schedule_home` / `schedule_flyer` は human review gate として明示されます。

---

## Warnings

| 条件 | 扱い |
| --- | --- |
| template contentModels ↔ adapter tables 差分 | warning |
| storageAssetTypes ↔ storageMappings 差分 | warning |
| `production.enabled: true` | 強い warning |
| `seo.stagingNoindex: false` | warning |
| draft template / adapter | warning |
| unknown templateId / schemaAdapterId / siteType | **error**（plan 失敗） |
| humanReviewRequired assets | warning ではなく gate として表示 |

---

## Next phases

| Phase | 内容 |
| --- | --- |
| **G-5g** | plan から dry-run generation package（**完了** — [site-generation-dry-run.md](./site-generation-dry-run.md)） |
| **G-5h** | onboarding runbook / 顧客チェックリスト |
| **G-5i** | Admin CMS template extraction |
| Later | write CLI の site-config 対応 |

```bash
node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
  --plan tools/static-to-astro/output/plans/gosaki/staging-generation-plan.json
```

---

*G-5f: read-only plan only. G-5g: dry-run package from plan. No Astro / DB / Storage / FTP operations.*
