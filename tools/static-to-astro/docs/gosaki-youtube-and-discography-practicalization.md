# Gosaki YouTube and Discography practicalization (G-9j)

**Phase:** `G-9j-gosaki-youtube-and-discography-practicalization`  
**Status:** static JSON + Instagram-style YouTube admin + Discography CMS-ready admin — no DB / Save / deploy

---

## YouTube (home embed + admin)

| Item | Path |
| --- | --- |
| Config (multi-item) | `config/sites/gosaki-piano-youtube-embed.json` |
| Public component | `templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro` |
| Resolver | `templates/site-extensions/gosaki-piano/gosaki-youtube-embed.ts` |
| Convert hook | `scripts/lib/gosaki-home-youtube-embed.mjs` — injects after `#comp-m8y53dj5` (THIS WEEK'S LIVE SCHEDULE) |
| Admin UI | `/__admin-staging-shell/musician-basic/admin/youtube/` — Instagram-inspired list + add form + iframe preview |

- `items[]` with `sortOrder`, `published`, `embedCode` / `sourceUrl` / `videoId`
- Save / add / delete disabled until next phase

## Discography

| Item | Path |
| --- | --- |
| CMS-ready JSON | `config/sites/gosaki-piano-discography.json` |
| Public | Wix static `/discography/` (unchanged) |
| Admin | `/__admin-staging-shell/musician-basic/admin/discography/` — form + preview cards |

## Next (not this phase)

- `site_embeds` Supabase + Save UI
- Public `/discography/` from JSON
