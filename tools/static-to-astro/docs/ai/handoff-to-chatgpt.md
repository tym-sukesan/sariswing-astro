Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-8a-gosaki-about-band-profiles-section (complete — operator manual re-upload pending)
Staging URL: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
FTP auto-deploy: DISABLED
```

---

## 3. Current state summary

G-8a added **Bands / Projects** section to gosaki About page: 5 band profiles from `config/sites/gosaki-piano-band-profiles.json`, rendered via `BandProfilesSection.astro` injected at convert time. Image placeholders when JPGs missing under `public/images/bands/`. Manual upload package regenerated; operator must re-upload for staging.

Doc: `tools/static-to-astro/docs/gosaki-about-band-profiles-section.md`

---

## 4. G-8a gates

```txt
gosakiAboutBandProfilesSectionComplete: true
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
