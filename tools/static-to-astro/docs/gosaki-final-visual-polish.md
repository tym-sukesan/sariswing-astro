# gosaki-final-visual-polish — first-pass public visual brush-up

Phase: `gosaki-final-visual-polish`  
Date: 2026-09-25  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`  
HEAD at implementation: `4c22e1cf`

## Scope

Public-site **design only** (first draft). No CMS / admin / URL / SEO / Supabase / Edge / Save arm / RLS / DB / FTP / production deploy / new images / JS animation.

```txt
VISUAL_POLISH_RESULT: PASS (first draft · local CSS only)
SAFE_TO_REVIEW_IN_BROWSER: true
PACKAGE_REBUILT: false
PRODUCTION_UPDATED: false
CMS_HTML_STRUCTURE: unchanged
```

## Changed files

- `tools/static-to-astro/scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` — append `gosaki-final-visual-polish` block at end of `buildGosakiPianoSiteOverridesCss()` (cascade wins over G-8g*)
- `tools/static-to-astro/docs/gosaki-final-visual-polish.md` — this doc
- AI SoT: `docs/ai/00-current-state.md`, `docs/ai/03-next-actions.md`, `docs/ai/handoff-to-chatgpt.md`

Composer `wix-staging-visual-overrides.mjs` unchanged (already appends site overrides).

## Design changes summary

Keep beige key. Add muted sage as accent (hairline, current nav, links, card borders). Reduce Wix “old / stretched” feel by tightening header padding, dropping the white nav pill, warming the page background (replace black void), and making the home KV full-bleed at native photo aspect on PC.

Direction: spacing / type / line / color — not extra decoration.

## Color tokens

Defined on `body.wix-static-export`:

| Token | Value | Use |
| --- | --- | --- |
| `--gosaki-beige` | `#ead7bd` | Header / footer fill (unchanged key) |
| `--gosaki-beige-deep` | `#dcc9ad` | Reserved (deeper beige) |
| `--gosaki-page` | `#f6f1e8` | Page canvas |
| `--gosaki-ink` | `#3f3732` | Headings / logo |
| `--gosaki-ink-soft` | `#5b4d43` | Body / nav default (existing ink) |
| `--gosaki-green` | `#4f6356` | Sage accent |
| `--gosaki-green-deep` | `#3d4f42` | Current / hover |
| `--gosaki-green-soft` | `#e4ebe6` | Quiet hover fill |
| `--gosaki-line` | `rgba(79, 99, 86, 0.26)` | Hairlines / card borders |
| `--gosaki-font` | `"Avenir Next", "Helvetica Neue", Arial, sans-serif` | Safe stack (no new webfonts) |

Rust `#9e3b1b` / `#993500` is no longer the current-nav accent in this block (superseded for header current/hover).

## Header changes

- Beige fill kept; sage 1px inset hairline under header
- PC mesh side padding `470px` → `clamp(1.25rem, 4vw, 3.25rem)` so logo / nav use the width
- Logo: medium weight, tracking `0.18em`, `clamp(15px, 1.2vw, 18px)` (SP: `clamp(16px, 4.2vw, 18px)`)
- White nav pill removed (`background: transparent`)
- Current / hover: sage color + 1px sage underline (not rust)
- Hamburger bars / border: sage
- SP open menu: beige (overrides G-8g1 `#fff` on `.is-nav-open .global-nav`)

## Footer changes

- Opaque beige fill (was translucent Wix underlay over black)
- Sage hairline on top
- Same type language as header
- SNS hover → sage; copyright slightly smaller with tracking
- Information density unchanged (SNS + copyright only)

## Main visual changes

Live PC before: `#comp-mbl1cpz3` **1340×620 at left 290** on a 1920 viewport (≈290px gutters each side). Photo native **2680×1240**.

After (PC ≥769px):

- KV section + image **full viewport width**
- `aspect-ratio: 2680 / 1240` so `object-fit: cover` does **not** extra-crop
- Measured overlay: **1920×888, left 0** (`fullBleed: true`)

SP: full width, `height: clamp(220px, 52vw, 340px)`, `object-fit: cover`, `object-position: center` (modest crop vs PC; avoids a ~180px-tall native-aspect strip).

No new images. Existing `home-kv-250428-0179re.jpg` reused.

## Site-wide style changes

- Page / `#SITE_CONTAINER` / `#BACKGROUND_GROUP` / `[id^="pageBackground"]` → warm `#f6f1e8` (kills black void below KV)
- Headings: ink + slight tracking
- Rich-text links: sage
- Schedule month links: cream fill, sage border, sage-soft hover (no rust)
- YouTube / band card borders: sage line token if those classes exist

## PC / SP verification

Verified by overlaying the new CSS on live `www.gosaki-piano.com` (session-only; **files on the host were not written**). Source CSS is local-only until a later package regen.

| Route | PC | SP | CMS content |
| --- | --- | --- | --- |
| `/` | Header + full-bleed KV + footer PASS | Header / hamburger / KV 100% width PASS | KV photo intact |
| `/schedule/` | Hub + 8 month links PASS | 8 month links + hamburger PASS | Months intact |
| `/discography/` | Albums / Track List / Personnel PASS | 4 albums in a11y tree PASS | Copy + shop links intact |
| `/about/` | Bio + photo + Bands / Projects PASS | Lede + bands in a11y tree PASS | `後藤 沙紀 1990年7月9日…` intact |
| `/contact/` | Photo + HubSpot form PASS | Title / copy / HubSpot / photo present | Form not submitted |

PC screenshots: home KV full-bleed; schedule cream canvas; discography cards; about bio; contact HubSpot.

## Known remaining visual issues

- First draft only — logo size / tracking and sage strength can still be tuned
- SP KV uses a modest cover crop (height clamp) so the hero is not a thin native-aspect strip
- HubSpot submit button stays HubSpot rust; HubSpot “Create your own free forms…” banner unchanged (iframe)
- Home YouTube / THIS WEEK islands remain empty/hidden (existing content decision, not this CSS)
- Link page not in the required route list — not restyled beyond inherited tokens
- Live production CSS **not** updated; customer preview needs later convert + package + FileZilla (FTP `--apply` still suspended)
- SP screenshot tool captured 390 layout in a large tab canvas; SP layout confirmed by `innerWidth` + bounding boxes

## Safety

- No DB / Secret / Edge / FTP / workflow_dispatch / `/admin` change
- No URL / sitemap / canonical change
- Original repo `~/sariswing-astro` unrelated diffs **untouched**
- Commit **not** created this phase
