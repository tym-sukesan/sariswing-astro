# G-10i1 — gosaki About bands/projects images package prep

Phase: `G-10i1-gosaki-about-bands-projects-images-package-prep`  
Date: 2026-06-25

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/`

## Source images (Operator-placed)

Directory: `fixtures/gosaki-piano/assets/about/bands/`

| Order | Band | File | Size |
| --- | --- | --- | --- |
| 1 | ごさきりかこTrio | `gosakirikako_trio.jpg` | 524×696 |
| 2 | 新谷健介オノマトペ | `onomatopoeia.jpg` | 696×524 |
| 3 | ケアレスホーネッツ | `careless_hornets.jpg` | 696×524 |
| 4 | 紀々音(ききおと) | `kikioto.jpg` | 524×696 |
| 5 | カリビアンファンクション | `caribbean_function.jpg` | 696×524 |

## Implementation

1. **`gosaki-piano-about-content.json`** — replaced 5× `.band-profile__placeholder` with `<img class="band-profile__image">`; paths `../assets/about/bands/*.jpg`; removed forced `aspect-ratio` / `object-fit` crop on images.
2. **`astro-generator.mjs`** — `copyImageAssets` preserves `assets/` subtree (not flattened to `images/` basename).

G-10h4b / G-10h4d markers unchanged. No image file create/modify/delete by Cursor.

## Gates

```txt
gosakiAboutBandsProjectsImagesPackagePrepComplete: true
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
node tools/static-to-astro/scripts/verify-g10i1-gosaki-about-bands-projects-images-package-prep.mjs
```

## Operator next step

Re-upload `output/manual-upload/gosaki-piano/public-dist/` (include `assets/about/bands/` and `_astro/`). **Cursor does not upload.**

## Next phase

`G-10h5-2a-gosaki-staging-manual-upload-by-operator` — operator upload + About bands image visual QA.
