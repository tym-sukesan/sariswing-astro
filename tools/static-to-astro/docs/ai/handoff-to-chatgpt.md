Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7d1-gosaki-live-route-static-public-compatibility-fix (completed)
Latest completed phase: G-7d1-gosaki-live-route-static-public-compatibility-fix
Recommended next phase: G-7e-gosaki-staging-preview-preparation
```

---

## 3. Current state summary

G-7d live crawl (10 pages) + G-7d1 verifier fix complete. prepare-public PASS on existing G-7d output (`safeForStaticFtp: true`). Live crawl routes `2026-XX/` and manual fixture routes `schedule-2026-XX/` both accepted. **No re-crawl / FTP / workflow_dispatch / DB.**

Next: G-7e — FTP dry-run, browser QA, staging preview preparation.

---

## 4. G-7d1 highlights

```txt
Fix: static-public verifier route + SEO + optional _astro checks
Live routes: 2026-03 … 2026-07/index.html — OK
Manual routes: schedule-2026-XX/index.html — OK (regression)
prepare-public: PASS
safeForStaticFtp: true
Result doc: gosaki-live-route-static-public-compatibility-fix.md
Re-crawl: NOT executed
```

---

## 5. Gate state

```txt
urlToStagingDryRunPilotComplete: true
gosakiLiveCrawlPilotComplete: true
gosakiLiveRouteStaticPublicCompatibilityFixComplete: true
gosakiPianoCrawlExecuted: true
externalCrawlExecutedInG7d: true
readyForG7eGosakiStagingPreviewPreparation: true
ftpDeployExecutedInG7d: false
ftpDeployExecutedInG7d1: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/gosaki-live-route-static-public-compatibility-fix.md
tools/static-to-astro/docs/gosaki-live-crawl-pilot-result.md
tools/static-to-astro/scripts/lib/static-public-artifact-verifier.mjs
tools/static-to-astro/scripts/lib/deploy-base.mjs
tools/static-to-astro/config/sites/gosaki-piano.url-to-staging.json
tools/static-to-astro/docs/ai/00-current-state.md
```
