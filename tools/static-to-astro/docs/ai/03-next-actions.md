Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-7g-gosaki-manual-staging-upload-package` (complete — **operator manual upload pending**)

**Doc:** `tools/static-to-astro/docs/gosaki-manual-staging-upload-package.md`

**FTP auto-deploy:** still disabled. Use manual upload package instead.

### Gates

```txt
gosakiManualUploadPackageCreated: true
ftpAutoDeployStillDisabled: true
readyForManualStagingUploadByOperator: true
readyForAnyFutureFtpApply: false
readyForG7gGosakiBrowserQaAndClientReview: false
```

## 2. Manual upload package

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```

**Package (gitignored):** `output/manual-upload/gosaki-piano/`  
**Zip:** `gosaki-piano-manual-upload.zip`  
**Upload target:** `/cms-kit-staging/gosaki-piano/` (contents of `public-dist/` only)

## 3. Operator next steps

1. Open `output/manual-upload/gosaki-piano/README-UPLOAD.md`
2. FileZilla → `/cms-kit-staging/gosaki-piano/` (not account root `/`)
3. Upload `public-dist/` **contents** — no mirror/delete sync
4. Browser QA per `CHECKLIST.md`

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
