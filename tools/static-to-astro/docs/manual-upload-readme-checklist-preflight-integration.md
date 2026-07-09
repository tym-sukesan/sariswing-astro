# G-20u12 — Manual-upload README/CHECKLIST preflight integration

**Phase:** `G-20u12-manual-upload-readme-checklist-preflight-integration`  
**Base commit:** `e6f2531`  
**Gate:** `manualUploadReadmeChecklistPreflightIntegrationComplete: true`

## Goal

Embed G-20u11 site-aware preflight instructions in every manual-upload package `README-UPLOAD.md` and `CHECKLIST.md`, so operators verify structure + freshness before FileZilla / Lolipop GUI upload.

## Generation source

`scripts/lib/manual-upload-package.mjs`:

- `formatReadmeUpload()` — README-UPLOAD.md
- `formatUploadChecklist()` — CHECKLIST.md
- `resolvePreflightNpmCommand(siteKey, profileName)`
- `resolveBuildNpmCommand(siteKey, profileName)`

## README / CHECKLIST additions

### Preflight (G-20u11)

| Site | Profile | Preflight command |
| --- | --- | --- |
| gosaki-piano | staging | `npm run preflight:gosaki:staging` |
| gosaki-piano | production | `npm run preflight:gosaki:production` |
| pilot-sample-static | staging | `npm run preflight:pilot:staging` |
| any | any | `npm run preflight -- --site SITE_KEY --profile PROFILE` |

### Freshness STOP

- Preflight **STOP** when `MANIFEST.sourceCommit !== git HEAD`
- **Upload forbidden** until rebuild at current HEAD + preflight PASS
- **After any git commit**, on-disk package is stale until regen

### FTP safety (retained)

- Upload **contents** of `public-dist/`, not the folder itself
- Confirm remote path — not account root `/` unless approved cutover
- No mirror / sync / delete-remote-extras / CLI FTP
- Production upload **STOP until G-20j** (even if preflight PASS)

## Operator flow

### Gosaki staging

```bash
cd tools/static-to-astro
npm run build:gosaki:staging
npm run preflight:gosaki:staging
# Manual FTP only — upload public-dist/ contents
```

### Gosaki production

```bash
npm run build:gosaki:production
npm run preflight:gosaki:production
# G-20j preflight still required · upload STOP
```

### Pilot staging

```bash
npm run build:pilot:staging
npm run preflight:pilot:staging
```

## Package regen note

README/CHECKLIST update on next `build:site-package` / `build:gosaki:*` / `build:pilot:*`.  
**Commit after regen → package stale** until rebuild at new HEAD.

## ENOTEMPTY fix (G-20u12 follow-up)

`build:pilot:staging` could fail when `output/*-astro/node_modules` remained from a prior interrupted build and `fs.rmSync` returned `ENOTEMPTY`.

**Fix:** `scripts/lib/safe-output-cleanup.mjs` — path-guarded cleanup (only under `tools/static-to-astro/output/`); bottom-up fallback when `fs.rmSync` fails. Used by `astro-generator.mjs` before regenerate.

**Verified:** `build:pilot:staging` + `preflight:pilot:staging` PASS at `e6f2531`.

## Verification

```bash
cd tools/static-to-astro
node scripts/verify-g20u12-manual-upload-readme-checklist-preflight-integration.mjs
```

## Not executed

- FTP / deploy  
- DB write  
- Package upload  
