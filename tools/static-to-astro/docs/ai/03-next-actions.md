Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-7c-url-to-staging-dry-run-pilot`

Local fixture E2E: dry-run plan + convert/build/public PASS on `fixtures/gosaki-static-site`. No live crawl.

**Doc:** `tools/static-to-astro/docs/url-to-staging-dry-run-pilot-result.md`

**Recommended next phase:** `G-7d-gosaki-live-crawl-pilot` (operator approval required)

## 2. G-7c pilot commands

```bash
# Dry-run plan (pilot config)
npm run url:staging -- \
  --config config/sites/gosaki-piano.dry-run-pilot.json \
  --dry-run --run-convert --run-build --prepare-public \
  --pilot-phase G-7c-url-to-staging-dry-run-pilot

# Verify
npm run verify:url-staging
npm run verify:crawl
```

Live crawl / FTP require explicit gates + operator approval. gosaki-piano.com **not crawled in G-7c**.

## 3. Pipeline status

| Step | Status |
| --- | --- |
| crawl CLI (G-7a) | DONE |
| orchestrator (G-7b) | DONE |
| dry-run pilot (G-7c) | **DONE** |
| live crawl pilot (G-7d) | **Next** (operator approval) |
| FTP deploy | Manual / gated (unchanged) |

## 4. Fixture note

- **Existing fixture:** `fixtures/gosaki-static-site` (local, gitignored)
- **G-7b config target:** `fixtures/gosaki-piano` (empty — for future crawl)
- **Pilot config:** `config/sites/gosaki-piano.dry-run-pilot.json`

## 5. Gate state

```txt
readyForG7dGosakiLiveCrawlPilot: true
externalCrawlExecutedInG7c: false
```

## 6. G-6 Schedule CMS (paused)

G-6-g3 price slice deferred.

## 7. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
