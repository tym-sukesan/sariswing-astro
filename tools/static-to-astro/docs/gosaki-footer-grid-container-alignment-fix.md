# G-8g7 — gosaki footer grid container alignment fix

**Phase:** `G-8g7-gosaki-footer-grid-container-alignment-fix`  
**Date:** 2026-06-14  
**Baseline commit (unchanged):** `a78a8d8`  
**Status:** local only — **commit / push deferred** (`commitDeferredForVisualBatch: true`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issue

After G-8g6 manual upload, injected `.gosaki-footer-social-links` (Facebook / X / Instagram) still appeared right-shifted. DevTools pointed to `SITE_FOOTERinlineContent-gridContainer` as the shifted parent.

## Cause

| Source | Issue |
| --- | --- |
| Wix inline mesh child rules | `#LnkBr2`: `left:415px; margin: … calc((100% - 980px) * 0.5)` |
| Wix inline mesh child rules | `#WRchTxtx`: `left:766px; margin: … calc((100% - 980px) * 0.5)` |
| Wix grid | Both in same `grid-area: 1/1/2/2; justify-self: start` |
| G-8f PC rule | `padding: 1.5rem calc((100% - 980px) * 0.5)` on gridContainer — asymmetric 980px centering |
| G-8g6 | Centered injected SNS block but **did not reset** Wix child `left` / `margin` selectors |

**Root cause:** Child elements were centered locally, but the **parent mesh container and Wix child positioning** kept desktop offsets. G-8g6 PC `text-align: right` on copyright also conflicted with staging preview goal.

## Fix implemented

**File:** `gosaki-piano-overrides.mjs` — G-8g7 block (after G-8g6)

### Footer grid container reset

- `#SITE_FOOTER`, `.XKFSfx`, `SITE_FOOTERinlineContent`, `SITE_FOOTERinlineContent-gridContainer`:
  - `width: 100%`, `margin: 0 auto`, `left/right: auto`, `display: flex`, `align-items: center`
  - Override G-8f asymmetric `calc((100% - 980px) * 0.5)` padding → symmetric `1rem` / `1.5rem` (PC)

### Mesh children reset

- `gridContainer > *`: `left: auto`, `margin: 0 auto`, `grid-area: auto`, `justify-self: center`

### SNS + copyright (PC/SP)

- `.gosaki-footer-social-links`: centered, `margin: 0 auto 0.75rem`
- `#WRchTxtx` + `p`: **always** `text-align: center` (G-8g6 PC right-align removed)
- `#LnkBr2`: remains hidden (G-8g6)

**Unchanged:** Injected SNS block (`gosaki-footer-social.mjs`), Discography G-8g5, Schedule G-8g3/4, nav G-8g2.

## Footer grid container reset result

Parent mesh containers no longer carry Wix `left:415px` / `left:766px` offsets; footer content stacks centered.

## SNS result

Facebook / X / Instagram text links centered as a group with `gap: 1.5rem`.

## Copyright result

`© 2025 Saki Goto.` centered below SNS on PC and SP; no overlap.

## Verification results (no FTP, no commit)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 148 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS (15 files)
```

Built CSS: `_astro/index.D570eAQi.css` (hash changed from G-8g6 `index.DDeUkkyc.css`).

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** updated `_astro/index.D570eAQi.css` and all HTML
3. Verify footer: SNS + copyright both centered; no right shift
4. Verify discography, schedule, hamburger unchanged
5. No mirror/delete sync

## Known remaining differences

- Hidden `#LnkBr2` still in DOM (CSS `display:none`)
- Original Wix copyright right-align on production not replicated (staging preview prioritizes center)
- Contact HubSpot deferred

## Safety

| Action | Executed? |
| --- | --- |
| FTP / mirror / delete | **No** |
| workflow_dispatch / DB | **No** |
| `output/` commit | **No** |
| Git commit / push | **No** |

## Gates

```txt
gosakiFooterGridContainerAlignmentFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
commitDeferredForVisualBatch: true
```
