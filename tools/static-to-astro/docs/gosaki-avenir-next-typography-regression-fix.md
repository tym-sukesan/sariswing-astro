# G-9b3 — Gosaki Avenir Next typography regression fix

Phase: `G-9b3-gosaki-avenir-next-typography-regression-fix`

## Problem

After G-9b2 font safety (Avenir Next replacing `futura-lt-w01-book`), Discography page title broke across lines:

```txt
Discograph
y
```

Font-family was correctly sanitized; layout was not.

## Root cause

Wix inline CSS sets fixed widths on page-title rich text components sized for Futura:

| Page | Comp ID | Wix `width` |
|---|---|---|
| Discography | `#comp-jqy0szge` | `199px` |
| About | `#WRchTxt16` | `136px` |
| Contact | `#WRchTxt4` | `155px` |

Avenir Next at `font-size: 35px` is wider than Futura in the same box. On mobile (`max-width: 768px`), G-8d already sets `width: 100%` on `#comp-jqy0szge`; the regression appears on **PC**.

Contributing factor on SP: baseline `overflow-wrap: anywhere` on `.wixui-rich-text` — mitigated for title comps only, not blanket.

## Fix

`gosaki-piano-overrides.mjs` — G-9b3 block:

- **PC (`min-width: 769px`)**: `width: auto`, center page title boxes; `white-space: nowrap` on title h4 / logo / nav / schedule hub title / Track List & Personnel labels only.
- **SP (`max-width: 768px`)**: `overflow-wrap: normal` on title comps (no blanket nowrap — avoids horizontal overflow).

Font safety unchanged — no `futura-lt-w01-book` restored.

## Wix class cleanup

`wixui-rich-text__text` and other Wix class names remain intentionally. Cleanup deferred to a future componentization phase (removing now risks layout regressions).

## Target pages

`/discography/` (primary), `/about/`, `/contact/`, header logo, nav, `/schedule/`, month pages, Track List / Personnel subheadings.

## Verification

```bash
cd tools/static-to-astro
npm run verify:gosaki-font-safety
npm run verify:url-staging
npm run verify:crawl
npm run verify:gosaki-schedule-seed
```

Local rebuild: convert + build + `manual-upload:package` (`output/` not committed).

## Deferred (out of G-9b3 scope)

- **`/` home horizontal scroll** on PC (Playwright file:// dist): pre-existing Wix `min-width` / mesh layout — not introduced by G-9b3. Track under future **gosaki responsive cleanup** phase; does not block this commit.

## Gates

```txt
gosakiAvenirNextTypographyRegressionFixComplete: true
discographyHeadingWrapFixed: true
wixFontSafetyStillPassed: true
wixClassCleanupDeferred: true
gosakiDesignRegressionAfterTypographyFix: false
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```
