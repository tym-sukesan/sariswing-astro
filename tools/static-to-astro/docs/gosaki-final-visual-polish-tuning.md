# gosaki-final-visual-polish-tuning

Phase: `gosaki-final-visual-polish-tuning`  
Date: 2026-09-25  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

CSS-only tuning of the first-pass polish block. KV full-bleed kept. No CMS / HTML / DB / FTP / commit.

```txt
VISUAL_POLISH_TUNING_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
PRODUCTION_UPDATED: false
LOCAL_PREVIEW: http://127.0.0.1:4321/
```

## Changed file

- `tools/static-to-astro/scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` (polish block only)

Local preview `output/gosaki-piano-astro-visual-polish/` rebuilt (gitignored).

## Changed values

| Item | Before | After |
| --- | --- | --- |
| Nav font | 13px / 0.12em | **15px** / 0.06em (SP 0.05em) |
| Nav current | 1px sage underline, `#3d4f42` | **2px** underline, `#3e5c4b`, no fill |
| Logo PC | `clamp(15px, 1.2vw, 18px)` / 0.18em | `clamp(17px, 1.55vw, 22px)` / 0.12em (**22px** at 1920) |
| Logo SP | `clamp(16px, 4.2vw, 18px)` / 0.14em | `clamp(16px, 4.6vw, 19px)` / 0.08em (~18px at 390) |
| Header/footer beige | `#ead7bd` | `#efe4d0` |
| Beige deep | `#dcc9ad` | `#e4d5bc` |
| Page bg | `#f6f1e8` | `#faf8f4` |
| Green | `#4f6356` / `#3d4f42` | `#3e5c4b` / `#2c4639` |
| Month default | `#fffefb` | `#fffefb` (unchanged) |
| Month hover/active/current | pale sage fill | **solid `#3e5c4b` + cream text** |

## Header font size

- Nav: **15px** PC and SP
- Letter-spacing: 0.06em PC / 0.05em SP (was 0.12em)

## Logo font size

- PC: `clamp(17px, 1.55vw, 22px)` — measured **22px** at 1920
- SP: `clamp(16px, 4.6vw, 19px)` — measured **~18px** at 390, not cramped

## Beige tokens before/after

| Token | Before | After |
| --- | --- | --- |
| `--gosaki-beige` | `#ead7bd` | `#efe4d0` |
| `--gosaki-beige-deep` | `#dcc9ad` | `#e4d5bc` |
| `--gosaki-page` | `#f6f1e8` | `#faf8f4` |

## Green hover/active treatment

- Header: no fill; current/hover = sage **text + 2px underline** (`#3e5c4b`)
- Schedule month buttons: rest = white/pale; hover / `:active` / `:focus-visible` / `.is-current` / `[aria-current="page"]` = **filled sage + `#faf8f4` text**
- Hub HTML has **no** current-month class yet (structure unchanged) — fill shows on hover/press; `.is-current` is ready if added later

## PC / SP

Verified local preview: `/` `/schedule/` `/discography/` `/about/` `/contact/`. KV still 1920×888 / SP 390×220 full-bleed. CMS copy intact.

## Safety

No production, DB, FTP, Edge, commit.
