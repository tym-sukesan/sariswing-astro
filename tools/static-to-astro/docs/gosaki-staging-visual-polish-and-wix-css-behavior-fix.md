# G-7i — gosaki staging visual polish and Wix CSS behavior fix

Phase: `G-7i-gosaki-staging-visual-polish-and-wix-css-behavior-fix`  
Date: 2026-06-16  
Prior phase: `G-7h-gosaki-staging-css-asset-fix` (commit `59e81b7`)

## Observed issue

After G-7h manual re-upload, staging at `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`:

- HTML / images / `_astro` CSS load correctly (200)
- **KV (hero) image** has a semi-transparent brown/cream overlay
- **Layout** partially matches Wix but not fully
- **MENU / navigation** looks unnatural (MENU label + unstyled list)

## Cause

### KV overlay (A + B)

1. Wix hero section `#comp-lol1i5k0` sets `--bg-overlay-color:rgba(var(--color_41), 0.3)` via `compCssMappers_mainPage` inline CSS (`color_41` = `255,248,241` cream).
2. Section includes `[data-testid="colorUnderlay"]` (`.LNYVZi.ayCf9D`) filled from `--bg-overlay-color`.
3. Without Thunderbolt JS / full Wix shell (`SITE_CONTAINER`, `masterPage`, hydrated bg media), the underlay reads as a visible wash over the KV image.
4. Page-level `.pTvOx2.wixui-page[data-testid="page-bg"]` absolute layer can add extra tint in static export.

### MENU / navigation (D)

1. `header-transform.mjs` replaces Wix `StylableHorizontalMenu` (menuMode-4) with custom `nav-toggle` + `global-nav`.
2. Toggle script queried `.site-header` but gosaki header is `#SITE_HEADER` → **menu JS never ran**.
3. No fallback CSS for `.global-nav` / `.nav-toggle` in Wix bundle → desktop nav looked like raw list + MENU button.

## Files inspected

| Path | Finding |
| --- | --- |
| `fixtures/gosaki-piano/index.html` | `#comp-lol1i5k0` colorUnderlay; `--bg-overlay-color:rgba(var(--color_41), 0.3)` |
| `output/gosaki-piano-astro/src/components/Header.astro` | Custom nav; broken `.site-header` selector |
| `scripts/lib/header-transform.mjs` | Nav replacement + inline script |
| `output/gosaki-piano-astro/src/styles/global.css` | Wix inline CSS ingested (G-7h) |
| `output/manual-upload/gosaki-piano/public-dist/` | `_astro/index.*.css`, deployBase hrefs OK |

## Fix implemented

1. **`scripts/lib/wix-staging-visual-overrides.mjs`** — gosaki/Wix static export override CSS:
   - Hide hero `#comp-lol1i5k0` colorUnderlay; transparent section overlay vars
   - Hide static page-bg tint layer (`.pTvOx2[data-testid="page-bg"]`)
   - Disable view-transition navigation side effects
   - Force Wix preload opacity helpers visible
   - Header nav fallback (horizontal desktop / collapsible mobile)
2. **`astro-generator.mjs`** — append overrides when inline Wix head styles detected; `body` class `wix-static-export device-desktop responsive`
3. **`header-transform.mjs`** — menu toggle targets `#SITE_HEADER` instead of `.site-header`
4. **`verify-url-to-staging-pipeline.mjs`** — G-7i override smoke tests

## public-dist / package

| | Count |
| --- | ---: |
| public-dist files | 14 |
| manual-upload files | 14 |
| CSS bundle | `_astro/index.*.css` (~418 KB, includes override rules) |

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 48 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

- `safeForStaticFtp: true`, `cssPresenceOk: true`
- Built CSS contains `#comp-lol1i5k0 [data-testid=colorUnderlay]{display:none}` and `#SITE_HEADER .global-nav` rules
- `index.html` has `body class="wix-static-export device-desktop responsive"`

## FTP not executed

No FTP connect / upload / mirror / delete from Cursor.

## Manual re-upload instructions (operator)

1. Use `output/manual-upload/gosaki-piano/` (or zip).
2. Upload **contents** of `public-dist/` to `/cms-kit-staging/gosaki-piano/` including `_astro/`.
3. No mirror/delete sync.
4. Browser QA:
   - KV image without brown wash overlay
   - Desktop: horizontal nav links in header
   - Mobile width: MENU toggles nav panel
   - `_astro/*.css` returns 200

## Known remaining visual differences

- Wix Thunderbolt JS / animations not replicated (external-js risks remain)
- Font rendering may differ (Wix CDN fonts vs system fallbacks)
- Schedule month pages use live-crawl `YYYY-MM/` routes; original Wix menuMode-4 flyout columns not restored (replaced by flat nav)
- Contact form still Wix-origin markup (non-functional without Wix backend)
- Pixel-perfect match to production Wix not guaranteed — staging preview quality target

## Gates

```txt
gosakiStagingVisualPolishComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
