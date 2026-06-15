Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-8b-gosaki-mobile-responsive-preview-fix` (complete — **operator manual re-upload pending**)

**Doc:** `tools/static-to-astro/docs/gosaki-mobile-responsive-preview-fix.md`

**Staging URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

**FTP auto-deploy:** still disabled.

### Gates

```txt
gosakiMobileResponsivePreviewFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```

## 2. Manual re-upload package

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```

**Package (gitignored):** `output/manual-upload/gosaki-piano/`  
**Upload target:** `/cms-kit-staging/gosaki-piano/` — **include `_astro/index.DFhgPQ9c.css`** (G-8b new hash)

## 3. Operator next steps

1. Re-upload full `public-dist/` contents to `/cms-kit-staging/gosaki-piano/`
2. Phone / DevTools mobile QA at ~375px: no major horizontal scroll
3. Check About (bio + photo stack), Bands 1-column, Contact form width, MENU toggle
4. Share staging with gosaki client if mobile QA passes

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
