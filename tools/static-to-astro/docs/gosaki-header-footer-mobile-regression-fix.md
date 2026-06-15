# G-8g — gosaki header/footer mobile regression fix

Phase: `G-8g-gosaki-header-footer-mobile-regression-fix`  
Date: 2026-06-14  
Prior phase: `G-8f-gosaki-mobile-visual-refinement`

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issues (after G-8f operator upload)

| Area | Issue |
| --- | --- |
| **PC header** | Horizontal nav (Home / About / Discography / Contact / Link) not visible |
| **SP header (nav open)** | Logo shifts upward when MENU opens |
| **SP header (sticky)** | Semi-transparent overlay; content bleeds through |
| **SP Discography** | Image / title / Track List vertical gaps still too wide |
| **Footer SNS** | Icons + copyright slightly right of center (desktop mesh `left:` offsets) |
| **Footer SNS icons** | Wix PNG icons look dated |

## Cause

| Area | Root cause |
| --- | --- |
| **PC nav** | Wix mesh keeps logo `#comp-mbdw9tzc` and nav `#comp-mbdw7xid` in the same grid cell with `left:371px`; baseline `:has(.global-nav)` sets `width:100%` without resetting mesh offsets on desktop — nav comp collapses or sits off-layout |
| **SP logo shift** | G-8d `is-nav-open` rule moves `#comp-mbdw7xid` to `order:3; flex:1 1 100%`, pulling logo row alignment (`align-items:flex-start` from G-8d) |
| **SP transparency** | Wix `#SITE_HEADER { --bg-overlay-color: rgba(var(--color_42), 0.6) }` shows through sticky header |
| **Discography spacing** | G-8d + G-8f cumulative margins/padding/gap on `#comp-jqy0szge`, `[id^="comp-llexymga__"]`, track list wrappers |
| **Footer offset** | `#LnkBr2 { left:415px }`, `#WRchTxtx { left:766px }` in Wix mesh; G-8f centering at `@768px` only partially reset |
| **SNS icons** | Wix LinkBar renders PNG `<img>` from wixstatic CDN |

## Fix implemented by area

### Site-specific (`gosaki-piano-overrides.mjs` — G-8g)

**PC header `@media (min-width: 769px)`**

- Header mesh → flex row, logo left / nav right
- Reset `#comp-mbdw9tzc`, `#comp-mbdw7xid` mesh `left` / margin / width
- `.global-nav ul` → horizontal flex; `.nav-toggle { display:none }`
- Opaque beige header background

**SP header `@media (max-width: 768px)`**

- Opaque `#fffccc` background (override Wix overlay alpha)
- `.nav-toggle { display:inline-flex }`; panel hidden until `is-nav-open`
- Nav open: logo + hamburger stay on row 1 (`align-self:center`); nav drops to row 2 full width (overrides G-8d `order:3` on nav comp)

**Footer (all widths)**

- Reset `#LnkBr2`, `#WRchTxtx` mesh offsets; flex center
- Hide Wix PNG `<img>`; inject modern icons via CSS `mask-image` + inline SVG data URIs (Facebook, X `[aria-label^="X"]`, Instagram)
- Gray `#7a6f65`, minimal hover opacity

**Discography `@768px`**

- Tighter margins on title, album repeater, image, track list (supersedes G-8d/G-8f values)

### Verifier

`verify-url-to-staging-pipeline.mjs`: G-8g block — PC nav, PC hamburger hidden, SP hamburger visible, opaque SP header, nav-open logo stability, footer center, discography compact, SNS mask icons.

## PC header result

- Logo left, horizontal nav right (Home / About / Discography / Contact / Link)
- MENU button hidden on desktop

## SP header result

- Sticky opaque beige bar; square hamburger right
- Nav open: logo stays vertically centered; vertical nav below

## Footer SNS result

- SNS icons + copyright centered
- Modern inline SVG mask icons (no external CDN)

## Discography spacing result

- Reduced image → title → Track List → Personnel vertical rhythm on SP

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 98 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

- Built CSS: `_astro/index.C9wUprmu.css`
- Manual package: 14 files, `safeForStaticFtp: true`

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** `_astro/index.C9wUprmu.css` (new hash) and all HTML pages
3. PC: confirm horizontal nav visible, no hamburger
4. SP ~375px: opaque sticky header, logo stable on menu open, centered footer SNS, tighter Discography
5. No mirror/delete sync

## Known remaining differences

- Not Wix pixel-perfect; client-preview target
- Contact form still non-functional until HubSpot phase
- Schedule month pages not given G-8g page-specific polish
- Real-device QA recommended after upload

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Gates

```txt
gosakiHeaderFooterMobileRegressionFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
