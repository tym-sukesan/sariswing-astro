# gosaki-home-latest-schedule

Phase: `gosaki-home-latest-schedule`  
Date: 2026-09-26  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Home only. Latest published schedule list on the Gosaki-piano top page. No YouTube registration / CMS / DB / other-page design / commit / FTP / production generate.

```txt
HOME_LATEST_SCHEDULE_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
LOCAL_PREVIEW: http://127.0.0.1:4321/
DISPLAY_COUNT: 4
FIELDS: date_display, title, venue
CTA: Scheduleを見る → /schedule/
PRODUCTION_UPDATED: false
DB_WRITE: false
```

## Existing structure / data path

| Piece | Reuse |
| --- | --- |
| Home slot | `<!--GOSAKI_HOME_SCHEDULE_SLOT-->` from Option D hide (`gosaki-home-stale-this-week-hide.mjs`). Stale Wix THIS WEEK IDs stay removed. |
| Wix repeater HTML | **Not reused** (stale crawl cards). New Astro list in the same section `#comp-m8y3dzb6`. |
| Schedule data | Existing `loadGosakiScheduleDataForBuild` → `loadScheduleDataForBuild` `.eq("published", true)` → `src/data/gosaki-schedules.json`. |
| Month / hub | Unchanged (`GosakiScheduleList` / `.gosaki-schedule-hub`). |
| `show_on_home` | Not used (fixture count 0). |

Adapter `applyPostGenerate` order: hide → **home latest** → YouTube. Slot comment kept so YouTube placement stays after the list.

## Selection

- Limit **4** (midpoint of 3–5).
- `published === true`, ISO date, skip hub-only / TBD.
- Upcoming (`date >= today` JST) first; if none, most recent past (local fixture 2026-03–07 vs today 2026-09-26 → July 4 rows).
- `today` default: `gosakiHomeScheduleTodayJst()` via `Intl.DateTimeFormat` `timeZone: "Asia/Tokyo"` `formatToParts` → `YYYY-MM-DD` (not UTC `toISOString()`).

## Changed files

- `scripts/lib/gosaki-home-latest-schedule.mjs`
- `templates/site-extensions/gosaki-piano/GosakiHomeLatestSchedule.astro`
- `templates/site-extensions/gosaki-piano/gosaki-home-latest-schedule.ts`
- `scripts/lib/gosaki-site-generator-hooks-adapter.mjs`
- `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs`
- `scripts/verify-gosaki-home-latest-schedule.mjs` (15 passed)
- `docs/gosaki-home-latest-schedule.md`

Inject unwraps leftover Wix `<!--$-->` / `<!--/$-->` around `#comp-m8y3dzb6` so Astro components actually render (those markers are island boundaries).

## Display

- Heading: Schedule
- Fields: date (`date_display`), event name, venue
- CTA: Scheduleを見る → `withBase("/schedule/")`
- Empty copy if no published dated rows
- Beige page + sage date/CTA/hairline
- SP: 16px padding, name 17px, `overflow-wrap: anywhere`; mesh `height: auto` / flex so CTA is not clipped

## Desktop / mobile

- PC: 720px centered list under KV; 4 items; sage dates; CTA above footer; click → `/schedule/` hub (month links unchanged).
- SP 390: hamburger header, list stacks, long title wraps, no horizontal overflow.

Local preview uses fixture `gosaki-schedules.json` (past fallback). YouTube embed HTML is unchanged in source; local fixture may have zero published items so the YouTube block stays empty.

## Production build (later, not this phase)

Yes — a later official generate with kmjq anon read will bake `published=true` rows into `gosaki-schedules.json`; the home component reads that file at build time. This phase did **not** run production build / FTP / Edge / Secret change.

## Not done

- commit / push
- production generate
- FTP `--apply`
- DB write
- Schedule CMS / month-page logic
