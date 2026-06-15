Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-7b-url-to-staging-pipeline-orchestrator-implementation`

Orchestrator CLI: `url-to-staging-pipeline.mjs` + config loader + gosaki config sample + verify (29 passed). No external crawl, no FTP.

**Doc:** `tools/static-to-astro/docs/url-to-staging-pipeline-orchestrator-implementation.md`

**Recommended next phase:** `G-7c-url-to-staging-dry-run-pilot`

## 2. G-7 orchestrator CLI

```bash
# Dry-run with gosaki config (default safe)
npm run url:staging -- \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --dry-run

# Verify (mock/local only)
npm run verify:url-staging
node tools/static-to-astro/scripts/verify-crawl-static-site.mjs
```

Live crawl / FTP require explicit gates + operator approval. gosaki-piano.com **not crawled in G-7b**.

## 3. Pipeline status

| Step | CLI | Status |
| --- | --- | --- |
| URL → fixture | `crawl-static-site.mjs` | DONE (G-7a) |
| orchestrator | `url-to-staging-pipeline.mjs` | **DONE (G-7b)** |
| analyze | `analyze-static-site.mjs` | Exists (wired in orchestrator) |
| convert | `convert-static-to-astro.mjs` | Exists (wired in orchestrator) |
| build / static-public | existing | Exists (gated in orchestrator) |
| FTP deploy | `deploy-public-dist-ftp.mjs` | Exists (plan-only in G-7b) |

## 4. G-6 Schedule CMS (paused)

G-6-g3 price slice deferred. G-6-g1/g2 execution succeeded.

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-7 planning | DONE |
| G-7a crawl CLI | DONE |
| G-7b orchestrator | **DONE** |
| G-7c dry-run pilot (local fixture E2E) | **Next** |
| G-7d gosaki live crawl pilot | Pending |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
