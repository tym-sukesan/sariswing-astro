# Site config CLI usage (G-5c)

**Scope:** read-only / planning CLIs only. Upload / DB update / FTP deploy CLIs are **not** site-config aware yet.

関連: [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md) / [gosaki-storage-image-migration-runbook.md](./gosaki-storage-image-migration-runbook.md)

---

## Role of site config

`site config` は**案件単位**の設定 JSON です。`siteSlug`、fixture パス、output レポート先などを1ファイルにまとめ、read-only CLI の引数を補完します。

- **Secrets は含めない**（Supabase service role / FTP password は `.env.local` のみ）
- パスは原則 `tools/static-to-astro/` 起点の相対パス
- **明示 CLI 引数が site config より優先**（後方互換）

Example: [`config/sites/gosaki.site-config.example.json`](../config/sites/gosaki.site-config.example.json)

Loader: [`scripts/lib/site-config-loader.mjs`](../scripts/lib/site-config-loader.mjs)

---

## Supported CLIs (G-5c)

| CLI | `--site-config` | Upload | DB | FTP |
| --- | --- | --- | --- | --- |
| `review-storage-assets.mjs` | yes | no | no | no |
| `prepare-storage-upload-allowlist.mjs` | yes | no | no | no |
| `review-schedule-storage-assets.mjs` | yes | no | no | no |
| `promote-schedule-storage-allowlist.mjs` | yes | no | no | no |
| `upload-storage-assets.mjs` | **no** (将来) | — | — | — |
| `apply-storage-db-updates.mjs` | **no** (将来) | — | — | — |
| `deploy-public-dist-ftp.mjs` | **no** (将来) | — | — | — |

---

## Path resolution

`output.storageDir` または `output.reports.storage` を基準に、以下を自動解決します。

| CLI | 補完される引数 | デフォルト（storageDir 配下） |
| --- | --- | --- |
| `review-storage-assets` | `--site-slug`, `--fixture-dir`, `--data-dir`, `--report`, `--manifest` | `STORAGE_ASSET_REVIEW_REPORT.md`, `storage-asset-review-manifest.json` |
| `prepare-storage-upload-allowlist` | `--review-manifest`, `--site-slug`, `--report`, `--allowlist` | `storage-asset-review-manifest.json`, `STORAGE_UPLOAD_ALLOWLIST_REPORT.md`, `storage-upload-allowlist.json` |
| `review-schedule-storage-assets` | `--allowlist`, `--review-manifest`, `--data-dir`, `--site-slug`, `--report`, `--manifest` | `storage-upload-allowlist.json`, `SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md`, … |
| `promote-schedule-storage-allowlist` | `--decision-template`, `--site-slug`, `--report`, `--allowlist` | `schedule-image-human-decision-template.json`, `schedule-upload-allowlist.json`, … |

`data-dir` は `{generatedAstroDir}/src/data`（既定: `output/generated-astro/src/data`）。

`fixture-dir` は `source.fixtureDir`（gosaki 例: `fixtures/gosaki-static-site`）。

---

## Examples

### Site-config driven（新形式）

```bash
node tools/static-to-astro/scripts/review-storage-assets.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/prepare-storage-upload-allowlist.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/review-schedule-storage-assets.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

```bash
node tools/static-to-astro/scripts/promote-schedule-storage-allowlist.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

### Explicit args（既存 G-4 形式・後方互換）

```bash
node tools/static-to-astro/scripts/review-schedule-storage-assets.mjs \
  --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
  --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
  --data-dir tools/static-to-astro/output/generated-astro/src/data \
  --site-slug gosaki \
  --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md \
  --manifest tools/static-to-astro/output/storage/gosaki/schedule-image-human-review.json
```

### Explicit override（site config + 1項目上書き）

```bash
node tools/static-to-astro/scripts/review-schedule-storage-assets.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json \
  --report /tmp/custom-report.md
```

`/tmp/custom-report.md` が `--report` に使われます。他のパスは site config から補完されます。

---

## Manifest / report metadata

`--site-config` 経由で実行した場合、manifest（または allowlist JSON）に以下を付与します（既存 schema を壊さない追加フィールド）。

```json
{
  "siteConfigPath": "tools/static-to-astro/config/sites/gosaki.site-config.example.json",
  "configDriven": true,
  "uploadPerformed": false,
  "dbUpdatePerformed": false,
  "ftpDeployPerformed": false
}
```

Report 末尾に同内容の **Site config (G-5c)** セクションを追記します。

---

## Backward compatibility

- `--site-config` **なし** → 従来どおり。必須引数はすべて CLI で指定。
- G-4 runbook のコマンド例は**変更不要**。
- `promote-schedule-storage-allowlist.mjs` の `--apply-gosaki-g4e` は既存動作のまま（G-5c では拡張しない）。

---

## Safety limits

| 制限 | 内容 |
| --- | --- |
| Read-only only | G-5c は planning / review CLI のみ |
| No apply | upload / DB / FTP の `--apply` は site-config 未対応 |
| No secrets in JSON | service role / FTP password は config 禁止 |
| Input missing | site config 解決後に input ファイル不在 → 自然な file-not-found エラー |

---

## Errors

| 状況 | エラー例 |
| --- | --- |
| config 不在 | `Site config not found: ...` |
| 必須フィールド欠落 | `Invalid site config: Missing siteSlug` |
| 入力 manifest 不在 | `Review manifest not found: ...`（config 解決は成功） |
| fixture 不在 | `Fixture directory not found: ...` |

---

## Template registry (G-5d)

Site config の `templateId` / `siteType` は [cms-template-registry.json](../config/templates/cms-template-registry.json) と照合できます。

```bash
node tools/static-to-astro/scripts/inspect-cms-template.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

- `musician-basic` — gosaki 実績（proven-with-gosaki）
- `music-school` / `dance-school` / `small-business` — draft

Registry は **metadata のみ**。詳細: [cms-template-registry.md](./cms-template-registry.md)

---

## Schema adapter (G-5e)

Site config の `schemaAdapterId` は [cms-schema-adapters.json](../config/schema-adapters/cms-schema-adapters.json) と照合できます。

```bash
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

gosaki 例: `templateId: musician-basic` + `schemaAdapterId: musician-basic-supabase-v1`

- template registry ↔ schema adapter の整合性を warnings で報告
- **read-only** — upload / DB update / FTP は行わない

詳細: [cms-schema-adapters.md](./cms-schema-adapters.md)

---

---

## Staging generation plan (G-5f)

site config + template registry + schema adapter から read-only plan を生成します。

```bash
node tools/static-to-astro/scripts/plan-staging-generation.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

出力（デフォルト）:

```txt
tools/static-to-astro/output/plans/{siteSlug}/STAGING_GENERATION_PLAN.md
tools/static-to-astro/output/plans/{siteSlug}/staging-generation-plan.json
```

- `recommendedWorkflow` — CLI 実行順序と safety gate
- `productionReadiness.ready` — 常に false（gosaki 含む）
- safety flags すべて false（upload / DB / FTP / Astro 未実施）

詳細: [staging-generation-plan.md](./staging-generation-plan.md)

---

---

## Dry-run generation package (G-5g)

plan または site config から generation package を出力します。

```bash
node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
```

出力: `output/generation-packages/{siteSlug}/`（gitignore）

詳細: [site-generation-dry-run.md](./site-generation-dry-run.md)

---

*G-5h 以降: onboarding runbook。write 系 CLI への site-config 対応は別フェーズ。*
