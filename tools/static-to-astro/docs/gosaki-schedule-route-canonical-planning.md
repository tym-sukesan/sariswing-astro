# Gosaki schedule route canonical planning (G-9c0)

**Phase:** `G-9c0-gosaki-schedule-route-canonical-planning`  
**Date:** 2026-06-16  
**Prior:** G-9c seed SQL planning (uncommitted — **on hold**)  
**Status:** planning only — **no implementation, no DB write, no FTP**

---

## 1. Purpose

Decide the **canonical Astro route** for Gosaki schedule month pages before committing G-9c seed SQL templates.

| Pattern | Example |
| --- | --- |
| **Current (Wix live-crawl)** | `/2026-07/` |
| **Candidate (CMS Kit)** | `/schedule/2026-07/` |

This doc compares Options A/B/C, lists impact, and recommends a path that balances CMS Kit generalization, Sariswing alignment, staging preview continuity, and G-9c `source_route` values.

---

## 2. Current state

### 2.1 Published staging routes (G-8g3 hub + live-crawl months)

```txt
/schedule/          ← hub (G-8g3 generated)
/2026-03/
/2026-04/
/2026-05/
/2026-06/
/2026-07/
```

Staging base: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

Hub month links use `withBase(m.route)` where `m.route` comes from `detectScheduleMonthPages()` → `htmlFileToAstroRoute("2026-07.html")` → `/2026-07/`.

### 2.2 Three route conventions in the codebase today

| Origin | Source file | `htmlFileToAstroRoute()` | Astro `pagePath` |
| --- | --- | --- | --- |
| Wix live crawl | `2026-07.html` | `/2026-07/` | `2026-07/index.astro` |
| Manual fixture (dry-run pilot) | `schedule-2026-07.html` | `/schedule-2026-07/` | `schedule-2026-07/index.astro` |
| **Sariswing CMS (production)** | dynamic `[month]` | `/schedule/2026-07/` | `schedule/[month]/index.astro` |

Gosaki staging follows **live crawl** mapping. The manual fixture uses a **hyphenated single segment** (`/schedule-2026-07/`), which is **not** the same as Sariswing’s **nested** `/schedule/2026-07/`.

### 2.3 Key implementation touchpoints (current behavior)

| File | Current role |
| --- | --- |
| `schedule-pages.mjs` | `LIVE_CRAWL_MONTH_FILENAME`, `detectScheduleMonthPages()`, `isScheduleSectionPath()` accepts `/schedule/`, `/schedule-YYYY-MM/`, `/YYYY-MM/` |
| `static-site-analyzer.mjs` | `htmlFileToAstroRoute()` — filename → route (no Gosaki override) |
| `astro-generator.mjs` | Writes month pages at `page.pagePath`; hub links use `m.route`; `generateScheduleIndexPage()` |
| `path-transform.mjs` | `productionAbsoluteUrlToRoute()` maps Wix `https://gosaki-piano.com/2026-07/` → `/2026-07/` |
| `header-transform.mjs` | Nav collapses month links to `/schedule/`; `scheduleNavActive()` highlights `/schedule/`, `/schedule-YYYY-MM/`, `/YYYY-MM/` |
| `static-public-artifact-verifier.mjs` | Resolves `YYYY-MM/index.html` (live) or `schedule-YYYY-MM/index.html` (fixture) — **no** `schedule/YYYY-MM/` variant |
| `gosaki-wix-schedule-extractor.mjs` | `source_route = htmlFileToAstroRoute(fileName)` → `/2026-07/` |
| `gosaki-schedules-seed-sql.mjs` | Emits `source_route` from extractor output |
| `verify-gosaki-schedule-seed-extractor.mjs` | Asserts July `source_route === "/2026-07/"` |
| `verify-url-to-staging-pipeline.mjs` | G-8g3 asserts hub uses `withBase(m.route)` and no root-only `href="/2026-` |

### 2.4 G-9c seed SQL template (uncommitted)

All 60 rows currently have:

```txt
source_file:  2026-07.html   (Wix crawl provenance — unchanged)
source_route: /2026-07/      (matches current Astro route, not CMS Kit target)
```

### 2.5 G-9a planning note (superseded by this phase)

