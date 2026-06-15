Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-7d1-gosaki-live-route-static-public-compatibility-fix`

Static-public verifier accepts live crawl routes (`2026-XX/`) and manual fixture routes (`schedule-2026-XX/`). G-7d output re-verified: prepare-public PASS, `safeForStaticFtp: true`. No re-crawl.

**Doc:** `tools/static-to-astro/docs/gosaki-live-route-static-public-compatibility-fix.md`

**Recommended next phase:** `G-7e-gosaki-staging-preview-preparation`

## 2. G-7d1 verification (no re-crawl)

```bash
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md

npm run url:staging -- \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --no-dry-run --prepare-public \
  --pilot-phase G-7d1-gosaki-live-route-static-public-compatibility-fix
```

## 3. Gate state

```txt
gosakiLiveCrawlPilotComplete: true
gosakiLiveRouteStaticPublicCompatibilityFixComplete: true
gosakiPianoCrawlExecuted: true
readyForG7eGosakiStagingPreviewPreparation: true
ftpDeployExecutedInG7d: false
ftpDeployExecutedInG7d1: false
```

## 4. G-7e scope (next)

- FTP dry-run (`deploy-public-dist-ftp.mjs --dry-run`)
- Browser QA on staging URL (noindex, robots, nav)
- Optional: canonical duplicate-path fix (`.../gosaki-piano/cms-kit-staging/gosaki-piano/`)
- Operator approval before any FTP `--apply`

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
