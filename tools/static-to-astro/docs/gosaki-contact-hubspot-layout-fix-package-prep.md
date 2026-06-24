# G-10g2 — gosaki Contact HubSpot layout fix package prep

Phase: `G-10g2-gosaki-contact-hubspot-layout-fix-package-prep`  
Date: 2026-06-24  
Prior phase: `G-10g1-gosaki-contact-hubspot-embed-implementation-and-package-prep` (commit `aa352ac`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`

## Problem

After G-10g1 operator upload, HubSpot form displayed on `/contact/` but layout differed from original Wix:

- **Observed:** photo on top/left; HubSpot form full-width below
- **Expected:** PC — photo left, form right (like Wix); mobile — vertical stack OK

## Root cause

Original Wix mesh (`#comp-lol1i5gqinlineContent-gridContainer`) placed photo (`#comp-jsh29kfc`) and form wrapper (`#comp-jqbwo704`) in the **same grid row** with different `left` offsets (`76px` vs `346px`). G-10g1 replaced `#comp-jqbwo704` with `#gosaki-contact-hubspot-embed`, removing Wix mesh placement rules. Existing G-8e CSS targeted `#comp-jqbwo704` only — not the HubSpot wrapper.

## Fix implemented

Contact-only CSS in `gosaki-piano-overrides.mjs` (G-10g2 block):

| Viewport | Behavior |
| --- | --- |
| PC (`min-width: 769px`) | 2-column CSS grid on contact mesh container: heading full-width; intro above form column; photo col 1 / form col 2 |
| Mobile (`max-width: 768px`) | Existing baseline flex column stack unchanged |

Also extended G-8d/G-8e mobile form rules to `.gosaki-contact-hubspot-embed`.

**Not changed:** HubSpot allowlist, `gosaki-contact-hubspot-embed.mjs` hook logic, About HTML CMS / G-10h4b / G-10h4d markers.

## Gates

```txt
gosakiContactHubspotLayoutFixPackagePrepComplete: true
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
node tools/static-to-astro/scripts/verify-g10g2-gosaki-contact-hubspot-layout-fix-package-prep.mjs
```

## Verification results

| Check | Astro | public-dist | manual-upload |
| --- | --- | --- | --- |
| HubSpot script (`21392032.js`) | **1** | **1** | **1** |
| `hs-form-frame` | **1** | **1** | **1** |
| Wix form `#comp-kei80g91` | **removed** | **removed** | **removed** |
| `.gosaki-contact-hubspot-embed` | **yes** | **yes** | **yes** |
| G-10g2 PC grid CSS | global.css | `_astro/*.css` bundle | same bundle |
| `noindex` | n/a | **yes** | **yes** |
| `deployBase` | yes | **yes** | **yes** |
| `safeForStaticFtp` | — | **true** | **true** |

About page markers / content from G-10h4b/G-10h4d **unchanged** in this convert.

## Operator next step

Re-upload `output/manual-upload/gosaki-piano/public-dist/` contents to `/cms-kit-staging/gosaki-piano/` via FileZilla (include `_astro/`). **Cursor does not upload.**

## Next phase

`G-10h5-2a-gosaki-staging-manual-upload-by-operator` — operator manual upload + visual QA (About + Contact layout).
