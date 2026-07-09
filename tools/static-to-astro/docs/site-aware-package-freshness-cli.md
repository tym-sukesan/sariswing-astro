# G-20u10 — Site-aware package freshness CLI

**Phase:** `G-20u10-site-aware-package-freshness-cli`  
**Base commit:** `8db175d`  
**Gate:** `siteAwarePackageFreshnessCliComplete: true`

## Goal

Extend G-20t6 package freshness preflight so `--site` + `--profile` resolve the package path from the site registry, while keeping `--package-dir` and legacy `--profile`-only Gosaki scripts working.

## CLI specification

```bash
node scripts/verify-package-upload-freshness.mjs [options]
```

| Option | Description |
| --- | --- |
| `--site SITE_KEY` | Registry site key |
| `--profile NAME` | `staging` \| `production` (default: `staging`) |
| `--package-dir PATH` | Explicit package dir (**wins** over `--site`/`--profile`) |

### Resolution order

1. **`--package-dir`** → use path directly (`resolution: package-dir`)
2. **`--site` + `--profile`** → registry `manualUploadOut` (`resolution: registry`)
3. **`--profile` only** → legacy Gosaki default (`resolution: legacy-gosaki-profile`)

Unknown `siteKey` or missing profile → **clear error, exit 1**.

## Registry resolution flow

```
verify-package-upload-freshness.mjs
  └─ resolvePackageFreshnessTarget({ siteKey, profileName, packageDir })
       └─ resolvePackageManifestMetaFromRegistry(siteKey, profile)
            └─ manualUploadOut → output/manual-upload/...
  └─ verifyPackageUploadFreshness(packageDir, repoRoot)
       └─ MANIFEST.sourceCommit === git HEAD ?
```

## Supported targets

| Invocation | Package path |
| --- | --- |
| `--site gosaki-piano --profile staging` | `output/manual-upload/gosaki-piano` |
| `--site gosaki-piano --profile production` | `output/manual-upload/gosaki-piano-production` |
| `--site pilot-sample-static --profile staging` | `output/manual-upload/pilot-sample-static` |
| `--profile staging` (legacy) | `output/manual-upload/gosaki-piano` |
| `--package-dir PATH` | explicit |

## npm scripts

| Script | Command |
| --- | --- |
| `verify:package-freshness` | generic CLI (pass `--site` / `--profile`) |
| `verify:package-freshness:staging` | `--profile staging` (legacy Gosaki) |
| `verify:package-freshness:production` | `--profile production` (legacy Gosaki) |
| `verify:package-freshness:pilot` | `--site pilot-sample-static --profile staging` |

Examples:

```bash
npm run verify:package-freshness -- --site gosaki-piano --profile staging
npm run verify:package-freshness -- --site pilot-sample-static --profile staging
```

## Backward compatibility

- `preflight:gosaki:*` unchanged (uses legacy `--profile` scripts)
- `--package-dir` unchanged
- Core freshness logic (`verifyPackageUploadFreshness`) unchanged

## Verification

```bash
cd tools/static-to-astro
node scripts/verify-g20u10-site-aware-package-freshness-cli.mjs
```

## Package freshness state

On-disk packages after G-20u9 commit are **stale** at `8db175d` until regen at current HEAD. Freshness CLI returns **STOP** for stale packages — expected.

**Commit after regen → stale again** until rebuild + freshness PASS.

## Not executed

- FTP / deploy  
- DB write  
- Package upload  

## Next

- Wire `preflight:gosaki:*` to explicit `--site gosaki-piano` (optional cosmetic)
- `preflight:pilot:staging` npm convenience script
