# Site Generation Dry-Run (G-5g)

**Status:** dry-run generation package — does **not** generate Astro files, create DB tables, upload Storage, or FTP deploy.

関連:

- [staging-generation-plan.md](./staging-generation-plan.md) — G-5f plan input
- [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md)
- Dry-runner: [`scripts/lib/site-generation-dry-runner.mjs`](../scripts/lib/site-generation-dry-runner.mjs)
- CLI: [`scripts/generate-site-dry-run.mjs`](../scripts/generate-site-dry-run.mjs)

---

## Purpose

G-5g は G-5f の `staging-generation-plan.json` を入力に、**実生成の一歩手前**の generation package を local output にまとめます。

```txt
staging-generation-plan.json
  ↓
generate-site-dry-run.mjs
  ↓
output/generation-packages/{siteSlug}/
```

含まれるもの:

- 生成予定ページ / components / data files 一覧
- Supabase schema skeleton + seed skeleton
- Storage migration tasks + human review tasks
- Staging QA checklist + recommended commands
- Safety flags（すべて false）

---

## CLI usage

### From plan

```bash
node tools/static-to-astro/scripts/plan-staging-generation.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json

node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
  --plan tools/static-to-astro/output/plans/gosaki/staging-generation-plan.json
```

### From site config (plan を内部生成)

```bash
node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

明示出力先:

```bash
node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json \
  --out-dir tools/static-to-astro/output/generation-packages/gosaki
```

デフォルト: `tools/static-to-astro/output/generation-packages/{siteSlug}/`

`output/` は **commit しない**。

---

## Generation package files

| File | 内容 |
| --- | --- |
| `generation-package.json` | マニフェスト + summary + safety |
| `GENERATION_PACKAGE_REPORT.md` | 人間向け要約 |
| `planned-files.json` | 予定 Astro pages / components / data（`willGenerateNow: false`） |
| `supabase-schema-skeleton.json` | tables / columns（`willCreateNow: false`） |
| `seed-skeleton.json` | seed 雛形（`seedGeneratedNow: false`） |
| `storage-tasks.json` | Storage 移行タスク（`storageUploadPerformed: false`） |
| `human-review-tasks.json` | 人間レビュー境界 |
| `qa-checklist.md` | Staging QA チェックリスト |
| `recommended-commands.md` | 実行予定 CLI（write は requires-approval） |

---

## Safety flags（常に false）

| Flag | G-5g |
| --- | --- |
| `astroGenerationPerformed` | false |
| `dbCreatePerformed` | false |
| `dbUpdatePerformed` | false |
| `storageUploadPerformed` | false |
| `ftpDeployPerformed` | false |
| `productionTouched` | false |

既存 `output/generated-astro` は上書きしません。

---

## Input validation

- `siteSlug`, `templateId`, `schemaAdapterId`, `template`, `schema` 必須
- unknown template / adapter は plan 段階でエラー
- template ↔ schema adapter 差分は warnings として package に引き継ぎ

---

## Gosaki example

- `musician-basic` / `musician-basic-supabase-v1`
- storage tasks: `discography_cover`, `schedule_home`, `schedule_flyer`
- `schedule_home` / `schedule_flyer` → human review tasks
- `productionReadiness.ready: false`

---

## Next phases

| Phase | 内容 |
| --- | --- |
| **G-5h** | Product onboarding runbook |
| **G-5i** | Admin CMS template extraction |
| Later | Optional Astro scaffold from `planned-files.json`（明示 opt-in） |

---

*G-5g: dry-run package only. No Astro / DB / Storage / FTP operations.*
