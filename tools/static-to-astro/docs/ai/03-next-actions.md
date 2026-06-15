Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-7h-gosaki-staging-css-asset-fix` (complete — **operator manual re-upload pending**)

**Doc:** `tools/static-to-astro/docs/gosaki-staging-css-asset-fix.md`

**FTP auto-deploy:** still disabled. Use regenerated manual upload package.

### Gates

```txt
gosakiStagingCssAssetFixComplete: true
readyForManualReuploadByOperator: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
readyForG7gGosakiBrowserQaAndClientReview: false
```

## 2. Manual re-upload package

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```

**Package (gitignored):** `output/manual-upload/gosaki-piano/`  
**Zip:** `gosaki-piano-manual-upload.zip`  
**Upload target:** `/cms-kit-staging/gosaki-piano/` (contents of `public-dist/` only, **include `_astro/`**)

## 3. Operator next steps

1. Open `output/manual-upload/gosaki-piano/README-UPLOAD.md`
2. FileZilla → `/cms-kit-staging/gosaki-piano/` (not account root `/`)
3. Re-upload `public-dist/` **contents** — must include `_astro/index.*.css` — no mirror/delete sync
4. Browser QA: layout CSS applied; Network tab shows `_astro` CSS 200
5. Follow `CHECKLIST.md`

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
