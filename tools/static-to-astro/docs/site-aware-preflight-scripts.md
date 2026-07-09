# G-20u11 — Site-aware preflight scripts

**Phase:** `G-20u11-site-aware-preflight-scripts`  
**Base commit:** `207a455`  
**Gate:** `siteAwarePreflightScriptsComplete: true`

## Goal

Unify operator preflight npm scripts to use explicit `--site` + `--profile` for both structure verify and freshness check. Gosaki, pilot, and future sites share the same build → verify → freshness → preflight flow.

## Operator flow

### Gosaki staging

```bash
cd tools/static-to-astro
npm run build:gosaki:staging
npm run preflight:gosaki:staging
# Manual FTP only — no auto deploy
```

### Gosaki production

```bash
npm run build:gosaki:production
npm run preflight:gosaki:production
# G-20j production upload preflight still required separately
# Upload still STOP (TBD_G-20i + G-20j HOLD)
```

### Pilot staging

```bash
npm run build:site-package -- --site pilot-sample-static --profile staging
# or: npm run build:pilot:staging
npm run preflight:pilot:staging
```

### Generic (any registered site)

```bash
npm run build:site-package -- --site SITE_KEY --profile staging
npm run preflight -- --site SITE_KEY --profile staging
```

## npm scripts

| Script | Command |
| --- | --- |
| `preflight` | generic CLI — pass `--site` / `--profile` |
| `preflight:gosaki:staging` | `--site gosaki-piano --profile staging` |
| `preflight:gosaki:production` | `--site gosaki-piano --profile production` |
| `preflight:pilot:staging` | `--site pilot-sample-static --profile staging` |

### Preflight chain (both steps use `--site` + `--profile`)

```
run-site-preflight.mjs
  ├─ verify-site-package.mjs --site … --profile …
  └─ verify-package-upload-freshness.mjs --site … --profile …
```

## Stale package behavior

Preflight **fails (STOP) at step 2** when the package is **stale** (`MANIFEST.sourceCommit !== git HEAD`). This is **expected and correct**:

- After any git commit, on-disk packages become stale.
- Operator must **rebuild at current HEAD** before preflight PASS.
- Preflight PASS does **not** authorize FTP upload — manual only.

## Legacy compatibility

These scripts are **retained unchanged**:

- `build:gosaki:*` / `build:pilot:*` / `build:site-package`
- `verify:gosaki:*` / `verify:pilot:staging` / `verify:site-package`
- `verify:package-freshness:*` / `verify:package-freshness` / `verify:package-freshness:pilot`

Production upload remains **STOP**.

## Verification

```bash
cd tools/static-to-astro
node scripts/verify-g20u11-site-aware-preflight-scripts.mjs
```

## Not executed

- FTP / deploy  
- DB write  
- Package upload  

## Next

- ~~Wire README/CHECKLIST in manual-upload packages~~ — done in G-20u12
- Add `preflight:pilot:production` when pilot production profile exists
