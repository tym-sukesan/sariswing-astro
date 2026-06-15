# URL-to-staging pipeline orchestrator implementation (G-7b)

Last updated: 2026-06-15  
Phase: `G-7b-url-to-staging-pipeline-orchestrator-implementation`  
Type: **implementation** — orchestrator CLI + dry-run plan; no external crawl, no FTP deploy, no workflow_dispatch

## Purpose

Connect G-7a crawl CLI to the existing static-to-astro pipeline with a single orchestrator entrypoint:

```txt
URL / config
  → crawl fixture (gated)
  → analyze fixture
  → convert static to Astro
  → build check
  → prepare staging public output
  → run manifest + next manual steps
```

**This phase did not:** crawl gosaki-piano.com, FTP deploy, workflow_dispatch, Supabase SQL, or production changes.

---

## Implementation summary

| Component | Path |
| --- | --- |
| CLI entry | `scripts/url-to-staging-pipeline.mjs` |
| Config loader | `scripts/lib/url-to-staging-config-loader.mjs` |
| Step plan (no heavy deps) | `scripts/lib/url-to-staging-pipeline-plan.mjs` |
| Pipeline execution | `scripts/lib/url-to-staging-pipeline.mjs` |
| Gosaki pilot config | `config/sites/gosaki-piano.url-to-staging.json` |
| Verify script | `scripts/verify-url-to-staging-pipeline.mjs` (29 tests, mock/local only) |
| npm script | `npm run url:staging` |
| Verify npm script | `npm run verify:url-staging` |

---

## CLI usage

```bash
# Default safe dry-run with gosaki config sample
npm run url:staging -- \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --dry-run

# CLI-only (no config file)
npm run url:staging -- \
  --url https://www.example.com/ \
  --site-slug example \
  --fixture-out fixtures/example \
  --project-out output/example-astro \
  --deploy-base /cms-kit-staging/example/ \
  --dry-run

# Verify (no network)
npm run verify:url-staging
node tools/static-to-astro/scripts/verify-crawl-static-site.mjs
```

---

## Dry-run behavior

Default: **`--dry-run`** (safe).

| Action | dry-run |
| --- | --- |
| External crawl | No (crawl step skipped unless `--run-crawl`; with dry-run, crawl uses G-7a dry-run = no network/writes) |
| analyze / convert / build / public | Planned only; commands printed |
| FTP deploy | Never executed |
| workflow_dispatch | Never supported |
| Manifest | Written to `output/runs/<timestamp>-<siteSlug>.json` (gitignored) |
| stdout | Step plan with `wouldRun` / `wouldWrite` / `wouldDeploy` flags |

Use `--no-dry-run` plus explicit gates for live execution.

---

## Step gating

All gates default **false** except dry-run.

| Flag | Default | Notes |
| --- | --- | --- |
| `--dry-run` | **true** | Pass `--no-dry-run` to allow gated writes |
| `--run-crawl` | false | Live crawl requires operator approval |
| `--run-convert` | false | Calls `generateAstroProject` |
| `--run-build` | false | `--verify-build` on convert or `npm run build` |
| `--prepare-public` | false | `verify-static-public-artifact.mjs` |
| `--deploy-ftp` | false | **Plan only in G-7b** — never executes FTP |

---

## Gosaki config sample

`config/sites/gosaki-piano.url-to-staging.json`:

- `startUrl`: `https://www.gosaki-piano.com/` (reference only — not crawled in G-7b)
- `stagingBaseUrl`: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano`
- `deployBase`: `/cms-kit-staging/gosaki-piano/`
- No secrets / FTP credentials

---

## Output / manifest

Run manifest path:

```txt
tools/static-to-astro/output/runs/<timestamp>-<siteSlug>.json
```

Manifest fields:

```json
{
  "phase": "G-7b-url-to-staging-pipeline-orchestrator",
  "siteSlug": "gosaki-piano",
  "dryRun": true,
  "wouldRun": false,
  "wouldWrite": true,
  "wouldDeploy": false,
  "steps": [],
  "seo": {},
  "warnings": [],
  "artifacts": {},
  "nextManualSteps": [],
  "readyForG7cUrlToStagingDryRunPilot": true
}
```

`output/` is gitignored — do not commit manifests or generated projects.

---

## Staging SEO (noindex / deployBase)

Wired via convert when `stagingBaseUrl` + `deployBase` are set:

- `--base-url` → staging host (not production)
- `--deploy-base` → subdirectory path for Astro build

Manifest `seo` section documents planned/required checks:

- staging noindex meta
- robots.txt Disallow on staging
- canonical uses staging URL (`canonicalMode: staging-url`)
- sitemap URLs use staging host + deployBase
- do not leak production canonical in staging HTML

Full automated SEO QA is **G-7c/G-7d** scope.

---

## Safety rules (G-7b)

| Rule | Status |
| --- | --- |
| gosaki-piano.com live crawl | **Not executed** |
| External site crawl | **Not executed** |
| FTP deploy | **Not executed** |
| workflow_dispatch | **Not supported** |
| DB write / Supabase SQL | **None** |
| production / Sariswing | **Untouched** |
| `/admin` changes | **None** |
| secrets committed | **None** |
| `output/` committed | **None** |

---

## Verification (this phase)

```txt
verify-url-to-staging-pipeline.mjs: 29 passed
verify-crawl-static-site.mjs: 30 passed (G-7a regression)
npm run build (repo root): success
```

---

## Next phases

### G-7c — URL-to-staging dry-run pilot

- End-to-end dry-run with gosaki config + existing `fixtures/gosaki-static-site` (no live crawl)
- `--no-dry-run --run-convert --run-build` on local fixture
- SEO manifest validation against staging URL

### G-7d — gosaki-piano live crawl pilot

- Operator-approved live crawl of gosaki-piano.com
- Full pipeline through static-public (still no auto FTP)
- Manual FTP via existing `deploy-public-dist-ftp.mjs`

---

## Gate state after G-7b

```txt
urlToStagingPipelineOrchestratorImplementationComplete: true
readyForG7cUrlToStagingDryRunPilot: true
externalCrawlExecutedInG7b: false
gosakiPianoCrawlExecuted: false
ftpDeployExecutedInG7b: false
```
