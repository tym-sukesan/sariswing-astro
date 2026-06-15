Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-7f-gosaki-staging-upload-execution` (**aborted** — FTP upload attempted once; connection hang; success unconfirmed)

**Doc:** `tools/static-to-astro/docs/gosaki-staging-upload-execution-result.md`

**Do not re-run FTP upload until connectivity is resolved.**

### Next action

1. Resolve Lolipop FTP connectivity (FileZilla test from operator machine; server status / access restriction).
2. Re-run G-7f preflight (`plan-staging-public-upload.mjs` + `deploy-public-dist-ftp.mjs --dry-run`).
3. Obtain new operator approval before any upload retry.

### G-7f abort summary

```txt
gosakiStagingUploadAttemptedInG7f: true
ftpDeployCompletedInG7f: false
reason: FTP connection hang; FileZilla also unable to connect
additional retries: none
.ftpaccess: not deleted
readyForG7gGosakiBrowserQaAndClientReview: false
```

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
gosakiStagingUploadPreflightComplete: true
ftpPathAlignedWithDeployBase: true
gosakiStagingUploadAttemptedInG7f: true
ftpDeployExecutedInG7f: false
ftpDeployCompletedInG7f: false
readyForG7gGosakiBrowserQaAndClientReview: false
```

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
