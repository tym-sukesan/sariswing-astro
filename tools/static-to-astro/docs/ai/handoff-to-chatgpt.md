Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-8b-gosaki-mobile-responsive-preview-fix (complete — operator manual re-upload pending)
Staging URL: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
FTP auto-deploy: DISABLED
CSS: _astro/index.DFhgPQ9c.css (G-8b mobile overrides)
```

---

## 3. Current state summary

G-8b fixed gosaki staging mobile layout: Wix sections had `min-width:980px` + desktop mesh grid offsets without Thunderbolt mobile runtime. Added G-8b responsive overrides in `wix-staging-visual-overrides.mjs` (mesh → flex column, section min-width reset, About/Contact mobile rules) + BandProfiles mobile polish. Manual package regenerated; operator must re-upload including new CSS hash.

Doc: `tools/static-to-astro/docs/gosaki-mobile-responsive-preview-fix.md`

---

## 4. G-8b gates

```txt
gosakiMobileResponsivePreviewFixComplete: true
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
