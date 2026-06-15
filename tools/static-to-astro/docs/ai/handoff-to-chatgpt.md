Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7h-gosaki-staging-css-asset-fix (complete — operator manual re-upload pending)
FTP auto-deploy: DISABLED
Manual package: output/manual-upload/gosaki-piano/ (gitignored, 14 files incl. _astro CSS)
```

---

## 3. Current state summary

G-7g manual upload rendered HTML on staging but **CSS was missing**. G-7h fixed Wix inline head style ingestion into `global.css`; rebuilt package includes `_astro/index.*.css` (~416 KB). Operator must **re-upload** `public-dist/` contents (including `_astro/`) to `/cms-kit-staging/gosaki-piano/`.

Doc: `tools/static-to-astro/docs/gosaki-staging-css-asset-fix.md`

---

## 4. G-7h gates

```txt
gosakiStagingCssAssetFixComplete: true
readyForManualReuploadByOperator: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
readyForG7gGosakiBrowserQaAndClientReview: false
```

---

## 5. G-7f1 gates (unchanged)

```txt
ftpDeploySafetyHardeningComplete: true
ftpDeployApplyBlockedUntilSafetyPatch: true
deleteByDefaultDisabled: true
readyForAnyFutureFtpApply: false
ftpRootMirrorIncidentSuspected: true
```

---

## 6. G-7e highlights (unchanged)

```txt
Canonical: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/ (no duplicate path)
Nav Home: withBase('/') — no www.gosaki-piano.com in nav
prepare-public: PASS
safeForStaticFtp: true
cssPresenceOk: true (G-7h)
```

---

## 7. Do not

- FTP connect / upload / mirror / delete from automation
- `workflow_dispatch`
- Touch production or production Supabase
- Commit `output/` or secrets

---

## 8. Regenerate manual package

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```
