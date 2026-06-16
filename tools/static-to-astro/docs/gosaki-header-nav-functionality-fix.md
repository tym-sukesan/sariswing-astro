# G-8g2 — gosaki header nav functionality fix

Phase: `G-8g2-gosaki-header-nav-functionality-fix`  
Date: 2026-06-14  
Prior phase: `G-8g1-gosaki-mobile-header-and-footer-social-regression-fix` (commit `a78a8d8`)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Observed issues (after G-8g1 operator upload)

| Area | Issue |
| --- | --- |
| **PC/SP nav** | `Schedule` missing; only Home / About / Discography / Contact / Link |
| **SP hamburger** | Button click does not open/close nav panel |

## Cause

| Area | Root cause |
| --- | --- |
| **Schedule missing** | Live-crawl fixture uses `2026-07.html` month pages, but `detectScheduleMonthPages()` only matched `schedule-YYYY-MM.html`. `scheduleHub` stayed false → month nav labels (`2026.07`) stripped by `header-transform.mjs`, no Schedule link injected, `/schedule/` index not generated |
| **Hamburger broken** | Toggle JS used global `document.querySelector(".nav-toggle")`; G-8g1 absolute dropdown + possible header overflow clipping; resize breakpoint at 768px conflicted with PC rules at 769px; `classList.toggle(name, bool)` less reliable than explicit add/remove under stacked CSS |

## Fix implemented

### Schedule detection (`schedule-pages.mjs`)

- Added `LIVE_CRAWL_MONTH_FILENAME` for `2026-03.html` style pages
- Extended `parseScheduleMonthSourcePath`, `isScheduleMonthNavTarget`, `isScheduleSectionPath` for live-crawl routes (`/2026-07/`)

### Header transform (`header-transform.mjs`)

- When `scheduleHub` true: inject single `Schedule` link → `/schedule/` (month labels collapsed)
- `scheduleNavActive()` matches `/schedule/`, `/schedule-YYYY-MM/`, and `/YYYY-MM/`
- Toggle JS scoped to `#SITE_HEADER` (`header.querySelector`)
- `preventDefault` / `stopPropagation` on click; explicit `classList.add/remove("is-nav-open")`
- Resize close at `min-width: 769px` (align with PC nav breakpoint)

### Site CSS (`gosaki-piano-overrides.mjs` — G-8g2)

- `#SITE_HEADER` + inner wrappers `overflow: visible`
- `.nav-toggle` `pointer-events: auto`, `z-index: 5`
- SP `@768px`: explicit `display: block !important` on `is-nav-open .global-nav`; vertical `ul` flex

### Generated output

- `/schedule/` index page now generated (11 pages + schedule hub)
- Manual package file count: **15** (was 14)

## Schedule nav link target

**`/schedule/`** — schedule hub listing month pages (`/2026-07/`, …). Not a provisional single-month link.

## Hamburger behavior

- Click toggles `#SITE_HEADER.is-nav-open`
- `aria-expanded` true/false
- SP: nav panel absolute dropdown below header row (G-8g1 + G-8g2 display rules)
- PC: hamburger hidden; horizontal nav unchanged

## Verification results (no FTP, no commit)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 115 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS (15 files)
```

- Built CSS: `_astro/index.DwDyMw67.css`
- Manual package: `output/manual-upload/gosaki-piano/public-dist/`

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** `_astro/index.DwDyMw67.css`, **`schedule/index.html`**, and all HTML pages
3. PC/SP: nav shows Home / About / **Schedule** / Discography / Contact / Link
4. SP ~375px: hamburger opens/closes vertical nav; beige header + footer text SNS unchanged
5. No mirror/delete sync

## Known remaining differences

- Footer SNS remains text links (G-8g1 intentional)
- Discography spacing unchanged (out of G-8g2 scope)
- Real-device QA recommended after upload

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Commit not executed

Per operator instruction: **commit / push deferred** until visual batch review (`commitDeferredForVisualBatch: true`).

## Gates

```txt
gosakiHeaderNavFunctionalityFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
commitDeferredForVisualBatch: true
```
