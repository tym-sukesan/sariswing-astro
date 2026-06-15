# G-8d — gosaki mobile visual parity fix

Phase: `G-8d-gosaki-mobile-visual-parity-fix`  
Date: 2026-06-14  
Prior phase: `G-8c-wix-static-export-responsive-baseline-generalization`

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`  
Priority page: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

## Observed issue

After G-8b/G-8c, gosaki staging mobile preview no longer had major horizontal scroll, but **visual parity with Wix production SP layout was poor**:

- Header: short beige band, small logo, MENU placement unlike production
- Discography: album title / image / Track List / Personnel order and spacing unnatural; desktop mesh offsets still visible in typography
- About: bio + photo stacking readable but heading scale and photo sizing still desktop-ish
- Contact: title/photo/form vertical flow needed tighter SP padding and full-width form

Root cause: G-8c **common baseline** resets mesh to flex column but does not reproduce Wix **mobile-specific layout** (component order, header proportions, page title scale). PC crawl HTML lacks Thunderbolt `device-mobile` CSS variants.

## Cause

1. Wix static export uses `device-desktop` body class — production mobile breakpoint CSS never activates.
2. Discography repeater items (`comp-llexymga__*`) DOM order is **title → image → text** (desktop grid); Wix SP shows **image → title → body**.
3. Fixed desktop widths remain on repeater shell (`#comp-llexymel` 825px, items 824px) until site-specific overrides.
4. Header mesh places logo and nav in one grid cell with desktop `left:` offsets; baseline column stack does not match production SP header (large logo + MENU top-right).
5. Page titles (`#comp-jqy0szge`, `#WRchTxt16`, `#WRchTxt4`) keep desktop `left:385px`-class positioning context and 199px width until centered SP rules applied.

## Fix implemented

### Site-specific only (`gosaki-piano-overrides.mjs` — G-8d block)

G-8c baseline **unchanged**. All G-8d rules live in `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs`.

**Header @768px**

- Taller header padding (`min-height: 5.5rem`)
- Header mesh → flex row: logo `#comp-mbdw9tzc` large (`clamp(22px, 6vw, 28px)`), MENU `#comp-mbdw7xid` right-aligned
- Nav open: full-width vertical panel below logo row

**Discography @768px**

- Page title `#comp-jqy0szge`: centered, large (`clamp(28px, 7vw, 35px)`)
- Repeater `#comp-llexymel` + items `[id^="comp-llexymga__"]`: full width, generous padding
- Repeater item grid → flex column with CSS `order`: image `jshobkm1` → title `lley9r5x` → Track List `lley4qy2` → Personnel `lley693e` / `llez4vdq`
- Album images `min(75vw, 280px)` centered

**About @768px**

- `#WRchTxt16` centered large heading
- Bio `#comp-jrqh3smr` + photo `#comp-jrtenw0n` full-width vertical stack; photo centered `min(85vw, 320px)`
- Section padding on `#comp-lol1i5l0` mesh container

**Contact @768px**

- `#WRchTxt4` centered page title
- Intro `#comp-j8pza50e`, photo `#comp-jsh29kfc`, form `#comp-jqbwo704` full-width vertical stack
- Form inputs 100% width

### Verifier

`verify-url-to-staging-pipeline.mjs`: G-8d assertions for discography/header/about/contact mobile rules; baseline must not contain gosaki discography comp IDs.

## Pages targeted

| Page | G-8d changes |
| --- | --- |
| Discography | **Primary** — 1-column, image-first order, title scale |
| About | Heading scale, bio/photo stack, padding |
| Contact | Title, photo/form stack, form width |
| Header (all pages) | Logo scale, MENU right, nav panel |
| Home / Link / Schedule | Baseline G-8c only (no G-8d page rules) |

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 72 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

- Built CSS: `_astro/index.BeQxkV9Y.css` (includes G-8c baseline + G-8d gosaki overrides)
- Manual package: 14 files, `safeForStaticFtp: true`
- G-8d marker present in `global.css` and composed override output

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` contents → `/cms-kit-staging/gosaki-piano/`
2. **Must include** `_astro/index.BeQxkV9Y.css` (new hash) and all HTML pages
3. Hard refresh on phone / DevTools mobile (375px width)
4. Check Discography: image above title, no sideways scroll, readable Track List
5. Check Header: large logo, MENU top-right, nav opens vertically
6. Check About / Contact: vertical stack, readable text, full-width form
7. No mirror/delete sync

## Known remaining mobile differences

- Not pixel-perfect Wix Thunderbolt mobile — static export preview target
- Wix internal component micro-spacing may differ
- Contact form non-functional (Wix backend)
- Home hero / Link / Schedule month pages not given page-specific G-8d polish
- Real-device QA recommended after operator upload

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Gates

```txt
gosakiMobileVisualParityFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
