# URL-to-staging dry-run pilot result (G-7c)

Last updated: 2026-06-15  
Phase: `G-7c-url-to-staging-dry-run-pilot`  
Type: **pilot execution record** — local fixture E2E; no live crawl, no FTP, no workflow_dispatch

## Purpose

Validate the G-7b orchestrator against the existing gosaki local fixture through dry-run planning and gated local execution:

```txt
fixtures/gosaki-static-site
→ orchestrator (no crawl)
→ convert-static-to-astro
→ build
→ prepare static-public
→ run manifest
```

**This phase did not:** crawl gosaki-piano.com, FTP deploy, workflow_dispatch, Supabase SQL, or production changes.

---

## 1. Existing gosaki fixture audit

| Item | Finding |
| --- | --- |
| **Location** | `tools/static-to-astro/fixtures/gosaki-static-site/` (gitignored local copy) |
| **G-7b config `fixtureOut`** | `fixtures/gosaki-piano` — **does not exist** (reserved for future live crawl output) |
| **G-7c pilot config** | `config/sites/gosaki-piano.dry-run-pilot.json` → `fixtures/gosaki-static-site` |
| **Legacy site config** | `gosaki.site-config.example.json` → `fixtures/gosaki-static-site` (consistent) |
| **Structure** | Flat `.html` at fixture root: `index.html`, `about.html`, `contact.html`, `discography.html`, `link.html`, `schedule-2026-03.html` … `schedule-2026-07.html` |
| **Assets** | `css/style.css`, `assets/` — relative paths; convert/build succeeded |
| **Pipeline compatibility** | Matches static-to-astro analyzer + convert expectations (10 HTML → 11 Astro pages incl. schedule hub) |

---

## 2. Commands executed

### Dry-run (plan only)

```bash
cd tools/static-to-astro

# Base G-7b config — fixture path missing, crawl skipped
npm run url:staging -- \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --dry-run \
  --pilot-phase G-7c-url-to-staging-dry-run-pilot

# Pilot config — convert/build/public planned, crawl skipped
npm run url:staging -- \
  --config config/sites/gosaki-piano.dry-run-pilot.json \
  --dry-run \
  --run-convert --run-build --prepare-public \
  --pilot-phase G-7c-url-to-staging-dry-run-pilot
```

### Local gated execution (no crawl, no FTP)

```bash
# Convert + verify-build (local fixture only; npm registry for Astro deps)
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-static-site output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician \
  --verify-build

# Orchestrator E2E (convert + build via gates)
npm run url:staging -- \
  --config config/sites/gosaki-piano.dry-run-pilot.json \
  --no-dry-run --run-convert --run-build \
  --pilot-phase G-7c-url-to-staging-dry-run-pilot

# Static-public artifact (orchestrator --prepare-public)
npm run url:staging -- \
  --config config/sites/gosaki-piano.dry-run-pilot.json \
  --no-dry-run --prepare-public \
  --pilot-phase G-7c-url-to-staging-dry-run-pilot
```

### Verification

```bash
npm run verify:url-staging   # 29 passed
npm run verify:crawl           # 30 passed
npm run build                  # repo root Astro build — success
```

---

## 3. Not executed

| Action | Status |
| --- | --- |
| gosaki-piano.com live crawl | **Not executed** |
| External site crawl | **Not executed** |
| FTP deploy | **Not executed** |
| GitHub workflow_dispatch | **Not executed** |
| DB write / Supabase SQL | **Not executed** |
| Production / Sariswing | **Not touched** |
| Secrets added / committed | **None** |
| `output/` / generated fixture committed | **None** |

---

## 4. Command plan results (dry-run)

With pilot config + gates (`--dry-run --run-convert --run-build --prepare-public`):

| Step | Status |
| --- | --- |
| validate-config | executed (dry-run) |
| crawl-fixture | **skipped** (`runCrawl=false`) |
| analyze-fixture | planned |
| convert-static-to-astro | planned |
| build-check | planned |
| prepare-staging-public | planned |
| deploy-ftp | **skipped** (plan-only; never executes) |
| workflow_dispatch | **unsupported / false** |

Safety flags in manifest:

```json
{
  "externalCrawl": false,
  "ftpDeploy": false,
  "workflowDispatch": false,
  "dbWrite": false,
  "productionTouched": false,
  "outputCommitRequired": false,
  "secretsRequired": false
}
```

