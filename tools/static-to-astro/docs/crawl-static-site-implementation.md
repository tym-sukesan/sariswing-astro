# Crawl static site — implementation (G-7a)

**Phase:** `G-7a-crawl-static-site-implementation`  
**Prerequisites:** [url-to-staging-automation-sprint-planning.md](./url-to-staging-automation-sprint-planning.md)

## 1. Purpose

Implement a crawl CLI that fetches same-origin HTML pages and assets from a start URL into a local fixture directory compatible with `analyze-static-site.mjs` and `convert-static-to-astro.mjs`.

**Cursor did not crawl gosaki-piano.com or any external production site.**  
**Verification used mock fetch + temp directory only.**

## 2. Deliverables

| File | Role |
| --- | --- |
| `scripts/crawl-static-site.mjs` | CLI entry |
| `scripts/lib/static-site-crawler.mjs` | Crawl orchestration |
| `scripts/lib/static-site-crawler-url.mjs` | URL normalization |
| `scripts/lib/static-site-crawler-path.mjs` | URL → fixture path mapping |
| `scripts/lib/static-site-crawler-robots.mjs` | robots.txt (minimal) |
| `scripts/lib/static-site-crawler-extract.mjs` | Link/asset extraction (cheerio) |
| `scripts/verify-crawl-static-site.mjs` | Local tests (no network) |
| `package.json` | `crawl:site`, `verify:crawl` scripts; `cheerio` dependency |

## 3. CLI usage

From repository root:

```bash
node tools/static-to-astro/scripts/crawl-static-site.mjs --help
```

Dry-run (no writes, **no network** in G-7a dry-run mode):

```bash
node tools/static-to-astro/scripts/crawl-static-site.mjs \
  --url https://www.gosaki-piano.com/ \
  --site-slug gosaki-piano \
  --out tools/static-to-astro/fixtures/gosaki-piano \
  --max-pages 20 \
  --same-origin-only \
  --respect-robots \
  --dry-run
```

Live crawl (operator approval required — **not run in G-7a**):

```bash
node tools/static-to-astro/scripts/crawl-static-site.mjs \
  --url https://www.example.com/ \
  --site-slug example \
  --out tools/static-to-astro/output/crawl-fixtures/example \
  --max-pages 20
```

From `tools/static-to-astro/`:

```bash
npm run crawl:site -- --url https://www.example.com/ --site-slug example --dry-run
npm run verify:crawl
```

### Options

| Option | Default | Notes |
| --- | --- | --- |
| `--url` | (required) | Start URL |
| `--site-slug` | (required) | Manifest identifier |
| `--out` | `tools/static-to-astro/fixtures/{site-slug}` | Output directory |
| `--max-pages` | `20` | HTML page cap |
| `--same-origin-only` | `true` | Use `--no-same-origin-only` to disable |
| `--respect-robots` | `true` | Use `--no-respect-robots` to skip |
| `--dry-run` | `false` | Plan only; no fixture writes; no network |
| `--include` | — | Comma-separated URL patterns |
| `--exclude` | — | Comma-separated URL patterns |
| `--user-agent` | `static-to-astro-crawler/1.0 ...` | |
| `--timeout-ms` | `15000` | |
| `--concurrency` | `2` | |
| `--delay-ms` | `500` | Rate limit between requests |

## 4. Dry-run behavior

When `--dry-run` is set:

- No HTML/asset files written
- No network requests (including robots.txt)
- Prints markdown summary: startUrl, origin, outDir, maxPages, safety flags
- `wouldFetchFirstPage` documents the first URL that a live crawl would fetch
- `robots.skippedInDryRun: true` in manifest when `--respect-robots`

## 5. Output structure

Fixture root (compatible with existing pipeline — HTML at root, not under `pages/`):

```txt
{out}/
  manifest.json
  CRAWL_REPORT.md
  index.html
  about.html              # single-segment paths → flat .html (gosaki-style)
  schedule/2026-07/index.html   # multi-segment → directory + index.html
  css/style.css
  js/main.js
  images/...
```

### manifest.json schema

```json
{
  "siteSlug": "gosaki-piano",
  "startUrl": "https://www.gosaki-piano.com/",
  "origin": "https://www.gosaki-piano.com",
  "crawledAt": "ISO-8601",
  "dryRun": false,
  "options": { "maxPages": 20, "sameOriginOnly": true, "respectRobots": true },
  "pages": [
    {
      "url": "...",
      "relativePath": "index.html",
      "title": "...",
      "description": "...",
      "canonical": "...",
      "status": 200,
      "contentType": "text/html"
    }
  ],
  "assets": [
    {
      "url": "...",
      "relativePath": "css/style.css",
      "contentType": "text/css",
      "status": 200,
      "fromPage": "index.html"
    }
  ],
  "failed": [{ "url": "...", "phase": "fetch-page|fetch-asset|robots", "reason": "..." }],
  "warnings": [],
  "stats": { "pagesFetched": 0, "assetsFetched": 0, "pagesSkipped": 0, "assetsSkipped": 0 }
}
```

## 6. Crawl policy

- Same-origin HTML pages only (default)
- BFS queue with `maxPages` cap
- Assets: CSS, JS, images from same origin (cap: `maxPages * 10`)
- URL normalization: strip hash; strip query for page dedup
- robots.txt: minimal allow/disallow parser; fetch failure → **warn-allow** (live crawl only)
- Delay between requests (default 500ms)
- External links not followed

## 7. Safety rules

| Rule | G-7a |
| --- | --- |
| External production crawl | **Not executed** (gosaki-piano.com dry-run CLI only) |
| FTP / workflow_dispatch | No |
| DB / Supabase | No |
| Secrets commit | No |
| `output/` / crawl fixtures commit | No (gitignore) |
| `/admin` changes | No |

Recommend `--out tools/static-to-astro/output/crawl-fixtures/{slug}` for live crawls (under gitignored `output/`).

## 8. Verification

```bash
node tools/static-to-astro/scripts/verify-crawl-static-site.mjs
# 30 passed, 0 failed (mock fetch, temp dir)

npm run build
# success (repo root)
```

Tests cover: URL normalization, path mapping, link extraction, robots parser, dry-run, mock live crawl.

## 9. Next phase — G-7b orchestrator

Connect crawl output to existing pipeline:

```txt
crawl-static-site.mjs
  → analyze-static-site.mjs
  → convert-static-to-astro.mjs
  → verify-static-public-artifact.mjs
  → (optional) deploy-public-dist-ftp.mjs
```

Planned CLI: `url-to-staging-run.mjs` with `--dry-run` default and `--execute-local` gated steps.

## 10. Before gosaki pilot (G-7d)

- [ ] Operator approves live crawl of gosaki-piano.com
- [ ] Confirm robots.txt / rate limits with site owner
- [ ] Use `--max-pages` conservatively on first run
- [ ] Compare crawl fixture to existing `gosaki-static-site` prototype
- [ ] Run visual-diff after convert
- [ ] Staging deploy remains separate gated step (G-7e)

## 11. Gate state

```txt
crawlStaticSiteImplementationComplete: true
readyForG7bUrlToStagingOrchestratorImplementation: true
externalCrawlExecutedInG7a: false
gosakiPianoCrawlExecuted: false
```

## 12. Related docs

- [url-to-staging-automation-sprint-planning.md](./url-to-staging-automation-sprint-planning.md)
- [README.md](../README.md) — Phase 2-E gosaki fixture workflow
- [gosaki-staging-runbook.md](./gosaki-staging-runbook.md)
