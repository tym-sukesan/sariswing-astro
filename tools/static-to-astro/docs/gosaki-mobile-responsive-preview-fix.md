# G-8b — gosaki mobile responsive preview fix

Phase: `G-8b-gosaki-mobile-responsive-preview-fix`  
Date: 2026-06-16  
Prior phase: `G-8a-gosaki-about-band-profiles-section` (commit `bf0009e`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issue

After G-8a manual upload, PC staging preview was close to production Wix, but **mobile layout was broken**:

- Horizontal overflow / page wider than viewport
- Header/nav awkward width and position
- About bio + photo shrunk and hard to read
- Bands / Projects section narrow / left-aligned on mobile
- Contact page remained desktop-width layout
- Unnatural spacing, font sizes, and image sizes on small screens

G-7j mobile check was **PENDING**; operator confirmed issues on real phone widths.

## Cause

### Primary: Wix desktop mesh layout without mobile runtime

1. Astro `body` uses `device-desktop` (static export default) — Wix mobile CSS variants are not activated without Thunderbolt JS.
2. Wix `compCssMappers` sets **`min-width:980px`** on section components (e.g. `#comp-lol1i5l0` About, contact sections).
3. Mesh grid children use **980px-centered desktop positioning**: `margin: … calc((100% - 980px) * 0.5); left:656px` etc., with fixed widths (`#comp-jrqh3smr` 467px, `#comp-jrtenw0n` 266px).
4. On viewports &lt; 980px (iPhone SE 375px), sections enforce min-width and absolute-ish grid offsets → **horizontal scroll**, shrunk content, overlapping columns.

### Secondary

- G-7i nav mobile rules existed (`@media max-width:767px`) but page content still forced desktop width.
- G-8a `BandProfilesSection` had basic 1-column breakpoint but could appear narrow when parent overflowed.

## Fix implemented

### 1. `wix-staging-visual-overrides.mjs` — G-8b block

- `html, body.wix-static-export { overflow-x: clip; max-width: 100% }`
- Page wrappers `#SITE_PAGES`, `.i0StQr`, containers: `min-width:0; max-width:100%`
- Global `img`, `form`, `input`, `textarea`: responsive max-width
- **`@media (max-width:768px)`**:
  - Reset section `min-width:0 !important` on `.Le88gL` / `.wixui-section`
  - Mesh `inlineContent-gridContainer` → **flex column**, children `width:100%`, reset `left`/`margin-left` grid offsets
  - About: centered heading, full-width bio text (15px / 1.75 line-height), photo `min(85vw,320px)` centered
  - Contact: full-width form fields and wrappers
  - Header nav container `width:100%`
- **`@media (max-width:480px)`** — tighter padding / photo size

G-7i / G-7i2 rules retained (hero underlay, footer isolation, nav fallback).

### 2. `BandProfilesSection.astro` — mobile polish

- `width:100%`, `box-sizing:border-box` on section/cards
- 1-column grid (existing) + image `min(85vw,320px)` centered
- `@media (max-width:480px)` tighter padding

### 3. Verifier smoke tests

`verify-url-to-staging-pipeline.mjs`: G-8b block presence, mesh flex reset, section min-width clamp, BandProfiles mobile query.

## Files inspected

| Path | Finding |
| --- | --- |
| `output/gosaki-piano-astro/src/styles/global.css` | `min-width:980px` on `#comp-lol1i5l0` etc.; mesh `calc((100% - 980px) * 0.5)` |
| `scripts/lib/wix-staging-visual-overrides.mjs` | G-8b mobile block added |
| `templates/site-extensions/gosaki-piano/BandProfilesSection.astro` | Mobile width/padding improved |
| `scripts/lib/astro-generator.mjs` | `body class="wix-static-export device-desktop responsive"` (unchanged) |
| `scripts/lib/header-transform.mjs` | Nav toggle targets `#SITE_HEADER` (unchanged) |

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 59 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

- Built CSS: `_astro/index.DFhgPQ9c.css` (includes G-8b mobile rules)
- Manual package: 14 files

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` contents → `/cms-kit-staging/gosaki-piano/`
2. **Must include** `_astro/index.DFhgPQ9c.css` (new hash) and all HTML pages
3. Hard refresh on phone / DevTools mobile (375px width)
4. Check: no major horizontal scroll; About stacks vertically; Bands 1-column; Contact form full width; MENU toggle works
5. No mirror/delete sync

## Known remaining mobile differences

- Not pixel-perfect Wix mobile — static export preview target
- Wix Thunderbolt mobile breakpoint switching not replicated
- Some Wix component internal spacing may differ from production
- Contact form still non-functional (Wix backend)
- Real-device QA recommended after upload (G-7j mobile was PENDING)

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Gates

```txt
gosakiMobileResponsivePreviewFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
