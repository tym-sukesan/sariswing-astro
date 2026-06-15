Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7d-gosaki-live-crawl-pilot (completed)
Latest completed phase: G-7d-gosaki-live-crawl-pilot
Recommended next phase: G-7e-gosaki-staging-preview-preparation
```

---

## 3. Current state summary

G-7d executed one live crawl of gosaki-piano.com (10 pages, max 20, robots OK). Fixture at `fixtures/gosaki-piano/`. Convert + build PASS. prepare-public FAIL due to Wix URL routes vs verifier expectations. **No FTP / workflow_dispatch / DB.**

Next: G-7e — fix static-public verifier, re-run prepare-public, FTP dry-run, browser QA.

---

## 4. G-7d highlights

```txt
Crawl: 10 pages, 0 assets, 0 failed
Fixture: fixtures/gosaki-piano/ (gitignored)
Convert: 10 Astro pages, build success
prepare-public: FAIL (schedule-2026-XX expected vs 2026-XX live routes)
Result doc: gosaki-live-crawl-pilot-result.md
```

---

## 5. Gate state

```txt
urlToStagingDryRunPilotComplete: true
gosakiLiveCrawlPilotComplete: true
gosakiPianoCrawlExecuted: true
externalCrawlExecutedInG7d: true
readyForG7eGosakiStagingPreviewPreparation: false
ftpDeployExecutedInG7d: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/gosaki-live-crawl-pilot-result.md
tools/static-to-astro/fixtures/gosaki-piano/manifest.json
tools/static-to-astro/docs/url-to-staging-dry-run-pilot-result.md
tools/static-to-astro/config/sites/gosaki-piano.url-to-staging.json
tools/static-to-astro/docs/ai/00-current-state.md
```
