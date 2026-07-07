# G-23g — Static-to-Astro seed extractor standardization result

**Phase:** `G-23g-static-to-astro-seed-extractor-standardization`  
**Status:** **complete** — standardized seed extractor module; **no crawl / DB / SQL / package / FTP**  
**Date:** 2026-07-08  
**Base commit:** `914be95`  
**Prior:** [static-to-astro-cms-preset-registry-result.md](./static-to-astro-cms-preset-registry-result.md) (G-23f)

| Artifact | Path |
| --- | --- |
| Seed extractor | `scripts/lib/onboarding-seed-extractor.mjs` |
| Inspect CLI | `scripts/inspect-onboarding-seed-extraction.mjs` |
| Verifier | `scripts/verify-g23g-static-to-astro-seed-extractor-standardization.mjs` |

| Check | Status |
| --- | --- |
| Extractor implemented | **yes** |
| 6 supported modules | **yes** |
| Sample musician fixture PASS | **yes** |
| DB / network / crawl | **not used** |

---

## Gates

```txt
staticToAstroSeedExtractorStandardizationComplete: true
phase: G-23g-static-to-astro-seed-extractor-standardization
readyForG23hOrchestratorSkeletonImplementation: true
readyForG23iFixtureModeOrchestratorIntegration: true
readyForG23jFirstNonNetworkSampleFullDryRun: true
liveCrawlExecuted: false
networkAccess: false
dbConnectionAttempted: false
dbWriteExecuted: false
cursorSqlMutationExecuted: false
packageBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
cursorSaveExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

---

## 1. Purpose

Standardize CMS seed candidate extraction from G-23d fixture-only dry-run into a **reusable module** callable by the future onboarding orchestrator (G-23h/G-23i).

---

## 2. Seed extractor role

| Consumer | Usage |
| --- | --- |
| **G-23d dry-run** | Prototype logic retained; G-23g module is the canonical extractor |
| **G-23h orchestrator** | Step 4 (CMS EXTRACT) calls `extractOnboardingSeedCandidates` |
| **G-23i fixture integration** | Fixture crawl result → seed candidates without network |
| **G-23j full dry-run** | End-to-end non-network sample onboarding |

Extractor produces **reviewable intermediate data** — not DB INSERT SQL.

---

## 3. Supported modules

| Module ID | Source in fixture | Notes |
| --- | --- | --- |
| `schedule` | `seedCandidates.schedule[]` | Array — multiple events |
| `news` | `seedCandidates.news[]` | Array |
| `profile` | `seedCandidates.profile` | Object |
| `discography` | `seedCandidates.discography[]` | Array |
| `video` | `seedCandidates.video[]` | Array |
| `contact` | `seedCandidates.contact` | Object |

---

## 4. Standard seed candidate format

Each candidate includes:

| Field | Type | Description |
| --- | --- | --- |
| `moduleId` | string | CMS module id |
| `siteSlug` | string | Site slug from config / crawl result |
| `sourcePath` | string | Page path + optional `#legacyId` |
| `sourceRoute` | string | Public route from config or preset |
| `title` / `label` | string? | Human-readable label |
| `published` | boolean | Publish intent |
| `status` | `candidate` \| `skipped` \| `warn` \| `fail` | Extraction status |
| `confidence` | `high` \| `medium` \| `low` | Field completeness heuristic |
| `raw` | object | Original fixture/crawl item |
| `normalized` | object | Module-specific normalized fields |
| `warnings` | string[] | Non-fatal extraction warnings |

---

## 5. Module-specific normalized fields

### schedule

`title`, `date`, `open_time`, `start_time`, `venue`, `price`, `description`, `source_route`, `published`

### news

`title`, `date`, `body`, `source_route`, `published`

### profile

`name`, `body`, `source_route`, `published`

### discography

`title`, `artist`, `year`, `description`, `tracks`, `source_route`, `published`

### video

`title`, `url`, `embed_url`, `description`, `source_route`, `published`

### contact

`body`, `email`, `links`, `source_route`, `published`

---

## 6. Inspect script command

```bash
node tools/static-to-astro/scripts/inspect-onboarding-seed-extraction.mjs \
  tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json
```

With JSON output:

```bash
node tools/static-to-astro/scripts/inspect-onboarding-seed-extraction.mjs \
  tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json \
  --json
```

Pipeline: config validator → CMS preset registry validation → seed extractor. **No file generation.**

---

## 7. Sample musician fixture extraction result

| Module | Candidate count | Status |
| --- | --- | --- |
| schedule | **2** | PASS |
| news | **1** | PASS |
| profile | **1** | PASS |
| discography | **1** | PASS |
| video | **1** | PASS |
| contact | **1** | PASS |

**Total active candidates:** 7

---

## 8. CMS preset registry connection

- `extractOnboardingSeedCandidates` calls `validateCmsPresetConfig` before extraction
- Per-module routes/tables/seed policies resolved via `getPresetModule(config.cmsPreset, moduleId)`
- Unknown module id in config → **FAIL**
- Enabled module with no fixture data (and `seedPolicy !== skip`) → **WARN**

---

## 9. Onboarding orchestrator connection

| Orchestrator step | G-23g function |
| --- | --- |
| Step 0 INTAKE | (G-23c validator — inspect script runs first) |
| Step 4 CMS EXTRACT | `extractOnboardingSeedCandidates` |
| Step 4 report | `summarizeSeedExtraction` |
| Per-module debug | `extractModuleSeedCandidates` / `normalizeSeedCandidate` |

G-23d `run-onboarding-fixture-dry-run.mjs` remains as prototype; orchestrator will call G-23g module directly.

---

## 10. Not DB seed SQL

Seed candidates are **intermediate review data**. No INSERT / UPDATE / UPSERT SQL is generated or executed in G-23g.

---

## 11–15. Safety — not executed

| Operation | Status |
| --- | --- |
| Live crawl | **not executed** |
| DB write | **not executed** |
| SQL mutation | **not executed** |
| Package regen | **not executed** |
| FTP / deploy | **not executed** |

---

## Exported functions

| Function | Purpose |
| --- | --- |
| `extractOnboardingSeedCandidates(config, crawlResult, options)` | Full extraction for all config modules |
| `extractModuleSeedCandidates(moduleId, config, crawlResult, options)` | Single-module extraction |
| `normalizeSeedCandidate(moduleId, rawItem, context)` | Raw → standard candidate |
| `summarizeSeedExtraction(result)` | Counts and status per module |
| `listSupportedSeedModules()` | Returns 6 supported module ids |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-23h** | Orchestrator skeleton implementation |
| **G-23i** | Fixture mode orchestrator integration |
| **G-23j** | First non-network sample full dry-run |

---

## Verification

```bash
node tools/static-to-astro/scripts/verify-g23g-static-to-astro-seed-extractor-standardization.mjs
```
