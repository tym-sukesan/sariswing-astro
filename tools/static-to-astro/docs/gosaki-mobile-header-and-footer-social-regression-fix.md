# G-8g1 — gosaki mobile header and footer social regression fix

Phase: `G-8g1-gosaki-mobile-header-and-footer-social-regression-fix`  
Date: 2026-06-14  
Prior phase: `G-8g-gosaki-header-footer-mobile-regression-fix` (commit `8d9b18e`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issues (after G-8g operator upload)

| Area | Issue |
| --- | --- |
| **SP header** | Background looked yellow (`#fffccc`) instead of natural beige |
| **SP header (nav open)** | Large yellow panel; logo and nav in unnatural 2-column layout |
| **Footer SNS** | CSS mask icons rendered broken / unrecognizable shapes |
| **Footer SP** | SNS links overlapped copyright text |

## Cause

| Area | Root cause |
| --- | --- |
| **Yellow header** | G-8g set `#fffccc` (Wix menu flyout yellow) on `#SITE_HEADER`, colorUnderlay, and `--bg-overlay-color`; site beige is Wix `--color_42` ≈ `#e0be9a` / `#ead7bd` |
| **Nav open layout** | G-8d `is-nav-open #comp-mbdw7xid { flex:1 1 100%; order:3 }` + G-8g flex-wrap/order on mesh made nav comp expand beside logo; toggle + nav share `#comp-mbdw7xid` |
| **Broken SNS icons** | G-8g CSS `mask-image` + data URI SVG unreliable across browsers; Wix PNG hidden but mask shapes incomplete |
| **SNS/copyright overlap** | `#LnkBr2` / `#WRchTxtx` share Wix grid cell with fixed heights (`46px`) and desktop `left:` offsets; mask pseudo-elements added extra box size without vertical stack clearance |

## Fix implemented

### Site-specific (`gosaki-piano-overrides.mjs` — G-8g1)

**Header (all widths + SP)**

- Replace `#fffccc` with opaque `#ead7bd` on `#SITE_HEADER`, underlay layers, `--bg-overlay-color`
- `.global-nav` background → `#fff` (not yellow)

**SP nav open @768px**

- Row 1: mesh `flex-wrap: nowrap`, logo order 1 / nav comp order 2 — stable logo + hamburger
- Override G-8d full-width `#comp-mbdw7xid` on open
- `.global-nav` → `position:absolute; top:100%; width:100%` under header (row 2 dropdown, white background)

**Footer SNS (all widths)**

- Disable G-8g mask `::before` icons
- Hide Wix PNG `<img>`
- Text fallback via `::after`: `Facebook` / `X` / `Instagram`
- Footer mesh → flex column, `grid-area:auto`, auto heights, gap between SNS and copyright

**PC nav**

- G-8g PC horizontal nav rules retained (G-8g1 only overrides header beige color globally)

### SNS strategy

**Text fallback** (chosen) — CSS-only, no HTML transform, no external CDN.

### Verifier

`verify-url-to-staging-pipeline.mjs`: G-8g1 block, `#ead7bd`, nav absolute dropdown, footer text fallback, footer stack layout.

## Header result

- SP: opaque natural beige sticky bar; MENU open → logo/hamburger row 1 stable, nav vertical on row 2 (white panel)
- PC: horizontal nav unchanged; beige header (not yellow)

## Footer social result

- Centered text links: Facebook / X / Instagram
- Copyright below with gap — no overlap

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 105 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

- Built CSS: `_astro/index.owM6dQVy.css`
- Manual package: 14 files, `safeForStaticFtp: true`

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** new `_astro/index.*.css` hash and all HTML pages
3. SP ~375px: beige header (not yellow), MENU open 2-row layout, footer text SNS + copyright stacked centered
4. PC: horizontal nav still visible
5. No mirror/delete sync

## Known remaining differences

- SNS are text links, not brand logo icons (intentional safe fallback)
- Discography spacing unchanged (G-8g values retained — out of G-8g1 scope)
- Real-device QA recommended after upload

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Gates

```txt
gosakiMobileHeaderAndFooterSocialRegressionFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
