# gosaki-discography-album-title-hierarchy

Phase: `gosaki-discography-album-title-hierarchy`  
Date: 2026-09-25  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`

Display-only title hierarchy. DB / CMS / alignment mesh unchanged.

```txt
MINIMAL_DISCOGRAPHY_TITLE_HIERARCHY_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
LOCAL_PREVIEW: http://127.0.0.1:4321/discography/
ADDED_CSS_LINES: 22
PRODUCTION_UPDATED: false
```

## Render logic

`wrapGosakiDiscographyAlbumTitleHtml` in `gosaki-discography-album-title-display.mjs`  
Called from `patchDiscographyPageMainHtml` on `/discography/` (after Supabase field patches when present).

Pattern `「title」/artist` → spans. Quotes not rendered. Source data unchanged.

## CSS

| Selector | Properties |
| --- | --- |
| `.gosaki-album-name` | `24px` / `700` |
| `.gosaki-album-slash` / `.gosaki-album-artist` | `18px` / `400` |
| `.gosaki-album-slash` | `margin-inline: 9px` |

Minimal PC align (`left:57px`, `margin:44px 0 20px`, list `margin-top:0`) kept. 4 albums measured.
