# gosaki-final-ux-fixes

Phase: `gosaki-final-ux-fixes`  
Date: 2026-09-27  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Three delivery UX fixes only. No DB / Supabase write / Edge / RLS / Secret / production package / FTP / push / commit.

```txt
FINAL_UX_FIX_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
LOCAL_PREVIEW: http://127.0.0.1:4321/
PRODUCTION_BUILD: false
FTP: false
COMMIT: false
```

## Changed files

- `tools/static-to-astro/scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` — SP hamburger → ×, SP month-page date 1.625rem, home item link styles
- `tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiHomeLatestSchedule.astro` — wrap each event as a month-page link
- `tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-home-latest-schedule.ts` — `gosakiHomeScheduleMonthPath`
- `tools/static-to-astro/scripts/lib/gosaki-home-latest-schedule.mjs` — same helper for convert/verify
- `tools/static-to-astro/scripts/verify-gosaki-final-ux-fixes.mjs` — new
- `tools/static-to-astro/scripts/verify-gosaki-home-latest-schedule.mjs` — month path + template link asserts
- `tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs` — aria-label open/close assert
- `tools/static-to-astro/package.json` — `verify:gosaki-final-ux-fixes` / `verify:gosaki-home-latest-schedule`
- `tools/static-to-astro/docs/gosaki-final-ux-fixes.md` — this doc
- AI SoT files

## Mobile menu behavior

Existing `is-nav-open` toggle + `aria-expanded` / `aria-label` (`Open menu` / `Close menu`) kept. SP only (max-width 768px): three bars rotate into × when open, hamburger when closed. PC `.nav-toggle` remains `display: none`. Open/close click, link-close, and 769px resize close unchanged.

Local check at 390px: closed `aria-expanded=false` / Open menu; open Close menu + bar transforms 45° / −45°; close restores hamburger.

## Home Schedule link behavior

Selection / limit 4 / JST / sort unchanged. Each published item is a whole-card `<a class="gosaki-home-schedule__link">` to `/schedule/YYYY-MM/` from ISO `date`. CTA `Scheduleを見る` still `/schedule/`.

Local baked hrefs: `/schedule/2026-09/` ×3 + `/schedule/2026-10/` ×1.

## Schedule SP date font-size

| Viewport | Before | After |
| --- | --- | --- |
| SP (~390px) | `clamp(1.125rem, 4vw, 1.625rem)` → **18px** | **26px** (`1.625rem`, PC max) |
| PC (1280px) | **26px** (clamp max) | **26px** unchanged |

Weight 600 and sage `var(--gosaki-green-deep)` unchanged. SP wrap allowed (`white-space: normal`, `overflow-wrap: anywhere`). Hub month buttons and card body type untouched. Local: SP no horizontal overflow; PC hamburger hidden, nav visible.

## Verifier result

| Verifier | Result |
| --- | --- |
| `verify:gosaki-final-ux-fixes` | **12 / 0** |
| `verify:gosaki-home-latest-schedule` | **18 / 0** |
| `verify:url-staging` | **809 / 0** |

Local convert only: `output/gosaki-piano-astro-visual-polish` (gitignored). Official production package **not** regenerated.

## Not done

- commit
- `build:gosaki:production`
- FileZilla / FTP `--apply`
- push
- DB / Secret / Edge
