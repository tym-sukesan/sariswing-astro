# G-8f — gosaki mobile visual refinement

Phase: `G-8f-gosaki-mobile-visual-refinement`  
Date: 2026-06-14  
Prior phase: `G-8e-gosaki-mobile-ui-final-polish` (commit `1eee686`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issues

After G-8e operator upload, SP preview was usable but not client-ready:

| Area | Issue |
| --- | --- |
| **TOP** | KV image `#comp-mbl1cpz3` small; large gap below hero before schedule |
| **Header** | Logo appeared top-aligned vs square MENU button |
| **Footer** | SNS `#LnkBr2` + copyright `#WRchTxtx` left-aligned (desktop `left:` offsets) |
| **About** | Bands / Projects placeholder/image uneven horizontal inset in cards |
| **Discography** | Section/item vertical gaps still generous |
| **Contact** | Wix form success text `#comp-kei80gar` visible on load ("メッセージを送信しました") |
| **Link** | `#comp-juctbpem` Wix-style asymmetric radius + heavy shadow (PC/SP) |

## Fix implemented by page/area

### Site-specific (`gosaki-piano-overrides.mjs` — G-8f)

**TOP @768px**

- `#comp-mbl1cpz3`: full-bleed `100vw`, `height: clamp(220px, 55vw, 420px)`, `object-fit: cover`
- Hero section `#comp-lol1i5k0`: zero bottom padding; schedule block `#comp-m8y3dzb6` tight top margin

**Header @768px**

- Grid `align-items: center`; logo link + `#comp-mbdw7xid` `align-self: center`
- G-8e sticky / square menu / logo link unchanged

**Footer @768px**

- Footer mesh → flex column, center aligned
- `#LnkBr2` SNS list `justify-content: center`
- `#WRchTxtx` copyright centered

**Discography @768px**

- Reduced title/album margins and repeater item padding/gap

**Contact (all widths)**

- `#comp-kei80gar { display: none !important }` — hide stale Wix success message

**Link (PC + SP)**

- `#comp-juctbpem`: remove radius + box-shadow; flat background panel

### About (`BandProfilesSection.astro`)

- Mobile: `.band-profile__media` flex center; image/placeholder fixed width `min(85vw, 280px)` centered in card

### Verifier

`verify-url-to-staging-pipeline.mjs`: G-8f block, hero cover, header/footer centering, contact hide, link flat panel.

## HubSpot contact replacement note

Contact form remains Wix static-export placeholder (non-functional). Success message hidden via CSS only.

**Planned:** replace `#comp-jqbwo704` / Wix form with HubSpot embed in a future phase — not in G-8f scope.

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 88 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

- Built CSS: `_astro/index.Dl5S2qmQ.css`
- Manual package: 14 files, `safeForStaticFtp: true`

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** `_astro/index.Dl5S2qmQ.css` (new hash) and all HTML pages
3. Phone ~375px: large KV cover, centered footer, flat Link page, no contact success message on load
4. No mirror/delete sync

## Known remaining differences

- Not Wix pixel-perfect; modern SP preview target
- Contact form still non-functional until HubSpot phase
- Schedule month pages not given page-specific G-8f polish
- Real-device QA recommended after upload

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Gates

```txt
gosakiMobileVisualRefinementComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
