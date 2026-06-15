# G-8c — Wix static export responsive baseline generalization

Phase: `G-8c-wix-static-export-responsive-baseline-generalization`  
Date: 2026-06-16  
Prior phase: `G-8b-gosaki-mobile-responsive-preview-fix` (commit `d110529`)

## Background

G-7h through G-8b fixed gosaki-piano Wix live-crawl staging preview issues. Many fixes apply to **any** Wix static export without Thunderbolt JS / `#masterPage`. G-8c splits common baseline from gosaki-specific overrides for reuse on the next Wix pilot.

## What was generalized (Wix common baseline)

| Area | Source phases | Baseline module |
| --- | --- | --- |
| Inline head CSS → `global.css` | G-7h | `static-site-analyzer.mjs` (unchanged) |
| `_astro` CSS + presence verify | G-7h | verifiers (unchanged) |
| `body.wix-static-export` class | G-7i | `astro-generator.mjs` (unchanged) |
| Header/footer bg layer isolation | G-7i2 | `wix-static-export-baseline-overrides.mjs` |
| Page-bg tint disable | G-7i | baseline |
| View-transition / opacity helpers | G-7i | baseline |
| Nav fallback layout (`.global-nav`, `.nav-toggle`, `:has(.global-nav)`) | G-7i | baseline (neutral colors) |
| Mobile overflow-x clip | G-8b | baseline |
| Section `min-width:980px` reset @768px | G-8b | baseline |
| Mesh grid → flex column @768px | G-8b | baseline |
| Generic rich text / image / form full-width @768px | G-8b | baseline (generic selectors) |

**Composer:** `wix-staging-visual-overrides.mjs` appends baseline + site-specific when inline Wix head styles detected.

## What remains gosaki-specific

| Item | Location | Notes |
| --- | --- | --- |
| Home hero `#comp-lol1i5k0` colorUnderlay | `site-specific-overrides/gosaki-piano-overrides.mjs` | Wix comp ID |
| Nav brand colors (futura, #9e3b1b, #fffccc) | gosaki-piano-overrides | Site branding |
| About comp IDs (`#WRchTxt16`, `#comp-jrqh3smr`, `#comp-jrtenw0n`) | gosaki-piano-overrides | Page layout tweaks |
| Bands / Projects section | `BandProfilesSection.astro`, `gosaki-about-band-profiles.mjs` | Not in CSS baseline |
| `gosaki-piano-band-profiles.json` | config | Data, not CSS |

## Files changed

| Path | Role |
| --- | --- |
| `scripts/lib/wix-static-export-baseline-overrides.mjs` | **New** — Wix common CSS baseline |
| `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` | **New** — Gosaki site CSS |
| `scripts/lib/wix-staging-visual-overrides.mjs` | Composer (baseline + site-specific) |
| `scripts/verify-url-to-staging-pipeline.mjs` | G-8c baseline / separation assertions |
| `scripts/lib/manual-upload-package.mjs` | Phase label G-8c |

Unchanged for baseline activation:

- `static-site-analyzer.mjs` — inline CSS collection
- `astro-generator.mjs` — `appendWixStagingVisualOverrides(..., { siteSlug })`
- `header-transform.mjs` — nav fallback markup

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
npm run verify:url-staging    # 65 passed (incl. G-8c separation checks)
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

Gosaki staging output: **unchanged behavior** (baseline + gosaki composed CSS in `global.css`).

## Risks

- **`:has(.global-nav)`** — modern browsers only; acceptable for staging preview
- **Generic mobile image rule** (`min(85vw, 320px)`) may differ from production Wix on some pages — tune per pilot if needed
- **Site-specific comp IDs** still required for hero/About until optional config-driven overrides exist
- New Wix site without `siteSlug` match gets baseline only (no gosaki colors/hero fix)

## Next Wix site application notes

1. Live-crawl fixture → convert with `--deploy-base` / `--base-url` as today
2. Inline Wix head styles trigger baseline automatically
3. Add `site-specific-overrides/<site-slug>-overrides.mjs` for brand colors + known comp IDs
4. Register in `buildWixSiteSpecificOverridesCss()` in `wix-staging-visual-overrides.mjs`
5. Pass `siteSlug` via fixture basename or explicit option in convert pipeline
6. Do **not** copy gosaki band profiles unless requested

## FTP not executed

No FTP / mirror / delete / `workflow_dispatch` / DB from Cursor.

## Gates

```txt
wixStaticExportResponsiveBaselineGeneralized: true
gosakiSpecificExtensionsSeparated: true
readyForNextWixPilot: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
