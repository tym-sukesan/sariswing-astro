Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-8e-gosaki-mobile-ui-final-polish (complete)
FTP auto-deploy: DISABLED
Wix baseline: scripts/lib/wix-static-export-baseline-overrides.mjs
Gosaki-specific CSS: scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs (G-8c–G-8e)
Header logo link: scripts/lib/header-transform.mjs
```

---

## 3. Current state summary

G-8e polished gosaki SP UI: sticky compact header, square hamburger (no MENU text), logo → home link, Home schedule 1-column overflow fix, unified ~20px gutter, Contact form centered. Baseline adds overflow-wrap on mobile rich text. Manual package regenerated; CSS `_astro/index.DRpT1Pny.css`. verify:url-staging 81 passed.

Docs: `gosaki-mobile-ui-final-polish.md`, `gosaki-mobile-visual-parity-fix.md`

---

## 4. G-8e gates

```txt
gosakiMobileUiFinalPolishComplete: true
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

## 6. Operator re-upload

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```

Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/` (include `_astro/index.DRpT1Pny.css`).
