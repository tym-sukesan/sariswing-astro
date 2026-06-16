# Gosaki font and Wix asset license safety audit (G-9b1)

**Phase:** `G-9b1-gosaki-font-and-wix-asset-license-safety-audit`  
**Date:** 2026-06-16  
**Prior:** `G-9b-gosaki-schedule-data-seed-planning` (commit `e97a047`)  
**Status:** audit + sanitizer implementation — **no DB, no FTP, no output commit**

---

## 1. Purpose

Gosaki staging preview is built from Wix live-crawl HTML. Wix inline CSS embeds proprietary webfonts (`futura-lt-w01-book`, `avenir-lt-w01_*`) via `@font-face` URLs on `static.parastorage.com`. Redistributing these in a static Astro export creates license risk.

This phase:

1. Inventories font / CDN references in repo + `output/` (read-only)
2. Implements `sanitizeWixFontCss()` in the convert pipeline
3. Replaces site overrides / templates that referenced `futura-lt-w01-book`
4. Documents residual image CDN risks (separate phase)

**Not in scope:** image migration off `static.wixstatic.com`, manual upload, FTP.

---

## 2. Audit summary

### 2.1 Source repo (excluding `output/`, `node_modules`)

| Location | Finding | Risk | G-9b1 action |
| --- | --- | --- | --- |
| `fixtures/gosaki-piano/*.html` | ~542 `@font-face` lines; ~255 `futura` / `avenir-lt-w` refs in inline `<head><style>` | **High** — Wix proprietary | Sanitized at convert time (fixtures unchanged) |
| `gosaki-piano-overrides.mjs` | 8× `futura-lt-w01-book` in site CSS | **High** — explicit proprietary name | Replaced with safe system stack |
| `BandProfilesSection.astro` | 3× futura, 1× avenir Wix face | **High** | Replaced |
| `astro-generator.mjs` | Inlined Wix head CSS → `global.css` unfiltered | **High** | `sanitizeWixFontCss()` on inline + final CSS |
| `path-transform.mjs` | Inline `style="font-family:avenir-lt-w01…"` in page HTML | **Medium** | `sanitizeWixInlineFontStyles()` |
| `verify-url-staging-pipeline.mjs` | Previously asserted futura **present** | Test drift | Now asserts futura **absent** |
| `fixtures/realistic-static-site` | Google Fonts link | N/A for Gosaki | Unchanged (non-gosaki fixture) |
| `src/layouts/BaseLayout.astro` (Sariswing) | Google Fonts | Out of Gosaki scope | **Not modified** |

### 2.2 `output/` (investigation only — not committed)

Prior `output/gosaki-piano-astro/src/styles/global.css` (pre-G-9b1):

| Metric | Before | After sanitizer (simulated) |
| --- | ---: | ---: |
| `@font-face` | 234 | 0 |
| `futura` | 24+ | 0 |
| `avenir-lt-w` | many | 0 |
| Wix `woff` URLs | 234 | 0 |

Simulated post-sanitizer `global.css` passes `isFontSafeForStaticExport()`.

### 2.3 `futura-lt-w01-book` origin map

| Layer | Present? | Notes |
| --- | --- | --- |
| Wix inline CSS (fixture) | **Yes** | Primary source — `@font-face` + `font-family` + `--fnt` CSS vars |
| `global.css` (generated) | **Was yes** | Copied from inline head via `collectInlineHeadStyles()` |
| Site overrides | **Was yes** | G-8g nav/hub styling intentionally used Futura name |
| `BandProfilesSection.astro` | **Was yes** | Injected About section |
| Public `src/` (Sariswing site) | No | Separate product |

---

## 3. Replacement policy

### 3.1 No new external font loading

- **Do not** add `fonts.googleapis.com` / `fonts.gstatic.com`
- Use system-installed + generic fallbacks only

### 3.2 Safe stacks (G-9b1)

**Display / headings** (replaces Futura LT W01):

```css
font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
```

**Body** (replaces Avenir LT W01 Wix faces):

```css
font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
```

`Avenir Next` is a common macOS system font — not bundled or fetched.

### 3.3 Sanitizer (`wix-font-safety.mjs`)

