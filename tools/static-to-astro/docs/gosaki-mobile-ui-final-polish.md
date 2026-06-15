# G-8e — gosaki mobile UI final polish

Phase: `G-8e-gosaki-mobile-ui-final-polish`  
Date: 2026-06-14  
Prior phase: `G-8d-gosaki-mobile-visual-parity-fix` (commit `dd0fd85`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issues

After G-8d, major SP layout collapse was fixed, but client-preview quality gaps remained:

- Home **THIS WEEK'S LIVE SCHEDULE** overflowed viewport (980px repeater + desktop card mesh)
- About: uneven horizontal padding (mixed 1rem / 0.5rem on nested comps)
- Link: insufficient side padding (`#comp-juctbpem` 563px card, desktop `left:` offset)
- Contact: form block appeared right-aligned (`left:346px` desktop mesh residue)
- Header: too tall (G-8d `min-height: 5.5rem` + large padding); not sticky
- MENU button showed "MENU" text; not square hamburger
- Logo had no link to home

## Cause

1. **Page-specific padding** — G-8d set per-comp padding inconsistently; no unified SP gutter (~20px).
2. **Home schedule** — `#comp-m8y53dj5` / items 980px wide; card internals use `left:48px` / `left:672px` desktop grid (text + image side-by-side).
3. **Link** — `#comp-juctbpem` fixed 563px width with centered desktop offset.
4. **Contact form** — `#comp-jqbwo704` shares grid-area with photo at desktop `left:346px`.
5. **Header** — G-8d prioritized visual parity (large logo band) over compact sticky SP chrome.

## Fix implemented

### Site-specific (`gosaki-piano-overrides.mjs` — G-8e block)

**Header (SP @768px)**

- `position: sticky; top: 0; z-index: 1000`
- Compact padding (`0.625rem 1.25rem`), smaller logo scale
- Square hamburger: 48×48px, `.nav-toggle__label { display: none }`
- `.site-logo-link` styles (no underline, inherit color)

**Unified SP gutter**

- `padding-inline: 1.25rem` on About / Discography / Contact / Link / Home schedule section mesh containers

**Home schedule**

- Full-width repeater + items; flex column per card
- Order: image (`m8y5ctyk`) → date/title text (`m8y53djg1`) → description (`m8y53djn1`)
- Heading `clamp(22px, 6vw, 32px)`, text wrap, image `min(70vw, 220px)`

**About / Link / Contact**

- About: remove nested comp horizontal padding (parent gutter only)
- Link: `#comp-juctbpem` full width, reset `left`
- Contact: `#comp-jqbwo704` centered, form/input/textarea/button 100% width

### Header transform (`header-transform.mjs`)

- Wrap `#comp-mbdw9tzc h1` in `<a href={withBase("/")} class="site-logo-link">` (regex — avoids cheerio corrupting Astro nav attrs)

### Baseline (`wix-static-export-baseline-overrides.mjs`)

- Mobile rich text: `overflow-wrap: anywhere; word-break: break-word` (safe for all Wix pilots)

### Verifier

- G-8e assertions: sticky header, square menu, schedule/contact/link rules, logo link in header transform

## Pages targeted

| Page | G-8e changes |
| --- | --- |
| All (header) | Sticky compact header, logo link, square menu |
| Home | Schedule section 1-column, overflow fix |
| About | Even padding |
| Link | Card full width + gutter |
| Contact | Form centered, 100% inputs |
| Discography | Unified gutter (inherits G-8d layout) |

## Header changes

```txt
SP: sticky top, compact height, logo left (linked), square hamburger right
PC: unchanged (nav-toggle hidden on desktop per baseline)
Nav JS: unchanged (toggle / close on link / resize)
```

## Logo link behavior

```html
<a href={withBase("/")} class="site-logo-link"><h1>SAKI GOTO Website</h1></a>
```

Built HTML: `href="/cms-kit-staging/gosaki-piano/"` (deployBase preserved).

## Verification results (no FTP)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 81 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS
```

- Built CSS: `_astro/index.DRpT1Pny.css`
- Manual package: 14 files, `safeForStaticFtp: true`

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** `_astro/index.DRpT1Pny.css` and all HTML (logo link in header)
3. Phone / DevTools ~375px: sticky header, hamburger only, schedule fits width, contact form centered
4. No mirror/delete sync

## Known remaining mobile differences

- Not pixel-perfect Wix Thunderbolt mobile
- Contact form still non-functional (Wix backend)
- Schedule month pages not given page-specific G-8e polish
- Real-device QA recommended after upload

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Gates

```txt
gosakiMobileUiFinalPolishComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
