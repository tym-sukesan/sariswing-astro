# G-20u16 — Remaining site-specific coupling audit

**Phase:** `G-20u16-remaining-site-specific-coupling-audit`  
**Status:** **complete** — read-only audit + docs · **no implementation / FTP / DB write**  
**Date:** 2026-07-10  
**Base commit:** `90f732d` (G-20u15 committed)  
**Prior:** G-20u2–u15 site-aware stack + `verify:current-active-regression` (14/14 PASS)

| Check | Status |
| --- | --- |
| Current active regression | **14/14 PASS** at audit time |
| Coupling inventory | **yes** |
| A–E classification | **yes** |
| Non-schedule sections covered | **yes** |
| Next-phase candidates (3–5) | **yes** |
| Large refactor | **not executed** |

---

## Gates

```txt
remainingSiteSpecificCouplingAuditComplete: true
phase: G-20u16-remaining-site-specific-coupling-audit
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
largeRefactorExecuted: false
```

---

## 1. Purpose

G-20u2–u15 で **build / verify / freshness / preflight / hooks / Supabase loaders / url-to-staging** は site-aware 化が進んだ。本フェーズは **まだ残る Gosaki 固有 coupling** を棚卸しし、次サイト追加前の実装優先順位を決める。

**G-20u1** は 2026-07-09 時点の監査。本 doc は **G-20u15 完了後の差分更新**（何が解消され、何が残るか）。

---

## 2. G-20u1 → G-20u16 delta (resolved since G-20u1)

| G-20u1 gap | Current state (G-20u15) |
| --- | --- |
| No site registry | `config/sites/registry.json` + `site-registry.mjs` |
| npm hardcoded gosaki paths | `build:site-package`, `verify:site-package`, `preflight`, `verify:package-freshness` with `--site` |
| Build entrypoints Gosaki-only | `build-site-package.mjs` + thin `build-gosaki-*` wrappers |
| Astro convert hooks inline | `site-generator-hooks.mjs` registry (G-20u6) |
| No siteKey propagation | `--site` through convert / build / url-to-staging (G-20u7, G-20u14) |
| Schedule read Gosaki gate | `site-aware-supabase-loaders.mjs` + `supabaseFeatures` (G-20u13) |
| url-to-staging Gosaki fixture heuristic | `--site` + registry (G-20u14) |
| No second-site pilot | `pilot-sample-static` noop hooks (G-20u8/u9) |
| No unified regression gate | `verify:current-active-regression` (G-20u15) |

---

## 3. Classification legend

| Tier | Meaning |
| --- | --- |
| **A** | Registry 化済み — 許容（siteKey 経由で解決） |
| **B** | Gosaki wrapper / factory — 当面許容（2サイト目は noop or 別 factory） |
| **C** | 次サイト追加前に一般化したい — 実装 coupling |
| **D** | production / FTP / DB 関連 — 別フェーズで慎重に |
| **E** | docs / verifier の historical reference — current gate ではない |

---

## 4. Inventory by area

### 4.1 Core pipeline (build / verify / preflight / freshness)

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| Site registry + profiles | `registry.json`, `site-registry.mjs` | **A** | gosaki-piano + pilot-sample-static |
| Generic build CLI | `build-site-package.mjs`, `build-site-package-core.mjs` | **A** | `--site --profile` |
| Generic verify CLI | `verify-site-package.mjs`, `verify-site-package-core.mjs` | **A** | Gosaki extensions optional |
| Preflight chain | `run-site-preflight.mjs` | **A** | verify + freshness |
| Freshness CLI | `verify-package-upload-freshness.mjs`, `package-freshness-target.mjs` | **A** | legacy `--profile` still defaults gosaki |
| Post-build verifier map | `build-site-package-core.mjs` `POST_BUILD_VERIFIERS` | **C** | Hardcoded per siteKey |
| `manual-upload:package` npm default | `package.json` | **C** | Still gosaki-piano paths/URLs inline |
| `create-manual-upload-package.mjs` defaults | CLI defaults | **C** | siteSlug/deployBase fallbacks |
| Gosaki build wrappers | `build-gosaki-staging-admin-package.mjs`, `build-gosaki-production-package.mjs` | **B** | Delegate to generic core |
| `gosaki-package-build-profile.mjs` | lib | **B** | Delegates to registry; Gosaki-named |
| `includeGosakiReadOnlyAdmin` | registry, manifest, verifiers | **C** | Should become generic `includeReadOnlyAdmin` |
| `gosaki-staging-admin-public-env.mjs` | build core env injection | **C** | Gosaki-only staging admin env |
| `verify-site-package-gosaki-extensions.mjs` | verify extensions | **B** | Gosaki content assertions; correct split point |
| `static-public-site-expectations.mjs` | per-site HTML expectations | **A/C** | Gosaki + pilot explicit; generic fallback exists |
| `manual-upload-package.mjs` copy | README/CHECKLIST | **B** | Gosaki examples in operator text (acceptable) |
| `deploy-base.mjs` production host patterns | `www.gosaki-piano.com` | **C** | Should read from registry `publicBaseUrl` |
| `site-registry.mjs` path equality guards | manualUploadOut hard checks | **B** | Protects Gosaki backward compat |

