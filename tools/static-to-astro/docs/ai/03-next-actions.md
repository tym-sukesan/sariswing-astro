Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-8a-gosaki-about-band-profiles-section` (complete — **operator manual re-upload pending**)

**Doc:** `tools/static-to-astro/docs/gosaki-about-band-profiles-section.md`

**Staging URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

**FTP auto-deploy:** still disabled.

### Gates

```txt
gosakiAboutBandProfilesSectionComplete: true
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
**Upload target:** `/cms-kit-staging/gosaki-piano/` (include updated `about/index.html` + `_astro/`)

## 3. Operator next steps

1. Re-upload `public-dist/` contents to `/cms-kit-staging/gosaki-piano/`
2. Confirm `/about/` shows **Bands / Projects** with 5 band cards (placeholders until photos added)
3. Optional: add JPGs to `public/images/bands/` in Astro project, rebuild, repackage
4. Share updated About page with gosaki client if QA passes

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