`gosaki-cms-scope-and-schedule-youtube-planning.md` listed Gosaki month route as `/2026-06/` (“gosaki 既存”). That reflected G-8 staging reality, not the long-term CMS Kit canonical. **G-9c0 revises that assumption.**

---

## 3. Problem statement

| Issue | Detail |
| --- | --- |
| Information architecture | Year-month pages at site root (`/2026-07/`) pollute top-level URL space and do not group under Schedule |
| CMS Kit generalization | Future customers expect `/schedule/` hub + `/schedule/YYYY-MM/` months (Sariswing pattern) |
| Sariswing alignment | Sariswing production uses `/schedule/2026-06/` (`src/pages/schedule/[month]/index.astro`) |
| `source_route` semantics | If seeded as `/2026-07/` but CMS later serves `/schedule/2026-07/`, admin/read layers must remap or re-seed |
| Staging continuity | Client preview URLs already shared as `/cms-kit-staging/gosaki-piano/2026-07/` |
| Wix production URLs | gosaki-piano.com uses `/2026-07/` — migration concern for go-live, not staging |

---

## 4. Option comparison

### Option A — Keep `/YYYY-MM/` (status quo)

```txt
/schedule/
/2026-07/
```

| Pros | Cons |
| --- | --- |
| Matches Wix production URLs | Poor CMS Kit IA |
| Minimal code change | Root-level month dirs scale poorly |
| G-9c template commit-ready as-is | Diverges from Sariswing `/schedule/YYYY-MM/` |
| Staging bookmarks unchanged | `source_route` encodes Wix crawl artifact, not CMS route |

**Verdict:** Acceptable short-term staging shortcut; **not** recommended as Kit canonical.

### Option B — Canonical `/schedule/YYYY-MM/` only

```txt
/schedule/
/schedule/2026-07/
```

| Pros | Cons |
| --- | --- |
| CMS Kit + Sariswing aligned | G-8/G-9b/G-9c touchpoints need updates |
| Clean hub → month hierarchy | Breaks existing staging `/YYYY-MM/` URLs |
| `source_route` matches served page | Operator re-upload required |
| Future Supabase read (`getStaticPaths`) natural | Wix production URLs differ until go-live redirect plan |

**Verdict:** **Recommended canonical target.**

### Option C — Both canonical + legacy

```txt
/schedule/2026-07/   canonical
/2026-07/            legacy mirror or redirect
```

| Pros | Cons |
| --- | --- |
| Canonical IA + backward compatibility | Duplicate HTML unless legacy is thin redirect stub |
| Staging links keep working | Verifier must enforce `rel=canonical` on legacy |
| SEO-safe if canonical correct | More build output; sitemap must list canonical only |

**Verdict:** **Recommended transition layer** on top of Option B for staging/client preview continuity. Static FTP cannot do HTTP 301 — use **legacy stub pages** with `rel=canonical` + optional meta refresh (same pattern as other static-export sites).

---

## 5. Recommendation

### Primary recommendation: **Option B + Option C (limited legacy)**

Align with operator preference:

```txt
canonical: /schedule/YYYY-MM/
legacy:    /YYYY-MM/  → thin compatibility page (rel=canonical → canonical URL)
```

**Why not Option A alone:** G-9d+ will read Supabase and generate month pages; Sariswing already uses `/schedule/[month]/`. Keeping `/YYYY-MM/` forces a permanent Gosaki-specific exception in Kit routing, hub links, admin staging shell, and `source_route` semantics.

**Why not pure Option B without legacy:** Staging preview was shared at `/2026-07/`. Breaking those URLs before client sign-off is unnecessary risk. Legacy stubs are low cost on static hosting.

**Why not defer route change until after G-9c commit:** G-9c `source_route` should encode the **canonical page route** the CMS will serve. Committing `/2026-07/` now creates a one-time seed that mismatches the intended architecture and requires UPDATE or re-seed later.

### `source_route` recommendation

| Field | Value | Meaning |
| --- | --- | --- |
| `source_file` | `2026-07.html` | Wix crawl provenance (unchanged) |
| `source_route` | `/schedule/2026-07/` | **Canonical CMS month page route** |