### 4.2 Convert / generator hooks

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| Hook registry | `site-generator-hooks.mjs` | **A** | `resolveSiteGeneratorHooks(siteKey)` |
| Gosaki hook factory | `createGosakiPianoHookMethods` | **B** | All Gosaki transforms behind factory |
| `isGosakiPianoFixture` | hooks `matchFixture` | **C** | Fixture path heuristic; should be registry `fixtureDir` match |
| Option names `gosakiScheduleBundle` / `gosakiDiscographyBundle` | convert, astro-generator, url-to-staging | **C** | Semantic leak; rename to `siteScheduleBundle` etc. |
| Wix visual overrides composer | `wix-staging-visual-overrides.mjs` | **B** | Baseline + `site-specific-overrides/{slug}` pattern |
| `gosaki-piano-overrides.mjs` | site-specific CSS | **B** | Correct per-site file; manual slug wiring |
| Default noop hooks | `DEFAULT_SITE_GENERATOR_HOOKS` | **A** | pilot-sample-static uses these |

### 4.3 Supabase / CMS data loaders

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| `supabaseFeatures` registry | `registry.json` | **A** | `{ schedule, discography }` per site |
| `loadSiteSupabaseDataForBuild` | `site-aware-supabase-loaders.mjs` | **A** | siteKey → plan |
| Gosaki schedule wrapper | `loadGosakiScheduleDataForBuild` | **B** | Delegates generic loader |
| Gosaki discography wrapper | `loadGosakiDiscographyDataForBuild` | **B** | Delegates generic loader |
| Non-gosaki discography loader | `site_discography_loader_not_implemented` | **C** | Returns wix-html fallback |
| `cmsSiteSlug` vs `supabaseSiteSlug` | gosaki: `gosaki` / `gosaki-piano` | **C** | Documented mismatch; no migration |
| `site_slug` table filter | `supabase-schedule-read.mjs` | **A** | Generic `.eq("site_slug", siteSlug)` |
| Discography `site_slug` filter | `supabase-discography-read.mjs` | **C** | Gosaki-coupled; multi-site rows TBD |
| `site_embeds` table (YouTube) | planned G-9a | **C** | Not in loaders yet |

### 4.4 Schedule (reference — largely generalized)

| Item | Tier | Notes |
| --- | --- | --- |
| Schedule data pages | **B** | `gosaki-schedule-data-pages.mjs` via hooks |
| Month route canonicalization | **A** | `schedule-pages.mjs` shared |
| Legacy month stubs | **B** | Gosaki Wix route compat |
| Schedule hub CSS/classes | **B** | `gosaki-schedule-hub` in overrides |
| Gosaki verify extensions (2026-06/07) | **B/E** | Content assertions in gosaki-extensions |

### 4.5 Discography (non-schedule)

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| Supabase read | `supabase-discography-read.mjs` | **B** | Gosaki paths + patch helpers |
| Convert hook `patchDiscographyPageMainHtml` | hooks factory | **B** | Gosaki-only implementation |
| Config JSON | `gosaki-piano-discography.json` | **B** | Per-site config pattern OK |
| `CORE_PUBLIC_HTML` includes discography | `static-public-artifact-verifier.mjs` | **C** | Gosaki-default assumption |
| Verify extensions (Like a Lover test strings) | `verify-site-package-gosaki-extensions.mjs` | **B/E** | Gosaki product QA |
| Admin discography write slices | `src/` admin (out of scope) | **D** | G-18/G-19 phases |

