Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-7i2-gosaki-footer-layer-isolation-fix` (complete — **operator manual re-upload pending**)

**Doc:** `tools/static-to-astro/docs/gosaki-footer-layer-isolation-fix.md`

**FTP auto-deploy:** still disabled. Use regenerated manual upload package.

### Gates

```txt
gosakiFooterLayerIsolationFixComplete: true
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
**Upload target:** `/cms-kit-staging/gosaki-piano/` (contents of `public-dist/` only, **include `_astro/`** — CSS hash `index.BZ7Sffo0.css`)

## 3. Operator next steps

1. Re-upload `public-dist/` contents (including `_astro/`) to `/cms-kit-staging/gosaki-piano/`
2. Hard refresh; confirm new `_astro/index.BZ7Sffo0.css` loads (200)
3. Browser QA: KV without footer/semi-transparent overlay; footer bg still at bottom; desktop nav; mobile MENU
4. Share staging URL with gosaki client preview if visual QA passes
5. No mirror/delete sync

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
