# G-20u18 — package.json / CLI default decoupling

**Phase:** `G-20u18-package-json-cli-default-decoupling`  
**Base:** `a544998` (G-20u16 committed)  
**Scope:** Low-risk script / CLI default cleanup — **no FTP / deploy / DB write**

## Goal

Reduce implicit Gosaki inline defaults in `package.json` and CLI entrypoints. Generic flows require explicit `--site` / `--site-key` + `--profile`. Gosaki convenience scripts remain as named legacy wrappers.

## Generic usage

```bash
# Full pipeline (preferred)
npm run build:site-package -- --site gosaki-piano --profile staging
npm run verify:site-package -- --site gosaki-piano --profile staging
npm run preflight -- --site gosaki-piano --profile staging

# Manual-upload package only (after build)
npm run manual-upload:site-package -- \
  --site-key pilot-sample-static \
  --profile staging \
  --public-dir output/static-public/pilot-sample-static/public-dist \
  --out output/manual-upload/pilot-sample-static

# URL-to-staging dry-run
npm run url:staging -- --site gosaki-piano --dry-run

# Freshness (explicit site)
npm run verify:package-freshness -- --site gosaki-piano --profile staging
```

**Upload rule:** rebuild at current HEAD → `preflight` PASS required before manual FTP. Stale package → freshness STOP (expected).

## Gosaki convenience scripts (retained)

| Script | Resolves to |
| --- | --- |
| `build:gosaki:staging` | `build-site-package --site gosaki-piano --profile staging` |
| `build:gosaki:production` | `build-site-package --site gosaki-piano --profile production` |
| `verify:gosaki:staging` | `verify-site-package --site gosaki-piano --profile staging` |
| `preflight:gosaki:staging` | `run-site-preflight --site gosaki-piano --profile staging` |
| `manual-upload:package:gosaki:staging` | `create-manual-upload-package --site-key gosaki-piano --profile staging …` |
| `manual-upload:package:gosaki:production` | `create-manual-upload-package --site-key gosaki-piano --profile production …` |
| `url:staging:gosaki` | `url-to-staging-pipeline --site gosaki-piano --dry-run` |
| `verify:package-freshness:gosaki:staging` | `verify-package-upload-freshness --site gosaki-piano --profile staging` |

## Legacy backward-compat aliases

| Alias | Points to |
| --- | --- |
| `manual-upload:package` | `manual-upload:package:gosaki:staging` |
| `manual-upload:package:gosaki-production` | `manual-upload:package:gosaki:production` |
| `verify:package-freshness:staging` | `verify:package-freshness:gosaki:staging` |
| `verify:package-freshness:production` | `verify:package-freshness:gosaki:production` |
| `verify:manual-upload` | `verify-manual-upload-package.mjs` (Gosaki staging legacy wrapper) |

## CLI changes

### `create-manual-upload-package.mjs`

- **Removed:** implicit defaults (`siteSlug=gosaki-piano`, `deployBase`, `stagingUrl`)
- **Required:** `--site-key` (or `--site`), `--public-dir`, `--out`
- **Added:** `--profile` alias for `--package-profile`
- Registry fills deploy paths when `--site-key` + `--profile` provided

### `verify-manual-upload-package.mjs`

- Documented as legacy Gosaki staging wrapper; prefer `verify:gosaki:staging`

### `verify-package-upload-freshness.mjs`

- Unchanged CLI; `--profile`-only still resolves legacy Gosaki via `package-freshness-target.mjs`
- npm `verify:package-freshness:staging` now uses explicit `--site gosaki-piano`

## Pilot flow (unchanged)

```bash
npm run build:pilot:staging:dry-run
npm run verify:pilot:staging
npm run preflight:pilot:staging
npm run url:staging:pilot
```

## Safety

- No FTP / deploy / mirror / DB write
- Production upload still gated (`TBD_G-20i`, preflight STOP)

## Verifier

```bash
npm run verify:g20u18-cli-decoupling
```

## Next (G-20u17+)

- Post-build verifier registry (`POST_BUILD_VERIFIERS` in build core)
- Rename `includeGosakiReadOnlyAdmin` → generic admin flag