### 4.6 About (non-schedule)

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| Band profiles injection | `gosaki-about-band-profiles.mjs` | **B** | Config: `gosaki-piano-band-profiles.json` |
| About content override | `gosaki-about-content.mjs` | **B** | Config: `gosaki-piano-about-content.json` |
| `BandProfilesSection.astro` template | `templates/site-extensions/gosaki-piano/` | **B** | Gosaki-only template |
| Pilot About | fixture static HTML only | **A** | No injection |

### 4.7 Contact (non-schedule)

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| HubSpot embed | `gosaki-contact-hubspot-embed.mjs` | **B** | Config: `gosaki-piano-contact-hubspot.json` |
| Wix comp selector `#comp-jqbwo704` | contact embed | **B** | Site-specific DOM coupling |
| HubSpot allowlist constants | contact embed | **B** | Gosaki portal/form IDs |
| Generic contact hook | hooks registry | **C** | No `contactEmbed` feature flag in registry |

### 4.8 Link / navigation (non-schedule)

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| `productionAbsoluteUrlToRoute` | `path-transform.mjs` | **A** | Shared Wix → internal |
| `withBase()` deploy links | generator + schedule hub | **A** | deployBase driven |
| Production nav URL rewrite | path-transform | **A** | Used for all sites |
| `navSampleSegment` default discography | deploy-base / expectations | **C** | Gosaki-biased default |
| Footer social links | `gosaki-footer-social.mjs` | **B** | Injected via hook `generateFooter` |

### 4.9 YouTube (non-schedule)

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| Home embed injection | `gosaki-home-youtube-embed.mjs` | **B** | Config: `gosaki-piano-youtube-embed.json` |
| Template + lib | `templates/site-extensions/gosaki-piano/` | **B** | Per-site extension pattern |
| Registry `supabaseFeatures` | registry.json | **C** | No `youtube` / `site_embeds` flag yet |
| G-9a planning (`site_embeds` table) | docs | **D** | DB schema deferred |

### 4.10 Home / Footer / Mobile (non-schedule)

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| Wix baseline overrides | `wix-static-export-baseline-overrides.mjs` | **A** | Shared baseline |
| Gosaki mobile/CSS fixes | `gosaki-piano-overrides.mjs` (G-8g*) | **B** | Site-specific overrides file |
| Footer social SVG/text fallback | gosaki-footer-social + overrides | **B** | Hook + CSS |
| SP header/nav fixes | overrides G-8g2 | **B** | Wix static export compat |
| Home YouTube slot | gosaki-home-youtube-embed | **B** | Gosaki-only |

### 4.11 Admin shell (non-schedule)

| Item | Location | Tier | Notes |
| --- | --- | --- | --- |
| Admin CMS template bundle | `admin-cms-template.mjs` | **A** | Generic template copy |
| Gosaki read-only admin overlay | `gosaki-staging-read-only-admin.mjs` | **B** | Staging-only via hook |
| `data-gosaki-read-only-admin` marker | static-public verifier | **C** | Gosaki-named detection |
| `includeGosakiReadOnlyAdmin` profile flag | registry | **C** | Rename + generalize |
| Staging admin env loader | `gosaki-staging-admin-public-env.mjs` | **C** | Gosaki-only |
| Production admin exclusion | G-20i3 verifier | **D** | Upload safety |
| `/admin` in sitemap filter | `sitemap-exclusions.mjs` | **A** | CMS Kit generic |

### 4.12 URL-to-staging

| Item | Tier | Notes |
| --- | --- | --- |
| `--site` + registry resolution | **A** | G-20u14 |
| Gosaki url-to-staging config | **A** | `gosaki-piano.url-to-staging.json` |
| Pilot url-to-staging config | **A** | `pilot-sample-static.url-to-staging.json` |
| G-7 pilot phase flags in plan | **E** | Historical gosaki crawl markers |

### 4.13 Verifier / docs coupling

| Item | Tier | Notes |
| --- | --- | --- |
| `verify:current-active-regression` | **A** | 14 G-20u2–u14 verifiers |
| `verify-url-to-staging-pipeline.mjs` (813 tests) | **E** | G-7–G-9 historical mega-suite |
| `verify-gosaki-*` / `verify-g20*gosaki*` scripts | **E** | Phase history; not current gate |
| G-20u1 audit doc | **E** | Superseded inventory; retain archive |
| Gosaki-specific assertions in gosaki-extensions | **B** | Correct: extensions not core verify |
| On-disk package stale checks | **A** | NOTE / STOP-expected in active verifiers |

