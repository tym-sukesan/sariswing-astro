# G-8g6 — gosaki footer social final alignment fix

**Phase:** `G-8g6-gosaki-footer-social-final-alignment-fix`  
**Date:** 2026-06-14  
**Baseline commit (unchanged):** `a78a8d8`  
**Status:** local only — **commit / push deferred** (`commitDeferredForVisualBatch: true`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issue

After G-8g5 manual upload:

- Footer SNS still appeared slightly right-shifted
- Only **Facebook** visible; **X** and **Instagram** missing
- Copyright alignment (original: right on desktop) interacted poorly with SNS centering attempts

Discography SP spacing from G-8g5 remained OK — out of scope for this phase.

## Cause

| Factor | Effect |
| --- | --- |
| Wix `#LnkBr2` inline CSS | `width: 150px; height: 46px; left: 415px` — icon-bar era constraints |
| G-8g1 `::after` text fallback on empty `<a>` | Fragile; pseudo-text on `inline` anchors inside clipped 150px bar |
| G-8g5 flex centering on `#LnkBr2` | Could not fully overcome Wix mesh offset + fixed width; long text labels overflow/clipped |
| Hidden Wix `<img>` + mask/::after stack | Only first label (Facebook) reliably visible in operator preview |

**Root cause:** Patching legacy Wix SNS markup with CSS-only text fallback was unstable. All three URLs existed in HTML but were not reliably rendered.

## Fix implemented (A案 — injected text block)

### 1. `gosaki-footer-social.mjs` (new)

- `extractGosakiFooterSocialLinks()` — reads `#LnkBr2 a[href]` + `aria-label`
- `injectGosakiFooterSocialBlock()` — inserts `<nav class="gosaki-footer-social-links">` before `#WRchTxtx`
- `generateGosakiFooterAstro()` — used for gosaki-piano `Footer.astro` generation

### 2. `astro-generator.mjs`

- gosaki-piano fixtures use `generateGosakiFooterAstro()` instead of plain `generateComponent()` for footer

### 3. `gosaki-piano-overrides.mjs` (G-8g6)

- `#LnkBr2 { display: none !important; }` — hide legacy Wix SNS bar
- `.gosaki-footer-social-links` — flex center, `gap: 1.5rem`, fit-content
- `#WRchTxtx` — centered on SP; right-aligned on PC (≥769px), no overlap with SNS

## SNS strategy

**Injected plain text links** (recommended path) — not CSS `::after`, not mask icons.

```html
<nav class="gosaki-footer-social-links" aria-label="Social links">
  <a href="https://www.facebook.com/goto.saki.3" …>Facebook</a>
  <a href="https://twitter.com/goto_saki_pf" …>X</a>
  <a href="https://www.instagram.com/gosaakiii/?hl=ja" …>Instagram</a>
</nav>
```

## SNS URLs found

| Label | URL | Status |
| --- | --- | --- |
| Facebook | `https://www.facebook.com/goto.saki.3` | **Found** in fixture/footer HTML |
| X | `https://twitter.com/goto_saki_pf` | **Found** (`aria-label="X  "`) |
| Instagram | `https://www.instagram.com/gosaakiii/?hl=ja` | **Found** |

No SNS URL confirmation pending.

## Verification results (no FTP, no commit)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 143 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS (15 files)
```

Built checks:

- `gosaki-footer-social-links` with Facebook / X / Instagram text + real hrefs
- Legacy `#LnkBr2` hidden via CSS
- Schedule month/hub, nav/hamburger, discography structure — regression OK

Built CSS: `_astro/index.DDeUkkyc.css` (hash changed from G-8g5 `index.CIiMPcyq.css`).

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** updated `_astro/index.*.css` (hash changes each build) and all HTML
3. Verify footer: **Facebook / X / Instagram** centered, even spacing, copyright below (not overlapping)
4. Verify discography SP spacing, schedule hub/month, hamburger — unchanged
5. No mirror/delete sync

## Known remaining differences

- Legacy `#LnkBr2` remains in DOM (hidden) — harmless for static export
- Copyright PC right-align vs original Wix may differ slightly in padding
- Contact HubSpot replacement still deferred

## Safety

| Action | Executed? |
| --- | --- |
| FTP / mirror / delete | **No** |
| workflow_dispatch / DB | **No** |
| `output/` commit | **No** |
| Git commit / push | **No** |

## Gates

```txt
gosakiFooterSocialFinalAlignmentFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
commitDeferredForVisualBatch: true
```
