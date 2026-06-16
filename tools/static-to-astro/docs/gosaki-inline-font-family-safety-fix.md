# G-9b2 — Gosaki inline font-family safety fix

Phase: `G-9b2-gosaki-inline-font-family-safety-fix`

## Problem

After G-9b1 manual upload, DevTools still showed Wix font names in HTML inline styles:

```css
font-family: futura-lt-w01-book, sans-serif;
```

Example: logo `SAKI GOTO Website` on `span.wixui-rich-text__text` in `Header.astro`.

G-9b1 sanitized `global.css` and page body fragments via `path-transform.mjs`, but **header HTML** emitted by `header-transform.mjs` bypassed sanitization.

## Root cause

| Location | Issue |
|---|---|
| `header-transform.mjs` | `Header.astro` shell written without `sanitizeWixFontHtml()` |
| `wix-font-safety.mjs` | Regex `[^;"']+` missed quoted `font-family: 'futura-lt-w01-book'` |
| `wix-font-safety.mjs` | No cheerio walk of all `[style]` attributes; `--fnt` / `font:` shorthand partial |

## Fix

1. **`sanitizeWixFontHtml()`** — cheerio walks every `[style]` attribute; each value through `sanitizeWixFontCss()`
2. **`rewriteFntAndFontShorthand()`** — rewrites `--fnt:` and `font:` containing Wix face names
3. **`rewriteFontFamilyDeclarations()`** — supports quoted font-family values
4. **`header-transform.mjs`** — sanitize shell **before** `wrapHeaderLogoWithHomeLink()` (never after Astro `{withBase(...)}` injection — cheerio corrupts Astro attrs)
5. **`path-transform.mjs`** — uses `sanitizeWixFontHtml()` for page fragments
6. **`verify-gosaki-font-safety.mjs`** — inline/`--fnt`/nested span tests; scans generated `src/`, `public-dist`, manual-upload package

## Replacement stacks

Display / logo / nav / headings (was `futura-lt-w01-book`):

```css
font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
```

Body (was `avenir-lt-w01_*`):

```css
font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
```

## Verification (local)

```bash
cd tools/static-to-astro
npm run verify:gosaki-font-safety    # 37 passed
npm run verify:url-staging         # 156 passed
npm run verify:crawl               # 30 passed
npm run verify:gosaki-schedule-seed # 36 passed
```

Regenerated (gitignored `output/`):

- `output/gosaki-piano-astro/` (convert + build)
- `output/static-public/gosaki-piano/public-dist/` (`safeForStaticFtp: true`)
- `output/manual-upload/gosaki-piano/` (package PASS)

`public-dist` blocked-pattern grep: **0 matches** for `futura-lt-w01`, `avenir-lt-w01`, `@font-face`, parastorage/wixstatic woff URLs.

## Gates

```txt
gosakiInlineFontFamilySafetyFixComplete: true
futuraLtW01BookRemovedFromGeneratedHtml: true
avenirLtW01RemovedFromGeneratedHtml: true
wixFontFaceOutputBlocked: true
manualUploadPublicDistFontSafe: true
gosakiDesignRegressionAfterInlineFontFix: false
readyToCommitInlineFontSafetyFix: true
readyToPushFontSafetyCommits: false
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Not in scope

- DB write / FTP / workflow_dispatch / `/admin`
- Commit `output/` or fixtures
