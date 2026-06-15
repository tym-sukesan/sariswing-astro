Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-7d-gosaki-live-crawl-pilot`

Live crawl of gosaki-piano.com (max 20 pages, 10 fetched). Convert/build PASS. prepare-public FAIL (Wix route shape vs verifier). No FTP.

**Doc:** `tools/static-to-astro/docs/gosaki-live-crawl-pilot-result.md`

**Recommended next phase:** `G-7e-gosaki-staging-preview-preparation`

## 2. G-7d live crawl

```bash
# Executed once (G-7d)
npm run crawl:site -- \
  --url https://www.gosaki-piano.com/ \
  --site-slug gosaki-piano \
  --out fixtures/gosaki-piano \
  --max-pages 20 \
  --same-origin-only \
  --respect-robots \
  --concurrency 1
```

Then pipeline (no `--run-crawl`):

```bash
npm run url:staging -- \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --no-dry-run --run-convert --run-build --prepare-public \
  --pilot-phase G-7d-gosaki-live-crawl-pilot
```

## 3. Gate state

```txt
gosakiLiveCrawlPilotComplete: true
gosakiPianoCrawlExecuted: true
readyForG7eGosakiStagingPreviewPreparation: false
ftpDeployExecutedInG7d: false
```

## 4. Known issue

Live Wix URLs: `/2026-07` not `schedule-2026-07`. static-public verifier expects manual fixture paths — fix in G-7e.

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
