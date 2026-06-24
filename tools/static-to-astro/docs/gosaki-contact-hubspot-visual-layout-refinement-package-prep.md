# G-10g3 — gosaki Contact HubSpot visual layout refinement package prep

Phase: `G-10g3-gosaki-contact-hubspot-visual-layout-refinement-package-prep`  
Date: 2026-06-24  
Prior phase: `G-10g2-gosaki-contact-hubspot-layout-fix-package-prep` (commit `04eadd9`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`

## Problem (post G-10g2 operator upload)

HubSpot form displayed beside photo, but visual balance still off:

1. Contact title left-aligned vs other pages (centered)
2. Photo–form gap too wide
3. Intro text (`#comp-j8pza50e`) awkwardly placed in form column only

## Root cause

G-10g2 used `grid-template-columns: minmax(209px, 360px) minmax(320px, 640px)` on a `max-width: 980px` container. The second column expanded (~720px) while the photo stayed ~209px, creating excess horizontal space. Title had `justify-self: center` but not scoped `text-align: center` on `#WRchTxt4 h4` within the contact mesh, and Wix residual positioning competed with the 2-column grid. Intro was in grid column 2 only (above form), not centered across the content block.

## Fix implemented

Refined G-10g2 block in `gosaki-piano-overrides.mjs` (G-10g3):

| Item | Change |
| --- | --- |
| Container | `width: fit-content`, `max-width: min(100%, 1000px)`, `margin-inline: auto` |
| Grid columns | `320px 560px`, `column-gap: 56px` |
| Title `#WRchTxt4` | full-width row, `text-align: center` on wrapper + h4 |
| Intro `#comp-j8pza50e` | full-width row, `max-width: 560px`, centered |
| Photo / HubSpot | row 3, columns 1 / 2; form `max-width: 560px` |

**Not changed:** HubSpot allowlist/hook, About CMS, G-10h4b/G-10h4d markers.

## Gates

```txt
gosakiContactHubspotVisualLayoutRefinementPackagePrepComplete: true
readyForG10h5_2aGosakiStagingManualUploadByOperator: true
cursorFtpUploadExecuted: false
cursorDbWriteExecuted: false
cursorImageOpsExecuted: false
```

## Local commands (executed)

```bash
cd tools/static-to-astro
rm -rf output/gosaki-piano-astro
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician \
  --verify-build

node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md

npm run manual-upload:package
npm run verify:manual-upload
```

Verifier:

```bash
node tools/static-to-astro/scripts/verify-g10g3-gosaki-contact-hubspot-visual-layout-refinement-package-prep.mjs
```

## Verification results

| Check | Astro | public-dist | manual-upload |
| --- | --- | --- | --- |
| HubSpot script (`21392032.js`) | **1** | **1** | **1** |
| `hs-form-frame` | **1** | **1** | **1** |
| Wix form `#comp-kei80g91` | **removed** | **removed** | **removed** |
| G-10g3 centered title / tightened grid CSS | global.css | `_astro/*.css` | same bundle |
| `noindex` | n/a | **yes** | **yes** |
| `deployBase` | yes | **yes** | **yes** |
| `safeForStaticFtp` | — | **true** | **true** |

## Operator next step

Re-upload `output/manual-upload/gosaki-piano/public-dist/` (include `_astro/`) to `/cms-kit-staging/gosaki-piano/` via FileZilla. **Cursor does not upload.**

## Next phase

`G-10h5-2a-gosaki-staging-manual-upload-by-operator` — operator re-upload + visual QA (Contact title center + column balance).
