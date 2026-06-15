# G-8a — gosaki About band profiles section

Phase: `G-8a-gosaki-about-band-profiles-section`  
Date: 2026-06-16  
Prior phase: `G-7j-gosaki-staging-browser-qa-and-client-preview-readiness`

## Added section

About page (`/about/`) now includes a **Bands / Projects** section after the existing Wix-crawled profile content (bio + photo unchanged).

Five band / project profiles:

1. ごさきりかこTrio
2. 新谷健介オノマトペ
3. ケアレスホーネッツ
4. 紀々音(ききおと)
5. カリビアンファンクション

## Band profile data source

`tools/static-to-astro/config/sites/gosaki-piano-band-profiles.json`

```json
{
  "name": "ごさきりかこTrio",
  "image": "/images/bands/gosakirika-trio.jpg",
  "description": ["段落1", "段落2"]
}
```

At convert time:

- JSON copied to `src/data/gosaki-band-profiles.json` in generated Astro project
- `BandProfilesSection.astro` copied from `templates/site-extensions/gosaki-piano/`
- `about/index.astro` patched to import and render `<BandProfilesSection />` after existing content

Hook: `applyGosakiAboutBandProfiles()` in `scripts/lib/gosaki-about-band-profiles.mjs`, called from `astro-generator.mjs` when fixture basename is `gosaki-piano`.

## Image handling

Expected paths (under generated project `public/images/bands/`):

```txt
/images/bands/gosakirika-trio.jpg
/images/bands/onomatope.jpg
/images/bands/careless-hornets.jpg
/images/bands/kikioto.jpg
/images/bands/caribbean-function.jpg
```

- At build time, component checks `public/` for each image file
- **If missing:** beige dashed placeholder (`Photo` label) — no broken `<img>` icon
- **If present:** `<img>` with `withBase()` for staging deploy path
- Operator can drop JPGs into `public/images/bands/` before rebuild / manual package

## Display design

- Section title: `Bands / Projects`
- Card layout: image left / text right on desktop; stacked on mobile (≤767px)
- Colors aligned with gosaki staging: beige `#fff8f1`, text `#5b4d43`, futura / avenir fonts
- Scoped styles in `BandProfilesSection.astro` (inlined in built About HTML)

## Files changed (committed scope)

| Path | Role |
| --- | --- |
| `config/sites/gosaki-piano-band-profiles.json` | Band data (source of truth) |
| `templates/site-extensions/gosaki-piano/BandProfilesSection.astro` | UI component template |
| `scripts/lib/gosaki-about-band-profiles.mjs` | Load config, inject About page |
| `scripts/lib/astro-generator.mjs` | Apply on `gosaki-piano` fixture convert |
| `scripts/verify-url-to-staging-pipeline.mjs` | G-8a smoke tests |
| `scripts/lib/manual-upload-package.mjs` | Phase label G-8a |

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 55 passed (incl. G-8a band profile checks)
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

Built About page checks:

- `band-profiles` section present in `public-dist/about/index.html`
- All 5 band names rendered
- Placeholder divs when images absent (no broken img)
- `_astro/index.BZ7Sffo0.css` still generated; band styles scoped inline on About page
- Existing About bio / SEO / nav / footer overrides unchanged

## Manual re-upload instructions (operator)

1. Use `output/manual-upload/gosaki-piano/public-dist/` contents → `/cms-kit-staging/gosaki-piano/`
2. Include `_astro/` and updated `about/index.html`
3. Optional: add band JPGs to `public/images/bands/` in Astro project, rebuild, repackage
4. No mirror/delete sync
5. Browser QA: `/about/` shows Bands / Projects below existing profile

## Known remaining issues

- Band photos not yet supplied — placeholders shown until JPGs added
- Re-convert from live crawl regenerates About Wix HTML; band injection re-applied automatically
- Contact form still non-functional Wix markup
- FTP auto-deploy remains disabled

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Gates

```txt
gosakiAboutBandProfilesSectionComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
