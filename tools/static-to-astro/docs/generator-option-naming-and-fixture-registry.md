# G-20u19 — Generator option naming and fixture registry

**Phase:** `G-20u19-generator-option-naming-and-fixture-registry`  
**Base:** `14214dd` (G-20u17 committed)  
**Scope:** Generic `scheduleBundle` / `discographyBundle` option names; registry-based fixture matching; reduce Gosaki-specific leaks in generator core.

## Problem (G-20u16 C items)

| Item | Before | Issue |
| --- | --- | --- |
| Option names | `gosakiScheduleBundle`, `gosakiDiscographyBundle` | Semantic leak in convert / astro-generator / url-to-staging |
| Fixture detect | `isGosakiPianoFixture(siteDir)` in hook `matchFixture` | Basename heuristic outside registry |
| Hook context | `ctx.gosakiScheduleBundle` only | Gosaki naming in shared hook contract |

## Solution

### 1. Generic bundle options — `site-generator-options.mjs`

Primary names:

- `scheduleBundle`
- `discographyBundle`

Legacy aliases (accepted on input, mirrored on output for backward compat):

- `gosakiScheduleBundle` → `scheduleBundle`
- `gosakiDiscographyBundle` → `discographyBundle`

`normalizeSiteDataBundles(options)` resolves either naming style. `astro-generator.mjs` uses generic names internally; return object includes both generic and legacy keys.

### 2. Registry fixture match — `site-fixture-match.mjs`

- `matchRegistryFixtureDir(siteDir, siteKey)` — compares input basename to registry `fixtureDir`
- `resolveRegisteredSiteKeyFromFixtureDir(siteDir)` — delegates to `resolveSiteKeyFromFixtureDir`
- `isLegacyGosakiPianoFixture(siteDir)` — registry-based Gosaki match (for gosaki-only modules)

`site-generator-hooks.mjs` Gosaki `matchFixture` uses `matchRegistryFixtureDir(siteDir, GOSAKI_SITE_KEY)` instead of `isGosakiPianoFixture`.

`isGosakiPianoFixture` remains in `gosaki-about-band-profiles.mjs` as **deprecated** legacy helper for gosaki-specific inject modules (About, YouTube, Contact, footer, admin).

### 3. Call sites updated

| Module | Change |
| --- | --- |
| `convert-static-to-astro.mjs` | Passes `scheduleBundle` / `discographyBundle` |
| `url-to-staging-pipeline.mjs` | Same |
| `astro-generator.mjs` | `normalizeSiteDataBundles`; hook ctx uses generic names |
| `site-generator-hooks.mjs` | Hook methods read `ctx.scheduleBundle ?? ctx.gosakiScheduleBundle` |

## Hook resolution (unchanged order)

1. Explicit `options.siteKey` + registered factory
2. Registry `fixtureDir` basename match
3. Per-site `matchFixture()` fallback (now registry-based for Gosaki)
4. `DEFAULT_SITE_GENERATOR_HOOKS` (pilot / unknown)

## Adding a new site

1. Register `fixtureDir` in `config/sites/registry.json`.
2. Pass `scheduleBundle` / `discographyBundle` from `loadSiteSupabaseDataForBuild` into `generateAstroProject`.
3. Register hook factory in `SITE_GENERATOR_HOOK_FACTORIES` if site-specific transforms are needed.
4. Do **not** add new `gosaki*` option names to generator core.

## Legacy compatibility

- Input: `gosakiScheduleBundle` still accepted via `normalizeSiteDataBundles`.
- Output: `generateAstroProject` return includes `gosakiScheduleBundle` alias pointing to `scheduleBundle`.
- Gosaki-specific modules may still call `isGosakiPianoFixture` (deprecated).

## Verifier

```bash
cd tools/static-to-astro
npm run verify:g20u19-generator-options
```

## Related

- G-20u6 hook registry: `site-generator-hooks.mjs`
- G-20u13 Supabase loaders: `site-aware-supabase-loaders.mjs`
- G-20u16 audit: `remaining-site-specific-coupling-audit.md`
