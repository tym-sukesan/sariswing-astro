Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7a-crawl-static-site-implementation (completed)
Latest completed phase: G-7a-crawl-static-site-implementation
Latest commit: cb5d517 — Plan G-7 URL-to-staging automation sprint for gosaki.
Recommended next phase: G-7b-url-to-staging-pipeline-orchestrator-implementation
```

---

## 3. Current state summary

G-7a crawl CLI ships `crawl-static-site.mjs` with dry-run (no network/writes), same-origin crawl, robots support, manifest output. Verified with mock fetch (30 tests). **No gosaki-piano.com or external crawl executed.**

Next: G-7b orchestrator connecting crawl → convert → build.

---

## 4. G-7a highlights

```txt
CLI: tools/static-to-astro/scripts/crawl-static-site.mjs
Verify: verify-crawl-static-site.mjs (30 passed)
Default max-pages: 20
Output: fixture root with index.html + manifest.json (gosaki-compatible flat .html paths)
Dry-run: no network, no file writes
```

---

## 5. Gate state

```txt
crawlStaticSiteImplementationComplete: true
readyForG7bUrlToStagingOrchestratorImplementation: true
urlToStagingAutomationSprintPlanningComplete: true
g6g3PriceSliceDeferred: true
externalCrawlExecutedInG7a: false
gosakiPianoCrawlExecuted: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/crawl-static-site-implementation.md
tools/static-to-astro/docs/url-to-staging-automation-sprint-planning.md
tools/static-to-astro/scripts/crawl-static-site.mjs
tools/static-to-astro/scripts/lib/static-site-crawler.mjs
tools/static-to-astro/docs/ai/00-current-state.md
```
