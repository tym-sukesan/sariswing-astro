# Gosaki YouTube embed section layout improvement (G-10e)

**Phase:** `G-10e-gosaki-youtube-embed-section-layout-improvement`  
**Status:** **complete** — local implementation + convert + build + manual-upload package verified; **G-10e1 staging re-upload QA PASS**  
**Date:** 2026-06-23  
**Prior:** G-10d2a staging QA **PASS**; known UI issue: YouTube section too small  
**G-10e commit:** `9dabcb4`

| Check | Status |
| --- | --- |
| Local implementation | **yes** |
| Local convert / build | **yes** |
| manual-upload package | **yes** |
| Operator FTP re-upload (G-10e1) | **yes** — staging QA **PASS** |
| Cursor FTP / deploy | **no** |
| `workflow_dispatch` | **no** |
| JSON write / Save click | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-youtube-embed-staging-upload-qa-finalization.md](./gosaki-youtube-embed-staging-upload-qa-finalization.md) (G-10d2a)
- [gosaki-youtube-embed-section-layout-reupload-qa-finalization.md](./gosaki-youtube-embed-section-layout-reupload-qa-finalization.md) (G-10e1)

---

## Gates

```txt
gosakiYoutubeEmbedSectionLayoutImprovementComplete: true
gosakiYoutubeEmbedSectionLayoutStagingReflected: true
phase: G-10e
readyForG10e1YoutubeEmbedSectionLayoutOperatorReupload: false
gosakiYoutubeEmbedSectionLayoutReuploadQaFinalizationComplete: true
readyForG10fDiscographyAlbumImagesPlanning: true
readyForG10gContactHubspotFormPlanning: true
readyForAnyFutureFtpApply: false
ftpAutoDeployUsed: false
workflowDispatchExecuted: false
cursorFtpUploadExecuted: false
cursorClickedSave: false
rollbackNeeded: false
```

**Do not re-click G-10c Save.**

---

## 1. Problem (operator QA)

Staging YouTube embed worked but the section/card appeared **too small** on PC — nested inside Wix schedule mesh grid.

---

## 2. Root cause

- `YouTubeEmbedSection.astro` injected after `#comp-m8y53dj5` inside Wix repeater mesh (`gosaki-home-youtube-embed.mjs`).
- Component had `max-width: 960px` but effective width was constrained by parent grid column (~schedule card width).
- Scoped Astro CSS alone could not break out of Wix mesh width.

---

## 3. Implementation (minimal diff)

### Source of truth

| File | Change |
| --- | --- |
| `templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro` | Section/card `max-width: 720px`, larger vertical margin, `grid-column: 1 / -1`, mobile `overflow-x: clip` |
| `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` | G-10e block — Wix mesh breakout + `720px` card + `aspect-ratio: 16 / 9` |

### Layout targets

| Selector | PC | Mobile |
| --- | --- | --- |
| `.gosaki-youtube-embed` | `width: 100%`, `max-width: 720px`, `margin: 3rem auto 3.5rem`, centered | `max-width: 100%`, `padding: 0 1rem`, `overflow-x: clip` |
| `.gosaki-youtube-embed__inner` | `max-width: 720px`, `margin: 0 auto` | `max-width: 100%` |
| `.gosaki-youtube-embed__media` | `width: 100%`, `aspect-ratio: 16 / 9` | same, no horizontal overflow |
| `.gosaki-youtube-embed__iframe` | `width: 100%`, `height: 100%` | tap-friendly full width |

---

## 4. Local commands (executed)

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

node scripts/verify-g10e-gosaki-youtube-embed-section-layout-improvement.mjs
```

Repo root:

```bash
cd /Users/toyamayusuke/sariswing-astro && npm run build
```

---

## 5. Package verification

| Check | Result |
| --- | --- |
| `public-dist/index.html` contains `.gosaki-youtube-embed` | **PASS** |
| `youtube-nocookie.com/embed/Ke4F8JAQz-I` | **PASS** |
| `max-width: 720px` in CSS | **PASS** |
| `aspect-ratio: 16 / 9` | **PASS** |
| `noindex` maintained | **PASS** |
| `deployBase` `/cms-kit-staging/gosaki-piano/` | **PASS** |
| `safeForStaticFtp: true` | **PASS** |

### Generated CSS size evidence (`public-dist/index.html` inline + `global.css` G-10e)

```txt
.gosaki-youtube-embed: width:100%; max-width:720px; margin:3rem auto 3.5rem; grid-column:1 / -1
.gosaki-youtube-embed__inner: width:100%; max-width:720px; margin:0 auto
.gosaki-youtube-embed__media: width:100%; aspect-ratio:16 / 9
.gosaki-youtube-embed__iframe: width:100%; height:100%
body.wix-static-export .gosaki-youtube-embed: max-width:720px !important (G-10e mesh breakout)
```

Prior (G-10d2a): section `max-width:960px` but effective width constrained by Wix schedule mesh column.

Package path: `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/`

---

## 6. Staging re-upload QA (operator, G-10e1 — PASS)

**Doc:** [gosaki-youtube-embed-section-layout-reupload-qa-finalization.md](./gosaki-youtube-embed-section-layout-reupload-qa-finalization.md)

Operator manual re-upload from `output/manual-upload/gosaki-piano/public-dist/` to `/cms-kit-staging/gosaki-piano/` — overwrite only; no delete/mirror.

| # | Check | Result |
| --- | --- | --- |
| 1 | Top page displays | **OK** |
| 2 | YouTube section visible | **OK** |
| 3 | Video displays (`Ke4F8JAQz-I`) | **OK** |
| 4 | Layout size improvement vs G-10d2a | **OK** |
| 5 | Larger, natural centered iframe | **OK** |
| 6 | No major layout breakage | **OK** |

**Staging URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

G-10e layout fixes confirmed live: Wix mesh breakout, `max-width: 720px`, `aspect-ratio: 16 / 9`, mobile `max-width: 100%`.

---

## 7. Next phase candidates

| Option | Phase | Goal |
| --- | --- | --- |
| **A (recommended)** | `G-10f-gosaki-discography-album-images-planning` | Real discography album artwork on staging |
| **B (alternate)** | `G-10g-gosaki-contact-hubspot-form-planning` | HubSpot or mailto-first contact form |

YouTube embed public + layout arc **closed** (G-10c → G-10e1).

---

## 8. Safety

- No FTP / deploy / `workflow_dispatch` by Cursor.
- No JSON write / DB write / Save click.
- No `src/pages/admin` changes.
- `readyForAnyFutureFtpApply: false` unchanged.
