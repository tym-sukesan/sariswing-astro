Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7f-gosaki-staging-upload-execution (aborted — FTP hang, upload unconfirmed)
Latest completed phase: G-7e-gosaki-staging-preview-preparation
Next step: resolve FTP connectivity → re-preflight → new approval before retry
```

---

## 3. Current state summary

G-7f **aborted**: operator approved `--apply` once; `lftp` hung ~30+ min; FileZilla also failed. Upload success unconfirmed; staging QA not done. **No additional retries.** `.ftpaccess` not deleted.

Doc: `tools/static-to-astro/docs/gosaki-staging-upload-execution-result.md`

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
gosakiStagingUploadPreflightComplete: true
ftpPathAlignedWithDeployBase: true
gosakiStagingUploadAttemptedInG7f: true
ftpDeployExecutedInG7f: false
ftpDeployCompletedInG7f: false
readyForG7gGosakiBrowserQaAndClientReview: false
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
