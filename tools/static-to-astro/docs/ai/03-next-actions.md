Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-7a-crawl-static-site-implementation`

Crawl CLI implemented: `crawl-static-site.mjs` + lib modules + `verify-crawl-static-site.mjs` (30 passed). No external site crawl executed.

**Doc:** `tools/static-to-astro/docs/crawl-static-site-implementation.md`

**Recommended next phase:** `G-7b-url-to-staging-pipeline-orchestrator-implementation`

## 2. G-7 crawl CLI

```bash
# Dry-run (no network, no writes)
node tools/static-to-astro/scripts/crawl-static-site.mjs \
  --url https://www.gosaki-piano.com/ \
  --site-slug gosaki-piano \
  --dry-run

# Verify (mock only)
node tools/static-to-astro/scripts/verify-crawl-static-site.mjs
```

Live crawl requires operator approval. gosaki-piano.com **not crawled in G-7a**.

## 3. Pipeline status

| Step | CLI | Status |
| --- | --- | --- |
| URL → fixture | `crawl-static-site.mjs` | **DONE (G-7a)** |
| analyze | `analyze-static-site.mjs` | Exists |
| convert | `convert-static-to-astro.mjs` | Exists |
| build / static-public | existing | Exists |
| orchestrator | `url-to-staging-run.mjs` | **Next (G-7b)** |
| FTP deploy | `deploy-public-dist-ftp.mjs` | Exists (gated) |

## 4. G-6 Schedule CMS (paused)

G-6-g3 price slice deferred. G-6-g1/g2 execution succeeded.

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-7 planning | **DONE** (`cb5d517`) |
| G-7a crawl CLI | **DONE** |
| G-7b orchestrator | **Next** |
| G-7c site config bootstrap | Pending |
| G-7d gosaki pilot | Pending |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
