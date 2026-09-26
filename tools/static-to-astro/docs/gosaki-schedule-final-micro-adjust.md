# gosaki-schedule-final-micro-adjust

Phase: `gosaki-schedule-final-micro-adjust`  
Date: 2026-09-26  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

CSS only. Schedule hub + month pages. No HTML / other pages / commit / FTP.

```txt
SCHEDULE_FINAL_MICRO_ADJUST_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
LOCAL_PREVIEW_HUB: http://127.0.0.1:4321/schedule/
LOCAL_PREVIEW_MONTH: http://127.0.0.1:4321/schedule/2026-07/
PRODUCTION_UPDATED: false
```

## Changed selectors

| Selector | Change |
| --- | --- |
| `.gosaki-schedule-month-link` | `border-radius: 2px` → `5px` (hover unchanged) |
| `.gosaki-schedule-event-card` | `border-radius: 6px` → `5px`; border `#e0be9a` → sage line |
| `.gosaki-schedule-event-date` | color `#993500` → `--gosaki-green-deep`; weight `600` |
| `.gosaki-schedule-event-body a` | `#993500` → `--gosaki-green` |
| `.gosaki-schedule-event-body > p:first-of-type` | 18px / 700 / margin-bottom 10px / `--gosaki-ink` |

Page heading `.gosaki-schedule-month h2.font_2` unchanged.

## Before / after color

| Surface | Before | After |
| --- | --- | --- |
| Month-link rest border | `var(--gosaki-line)` (already sage) | same |
| Card border | `#e0be9a` | `rgba(62, 92, 75, 0.28)` (`--gosaki-line`) |
| Date heading | `#993500` | `#2c4639` (`--gosaki-green-deep`) |
| Body links | `#993500` | `#3e5c4b` (`--gosaki-green`) |
| Event title | inherited `#5b4d43` / 0.95rem | `#3f3732` (`--gosaki-ink`) 18px/700 |

## Border-radius

- Hub month links: **5px**
- Month event cards: **5px**

## Verify

- `/schedule/` PC: month buttons 5px radius; hover still sage fill
- `/schedule/2026-07/` PC: sage date 26px/600; title 18px/700; venue 15.2px/400
- SP 390: card radius 5px; padding unchanged `16px 18px`
- Heading “Schedule 2026.07” 45px unchanged
