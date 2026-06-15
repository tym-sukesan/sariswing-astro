# G-7h — gosaki staging CSS / asset fix

Phase: `G-7h-gosaki-staging-css-asset-fix`  
Date: 2026-06-16  
Prior phase: `G-7g-gosaki-manual-staging-upload-package`

## Observed issue

After operator manual upload of G-7g `public-dist/` to `/cms-kit-staging/gosaki-piano/`:

- Staging URL loaded: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- HTML body and images visible
- **Layout CSS not applied** — unstyled HTML

## Cause

**Classification: E (Wix inline head CSS not ingested by converter)**

Wix live-crawl HTML has **no** `<link rel="stylesheet">` tags. Layout CSS lives in **22+ inline `<style data-url="https://static.parastorage.com/...">` blocks** in `<head>` (~233 KB total).

The converter only:

1. Collected `<link rel="stylesheet">` → `cssRefs` (empty for gosaki crawl)
2. Built `src/styles/global.css` from internal `.css` files only (none in fixture)
3. Stripped `<link rel="stylesheet">` from body fragments (N/A)

Result: `global.css` was effectively empty → Astro build emitted an **empty** `<style></style>` in `index.html`. G-7g `public-dist` had **13 files**, no `_astro/`, no CSS files.

This was **not** a manual-upload copy bug (C) or deployBase href bug (D). `prepare-public` already copies `_astro/` when present.

## Files inspected

| Path | Finding |
| --- | --- |
| `fixtures/gosaki-piano/index.html` | 22 `<head><style>` blocks, 0 stylesheet links, parastorage `data-url` |
| `output/static-public/gosaki-piano/public-dist/index.html` (before) | Empty `<style></style>`, no `_astro/` link |
| `output/gosaki-piano-astro/src/styles/global.css` (before) | Comments only (~3 lines) |
| `scripts/lib/astro-generator.mjs` | `collectCssFiles` + `buildGlobalCss` ignored inline head styles |
| `scripts/lib/path-transform.mjs` | Removes `<link stylesheet>` from fragments (correct) |
| `scripts/lib/static-public-artifact-verifier.mjs` | Copies `_astro/` when dist includes it; no CSS gate before G-7h |

## Fix implemented

1. **`collectInlineHeadStyles()`** in `scripts/lib/static-site-analyzer.mjs` — dedupe Wix `<head><style>` blocks by `data-url` or content hash.
2. **`buildGlobalCss()`** in `scripts/lib/astro-generator.mjs` — append inline head styles into `src/styles/global.css`.
3. **`verifyPublicDistCssPresence()`** in `scripts/lib/deploy-base.mjs` — fail if no resolvable stylesheet (local `_astro` with deployBase prefix, external URL, or substantial inline CSS).
4. **`resolvePublicDistAssetPath()`** — resolve `/cms-kit-staging/gosaki-piano/_astro/...` hrefs to files under `public-dist/_astro/`.
5. Gates wired into `static-public-artifact-verifier.mjs`, `manual-upload-package.mjs`, `verify-manual-upload-package.mjs`.
6. Regression tests in `verify-url-to-staging-pipeline.mjs` (G-7h CSS checks).

## public-dist file count

| | Count | Notes |
| --- | ---: | --- |
| Before (G-7g) | 13 | HTML + robots + sitemaps only |
| After (G-7h) | 14 | + `_astro/index.Dkvo27x-.css` (416,392 bytes) |

## Manual upload package file count

| | Count |
| --- | ---: |
| Before (G-7g) | 13 |
| After (G-7h) | 14 |

## Built HTML CSS reference (after fix)

```txt
<link rel="stylesheet" href="/cms-kit-staging/gosaki-piano/_astro/index.Dkvo27x-.css">
```

File exists in package: `public-dist/_astro/index.Dkvo27x-.css`

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 46 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS, cssPresenceOk: true
```

- `safeForStaticFtp: true`
- `cssPresenceOk: true`
- `hasResolvableStylesheet: true` (local `_astro` CSS)
- `maxInlineStyleChars: 0` (Astro externalized CSS to `_astro/`)

## FTP not executed

No FTP connect, upload, mirror, or delete from Cursor in this phase.

## Manual re-upload instructions (operator)

1. Regenerated package: `tools/static-to-astro/output/manual-upload/gosaki-piano/` (or zip).
2. FileZilla → remote path `/cms-kit-staging/gosaki-piano/` (**not** account root `/`).
3. Upload **contents** of `public-dist/` including the new **`_astro/` folder** and `index.html`.
4. **Do not** use mirror/sync with delete.
5. Verify in browser:
   - `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
   - DevTools Network: `index.*.css` under `_astro/` returns 200.
6. Follow `CHECKLIST.md` in the package.

## Gates

```txt
gosakiStagingCssAssetFixComplete: true
readyForManualReuploadByOperator: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
