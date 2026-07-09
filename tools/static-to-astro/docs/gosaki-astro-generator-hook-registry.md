# G-20u6 — Astro generator hook registry

**Phase:** `G-20u6-astro-generator-hook-registry`  
**Base commit:** `3decd7f`  
**Gate:** `astroGeneratorHookRegistryComplete: true`

## Goal

Inventory Gosaki-specific logic still embedded in `astro-generator.mjs` and introduce a minimal **site hook registry** so future multi-site onboarding can register hooks without growing the generator core. **Output compatibility for Gosaki is preserved** — no wrapper removal, no large renames.

## Hook registry design

| Module | Role |
| --- | --- |
| `scripts/lib/site-generator-hooks.mjs` | Registry loader + `DEFAULT_SITE_GENERATOR_HOOKS` (noop) + Gosaki factory |
| `scripts/lib/astro-generator.mjs` | Calls `resolveSiteGeneratorHooks(siteDir)` and delegates site-specific steps |

### Resolution order

1. Explicit `options.siteKey` when registered  
2. `config/sites/registry.json` → `fixtureDir` basename match  
3. Per-site `matchFixture(siteDir)` fallback  
4. `DEFAULT_SITE_GENERATOR_HOOKS` (safe noop)

### Hook surface (minimal)

| Hook | Default | Gosaki (`gosaki-piano`) |
| --- | --- | --- |
| `transformAnalysisPages` | identity | canonical schedule month routes |
| `resolveVisualOverrideSiteSlug` | `null` | `gosaki-static-site` alias |
| `generateFooter` | `null` (use generic Footer) | `generateGosakiFooterAstro` |
| `resolveScheduleDataUsage` | no data | Supabase/static-fallback bundle |
| `shouldSkipScheduleMonthPage` | never | skip data-backed month routes |
| `patchDiscographyPageMainHtml` | `null` | Supabase discography patch |
| `applyScheduleDataPages` | `null` | `applyGosakiScheduleDataPages` |
| `applyLegacyMonthStubs` | `{ count: 0 }` | `/YYYY-MM/` legacy stubs |
| `applyPostGenerate` | noop summaries | band profiles, about, YouTube, contact, read-only admin |

Unregistered sites never call Gosaki modules.

## Gosaki inventory (moved to registry)

| Category | Former `astro-generator.mjs` | Now |
| --- | --- | --- |
| **Imports** | 7× `gosaki-*` + discography patch | `site-generator-hooks.mjs` only |
| **Fixture detect** | `isGosakiPianoFixture` | registry + `matchFixture` |
| **Schedule routes** | `toCanonicalScheduleMonthPage` | hook `transformAnalysisPages` |
| **CSS site slug** | `fixtureLabelFromPath` hardcode | hook `resolveVisualOverrideSiteSlug` |
| **Footer** | `generateGosakiFooterAstro` | hook `generateFooter` |
| **Schedule data** | inline bundle checks | hook `resolveScheduleDataUsage` + `applyScheduleDataPages` |
| **Discography** | inline Supabase patch | hook `patchDiscographyPageMainHtml` |
| **Legacy stubs** | inline `/YYYY-MM/` loop | hook `applyLegacyMonthStubs` |
| **Post-generate** | band / about / YouTube / contact / admin | hook `applyPostGenerate` |

### Still in `astro-generator.mjs` (shared / markup)

| Item | Notes |
| --- | --- |
| `generateScheduleIndexPage` | Hub markup with `gosaki-schedule-*` classes (G-8g3; future generic CSS rename deferred) |
| `generateScheduleLegacyMonthStubPage` | Stub HTML; passed into hook via context |
| `appendWixStagingVisualOverrides` | Baseline Wix CSS; `siteSlug` from hook |
| `applyAdminCmsTemplateBundle` | Generic admin CMS template |
| `buildSitemapIntegrationBlock` | Via `sitemap-exclusions.mjs` (unchanged) |

### Gosaki modules (unchanged — called by hooks)

- `applyGosakiAboutBandProfiles` → `gosaki-about-band-profiles.mjs`
- `gosaki-about-content.mjs`
- `gosaki-home-youtube-embed.mjs`
- `gosaki-contact-hubspot-embed.mjs`
- `gosaki-schedule-data-pages.mjs`
- `gosaki-staging-read-only-admin.mjs`
- `gosaki-footer-social.mjs`
- `supabase-discography-read.mjs` (patch helpers)
- `site-specific-overrides/gosaki-piano-overrides.mjs` (via `wix-staging-visual-overrides.mjs`)

## Output compatibility

- Gosaki hooks **call existing functions unchanged** — no logic rewrites.
- `astro-generator.mjs` delegation only; return shape (`gosakiScheduleDataSummary`, etc.) preserved.
- Schedule hub / legacy stub **HTML generators remain in generator**; hook writes same paths.
- **No FTP / deploy / DB write** in this phase.

## Verification

```bash
cd tools/static-to-astro
node scripts/verify-g20u6-astro-generator-hook-registry.mjs
npm run build:gosaki:staging:dry-run
```

Checks:

- Gosaki hooks resolve from `fixtures/gosaki-piano`
- Default/noop hooks for unregistered fixtures
- `build-site-package --dry-run` passes
- G-20u3 generic build verifier still passes
- Generator no longer imports `gosaki-*` directly

## Package freshness

On-disk manual-upload packages remain **freshness STOP** until regen at current HEAD. **Any commit after regen makes packages stale** — run `build:gosaki:*` then `verify:package-freshness:*` before upload.

## Full staging regen verification (G-20u6 follow-up)

**Executed at HEAD `3decd7f` (2026-07-10).** Hook registry 化後の staging full regen + package verify を実施。

| Check | Result |
| --- | --- |
| `npm run build:gosaki:staging` | **PASS** — 29 files |
| `npm run verify:gosaki:staging` | **PASS** |
| `npm run verify:site-package -- --site gosaki-piano --profile staging` | **PASS** |
| `npm run verify:package-freshness:staging` | **PASS** (fresh at `3decd7f`) |
| `verify-g20u6-astro-generator-hook-registry.mjs` | **43/43 PASS** |
| `/schedule/2026-08/` | **present** — 14 event cards · `scheduleDataSource=supabase` |
| `/2026-08/` legacy stub | **present** · `noindex` |
| sitemap `/schedule/2026-08/` | **present** |
| sitemap `/admin/` | **absent** |
| `admin/index.html` | **present** (staging) |
| Discography / About / Contact / YouTube hooks | **intact** |
| MANIFEST `includesAdmin` | **true** |
| MANIFEST `targetEnvironment` | **staging** |
| MANIFEST `sourceCommit` | `3decd7f4e1744c5e67b720c5de2a52689702ca0a` |
| Production | **dry-run only** (`build:gosaki:production:dry-run` PASS) — upload **STOP** |

**Gate:** `g20u6FullStagingRegenVerified: true`

**Commit note:** G-20u6 を commit すると HEAD が進み、直後の on-disk package は **stale** になる。アップロード前は再度 `build:gosaki:staging` + `verify:package-freshness:staging` が必要。

## Not executed

- FTP / deploy / mirror / delete  
- DB write / SQL  
- Full package regen (optional; output gitignored)  
- Wrapper removal  
- Second-site pilot  

## Next

- **G-20u7** — convert CLI `--site` wiring to pass `siteKey` into generator options  
- **G-20u8** — second fixture pilot with noop + one hook slice  
- Schedule hub CSS class generalization (separate visual phase)
