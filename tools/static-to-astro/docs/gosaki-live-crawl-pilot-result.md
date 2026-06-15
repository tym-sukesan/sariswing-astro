# Gosaki live crawl pilot result (G-7d)

Last updated: 2026-06-15  
Phase: `G-7d-gosaki-live-crawl-pilot`  
Type: **live crawl + local pipeline** — one small crawl only; no FTP, no workflow_dispatch, no DB

## Purpose

First live crawl of [gosaki-piano.com](https://www.gosaki-piano.com/) with a small page cap, then local convert / build / static-public verification via the G-7b orchestrator.

**This phase did not:** FTP deploy, workflow_dispatch, Supabase SQL, DB write, or production/Sariswing changes.

---

## 1. Preflight (before crawl)

| # | Check | Result |
| --- | --- | --- |
| 1 | Working tree clean | ✅ (`git status` clean at start) |
| 2 | `fixtures/gosaki-piano/` gitignored | ✅ `.gitignore` line 3 |
| 3 | `output/` gitignored | ✅ `.gitignore` `output/*` |
| 4 | Config has no secrets | ✅ `gosaki-piano.url-to-staging.json` |
| 5 | deploy-ftp gate default false | ✅ not passed |
| 6 | workflow_dispatch not invoked | ✅ no code path |
| 7 | No DB / Supabase connection | ✅ crawl + convert only |
| 8 | maxPages ≤ 20 | ✅ `--max-pages 20` |
| 9 | respectRobots true | ✅ |
| 10 | sameOriginOnly true | ✅ |

---

## 2. Live crawl command (executed once)

```bash
cd tools/static-to-astro

npm run crawl:site -- \
  --url https://www.gosaki-piano.com/ \
  --site-slug gosaki-piano \
  --out fixtures/gosaki-piano \
  --max-pages 20 \
  --same-origin-only \
  --respect-robots \
  --concurrency 1 \
  --delay-ms 500
```

**Retries:** none (single run, exit 0)

---

## 3. Crawl result

| Field | Value |
| --- | --- |
| externalCrawlExecuted | **true** (standalone crawl CLI) |
| targetUrl | `https://www.gosaki-piano.com/` |
| maxPages | 20 |
| sameOriginOnly | true |
| respectRobots | true |
| concurrency | 1 |
| fixtureOut | `tools/static-to-astro/fixtures/gosaki-piano` |
| pagesCrawled | **10** |
| assetsFetched | **0** |
| failed | **0** |
| warnings | **0** |
| robots.txt | fetched OK (200) |
| manifest | `fixtures/gosaki-piano/manifest.json` |
| report | `fixtures/gosaki-piano/CRAWL_REPORT.md` |

### Sample pages (Wix URL shape)

| URL | Fixture file |
| --- | --- |
| `/` | `index.html` |
| `/about` | `about.html` |
| `/discography` | `discography.html` |
| `/contact` | `contact.html` |
| `/link` | `link.html` |
| `/2026-03` … `/2026-07` | `2026-03.html` … `2026-07.html` |

**Note:** Live Wix site uses `/2026-07` paths, not `schedule-2026-07.html` like the manual `gosaki-static-site` fixture. No separate `/schedule/` hub page was discovered within the 10-page crawl.

**Assets:** 0 same-origin assets saved — Wix serves CSS/JS/images from external CDN (`static.wixstatic.com` etc.); crawl correctly skipped cross-origin assets with `sameOriginOnly: true`.

---

## 4. Local pipeline (after crawl)

```bash
npm run url:staging -- \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --no-dry-run \
  --run-convert \
  --run-build \
  --prepare-public \
  --pilot-phase G-7d-gosaki-live-crawl-pilot
```

(`--run-crawl` **not** used — crawl already completed separately)

---

## 5. Convert / build / prepare-public

| Step | Result | Notes |
| --- | --- | --- |
| analyze-fixture | **PASS** | 10 HTML pages |
| convert-static-to-astro | **PASS** | 10 Astro pages (`/2026-03/` … not `/schedule-2026-03/`) |
| npm build (`--verify-build`) | **PASS** | sitemap: `sitemap-0.xml`, `sitemap-index.xml` |
| prepare-staging-public | **FAIL** | See issues below |
| deploy-ftp | **skipped** | gate false |

### prepare-public failure (orchestrator)

```
missing expected public HTML files
missing base-prefixed _astro path
staging SEO flags incomplete (expected noindex meta + robots Disallow: /)
```

**Root cause:** `verify-static-public-artifact.mjs` / `EXPECTED_PUBLIC_HTML` still assumes manual fixture routes (`schedule-2026-03/index.html`). Live crawl produces `2026-03/index.html`. Staging SEO checks also failed on Wix-heavy prerendered HTML in this run.

**Partial artifact:** `output/static-public/gosaki-piano/` was written but orchestrator marked step failed.

---

## 6. Summary table

```txt
externalCrawlExecuted: true
pagesCrawled: 10
assetsFetched: 0
failed: 0
convert: PASS (10 pages)
npm build: PASS
sitemap: PASS
prepare-public: FAIL
safeForStaticFtp: false (orchestrator gate)
```

---

## 7. Generated artifacts (do not commit)

| Path | Contents |
| --- | --- |
| `fixtures/gosaki-piano/` | Live crawl HTML + manifest (~6MB Wix HTML pages) |
| `output/gosaki-piano-astro/` | Generated Astro + `dist/` |
| `output/static-public/gosaki-piano/` | public-dist attempt + report |
| `output/runs/` | Pipeline + analysis manifests |

All gitignored.

---

## 8. Not executed

| Action | Status |
| --- | --- |
| FTP deploy | **Not executed** |
| workflow_dispatch | **Not executed** |
| DB write / Supabase SQL | **Not executed** |
| Production / Sariswing | **Not touched** |
| Second live crawl | **Not executed** |
| Secrets committed | **None** |

---

## 9. Issues / risks

| Issue | Impact | G-7e action |
| --- | --- | --- |
| Wix URL routes (`/2026-07` vs `schedule-2026-07`) | static-public verifier mismatch | Dynamic expected paths from manifest or crawl manifest |
| 0 same-origin assets | Missing CSS/images in fixture | Optional CDN asset policy (explicit approval) or Wix export strategy |
| Heavy Wix HTML / JSON blobs | Large pages, SEO check noise | Wix-specific cleanup or snapshot mode |
| No schedule hub page | No `/schedule/` index | Map month pages to schedule hub in convert |
| prepare-public FAIL | Blocks confident FTP gate | Fix verifier + re-run prepare-public |

---

## 10. G-7e staging preview — prerequisites

**Gate:** `readyForG7eGosakiStagingPreviewPreparation: false`

| Prerequisite | Status |
| --- | --- |
| Live crawl completed | ✅ |
| Convert PASS | ✅ |
| Build PASS | ✅ |
| prepare-public PASS | ❌ |
| Browser QA on staging URL | ⏳ |
| FTP dry-run + operator approval | ⏳ |
| Fix route/SEO verifier for live crawl | ⏳ |

---

## 11. Remaining work before gosaki-san staging preview

1. Fix `EXPECTED_PUBLIC_HTML` / SEO checks for live-crawl route shapes (`2026-XX` vs `schedule-2026-XX`).
2. Re-run `--prepare-public` until `safeForStaticFtp: true`.
3. Decide asset strategy for Wix CDN resources (stay external vs approved asset mirror).
4. FTP dry-run: `deploy-public-dist-ftp.mjs --dry-run` (staging only, separate approval).
5. Browser QA: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` — layout, noindex, robots, canonical.
6. Optional: visual diff vs production for operator review.

---

## Gate state after G-7d

```txt
gosakiLiveCrawlPilotComplete: true
gosakiPianoCrawlExecuted: true
externalCrawlExecutedInG7d: true
liveCrawlMaxPages: 20
readyForG7eGosakiStagingPreviewPreparation: false
ftpDeployExecutedInG7d: false
```
