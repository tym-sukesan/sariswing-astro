# G-7i2 — gosaki footer layer isolation fix

Phase: `G-7i2-gosaki-footer-layer-isolation-fix`  
Date: 2026-06-16  
Prior phase: `G-7i-gosaki-staging-visual-polish-and-wix-css-behavior-fix`

## Observed issue

After G-7i manual re-upload, staging at `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` still showed a semi-transparent layer over the KV (hero) image.

DevTools selection pointed at footer background markup:

```html
<footer id="SITE_FOOTER" class="... wixui-footer">
  <div ...>
    <div id="bgLayers_SITE_FOOTER">...</div>
  </div>
</footer>
```

The footer background layer appeared to extend over the top of the page, not only the footer region.

## Cause

### Primary: footer bg wrapper anchors to viewport

1. Wix CSS defines `.uZIV9d { position: absolute; inset: 0 }` for header/footer background wrappers.
2. On live Wix, `#masterPage.mesh-layout #SITE_FOOTER { position: relative }` confines that absolute fill to the footer box.
3. Astro `BaseLayout` renders `#SITE_HEADER`, `main`, `#SITE_FOOTER` as **direct `body` children** — no `#masterPage` wrapper.
4. Without `position: relative` on `#SITE_FOOTER`, `.uZIV9d` + `inset: 0` anchors to the initial containing block (viewport), so `#bgLayers_SITE_FOOTER` and its `[data-testid="colorUnderlay"]` paint over the full page including the KV.

### Secondary (already mitigated in G-7i)

- Hero `#comp-lol1i5k0 [data-testid="colorUnderlay"]` — hidden by G-7i override
- Page `.pTvOx2.wixui-page[data-testid="page-bg"]` tint — opacity 0 in G-7i override

### HTML structure (correct)

- Order: `body` → `#SITE_HEADER` → `main` → `#SITE_FOOTER`
- Footer is **not** inside hero; no closing-tag reorder bug found in generated `Footer.astro` / `index.html`.

## Footer / bg layer candidates

| Selector | Role |
| --- | --- |
| `#SITE_FOOTER .uZIV9d` | Absolute fill wrapper (viewport leak without relative footer) |
| `#bgLayers_SITE_FOOTER` | Footer background stack container |
| `#SITE_FOOTER [data-testid="colorUnderlay"]` | Semi-transparent color underlay |
| `#SITE_FOOTER [data-testid="mediaPadding"]` | Media padding layer inside bg stack |
| `#SITE_FOOTER .XKFSfx` | Footer inline content (kept above bg with `z-index: 1`) |
| `.pTvOx2.wixui-page[data-testid="page-bg"]` | Page-level tint (G-7i disabled) |

## Fix implemented

Extended `scripts/lib/wix-staging-visual-overrides.mjs` (G-7i2 block, G-7i rules retained):

```css
body.wix-static-export #SITE_HEADER,
body.wix-static-export #SITE_FOOTER {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

body.wix-static-export #SITE_FOOTER .uZIV9d { /* confined to footer box */ }
body.wix-static-export #SITE_FOOTER [id^="bgLayers_"] { pointer-events: none; }

body.wix-static-export main,
body.wix-static-export #SITE_PAGES,
body.wix-static-export #comp-lol1i5k0 {
  position: relative;
  z-index: 1;
}
```

Also applied symmetric header bg confinement (same `.uZIV9d` pattern).

**Other files:**

- `scripts/verify-url-to-staging-pipeline.mjs` — assertions for footer isolation CSS in overrides source
- `scripts/lib/manual-upload-package.mjs` — phase label `G-7i2-gosaki-footer-layer-isolation-fix`
- `scripts/create-manual-upload-package.mjs` — console label G-7i2

**Unchanged from G-7i:** hero colorUnderlay hide, page-bg tint off, `#SITE_HEADER` nav fallback, `body.wix-static-export`, inline head → `global.css`, `_astro` CSS generation.

## Files inspected

| Path | Finding |
| --- | --- |
| `output/manual-upload/gosaki-piano/public-dist/index.html` | Footer after `main`; `#bgLayers_SITE_FOOTER` inside `#SITE_FOOTER` |
| `output/gosaki-piano-astro/src/components/Footer.astro` | Full Wix footer HTML preserved |
| `output/gosaki-piano-astro/src/styles/global.css` | `.uZIV9d`, `#masterPage.mesh-layout #SITE_FOOTER` rules; G-7i2 overrides appended |
| `scripts/lib/wix-staging-visual-overrides.mjs` | Footer/header isolation overrides |
| `scripts/lib/astro-generator.mjs` | Appends overrides when Wix inline styles detected |
| `scripts/lib/header-transform.mjs` | Nav fallback (unchanged) |

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 50 passed (incl. footer isolation assertions)
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

- `safeForStaticFtp: true`
- Built CSS: `_astro/index.BZ7Sffo0.css` contains `body.wix-static-export #SITE_FOOTER` isolation rules
- Manual package: 14 files (unchanged count)
- New verifier checks:
  - `wix overrides isolate footer bg layers`
  - `wix overrides keep main above footer bg`

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Manual re-upload instructions (operator)

1. Use `output/manual-upload/gosaki-piano/` (or zip).
2. Upload **contents** of `public-dist/` to `/cms-kit-staging/gosaki-piano/` including `_astro/` (new CSS hash: `index.BZ7Sffo0.css`).
3. Hard refresh or cache-bust if old CSS cached.
4. No mirror/delete sync.
5. Browser QA:
   - KV image without semi-transparent wash (footer layer no longer covers hero)
   - Footer still visible at page bottom with expected background
   - Desktop horizontal nav; mobile MENU toggle
   - `_astro/*.css` returns 200

## Known remaining visual differences

- Wix Thunderbolt JS / animations not replicated
- Font rendering may differ from production Wix CDN
- Schedule month routes flat nav (G-7i note)
- Contact form Wix-origin markup (non-functional)
- Pixel-perfect Wix match not guaranteed — staging preview quality target

## Gates

```txt
gosakiFooterLayerIsolationFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
