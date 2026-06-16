# G-8g5 — gosaki discography spacing and footer social alignment fix

**Phase:** `G-8g5-gosaki-discography-spacing-and-footer-social-alignment-fix`  
**Date:** 2026-06-14  
**Baseline commit (unchanged):** `a78a8d8`  
**Status:** local only — **commit / push deferred** (`commitDeferredForVisualBatch: true`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issues

### 1. Discography SP — excessive gap below album image

On `/discography/`, mobile view showed a large empty area between album cover and title. Image → title → Track List felt stretched.

### 2. Footer SNS text — slightly right-shifted, uneven spacing

Footer SNS text fallback (Facebook / X / Instagram) was acceptable in strategy but appeared slightly right of center. Gap between X and Instagram looked wider than Facebook–X.

## Cause

### Discography

| Source | Issue |
| --- | --- |
| Wix inline mesh CSS (`global.css`) | Album card grid `grid-template-rows: repeat(2, min-content) 1fr` reserves stretch row |
| Wix mesh child rules | Title `comp-lley9r5x`: `margin-top: 44px`; image `comp-jshobkm1`: `margin-bottom: 54px`, `left: 57px` / `351px` desktop offsets |
| Wix CSS vars | `[id^="comp-jshobkm1__"] { --height: 260px; --width: 260px }` reserves fixed image box |
| G-8d / G-8f / G-8g | Flex column reorder (image → title) applied but **did not reset** Wix `margin-top: 44px` on title or `--height: 260px` on SP |

Content was present; spacing came from **desktop equal-height grid + fixed image height**, not missing HTML.

### Footer SNS

| Source | Issue |
| --- | --- |
| Wix inline `#LnkBr2` | Fixed `width: 150px; height: 46px` (icon-bar era) too narrow for three text labels |
| Wix mesh | `left: 415px` desktop offset on footer SNS cell |
| Wix vars | `--item-margin-inline: 0px 6px` uneven inline spacing vs flex `gap` |
| G-8g / G-8g1 | Centering rules present but `#LnkBr2` remained `width: 100%` in some rules while inner list `width: auto`, producing visual right bias |

## Fix implemented

**File:** `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` — G-8g5 block

### Discography (SP `@media (max-width: 768px)`, scoped to `#comp-llexymel`)

- Force album mesh containers to `flex` column, `grid-template-rows: none`, `height: auto`
- Reset image wrapper: `--height/width: auto`, `margin-bottom: 0.5rem`, kill fixed height
- Reset title: `margin: 0.375rem 0 0.5rem` (overrides Wix `margin-top: 44px`)
- Reset track-list blocks margins / `left` offsets
- Clear grid-area / justify-self on mesh children

### Footer SNS (all widths)

- `#LnkBr2`: `width: fit-content`, `margin-inline: auto`, override Wix `--item-margin-inline`
- `.tN_ggS`: flex center, `gap: 1.4rem`, `width: fit-content`, `margin-inline: auto`
- `.re13Ik` / `.twXk19`: zero margins, `inline-flex`, `white-space: nowrap`
- `#WRchTxtx`: full-width centered copyright below SNS

**Unchanged:** Schedule hub/month (G-8g3/G-8g4), nav/hamburger (G-8g2), header beige (G-8g1), SNS text fallback strategy.

## Discography spacing result

SP album cards should show tighter image → title → track list flow without large dead space under covers. PC layout largely unchanged (G-8g5 rules are SP-scoped for discography).

## Footer SNS alignment result

SNS text group centered in footer with even `1.4rem` gap; copyright remains centered below with stack gap from G-8g1.

## Verification results (no FTP, no commit)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 135 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS (15 files)
```

Regression checks retained: schedule month `会場` body, hub deployBase links, PC Schedule nav, SP hamburger.

Built CSS: `_astro/index.CIiMPcyq.css` (hash changed from G-8g4 `index.Bargt8YH.css`).

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** updated `_astro/index.CIiMPcyq.css`, all HTML pages
3. Verify `/discography/` SP: image–title gap reduced, natural track list flow
4. Verify footer: Facebook / X / Instagram centered, even spacing, copyright below
5. Verify `/schedule/`, `/2026-07/`, nav Schedule, hamburger unchanged
6. No mirror/delete sync

## Known remaining differences

- Discography PC still uses Wix desktop mesh (intentional — SP-only tightening)
- Footer SNS remains text `::after` fallback (not icons)
- Real-device QA recommended after upload

## Safety

| Action | Executed? |
| --- | --- |
| FTP connect / upload / mirror / delete | **No** |
| workflow_dispatch | **No** |
| DB / Supabase writes | **No** |
| Production deploy | **No** |
| `output/` commit | **No** |
| Git commit / push | **No** |

## Gates

```txt
gosakiDiscographySpacingAndFooterSocialAlignmentFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
commitDeferredForVisualBatch: true
```
