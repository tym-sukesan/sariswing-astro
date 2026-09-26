# gosaki-link-page-visual-polish

Phase: `gosaki-link-page-visual-polish`  
Date: 2026-09-25  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Link page look only. Typography + spacing. No cards, no JS, no HTML rewrite, no CMS / DB / FTP / commit.

```txt
LINK_VISUAL_POLISH_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
LOCAL_PREVIEW: http://127.0.0.1:4321/link/
PRODUCTION_UPDATED: false
```

## Changed selectors

All scoped under `body.wix-static-export #comp-lol1i5hv` (Link page section only).

| Selector | Role |
| --- | --- |
| `#comp-juctbpem` | former beige box — fill off, PC max-width 720px |
| `#comp-juctbpem .jv9xi4` / `[data-testid="container-bg"]` / `.LNYVZi` / `[data-testid="colorUnderlay"]` | hide Wix underlay |
| `#comp-jsgv2olq` | page heading “Link” |
| `#comp-jsgv72ui` | link list |
| `#comp-jsgv72ui p:has(a)` | link name |
| `#comp-jsgv72ui p:not(:has(a))` | description |
| `#comp-jsgv72ui p:has(a) + p + p:not(:has(a))` | hide empty spacer `<p>` |

## Changed CSS values

| Item | Before | After |
| --- | --- | --- |
| Box fill | `--bg: 230,222,202` / `--alpha-bg: 0.65` (563px) | transparent / `--alpha-bg: 0` |
| Box width PC | 563px + `left: 208px` | `min(720px, 88%)` centered |
| Heading | 45px, width 127px, `left: 240px` | 40px (SP 34px), full width, `text-align: center` |
| List | 436px, `left: 63px` | full width, `text-align: left` |
| Link name | 14px / 400 / underline | **19px / 600** (SP **18px**) |
| Description | 12–14px mixed | **14.5px / 400** (SP **14px**), ink slightly weaker |
| Item gap | Wix empty `<p>` clump | **32px** PC / **28px** SP (`padding-top` on name) |

## Background treatment

Beige panel removed. Underlay opacity 0, no border, no shadow. List sits on `--gosaki-page` (`#faf8f4`). Boundary with the page is none.

## Typography

- Heading “Link”: centered, 40px / 400, letter-spacing 0.08em, `--gosaki-ink`
- Names: 19px / 600 (SP 18px), `--gosaki-ink`
- Descriptions: 14.5px / 400 (SP 14px), muted ink via `color-mix` with page

## Spacing

- Name → description: `0.4rem`
- Item → item: 32px PC / 28px SP
- Empty spacer paragraphs hidden
- PC column 720px; SP side pad ~42px at 390

## Hover treatment

- Rest: no full underline; 1px sage hairline (`color-mix` 28%)
- Hover / focus-visible: text + hairline → `--gosaki-green` (`#3e5c4b`)
- Not a button (no fill, no radius, no padding chip)

## Follow-up: list background box (2026-09-26)

Operator request: restore grouping via list background only. Outer `#comp-juctbpem` stays transparent. Heading stays outside the box.

```txt
LINK_LIST_BACKGROUND_BOX_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
LOCAL_PREVIEW: http://127.0.0.1:4321/link/
CHANGED_SELECTOR: #comp-lol1i5hv #comp-jsgv72ui
BACKGROUND: #efe4d0
PADDING_PC: 50px
PADDING_SP: 36px 28px
BORDER_RADIUS: 5px
BOX_SHADOW: none
BORDER: none
```

Typography / item spacing / hover unchanged. `/discography/` IDs absent; album title 24px kept.


## Safety

No production, DB, Supabase, Admin, FTP, Edge, commit. HTML unchanged. Preview CSS mirrored in gitignored `output/gosaki-piano-astro-visual-polish/src/styles/global.css`.