---

## 5. Local fixture convert / build results

| Step | Result |
| --- | --- |
| convert-static-to-astro | **PASS** — 11 Astro pages generated |
| `npm run build` (`--verify-build`) | **PASS** — `dist/schedule/index.html`, sitemap XML present |
| prepare-staging-public | **PASS** — `safeForStaticFtp: true`, 15 files copied to `output/static-public/gosaki-piano/public-dist/` |

Sample manifest: `output/runs/20260615T022659Z-gosaki-piano.json` (gitignored)

---

## 6. Generated artifacts (gitignored — do not commit)

| Path | Purpose |
| --- | --- |
| `output/gosaki-piano-astro/` | Generated Astro project + `dist/` |
| `output/static-public/gosaki-piano/` | Static FTP-ready `public-dist/` + manifest |
| `output/runs/*.json` | Run manifests |
| `output/runs/gosaki-piano-analysis.json` | Analyze JSON report |

All under `tools/static-to-astro/output/*` per `.gitignore`.

---

## 7. Fixes applied during G-7c pilot

| Fix | Reason |
| --- | --- |
| cheerio resolve via `TOOL_ROOT` (not repo root) in analyzer / header / path / schedule-seed modules | Local convert failed without `tools/static-to-astro/node_modules/cheerio` |
| `copyPublicStagingLibs()` in astro-generator (`resolve-public-seo.ts`, `with-base.ts`) | Staging subdirectory build failed on missing `src/lib/*` |
| orchestrator `prepare-public` uses `manifestOutDir: staticPublicOut`, not `publicDirCli` | Was pointing at copy destination instead of `dist/` |
| `--pilot-phase` + G-7c manifest fields + `readyForG7dGosakiLiveCrawlPilot` | Pilot traceability |
| `config/sites/gosaki-piano.dry-run-pilot.json` | Maps pilot to existing `gosaki-static-site` fixture |

---

## 8. Staging SEO / deploy-base

Verified via static-public manifest:

- `deployBase`: `/cms-kit-staging/gosaki-piano/`
- `stagingSubdirBuild`: true
- `stagingNoindex` / `robotsDisallowAll`: checked in artifact verifier
- `canonicalMode`: staging-url (via `resolve-public-seo.ts`)
- Production canonical leak: not detected in public-dist scan

Open items (non-blocking for G-7d crawl):

- 49 SEO field gaps noted in `CONVERSION_REPORT.md` (legacy HTML metadata)
- Browser QA on staging URL still required before FTP

---

## 9. G-7d live crawl pilot — prerequisites

**Gate:** `readyForG7dGosakiLiveCrawlPilot: true`

| Prerequisite | Status |
| --- | --- |
| G-7c dry-run plan PASS | ✅ |
| Local fixture convert/build PASS | ✅ |
| Static-public artifact PASS | ✅ |
| Output artifacts gitignored | ✅ |
| deploy-base / noindex / robots policy documented | ✅ |
| Operator explicit approval required | ⏳ (before G-7d) |

**Recommended G-7d first live crawl settings:**

```txt
--run-crawl --no-dry-run
--max-pages 20          (pilot; config default 80)
--respect-robots true
concurrency: 2 (crawl default)
delay-ms: 500 (crawl default)
fixtureOut: fixtures/gosaki-piano  (fresh crawl output; separate from gosaki-static-site)
operator approval: required
```

**Still manual in G-7d:** FTP deploy, workflow_dispatch, Supabase seed/admin.

---

## 10. Risks and open items

| Risk | Mitigation |
| --- | --- |
| `fixtureOut` naming mismatch (`gosaki-piano` vs `gosaki-static-site`) | Use pilot config or `--fixture-out` until G-7d crawl populates `fixtures/gosaki-piano` |
| npm registry access during build | Expected for Astro deps; not production site access |
| Other lib modules still use repo-root cheerio | Fix if encountered; convert chain fixed for gosaki |
| Live crawl politeness / robots | G-7d: low max-pages, respect-robots, operator approval |
| FTP still separate gated CLI | Do not wire auto-FTP in orchestrator |

---

## Gate state after G-7c

```txt
urlToStagingDryRunPilotComplete: true
readyForG7dGosakiLiveCrawlPilot: true
externalCrawlExecutedInG7c: false
gosakiPianoCrawlExecuted: false
ftpDeployExecutedInG7c: false
```
