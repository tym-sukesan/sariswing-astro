# G-10g4 — gosaki Contact photo aspect-ratio fix package prep

Phase: `G-10g4-gosaki-contact-photo-aspect-ratio-fix-package-prep`  
Date: 2026-06-24  
Prior phase: `G-10g3-gosaki-contact-hubspot-visual-layout-refinement-package-prep`

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`

## Problem (post G-10g3 operator upload)

G-10g3 layout OK (title/intro center, 2-column), but PC photo appeared **landscape-cropped** (lower body cut off). SP portrait display was acceptable.

## Root cause

- Wix original: `#comp-jsh29kfc` **209×275px** (`object-fit: cover` on img).
- G-10g3 set `width: 100%; max-width: 320px` without overriding height → Wix **275px height** remained while width expanded to **320px** → landscape container → heavy bottom crop.
- SP rules use `height: auto` on img (`min(75vw, 260px)`) → natural portrait.

## Fix implemented

G-10g4 in `gosaki-piano-overrides.mjs` (PC `@media (min-width: 769px)`, contact-scoped):

| Rule | Value |
| --- | --- |
| Container `#comp-jsh29kfc` | `width: 320px`, `aspect-ratio: 3 / 4`, `overflow: hidden`, mask removed |
| Inner `.apPOZK` | `width/height: 100%` |
| `img` | `object-fit: cover`, `object-position: center top` |

G-10g3 title/intro/grid layout **unchanged**. SP mobile rules **unchanged**.

## Gates

```txt
gosakiContactPhotoAspectRatioFixPackagePrepComplete: true
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
node tools/static-to-astro/scripts/verify-g10g4-gosaki-contact-photo-aspect-ratio-fix-package-prep.mjs
```

## Operator next step

Re-upload `output/manual-upload/gosaki-piano/public-dist/` (include `_astro/`) via FileZilla. **Cursor does not upload.**

## Next phase

`G-10h5-2a-gosaki-staging-manual-upload-by-operator` — operator re-upload + Contact photo visual QA.
