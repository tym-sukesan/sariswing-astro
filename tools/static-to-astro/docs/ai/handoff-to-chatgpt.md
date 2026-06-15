Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7i-gosaki-staging-visual-polish-and-wix-css-behavior-fix (complete — operator manual re-upload pending)
FTP auto-deploy: DISABLED
Manual package: output/manual-upload/gosaki-piano/ (gitignored, 14 files incl. _astro CSS)
```

---

## 3. Current state summary

G-7h fixed CSS loading. G-7i fixed Wix static-export visual issues: hero KV overlay, page-bg tint, broken MENU JS (`.site-header` → `#SITE_HEADER`), nav fallback CSS. Operator must re-upload `public-dist/` + `_astro/` for client preview QA.

Doc: `tools/static-to-astro/docs/gosaki-staging-visual-polish-and-wix-css-behavior-fix.md`

---

## 4. G-7i gates

```txt
gosakiStagingVisualPolishComplete: true
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
