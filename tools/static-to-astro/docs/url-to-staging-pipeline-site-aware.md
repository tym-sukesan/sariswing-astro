# G-20u14 — URL-to-staging pipeline site-aware

**Phase:** `G-20u14-url-to-staging-pipeline-site-aware`  
**Base:** `861ea4d` (G-20u13 complete)  
**Scope:** `url-to-staging-pipeline.mjs` + registry resolution — **no FTP / deploy / DB write**

## Goal

Make the URL → crawl → convert → build → static-public pipeline resolve paths and convert metadata from `siteKey` / registry, replacing Gosaki fixture heuristics (`isGosakiPianoFixture`) with the same site-aware stack used by `build-site-package` and `convert-static-to-astro`.

## Changes

| Area | Before | After |
| --- | --- | --- |
| CLI | `--config` or `--url` + `--site-slug` only | `--site SITE_KEY` resolves from registry |
| Convert step | `isGosakiPianoFixture` + `loadGosakiScheduleDataForBuild` | `loadSiteSupabaseDataForBuild({ siteKey })` |
| `generateAstroProject` | no `siteKey`, schedule only | `siteKey` + schedule + discography bundles |
| Step plan | convert command without `--site` | `--site ${siteKey}` in planned command |
| static-public verify | no `siteKey` | passes `siteKey` to verifier |
| Manifest | `siteSlug` only | `siteKey` + `siteSlug` |

## Module

`scripts/lib/url-to-staging-site-registry.mjs`

- `buildUrlToStagingConfigFromSite(siteKey, toolRoot, cliOverrides)` — registry staging profile + optional `config/sites/{siteKey}.url-to-staging.json` overlay
- `resolveEffectiveUrlToStagingSiteKey(config)`
- `isKnownUrlToStagingSiteKey(siteKey)`

## CLI usage

```bash
# Gosaki — registry (uses gosaki-piano.url-to-staging.json when present)
npm run url:staging -- --site gosaki-piano --dry-run

# Pilot — noop hooks, Supabase skip
npm run url:staging -- --site pilot-sample-static --dry-run

# Legacy config file (backward compatible)
npm run url:staging -- --config config/sites/gosaki-piano.url-to-staging.json --dry-run
```

## siteKey flow

```
CLI --site SITE_KEY
  → buildUrlToStagingConfigFromSite()
    → registry.json + staging profile (fixtureDir, astroOut, deployBase, …)
    → optional config/sites/{siteKey}.url-to-staging.json
  → runUrlToStagingPipeline({ config.siteKey, … })
    → convert: loadSiteSupabaseDataForBuild({ siteKey })
    → generateAstroProject({ siteKey, gosakiScheduleBundle, gosakiDiscographyBundle })
    → step plan: convert-static-to-astro.mjs … --site ${siteKey}
    → prepare-public: runStaticPublicArtifactVerification({ siteKey })
```

## Config files

| Site | File |
| --- | --- |
| gosaki-piano | `config/sites/gosaki-piano.url-to-staging.json` (+ `siteKey`) |
| pilot-sample-static | `config/sites/pilot-sample-static.url-to-staging.json` (new) |

## Safety

- Default `--dry-run` unchanged
- `--deploy-ftp` remains plan-only
- No DB write / SQL mutation / FTP / production touch
- Unknown `--site` → registry error (fail fast)

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g20u14-url-to-staging-pipeline-site-aware.mjs
npm run verify:g20u14-url-staging
```

## Not in scope

- Live crawl execution
- FTP upload / manual package upload
- DB write / Supabase mutation
- `/admin` or production changes

## Next

- G-20u15+: wire url-to-staging into `build-site-package` orchestration or multi-site crawl pilots
- Optional: spawn `convert-static-to-astro.mjs` CLI instead of inline `generateAstroProject` for single code path

## Follow-up (G-20u14 legacy verifier)

`verify-url-to-staging-pipeline.mjs` had 2 historical FAILs (not on-disk stale):

| Assertion | Cause | Fix |
| --- | --- | --- |
| G-9c0b sitemap filter | G-20t1 moved `filter: (page)` to `sitemap-exclusions.mjs` | Assert `sitemap-exclusions.mjs` + `buildSitemapIntegrationBlock` in astro-generator |
| G-9d data pages wiring | G-20u6 moved `applyGosakiScheduleDataPages` to `site-generator-hooks.mjs` | Assert hooks module + `gosakiScheduleBundle` in astro-generator |

`buildNextManualSteps()` now includes `--site ${siteKey}` in convert hint text.
