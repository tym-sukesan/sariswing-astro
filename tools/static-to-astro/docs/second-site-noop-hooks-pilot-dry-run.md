# G-20u8 — Second-site noop hooks pilot dry-run

**Phase:** `G-20u8-second-site-noop-hooks-pilot-dry-run`  
**Base commit:** `d3e8ff7`  
**Gate:** `secondSiteNoopHooksPilotDryRunComplete: true`

## Goal

Confirm G-20u2–u7 infrastructure (registry, generic build/verify, hook registry, siteKey propagation) works for a **non-Gosaki pilot site** using **default/noop hooks** only. No real customer onboarding, FTP, DB write, or production deploy.

## Pilot site design

| Field | Value |
| --- | --- |
| **siteKey** | `pilot-sample-static` |
| **fixture** | Existing `fixtures/sample-static-site` (4 pages — no new large site) |
| **hooks** | None registered → `DEFAULT_SITE_GENERATOR_HOOKS` (noop) |
| **profiles** | **staging only** in registry |
| **production** | Not registered — `build --profile production` fails at registry |
| **includesAdmin** | `false` |
| **includeGosakiReadOnlyAdmin** | `false` |
| **deployBase** | `/cms-kit-staging/pilot-sample-static/` |
| **publicBaseUrl** | `https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static/` |

### Files added

| File | Purpose |
| --- | --- |
| `config/sites/registry.json` | `pilot-sample-static` entry |
| `config/sites/pilot-sample-static.deploy-profiles.json` | Staging deploy paths (dry-run) |

### Not added

- Gosaki hook factory entry
- Supabase data loaders
- Production profile / FTP / DB

## siteKey propagation (pilot)

```
build-site-package.mjs --site pilot-sample-static --profile staging
  └─ buildConvertCliArgs → convert --site pilot-sample-static
       └─ generateAstroProject({ siteKey: "pilot-sample-static" })
            └─ resolveSiteGeneratorHooks → DEFAULT (noop, active: false)
```

## Noop hooks behavior

| Check | Pilot | Gosaki |
| --- | --- | --- |
| `hooks.active` | `false` (explicit `siteKey` preserved, no factory) | `true` |
| `generateFooter` | `null` → generic Footer | Gosaki footer |
| `applyPostGenerate` | noop summaries | band/about/YouTube/contact/admin |
| Gosaki artifacts in output | **none** | present |
| `admin/index.astro` | **absent** | present (staging) |

## Gosaki mis-apply prevention

- `SITE_GENERATOR_HOOK_FACTORIES` has **only** `gosaki-piano`
- Explicit `--site pilot-sample-static` does not register a factory → merge defaults only
- `fixtures/sample-static-site` basename does not match `gosaki-piano` registry fixtureDir
- `matchFixture()` for Gosaki returns false on sample fixture

## Build / verify adjustments (minimal)

| Change | Reason |
| --- | --- |
| `verify-site-package-core` | Schedule `/2026-08/` checks scoped to `gosaki-piano` only |
| `build-site-package-core` | Skip Gosaki admin env validation for non-gosaki sites |
| `POST_BUILD_VERIFIERS` | Pilot staging → `verify-site-package.mjs` |
| `buildPostBuildVerifierArgs` | Generic `--site` / `--profile` for verify-site-package |

## Verification

```bash
cd tools/static-to-astro
node scripts/verify-g20u8-second-site-noop-hooks-pilot-dry-run.mjs
node scripts/build-site-package.mjs --site pilot-sample-static --profile staging --dry-run
node scripts/build-site-package.mjs --site gosaki-piano --profile staging --dry-run
```

Local minimal convert (gitignored `output/_g20u8-pilot-sample-astro`):

- No `gosaki-*` data/components
- No `admin/index.astro`

## Package freshness

On-disk Gosaki package remains **freshness STOP** until regen at current HEAD. Pilot output is gitignored. **Commit after any regen → stale.**

## Not executed

- FTP / deploy  
- DB write / SQL  
- Full pilot package build (`npm run build` in astro output)  
- Production profile  
- Client preview  

## Next

- **G-20u9** — optional full pilot package build + verify-site-package (without Gosaki schedule gates)
- **G-20u10** — site-specific hook factory for a real 2nd customer (when approved)
- Generalize Supabase data loaders behind siteKey adapters
