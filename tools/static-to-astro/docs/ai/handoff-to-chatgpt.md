Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7e-gosaki-staging-preview-preparation (completed)
Latest completed phase: G-7e-gosaki-staging-preview-preparation
Recommended next phase: G-7f-gosaki-staging-upload-execution
```

---

## 3. Current state summary

G-7e fixed canonical duplicate deployBase and Wix Nav Home production URLs on G-7d live crawl output. Re-convert/build/prepare-public without re-crawl. `safeForStaticFtp: true`, `stagingPreviewOk: true`. FTP upload plan created — **no FTP `--apply`**.

Next: G-7f — operator-approved staging FTP upload + browser QA.

---

## 4. G-7e highlights

```txt
Canonical: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/ (no duplicate path)
Nav Home: withBase('/') — no www.gosaki-piano.com in nav
prepare-public: PASS
safeForStaticFtp: true
stagingPreviewOk: true
Upload plan: output/deploy/gosaki-piano/staging-upload-plan.md (gitignored)
Re-crawl: NOT executed
FTP apply: NOT executed
```

---

## 5. Gate state

```txt
gosakiLiveCrawlPilotComplete: true
gosakiLiveRouteStaticPublicCompatibilityFixComplete: true
gosakiStagingPreviewPreparationComplete: true
readyForG7fGosakiStagingUploadExecution: true
readyForG7eGosakiStagingPreviewPreparation: true
ftpDeployExecutedInG7e: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/gosaki-staging-preview-preparation.md
tools/static-to-astro/docs/gosaki-live-route-static-public-compatibility-fix.md
tools/static-to-astro/scripts/lib/deploy-base.mjs
tools/static-to-astro/scripts/lib/path-transform.mjs
tools/static-to-astro/config/sites/gosaki-piano.url-to-staging.json
tools/static-to-astro/docs/ai/00-current-state.md
```
