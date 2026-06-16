# G-8g8 — gosaki discography subheading style fix

**Phase:** `G-8g8-gosaki-discography-subheading-style-fix`  
**Date:** 2026-06-14  
**Baseline commit (unchanged):** `a78a8d8`  
**Status:** local only — **commit / push deferred** (`commitDeferredForVisualBatch: true`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

## Observed issue

On `/discography/`, **Track List** and **Personnel** appeared with underlines, looking like links rather than subheadings.

## Cause

| Element | Source |
| --- | --- |
| **Track List** | `#comp-llexymel [id^="comp-lley4qy2__"]` — first `<p>` only |
| **Personnel** | `#comp-llexymel [id^="comp-lley693e__"]` — first `<p>` only |
| **Underline** | Wix inline `style="text-decoration:underline;"` on wrapper `<span>` (not `<a>`) |
| **Font** | `font-size:14px`, normal weight via Avenir light stack |

Track/personnel body lines are in subsequent `<p>` elements in the same rich-text blocks — not affected.

## Fix implemented

**File:** `gosaki-piano-overrides.mjs` — G-8g8 block

Scoped to `#comp-llexymel` (discography repeater only):

```css
#comp-llexymel [id^="comp-lley4qy2__"] > p:first-of-type .wixui-rich-text__text
#comp-llexymel [id^="comp-lley693e__"] > p:first-of-type .wixui-rich-text__text
```

- `text-decoration: none !important`
- `font-weight: 700 !important`
- `font-size: 16px !important` (14px + 2px); SP uses `calc(14px + 2px)`
- Existing `color_17` / Avenir color stack unchanged

**Unchanged:** Footer G-8g7, Schedule G-8g3/4, Discography spacing G-8g5, shop URL underlines in `comp-llez4vdq`.

## Verification results (no FTP, no commit)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
npm run verify:url-staging    # 152 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS (15 files)
```

Built CSS: `_astro/index.D9h1trWb.css` (hash changed from G-8g7 `index.D570eAQi.css`).

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. Include updated `_astro/index.*.css` and all HTML
3. Verify `/discography/`: Track List / Personnel — no underline, bold, slightly larger
4. Footer / schedule / nav unchanged

## Safety

FTP / commit / push: **not executed**

## Gates

```txt
gosakiDiscographySubheadingStyleFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
commitDeferredForVisualBatch: true
```