---

## 5. Verifier vs implementation — what should stay Gosaki-specific

| OK in verifier (B/E) | Should NOT stay in implementation (C) |
| --- | --- |
| `gosaki-schedule-month` class assertions | `isGosakiPianoFixture()` as hook gate |
| `2026-06/07` month content checks | `POST_BUILD_VERIFIERS` hardcoded map |
| Discography test title strings (Like a Lover) | `gosakiScheduleBundle` option naming |
| `www.gosaki-piano.com` in production verify | `manual-upload:package` npm inline gosaki defaults |
| Historical G-8g CSS marker checks in mega-suite | `includeGosakiReadOnlyAdmin` flag name |
| Gosaki HubSpot portal ID in E2E verify | `gosaki-staging-admin-public-env.mjs` without registry hook |

---

## 6. Next-phase candidates (recommended 5)

### 1. G-20u17 — Post-build verifier registry

| | |
| --- | --- |
| **Scope** | Move `POST_BUILD_VERIFIERS` from `build-site-package-core.mjs` into `registry.json`; optional `verifyExtensions` module per site |
| **Risk** | Low |
| **Impact** | High — 3rd site can register verifier without editing core |
| **Touches** | registry, build-site-package-core, verify-site-package |

### 2. G-20u18 — package.json / CLI default decoupling

| | |
| --- | --- |
| **Scope** | Remove gosaki inline defaults from `manual-upload:package` npm script; require `--site` or explicit args in `create-manual-upload-package.mjs` |
| **Risk** | Low |
| **Impact** | Medium — operator scripts stop implying gosaki-only |
| **Touches** | package.json, create-manual-upload-package.mjs |

### 3. G-20u19 — Generator option naming + fixture match registry

| | |
| --- | --- |
| **Scope** | Rename `gosakiScheduleBundle` → `siteScheduleBundle`; replace `isGosakiPianoFixture` with registry `fixtureDir` equality |
| **Risk** | Low–medium (wide rename, compat aliases) |
| **Impact** | Medium — reduces semantic leak before 3rd site |
| **Touches** | convert, astro-generator, url-to-staging, hooks |

### 4. G-20u20 — Supabase CMS feature registry (discography + embeds)

| | |
| --- | --- |
| **Scope** | Extend `supabaseFeatures` with `youtube` / `contact` / `site_embeds`; generic loaders; registry-driven hook enablement |
| **Risk** | Medium (Supabase read scope) |
| **Impact** | High — Gosaki CMS MVP (discography + top YouTube per G-9a) |
| **Touches** | registry, site-aware-supabase-loaders, hooks, gosaki-* modules |

### 5. G-20u21 — Read-only admin flag + static-public generalization

| | |
| --- | --- |
| **Scope** | Rename `includeGosakiReadOnlyAdmin` → `includeReadOnlyAdmin`; generic admin marker in static-public verifier; registry `adminFeatures` |
| **Risk** | Medium (upload safety / G-20i3 interaction) |
| **Impact** | Medium — required before multi-site staging with admin |
| **Touches** | registry, static-public-artifact-verifier, manual-upload-package, G-20i3 verifier |

---

## 7. Recommended order

```
1. G-20u18  package.json / CLI default decoupling     (low risk, quick win)
2. G-20u17  post-build verifier registry              (completes build/verify chain)
3. G-20u19  option naming + fixture match             (hygiene before site #3)
4. G-20u20  Supabase CMS features (discography/embed) (Gosaki CMS MVP)
5. G-20u21  admin flag generalization                 (before production cutover)
```

**Defer to separate tracks (D):** production upload (`TBD_G-20i`), FTP apply, DB write/admin Save paths, `site_embeds` migration.

---

## 8. Current active regression (baseline)

```bash
npm run verify:current-active-regression
# G-20u15: 14/14 verifiers passed at audit time (HEAD 90f732d)
```

**Not in current gate:** `verify-url-to-staging-pipeline.mjs`, G-20t3–t6, G-20u1 audit verifier, `verify-gosaki-*` phase scripts.

---

## 9. References

- G-20u1 baseline: `gosaki-hardcode-generalization-audit.md`
- Current gate: `current-active-regression-suite.md`
- Gosaki CMS scope: `gosaki-cms-scope-and-schedule-youtube-planning.md` (G-9a)