| Step | Function | Effect |
| --- | --- | --- |
| 1 | `stripFontFaceBlocks()` | Remove `@font-face { … }` blocks |
| 2 | `stripWixFontUrls()` | Remove `url(…parastorage|wixstatic…woff…)` |
| 3 | `rewriteFontFamilyDeclarations()` | Rewrite `font-family:` with Wix tokens |
| 4 | `rewriteWixFontNameTokens()` | Rewrite standalone tokens in `--fnt:` / shorthand |
| 5 | `sanitizeWixInlineFontStyles()` | HTML inline `style="font-family:…"` |
| 6 | `isBlockedExternalStylesheetHref()` | Drop Google/Wix font CDN `<link>` in BaseLayout |

Wired in:

- `astro-generator.mjs` — inline head + final `global.css`
- `path-transform.mjs` — all HTML fragments

---

## 4. Image / SVG / SNS assets (inventory — not replaced)

| Asset type | Current state | License note | Phase |
| --- | --- | --- | --- |
| Page images | `static.wixstatic.com` URLs in HTML | Hotlink / Wix ToS — review before production | G-4 / Storage migration |
| Favicon | `static.parastorage.com/client/pfavico.ico` | Wix default | Future: local favicon |
| Footer SNS | Text links (G-8g6) — no Wix icon masks in export | Low font/icon risk | Done |
| Discography covers | Wix CDN in HTML | Same as images | Storage pipeline |

**G-9b1:** fonts only. Images remain external CDN references.

---

## 5. General rules for future Kit customers

```txt
1. Never ship Wix @font-face or parastorage/wixstatic font URLs in static export
2. Run sanitizeWixFontCss() on all Wix-derived CSS before build
3. Site overrides must use system/generic stacks — not Wix font face names
4. Do not add Google Fonts unless customer provides license + self-hosting plan
5. Inventory wixstatic images separately; migrate to Supabase Storage before production
6. Fixtures may retain Wix HTML for fidelity — sanitization happens at convert
```

---

## 6. Residual risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Wix images still hotlinked | Medium | Storage migration phase; staging OK for preview |
| macOS-only `Avenir Next` | Low | Falls back to Helvetica Neue / Arial |
| New Wix font face names | Low | `WIX_FONT_NAME_RE` pattern + audit helper |
| Operator uploads pre-G-9b1 `public-dist` | Medium | Re-run convert + manual upload after merge |
| Sariswing `BaseLayout` Google Fonts | N/A Gosaki | Do not touch production Sariswing |

---

## 7. Verification

```bash
cd tools/static-to-astro
npm run verify:gosaki-font-safety   # 21 passed (incl. simulated global.css)
npm run verify:url-staging            # 156 passed
npm run verify:crawl                  # 30 passed
npm run verify:gosaki-schedule-seed   # 36 passed (G-9b extractor unaffected)
```

**Regenerate staging package (operator, post-merge):**

```bash
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
npm run manual-upload:package
# manual upload only — no FTP auto deploy
```

---

## 8. Files changed (G-9b1)

| File | Change |
| --- | --- |
| `scripts/lib/wix-font-safety.mjs` | **New** — sanitizer + audit |
| `scripts/lib/astro-generator.mjs` | Sanitize inline + global CSS; block font CDN links |
| `scripts/lib/path-transform.mjs` | Inline HTML font sanitize |
| `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` | futura → safe stack |
| `templates/site-extensions/gosaki-piano/BandProfilesSection.astro` | futura/avenir → safe stack |
| `scripts/verify-gosaki-font-safety.mjs` | **New** |
| `scripts/verify-url-to-staging-pipeline.mjs` | G-9b1 asserts |
| `package.json` | `verify:gosaki-font-safety` |

---

## 9. Gates (G-9b1)

```txt
gosakiFontAndWixAssetLicenseSafetyAuditComplete: true
futuraLtW01BookRemovedOrRewritten: true
wixFontFaceOutputBlocked: true
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 10. Recommended next phase

```txt
G-9c-gosaki-schedule-seed-sql-planning
```

Operator: after G-9b1 merge, regenerate manual-upload package for font-safe staging CSS before client re-preview.
