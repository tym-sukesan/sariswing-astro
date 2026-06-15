Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7c-url-to-staging-dry-run-pilot (completed)
Latest completed phase: G-7c-url-to-staging-dry-run-pilot
Recommended next phase: G-7d-gosaki-live-crawl-pilot
```

---

## 3. Current state summary

G-7c validated orchestrator dry-run plan and local fixture E2E on `fixtures/gosaki-static-site` via `gosaki-piano.dry-run-pilot.json`. Convert, build, and static-public artifact PASS. **No gosaki-piano.com or external crawl executed.**

Next: G-7d live crawl with operator approval (recommended max-pages: 20 first run).

---

## 4. G-7c highlights

```txt
Pilot config: config/sites/gosaki-piano.dry-run-pilot.json
Fixture: fixtures/gosaki-static-site (existing local HTML)
Result doc: url-to-staging-dry-run-pilot-result.md
Local E2E: convert + build + static-public PASS
Manifest: output/runs/<timestamp>-gosaki-piano.json (gitignored)
```

---

## 5. Gate state

```txt
urlToStagingPipelineOrchestratorImplementationComplete: true
urlToStagingDryRunPilotComplete: true
readyForG7dGosakiLiveCrawlPilot: true
externalCrawlExecutedInG7a: false
externalCrawlExecutedInG7b: false
externalCrawlExecutedInG7c: false
gosakiPianoCrawlExecuted: false
ftpDeployExecutedInG7c: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/url-to-staging-dry-run-pilot-result.md
tools/static-to-astro/docs/url-to-staging-pipeline-orchestrator-implementation.md
tools/static-to-astro/config/sites/gosaki-piano.dry-run-pilot.json
tools/static-to-astro/scripts/url-to-staging-pipeline.mjs
tools/static-to-astro/docs/ai/00-current-state.md
```
