Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7b-url-to-staging-pipeline-orchestrator-implementation (completed)
Latest completed phase: G-7b-url-to-staging-pipeline-orchestrator-implementation
Recommended next phase: G-7c-url-to-staging-dry-run-pilot
```

---

## 3. Current state summary

G-7b orchestrator connects crawl → analyze → convert → build → static-public with gated CLI (`url-to-staging-pipeline.mjs`). Default dry-run. Gosaki config sample at `config/sites/gosaki-piano.url-to-staging.json`. Verify: 29 passed. **No gosaki-piano.com or external crawl executed.**

Next: G-7c E2E dry-run pilot with local `fixtures/gosaki-static-site`.

---

## 4. G-7b highlights

```txt
CLI: tools/static-to-astro/scripts/url-to-staging-pipeline.mjs
npm: npm run url:staging
Config: config/sites/gosaki-piano.url-to-staging.json
Verify: verify-url-to-staging-pipeline.mjs (29 passed)
Gates: --run-crawl --run-convert --run-build --prepare-public --deploy-ftp (all default false)
Dry-run: default; manifest in output/runs/ (gitignored)
FTP / workflow_dispatch: never executed in G-7b
```

---

## 5. Gate state

```txt
crawlStaticSiteImplementationComplete: true
urlToStagingPipelineOrchestratorImplementationComplete: true
readyForG7cUrlToStagingDryRunPilot: true
urlToStagingAutomationSprintPlanningComplete: true
g6g3PriceSliceDeferred: true
externalCrawlExecutedInG7a: false
externalCrawlExecutedInG7b: false
gosakiPianoCrawlExecuted: false
ftpDeployExecutedInG7b: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/url-to-staging-pipeline-orchestrator-implementation.md
tools/static-to-astro/docs/crawl-static-site-implementation.md
tools/static-to-astro/docs/url-to-staging-automation-sprint-planning.md
tools/static-to-astro/scripts/url-to-staging-pipeline.mjs
tools/static-to-astro/config/sites/gosaki-piano.url-to-staging.json
tools/static-to-astro/docs/ai/00-current-state.md
```