Do **not** store Wix production URL or legacy `/2026-07/` in `source_route` once canonical is decided. Legacy compatibility is a **routing/build** concern, not seed metadata.

### Legacy `/YYYY-MM/` handling

| Layer | Policy |
| --- | --- |
| Build | Generate `src/pages/2026-07/index.astro` as **legacy stub** OR post-build copy with canonical tag only |
| Stub content | `rel=canonical` → `{deployBase}/schedule/2026-07/`; optional `<meta http-equiv="refresh" content="0;url=...">` |
| Nav / hub | Link only to `/schedule/YYYY-MM/` |
| Sitemap | Include **canonical** paths only (`/schedule/YYYY-MM/`) |
| `isScheduleSectionPath` | Continue matching both during transition |
| Go-live (future) | Server 301 from `/YYYY-MM/` → `/schedule/YYYY-MM/` if host supports it; drop stubs when analytics show no traffic |

### Sitemap / canonical / og:url

| Item | Policy |
| --- | --- |
| **Canonical month page** | `applyBaseUrlToSeo(route, baseUrl, deployBase)` with `route = /schedule/YYYY-MM/` → staging URL under deployBase (G-7e duplicate-deployBase rules apply) |
| **Legacy stub** | `rel=canonical` points to canonical; og:url same as canonical (avoid duplicate indexing) |
| **Hub `/schedule/`** | Unchanged; month list links to `/schedule/YYYY-MM/` |
| **Staging** | `canonicalMode: staging-url` — no production host leak (existing G-7e checks) |
| **Production go-live** | TBD — likely `https://www.gosaki-piano.com/schedule/2026-07/` as canonical; legacy Wix `/2026-07/` handled at DNS/host redirect phase (out of G-9c0 scope) |

### Sariswing consistency

| Site | Hub | Month |
| --- | --- | --- |
| Sariswing | `/schedule/` | `/schedule/2026-06/` |
| Gosaki (recommended) | `/schedule/` | `/schedule/2026-07/` |
| Gosaki manual fixture | N/A | `/schedule-2026-07/` (hyphen — **deprecated** for Gosaki; verifier may keep accepting for dry-run pilot fixtures only) |

Kit-level helper to introduce (implementation phase):

```js
// schedule-pages.mjs (proposed)
export function cmsKitScheduleMonthRoute(year, month) {
  return `/schedule/${year}-${month}/`;
}
```

Live-crawl filename mapping becomes an input concern; **canonical route** is always `cmsKitScheduleMonthRoute`.

---

## 6. Impact matrix (implementation phase — not executed in G-9c0)

| File | Change if Option B+C |
| --- | --- |
| `schedule-pages.mjs` | Add `cmsKitScheduleMonthRoute()`; override `scheduleMonthFromPage()` route for live-crawl; extend `isScheduleSectionPath` for `/schedule/YYYY-MM/` |
| `static-site-analyzer.mjs` | Optional: site-profile hook; or keep generic and override in `astro-generator` |
| `astro-generator.mjs` | Emit month pages at `schedule/YYYY-MM/index.astro`; hub links use canonical route; optional legacy stub generator |
| `path-transform.mjs` | Map Wix `productionAbsoluteUrlToRoute` month URLs → `/schedule/YYYY-MM/` |
| `header-transform.mjs` | `scheduleNavActive()` match `/schedule/YYYY-MM/` |
| `static-public-artifact-verifier.mjs` | Add `schedule/${ym}/index.html` variant; sitemap expectations |
| `gosaki-wix-schedule-extractor.mjs` | `source_route = cmsKitScheduleMonthRoute(year, month)` |
| `gosaki-schedules-seed-sql.mjs` | Pass-through from extractor (auto-updates) |
| `verify-gosaki-schedule-seed-extractor.mjs` | Assert `source_route === "/schedule/2026-07/"` |
| `verify-url-to-staging-pipeline.mjs` | Hub link + route existence checks for nested path |
| `gosaki-schedules-seed.template.sql` | Regenerate — all `source_route` → `/schedule/YYYY-MM/` |
| `gosaki-schedule-seed-sql-planning.md` | Update route table + checklist |
| `gosaki-cms-scope-and-schedule-youtube-planning.md` | Footnote: month route superseded by G-9c0 |

