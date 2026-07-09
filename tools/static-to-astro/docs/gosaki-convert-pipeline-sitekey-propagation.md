# G-20u7 — Convert pipeline siteKey propagation

**Phase:** `G-20u7-convert-pipeline-sitekey-propagation`  
**Base commit:** `528b06a`  
**Gate:** `convertPipelineSiteKeyPropagationComplete: true`

## Goal

Pass registry `siteKey` explicitly from the convert/build pipeline into `generateAstroProject` / `resolveSiteGeneratorHooks`, reducing reliance on fixture basename and `matchFixture()` implicit detection for multi-site safety.

## siteKey propagation path

```
build-site-package.mjs --site gosaki-piano
  └─ runSitePackageBuild({ siteKey })
       └─ buildConvertCliArgs(siteKey, profile)
            └─ convert-static-to-astro.mjs … --site gosaki-piano
                 └─ resolveEffectiveConvertSiteKey(explicit, fixtureDir)
                 └─ generateAstroProject(…, { siteKey: effectiveSiteKey })
                      └─ resolveSiteGeneratorHooks(siteDir, { siteKey })
```

**Legacy wrappers** (`build-gosaki-staging-admin-package.mjs`, `build-gosaki-production-package.mjs`) call `runSitePackageBuild({ siteKey: GOSAKI_SITE_KEY })` — unchanged.

## Resolution order

### Convert CLI (`resolveEffectiveConvertSiteKey`)

1. **`--site SITE_KEY`** — validated via `assertRegisteredSiteKey` (unknown → clear error)
2. **`resolveSiteKeyFromFixtureDir`** — registry `fixtureDir` basename match
3. **`null`** — no siteKey (generator uses hook fallbacks only)

### Generator hooks (`resolveSiteGeneratorHooks`)

1. **`options.siteKey`** when hook factory registered (**preferred**)
2. Registry `fixtureDir` basename
3. `matchFixture()` fallback (G-20u6 backward compat)
4. `DEFAULT_SITE_GENERATOR_HOOKS` (noop)

## Changes

| File | Change |
| --- | --- |
| `site-registry.mjs` | `resolveSiteKeyFromFixtureDir`, `assertRegisteredSiteKey` |
| `build-site-package-core.mjs` | `buildConvertCliArgs()`; convert step passes `--site` |
| `convert-static-to-astro.mjs` | `--site` flag; uses `resolveEffectiveConvertSiteKey`; passes `siteKey` to generator; Gosaki data load keyed by `GOSAKI_SITE_KEY` |
| `convert-site-key.mjs` | `resolveEffectiveConvertSiteKey` helper |
| `astro-generator.mjs` | unchanged surface — already accepts `options.siteKey` |
| `site-generator-hooks.mjs` | resolution order documented |

## Unknown site policy

| Context | Behavior |
| --- | --- |
| `build-site-package --site UNKNOWN` | **Error** at registry lookup (existing G-20u2) |
| `convert --site UNKNOWN` | **Error** — `Unknown siteKey "…"` |
| Convert without `--site`, unregistered fixture | `siteKey: null` → noop hooks |
| Explicit `gosaki-piano` on any fixture dir | Gosaki hooks via factory (siteKey wins) |

## Backward compatibility

- Fixture basename / `matchFixture` fallback **retained**
- `build-gosaki-*` wrappers **unchanged**
- Standalone convert without `--site` still works for `fixtures/gosaki-piano`
- No wrapper removal · no large renames

## Verification

```bash
cd tools/static-to-astro
node scripts/verify-g20u7-convert-pipeline-sitekey-propagation.mjs
npm run build:gosaki:staging:dry-run
```

## Package freshness

On-disk packages are **freshness STOP** until regen at current HEAD. **Commit after regen → stale** — rebuild + `verify:package-freshness:*` before upload.

## Full staging regen verification (G-20u7 follow-up)

**Executed at HEAD `528b06a` (2026-07-10).** siteKey propagation 後の staging full regen + package verify を実施。

| Check | Result |
| --- | --- |
| `npm run build:gosaki:staging` | **PASS** — 29 files · `--site gosaki-piano` via convert |
| `verify:gosaki:staging` | **PASS** |
| `verify:site-package` | **PASS** · MANIFEST `siteKey: gosaki-piano` |
| `verify:package-freshness:staging` | **PASS** (fresh at `528b06a`) |
| `verify-g20u7` | **40/40 PASS** |
| `/schedule/2026-08/` | **14 cards** · supabase |
| `/2026-08/` legacy stub | **present** |
| sitemap | `/schedule/2026-08/` present · `/admin/` absent |
| Hooks | Discography / About / Contact / YouTube / admin — **intact** |

**Gate:** `g20u7FullStagingRegenVerified: true`

**Commit note:** G-20u7 を commit すると HEAD が進み、直後の on-disk package は **stale** になる。

## Not executed

- FTP / deploy  
- DB write / SQL  
- Full staging regen (optional)  

## Next

- **G-20u8** — second-site pilot with explicit siteKey + noop hooks
- Generalize Gosaki Supabase data loaders behind siteKey-aware adapters
