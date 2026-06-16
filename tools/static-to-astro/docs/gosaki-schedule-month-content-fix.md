# Gosaki schedule month content fix (G-8g4)

**Phase:** `G-8g4-gosaki-schedule-month-content-fix`  
**Date:** 2026-06-14  
**Baseline commit (unchanged):** `a78a8d8`  
**Status:** local only — **commit / push deferred** (`commitDeferredForVisualBatch: true`)

## Observed issue

After G-8g2/G-8g3 manual upload, `/schedule/` hub and month links worked, but month pages such as `/2026-07/` showed only the heading **July, 2026** with no live schedule body (venue, times, performers, etc.).

## Cause (stage cutover)

| Stage | Schedule body present? | Notes |
| --- | --- | --- |
| `fixtures/gosaki-piano/2026-07.html` (live crawl) | **Yes** | 14 `wixui-repeater__item` entries; dates, 会場, OPEN/START, 料金, 出演 |
| `fixtures/gosaki-static-site/schedule-2026-07.html` (manual) | **Yes** | Same Wix repeater structure |
| `output/gosaki-piano-astro/src/pages/2026-07/index.astro` | **Yes** | Full Wix HTML converted; not title-only |
| `output/static-public/.../2026-07/index.html` | **Yes in DOM, hidden in browser** | `<fluid-columns-repeater style="visibility:hidden" …>` |

**Root cause:** Wix Thunderbolt SSR leaves the schedule repeater at `visibility:hidden` until client JS runs. Static Astro export has no Wix runtime, so only the month title (`comp-mptgosys` h2) was visible. Content was **not** dropped during crawl or conversion.

**Not the cause:** `detectScheduleMonthPages()` metadata-only handling, or `generatePage()` stripping main body.

## Fixture content availability

Live crawl fixtures checked:

- `2026-03.html` … `2026-07.html` — all contain repeater items with readable schedule text in normal HTML (not JSON-only).

## Fix implemented

### A. HTML transform (`path-transform.mjs`)

For schedule month source paths (`2026-07.html`, `schedule-2026-07.html`, etc.):

1. Strip `visibility:hidden` from `fluid-columns-repeater` inline style
2. Add classes: `gosaki-schedule-month-repeater`, `gosaki-schedule-event-card`, `gosaki-schedule-event-date`, `gosaki-schedule-event-body`
3. Wrap page fragment in `<div class="gosaki-schedule-month">`

### B. Site CSS (`gosaki-piano-overrides.mjs` G-8g4)

- Force `fluid-columns-repeater` visible in static export
- Card layout for `.gosaki-schedule-event-card` (beige border, white background)
- Readable typography for date / venue / time / charge / performers
- Mobile padding and `overflow-x: hidden` on `.gosaki-schedule-month`
- Centered month h2 (e.g. July, 2026)

**Unchanged:** `/schedule/` hub (G-8g3), deployBase month links, PC/SP nav Schedule + hamburger (G-8g2), footer SNS text fallback (G-8g1).

## Schedule month design

- **h1/h2:** month title centered (Futura, beige-brown palette)
- **Events:** one card per repeater item
- **Date:** larger accent color (`#993500`)
- **Body lines:** MS Gothic stack, 会場 / 時間 / 料金 / 出演 readable on PC/SP
- **Classes:** `.gosaki-schedule-month`, `.gosaki-schedule-event-card`, `.gosaki-schedule-event-date`, `.gosaki-schedule-event-body`

## Verification results (no FTP, no commit)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 130 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS (15 files)
```

Built checks (2026-06, 2026-07):

- `会場` present (28 occurrences in 2026-07)
- `visibility:hidden` **removed** from repeater
- `gosaki-schedule-month` + `gosaki-schedule-event-card` in HTML
- Schedule hub links use `/cms-kit-staging/gosaki-piano/2026-XX/`
- PC nav Schedule + SP hamburger present

Built CSS: `_astro/index.Bargt8YH.css` (hash changed from G-8g3 `index.65gpmar1.css`).

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** updated `_astro/index.Bargt8YH.css`, all `2026-XX/index.html`, `schedule/index.html`, other HTML
3. Verify `/2026-07/`: month title + event cards with 会場 / 時間 / 出演
4. Verify `/schedule/` hub and deployBase month links still OK
5. Verify nav Schedule, hamburger, footer SNS text links
6. No mirror/delete sync

## Known remaining differences

- Event cards use Wix repeater HTML inside gosaki card wrapper (not a full CMS data model)
- Wix mesh inline positioning reset via CSS; minor spacing may differ from live Wix
- Per-month Wix comp IDs differ; styling is class-based not comp-ID-based
- Contact HubSpot replacement still deferred

## Safety

| Action | Executed? |
| --- | --- |
| FTP connect / upload / mirror / delete | **No** |
| workflow_dispatch | **No** |
| DB / Supabase writes | **No** |
| Production deploy | **No** |
| `.ftpaccess` edit | **No** |
| `output/` commit | **No** |
| Git commit / push | **No** |

## Gates

```txt
gosakiScheduleMonthContentFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
commitDeferredForVisualBatch: true
```