**Out of scope for route phase:** `/admin`, Supabase RLS, FTP apply, production gosaki-piano.com.

---

## 7. Implementation phases (future — not G-9c0)

| Phase | Scope | DB | FTP |
| --- | --- | --- | --- |
| **G-9c0** (this doc) | Route decision + impact | no | no |
| **G-9c0a** | Canonical route implementation + verifiers | no | no |
| **G-9c0b** | Legacy stub pages + canonical enforcement | no | no |
| **G-9c0c** | Regenerate seed SQL + update G-9c planning doc | no | no |
| **G-9c commit** | Commit planning artifacts with route-aware `source_route` | no | no |
| **G-9c-execution** | Operator manual SQL on staging | operator only | no |
| **G-9d** | Supabase read + static fallback using canonical routes | read only | no |
| **Operator re-upload** | `npm run manual-upload:package` after G-9c0a/b | no | manual only |

Estimated effort for G-9c0a+b: **~1 day** (converter + verifiers + package regen + spot-check staging). Lower risk than re-seeding `source_route` after SQL execution.

---

## 8. G-9c seed SQL template impact

### If commit G-9c **before** route change (not recommended)

| Aspect | State |
| --- | --- |
| `source_route` | `/2026-07/` (60 rows) |
| Risk | Seed metadata ≠ served route after G-9c0a |
| Mitigation | Staging UPDATE or re-run seed after route phase — extra operator work |
| `legacy_id` collision | **Unrelated** to route — `schedule-2026-07-010` PoC conflict remains |

### If commit G-9c **after** G-9c0a+c (recommended)

| Aspect | State |
| --- | --- |
| `source_route` | `/schedule/2026-07/` (60 rows) |
| `source_file` | Still `2026-07.html` |
| Regenerate | `npm run generate:gosaki-schedule-seed-sql` |
| Verifier | Update assertion in `verify-gosaki-schedule-seed-extractor.mjs` |
| Collision | Unchanged — resolve at G-9c-execution |

**G-9c SQL column set unchanged** — only `source_route` string values and docs differ.

---

## 9. Staging preview impact

| Scenario | Effect |
| --- | --- |
| Canonical only (B) | Existing `/2026-07/` bookmarks 404 until re-upload |
| B + legacy stubs (recommended) | `/2026-07/` still resolves; user lands on canonical via link or refresh |
| Hub | Month links change from `/2026-07/` to `/schedule/2026-07/` — visible UX improvement |
| Client preview | Brief note to client optional: “month URLs now under /schedule/” |
| Re-upload | Required after G-9c0a/b — manual package only (`readyForAnyFutureFtpApply: false`) |

---

## 10. Decision summary

| Question | Answer |
| --- | --- |
| Canonical route? | **`/schedule/YYYY-MM/`** |
| Keep `/YYYY-MM/`? | **Yes, as legacy stub during transition** (Option C lite) |
| Commit G-9c now? | **No** — `readyForG9cCommit: false` until route-aware template |
| `source_route` in seed? | **`/schedule/YYYY-MM/`** |
| Match Sariswing? | **Yes** (nested under `/schedule/`) |
| Match Wix production? | **No** on staging; go-live redirect plan later |

---

## 11. Gates

```txt
gosakiScheduleRouteCanonicalPlanningComplete: true
recommendedGosakiScheduleCanonicalRoute: /schedule/YYYY-MM/
recommendedGosakiScheduleLegacyRoute: /YYYY-MM/ (compatibility stub — transition only)
readyForG9cRouteAwareSeedSqlPlanning: true
readyForG9cCommit: false
readyForG9c0aCanonicalRouteImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 12. Next actions (operator)

1. **Approve** canonical `/schedule/YYYY-MM/` + legacy stub approach (or choose Option A to minimize churn).
2. **G-9c0a/b** implementation phase (separate approval).
3. Regenerate seed SQL + update G-9c planning doc.
4. **Then** commit G-9c artifacts with route-aware `source_route`.
5. G-9c-execution remains blocked on `schedule-2026-07-010` collision resolution.

**Do not:** commit G-9c as-is with `/2026-07/` `source_route` if canonical decision stands.
