Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7i2-gosaki-footer-layer-isolation-fix (complete — operator manual re-upload pending)
FTP auto-deploy: DISABLED
Manual package: output/manual-upload/gosaki-piano/ (gitignored, 14 files incl. _astro/index.BZ7Sffo0.css)
```

---

## 3. Current state summary

G-7h fixed CSS loading. G-7i fixed hero KV overlay, page-bg tint, MENU JS (`#SITE_HEADER`), nav fallback CSS. G-7i2 fixed footer `#bgLayers_SITE_FOOTER` painting over KV: without `#masterPage`, Wix `.uZIV9d { position:absolute; inset:0 }` on footer bg leaked to viewport — added footer/header `position:relative` + main `z-index:1` isolation in `wix-staging-visual-overrides.mjs`. Operator must re-upload `public-dist/` + `_astro/` for browser QA.

Doc: `tools/static-to-astro/docs/gosaki-footer-layer-isolation-fix.md`

---

## 4. G-7i2 gates

```txt
gosakiFooterLayerIsolationFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```

---

## 5. Do not

- FTP connect / upload / mirror / delete from automation
- `workflow_dispatch`
- Touch production or production Supabase
- Commit `output/` or secrets

---

## 6. Regenerate manual package

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```
