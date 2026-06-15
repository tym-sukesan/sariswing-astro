Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-7e-gosaki-staging-preview-preparation`

Canonical duplicate path fixed, Nav Home / internal production URLs rewritten, static-public regenerated, FTP upload plan created. No re-crawl, no FTP `--apply`.

**Doc:** `tools/static-to-astro/docs/gosaki-staging-preview-preparation.md`

**Recommended next phase:** `G-7f-gosaki-staging-upload-execution` (operator approval required)

## 2. G-7e verification (no re-crawl)

```bash
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician --verify-build

npm run url:staging -- \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --no-dry-run --prepare-public \
  --pilot-phase G-7e-gosaki-staging-preview-preparation

node scripts/plan-staging-public-upload.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki-piano/public-dist \
  --site-slug gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --out tools/static-to-astro/output/deploy/gosaki-piano/staging-upload-plan.json
```

## 3. Gate state

```txt
gosakiLiveRouteStaticPublicCompatibilityFixComplete: true
gosakiStagingPreviewPreparationComplete: true
readyForG7fGosakiStagingUploadExecution: true
ftpDeployExecutedInG7e: false
```

## 4. G-7f scope (next)

- Operator approval checklist (see upload plan)
- `deploy-public-dist-ftp.mjs --dry-run` with local FTP env (optional pre-check)
- `deploy-public-dist-ftp.mjs --apply --env staging` (G-7f only, explicit approval)
- Browser QA on live staging URL

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
