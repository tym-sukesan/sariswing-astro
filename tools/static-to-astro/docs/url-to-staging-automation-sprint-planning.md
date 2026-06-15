# URL → Staging automation sprint planning (G-7)

Last updated: 2026-06-15  
Phase: `G-7-url-to-staging-automation-sprint-planning`  
Type: **planning only** — no crawl execution, no DB write, no FTP deploy, no GitHub workflow_dispatch

## Purpose

Shift short-term product focus from G-6 Schedule CMS slice work (G-6-g3 price deferred) to a **semi-automatic tool** that lets the operator (戸山) build a staging site on their own server from an existing site URL.

**First real customer:** [gosaki-piano.com](https://www.gosaki-piano.com) — second Sariswing-style CMS Kit case after Sariswing.com.

**Not a goal:** fully automated SaaS. Operator-in-the-loop semi-automation is acceptable.

**This phase performed:** inventory, gap analysis, gosaki shortest path, MVP scope, safety design, implementation phase split, AI context updates.  
**This phase did not:** URL crawl, Astro generation, Supabase, Storage upload, FTP deploy, production DNS cutover, secrets commit.

---

## 1. Target flow (operator view)

```txt
URL input
  ↓
crawl / static HTML fetch          ← GAP: no dedicated CLI yet
  ↓
fixtures/{siteSlug}-static-site/   ← gosaki: manual copy today
  ↓
analyze + convert → Astro          ← EXISTS
  ↓
assets / CSS / JS / images         ← EXISTS (convert + public copy)
  ↓
baseUrl / sitemap / robots / noindex ← EXISTS (--base-url, --deploy-base)
  ↓
npm run build                      ← EXISTS (--verify-build)
  ↓
static-public artifact             ← EXISTS (verify-static-public-artifact)
  ↓
FTP upload prep / semi-auto deploy ← EXISTS (deploy-public-dist-ftp, gated)
  ↓
staging URL QA                     ← gosaki proven: yskcreate.weblike.jp/cms-kit-staging/gosaki/
```

---

## 2. What static-to-astro already does

### 2.1 Static HTML → Astro (proven on gosaki)

| Capability | CLI / module | Status |
| --- | --- | --- |
| HTML structure analysis | `analyze-static-site.mjs` | Done |
| Astro scaffold generation | `convert-static-to-astro.mjs` | Done |
| BaseLayout / nav / SEO / OGP | `lib/astro-generator.mjs`, header transforms | Done |
| `--base-url` → `site`, robots, sitemap | convert + `@astrojs/sitemap` | Done |
| `--deploy-base` → staging subdir build | `lib/deploy-base.mjs`, `lib/seo-publish.mjs` | Done |
| Build verification | `--verify-build` on convert | Done |
| Visual diff QA | `visual-diff.mjs` + intentional diffs config | Done |
| Site profile modules | `--site-profile musician` | Done |

### 2.2 CMS Kit planning / config (read-only layers)

| Capability | CLI / doc | Status |
| --- | --- | --- |
| Site config JSON | `config/sites/gosaki.site-config.example.json` | Done |
| Staging generation plan | `plan-staging-generation.mjs` (G-5f) | Done |
| Dry-run generation package | `generate-site-dry-run.mjs` (G-5g) | Done |
| Template / schema registry | `inspect-cms-template.mjs`, `inspect-schema-adapter.mjs` | Done |
| Onboarding runbook | `cms-kit-onboarding-runbook.md` | Done |

### 2.3 CMS data path (optional — deferrable for MVP)

| Capability | CLI | Status |
| --- | --- | --- |
| CMS candidate analysis | `analyze-cms-candidates.mjs` | Done |
| Schedule / discography seed extract | `extract-schedule-seed.mjs`, `extract-discography-seed.mjs` | Done |
| Supabase seed JSON | `generate-supabase-seed.mjs` | Done |
| Seed insert / export JSON | `insert-supabase-seed.mjs`, `export-supabase-json.mjs` | Done |
| Storage review / upload / DB update | G-4a〜g scripts | Done (gosaki proven) |
| Admin CMS template | `templates/admin-cms/` | Done |
| Staging admin shell (Sariswing repo) | `/__admin-staging-shell/` (G-6 work) | In progress |

### 2.4 Staging deploy (Lolipop — proven on gosaki)

| Capability | CLI / doc | Status |
| --- | --- | --- |
| Admin-excluded static artifact | `verify-static-public-artifact.mjs` | Done |
| FTP mirror deploy (contents-only) | `deploy-public-dist-ftp.mjs` | Done |
| Staging FTP safety gates | `verify-staging-ftp-safety.mjs`, `verify-staging-ftp-deploy-plan.mjs` | Done |
| Gosaki staging runbook | `gosaki-staging-runbook.md` | Done |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki/` | Proven |

### 2.5 What is explicitly **not** automated today

| Step | Current state |
| --- | --- |
| **URL → static HTML fetch** | Manual: copy from `tools/site-audit/`, wget, or browser save |
| **Single-command URL → staging** | No orchestrator CLI |
| **Site config from URL** | Manual JSON authoring |
| **Crawl quality report** | None |

`staging-generation-planner.mjs` step 1 (`crawl-static-export`) lists `cli: null` — **by design, not implemented**.

---

## 3. Gaps for URL → staging

| # | Gap | Impact | MVP priority |
| --- | --- | --- | --- |
| G1 | **Crawl / mirror CLI** from production URL | Blocks "URL input" start | **P0** |
| G2 | **Orchestrator** chaining crawl → convert → build → artifact | Operator runs 6+ commands manually | **P0** |
| G3 | **Site config bootstrap** from URL + slug + staging paths | Manual `gosaki.site-config.example.json` copy | **P1** |
| G4 | **Crawl manifest + link rewrite report** | Broken assets after fetch | **P1** |
| G5 | **Unified operator entrypoint** (`url-to-staging-run.mjs`) | UX friction | **P1** |
| G6 | FTP deploy in orchestrator (default off) | Separate manual step today | **P2** (reuse existing CLI) |
| G7 | Supabase / seed / admin in pipeline | Not needed for static staging MVP | **Defer** |
| G8 | Production DNS / domain cutover automation | Out of scope | **Never in G-7** |

---

## 4. gosaki-piano.com — shortest route

### 4.1 Known facts

| Item | Value |
| --- | --- |
| Production URL | `https://www.gosaki-piano.com` |
| Site slug | `gosaki` |
| Site type | `musician` / template `musician-basic` |
| Existing fixture path | `fixtures/gosaki-static-site/` (`.gitignore`, manual populate) |
| Legacy fixture source | `tools/site-audit/prototype-static-gosaki-v4/` (if present locally) |
| Staging URL (proven) | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki/` |
| Staging deploy base | `/cms-kit-staging/gosaki/` |
| Site config | `config/sites/gosaki.site-config.example.json` |
| Staging runbook | `docs/gosaki-staging-runbook.md` |

### 4.2 Route A — Fastest (fixture already on disk)

Use when `fixtures/gosaki-static-site/` already exists. **No new crawl code required.**

```bash
# From repo root — see gosaki-staging-runbook.md for full pipeline
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://yskcreate.weblike.jp \
  --deploy-base /cms-kit-staging/gosaki/ \
  --site-profile musician \
  --verify-build

# Then: export-supabase-json (if CMS data exists) → verify-static-public-artifact
# FTP: deploy-public-dist-ftp.mjs --apply (explicit approval only)
```

**Time:** ~1 operator session if fixture + `.env.local` FTP secrets exist.

### 4.3 Route B — Goal path (URL input → fresh crawl)

Use when production HTML must be re-fetched or fixture is stale.

```txt
1. crawl-static-site.mjs --url https://www.gosaki-piano.com --out fixtures/gosaki-static-site  (G-7a — NEW)
2. analyze-static-site.mjs (existing)
3. convert-static-to-astro.mjs --base-url STAGING_HOST --deploy-base /cms-kit-staging/gosaki/ (existing)
4. npm run build / verify-static-public-artifact (existing)
5. deploy-public-dist-ftp.mjs (existing, --apply gated)
6. QA on staging URL
```

**Recommendation:** Implement G-7a crawl first, then validate Route B on gosaki before generalizing.

### 4.4 Route comparison

| | Route A (fixture) | Route B (URL crawl) |
| --- | --- | --- |
| Crawl CLI needed | No | Yes (G-7a) |
| Matches "URL input" goal | Partial | Full |
| Risk to production | Read-only crawl only | Read-only crawl only |
| gosaki as 2nd case | Immediate pilot | After G-7a |

---

## 5. Semi-auto MVP scope (2–3 days)

### Day 1 — G-7a: Crawl CLI

**Deliverable:** `scripts/crawl-static-site.mjs` + `lib/static-site-crawler.mjs`

| In scope | Out of scope |
| --- | --- |
| Fetch HTML from seed URL + same-origin links | JavaScript SPA rendering (Playwright crawl) |
| Save to `fixtures/{siteSlug}-static-site/` | Wix authenticated / member-only pages |
| Download linked CSS / JS / images (same host) | Cross-origin CDN asset rewrite (report only) |
| Crawl manifest JSON + `CRAWL_REPORT.md` | Infinite crawl / sitemap discovery beyond N pages |
| `--max-pages`, `--dry-run`, `--allow-host` safety | Auto-commit fixture to git |

**Default:** dry-run lists URLs to fetch; `--write` creates fixture locally.

**gosaki acceptance:** crawl produces fixture with routes `/`, `/about/`, `/schedule/`, `/schedule-2026-07/`, `/contact/`, `/link/` (or documented subset).

### Day 2 — G-7b: Pipeline orchestrator

**Deliverable:** `scripts/url-to-staging-run.mjs` + `lib/url-to-staging-pipeline.mjs`

```bash
node tools/static-to-astro/scripts/url-to-staging-run.mjs \
  --url https://www.gosaki-piano.com \
  --site-slug gosaki \
  --site-profile musician \
  --staging-base-url https://yskcreate.weblike.jp \
  --deploy-base /cms-kit-staging/gosaki/ \
  --dry-run
```

| Step | Action | Default |
| --- | --- | --- |
| 1 | crawl (or skip if `--fixture-dir` provided) | dry-run |
| 2 | analyze-static-site | dry-run |
| 3 | convert-static-to-astro | dry-run |
| 4 | verify-build | optional flag |
| 5 | verify-static-public-artifact | dry-run |
| 6 | FTP deploy | **never** without `--deploy-apply` + safety verifiers |

**Output:** `output/url-to-staging/{siteSlug}/PIPELINE_REPORT.md` + manifest JSON.

### Day 3 — G-7c: Site config bootstrap + gosaki pilot prep

**Deliverable:** `scripts/init-site-config-from-url.mjs` (or inline in orchestrator)

| In scope | Out of scope |
| --- | --- |
| Generate `config/sites/{slug}.site-config.json` from URL + staging paths | Supabase project creation |
| Wire `plan-staging-generation.mjs` after config | Seed insert / RLS |
| Operator checklist for first gosaki URL→staging pilot | Auto FTP without human confirm |
| Documented rollback (delete remote dir / restore previous artifact hash) | Production deploy |

### MVP explicit exclusions

- Supabase seed insert / export loop
- Storage image migration (G-4)
- Admin CMS / staging shell write paths (G-6)
- GitHub Actions workflow generation
- Customer self-service UI
- Production `gosaki-piano.com` DNS or content switch

---

## 6. CMS connection — defer safely

### Safe to defer for staging MVP

| Layer | Defer? | Staging without CMS |
| --- | --- | --- |
| Supabase project / tables | Yes | Static HTML content from crawl |
| Seed extractors | Yes | Schedule pages stay static HTML |
| `export-supabase-json` | Yes | No JSON data dir needed |
| Admin `/admin` or staging shell writes | Yes | No admin on staging artifact |
| Storage upload | Yes | Use crawled local images in `public/` |
| RLS / auth bootstrap | Yes | Public static site only |

### Minimum to ship "staging site preview"

```txt
crawl → convert → build → static-public → FTP → browser QA
```

Content updates on staging = re-run pipeline (acceptable for MVP).

### When to add CMS (post-MVP)

After staging visual QA passes:

1. `analyze-cms-candidates.mjs` on fixture
2. Seed extract → `generate-supabase-seed.mjs`
3. Staging Supabase insert (dry-run default)
4. `export-supabase-json` → rebuild
5. Admin template optional on staging subpath (separate from public-dist)

---

## 7. Design rules for later Sariswing-type CMS hookup

Preserve these in **staging generation** so CMS can attach without rework:

| Rule | Rationale |
| --- | --- |
| **`siteSlug` + `site-config.json` per customer** | Paths, FTP prefix, Supabase adapter ID |
| **`musician-basic` template + `musician-basic-supabase-v1` adapter** | gosaki-proven schema |
| **Content in JSON / Supabase, not hardcoded in `.astro`** | convert generates data-driven stubs where profile says so |
| **`legacy_id` on schedule / discography rows** | Stable CMS keys across re-crawls |
| **`deploy-base` subdirectory builds** | Staging coexists with production on same Lolipop account |
| **`public-dist` excludes `/admin` and API routes** | FTP mirror is safe public surface |
| **`output/` never committed** | Per-site artifacts stay local |
| **Crawl fixture retained** | Diff against new crawl when customer edits production |
| **Schedule month routes as data-driven pattern** | Already in gosaki convert profile |
| **Image fields map to Storage pathPrefix `{siteSlug}/`** | G-4 pipeline reuses config |

### Anti-patterns to avoid in G-7

- Hardcoding gosaki URLs in generic crawler (use `--url` + site config)
- Baking Supabase keys into generated Astro (env at build time only)
- Skipping `--deploy-base` on staging (production canonical leak risk)
- Committing crawled fixtures with customer PII (keep gitignored)
- Coupling crawl to FTP in one unguarded `--apply` flag

---

## 8. Staging on Lolipop (operator server)

### Proven pattern (gosaki G-2b / G-3)

| Setting | Value |
| --- | --- |
| Host | `yskcreate.weblike.jp` (戸山 Lolipop) |
| FTP server | `ftp.lolipop.jp` (plain FTP — FTPS cert issues documented) |
| Remote dir | `/cms-kit-staging/{siteSlug}/` |
| Mirror mode | **contents-only** — upload `public-dist/*` contents, not the folder itself |
| Local secrets | `tools/static-to-astro/.env.local` — `{SLUG}_STAGING_FTP_*` prefix |

### Deploy command chain (existing — not auto-run in G-7 planning)

```bash
# Safety first (dry-run)
node tools/static-to-astro/scripts/verify-staging-ftp-safety.mjs --report ...
node tools/static-to-astro/scripts/verify-staging-ftp-deploy-plan.mjs --report ...

# Apply only after operator approval
node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
  --site-slug gosaki \
  --apply
```

### New site on same server

```txt
/cms-kit-staging/gosaki/     ← existing
/cms-kit-staging/{newSlug}/ ← add per customer; no production path overlap
```

### Rollback deploy

- Keep previous `public-dist` tarball or manifest hash in `output/deploy/{slug}/`
- Re-upload previous artifact via FTP (manual) — documented in pipeline report
- Remote delete of wrong upload: operator-only, never scripted without approval

---

## 9. SEO / staging isolation

### Required on every staging build

| Control | Mechanism | gosaki staging |
| --- | --- | --- |
| **noindex** | `<meta name="robots" content="noindex,nofollow,noarchive">` | Enabled via `--deploy-base` |
| **robots.txt** | `Disallow: /` in staging artifact | Enabled |
| **canonical** | `canonicalMode: staging-url` — no production URL leak | Staging host + deploy-base path |
| **og:url** | Same as canonical staging URL | Must not point to gosaki-piano.com |
| **sitemap** | Generated for staging base path only | `@astrojs/sitemap` with `site` = staging host |
| **baseUrl** | `https://yskcreate.weblike.jp` (not www.gosaki-piano.com) | `--base-url` at convert |
| **asset paths** | Prefix `/cms-kit-staging/gosaki/` in built HTML | `--deploy-base` |

### Production URL handling

| Field | Staging value | Notes |
| --- | --- | --- |
| `site` (astro.config) | Staging host | Build-time |
| `seo.productionBaseUrl` in site config | `https://www.gosaki-piano.com` | Reference only; not in canonical |
| `deploy.production.enabled` | `false` | Until explicit production gate |

### Verifiers (run before FTP apply)

- `verify-static-public-artifact.mjs` — no `/admin`, staging SEO flags
- `deploy-public-dist-ftp.mjs` internal check — blocks apply if production canonical detected

---

## 10. Safety and rollback

| Risk | Mitigation |
| --- | --- |
| Crawl hits production too hard | `--max-pages`, rate limit, read-only GET |
| FTP to wrong directory | `verify-staging-ftp-safety.mjs`; env prefix per slug; no `PROD_FTP_*` in `.env.local` |
| Production deploy accident | `production.enabled: false`; no workflow_dispatch without approval |
| Secrets in git | `.gitignore` fixtures + output + `.env.local`; reports mask passwords |
| Staging indexed by Google | noindex + robots Disallow enforced at build |
| Broken staging overwrite | Save deploy manifest + previous artifact path before `--apply` |
| Crawl fixture PII committed | Fixtures gitignored; crawl report lists files, not committed |
| CMS half-connected state | MVP skips Supabase entirely |
| Operator error | Pipeline `--dry-run` default; step-by-step manifest |

### Rollback layers

1. **Crawl:** delete `fixtures/{slug}-static-site/`, re-crawl
2. **Generated Astro:** delete `output/generated-astro/`, re-convert
3. **FTP staging:** re-upload previous `public-dist` from saved manifest
4. **Supabase (later):** not touched in G-7 MVP

---

## 11. Implementation phases (after this planning)

| Phase | Name | Scope | Est. |
| --- | --- | --- | --- |
| **G-7** | `url-to-staging-automation-sprint-planning` | This doc | Done |
| **G-7a** | `crawl-static-site-implementation` | Crawl CLI + lib + verify script | Day 1 |
| **G-7b** | `url-to-staging-pipeline-orchestrator` | `url-to-staging-run.mjs`, dry-run default | Day 2 |
| **G-7c** | `site-config-bootstrap-from-url` | Init site config from URL + staging paths | Day 2–3 |
| **G-7d** | `gosaki-url-to-staging-pilot` | Operator manual: Route B on gosaki, QA report | Day 3 |
| **G-7e** | `url-to-staging-ftp-integration` | Wire safety verifiers into orchestrator; `--deploy-apply` gated | Optional |
| **Later** | G-6-g3 price slice | Resume Schedule CMS when staging sprint pauses | Paused |

### G-7a acceptance criteria

- `crawl-static-site.mjs --url https://www.gosaki-piano.com --site-slug gosaki --dry-run` lists pages
- `--write` creates local fixture without network write to production server
- `CRAWL_REPORT.md` documents fetched / skipped / failed URLs

### G-7b acceptance criteria

- Single command produces `PIPELINE_REPORT.md` with all step statuses
- `--dry-run` default; no FTP / no npm install side effects unless `--execute`
- Reuses existing convert / verify scripts (no duplicate logic)

### G-7d acceptance criteria

- Staging URL loads key routes after operator FTP apply
- noindex / robots / canonical checks pass verifiers
- `rollbackNeeded: false` or documented rollback path

---

## 12. Recommended operator commands (post-implementation preview)

```bash
# Planning reference only — scripts do not exist until G-7a/b

# Full dry-run pipeline
node tools/static-to-astro/scripts/url-to-staging-run.mjs \
  --url https://www.gosaki-piano.com \
  --site-slug gosaki \
  --site-profile musician \
  --staging-base-url https://yskcreate.weblike.jp \
  --deploy-base /cms-kit-staging/gosaki/ \
  --dry-run

# Execute local steps only (crawl + convert + build)
node tools/static-to-astro/scripts/url-to-staging-run.mjs \
  --url https://www.gosaki-piano.com \
  --site-slug gosaki \
  --execute-local

# FTP remains separate explicit step (G-7e)
node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
  --site-slug gosaki \
  --apply   # operator approval required
```

---

## 13. Gate state (planning)

```txt
urlToStagingAutomationSprintPlanningComplete: true
readyForG7aCrawlStaticSiteImplementation: true
readyForG7bUrlToStagingPipelineOrchestrator: false
readyForG7dGosakiUrlToStagingPilot: false
g6g3PriceSliceDeferred: true
productionTouched: false
ftpDeployInPlanning: false
secretsCommitted: false
```

---

## 14. Related docs

- [README.md](../README.md) — Phase 2-E gosaki verification
- [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md) — §11 migration workflow
- [staging-generation-plan.md](./staging-generation-plan.md) — G-5f plan (step 1 crawl gap)
- [gosaki-staging-runbook.md](./gosaki-staging-runbook.md) — FTP + QA
- [cms-kit-onboarding-runbook.md](./cms-kit-onboarding-runbook.md) — crawl intake checklist
- [schedule-time-fields-non-dry-run-slice-execution-result.md](./schedule-time-fields-non-dry-run-slice-execution-result.md) — G-6-g2 complete (paused)

---

*G-7 planning only. Next: G-7a crawl-static-site-implementation.*
