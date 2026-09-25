# gosaki-discography-minimal-pc-align

Phase: `gosaki-discography-minimal-pc-align`  
Date: 2026-09-25  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`

Minimal Wix-mesh overrides only. No new grid. No HTML / card / border. SP unchanged.

```txt
MINIMAL_DISCOGRAPHY_FIX_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
LOCAL_PREVIEW: http://127.0.0.1:4321/discography/
ADDED_CSS_LINES: 23
PRODUCTION_UPDATED: false
```

## Changed selectors / properties

| Selector (PC `@media (min-width: 769px)`) | Properties |
| --- | --- |
| `#comp-llexymel [data-mesh-id^="comp-llexymga__"] > [id^="comp-lley9r5x__"]` | `left: 57px` (was 351px) · `width: 503px` (was 453px) · `margin: 44px 0 20px` (was `44px 0 0`) |
| `> [id^="comp-lley4qy2__"]` / `> [id^="comp-lley693e__"]` | `margin-top: 0` (was 23px) |

Cover / purchase: **not changed** (`left: 57px` already).

Measured 1440px, 4 albums: title left = cover left = purchase left (**0px**); cover / Track List / Personnel tops (**0px**); title–cover gap **20px**.
