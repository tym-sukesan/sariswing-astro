# Gosaki YouTube and Discography practicalization (G-9j)

**Phase:** `G-9j-gosaki-youtube-and-discography-practicalization`  
**Status:** static config + read-only admin — no DB / migration / Save / deploy

---

## YouTube (home embed)

| Item | Path |
| --- | --- |
| Config | `config/sites/gosaki-piano-youtube-embed.json` |
| Public component | `templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro` |
| Resolver | `templates/site-extensions/gosaki-piano/gosaki-youtube-embed.ts` |
| Convert hook | `scripts/lib/gosaki-home-youtube-embed.mjs` |

- Injected into gosaki `index.astro` on convert (same pattern as BandProfiles on About).
- `published: false` or missing `videoId` / `sourceUrl` → section hidden on public home.
- Embed uses `youtube-nocookie.com`, `loading="lazy"`, responsive 16:9, `YouTubeで見る` link.

## Discography

| Item | Path |
| --- | --- |
| Public | Wix static HTML `/discography/` (unchanged) |
| Admin summary JSON | `config/sites/gosaki-piano-discography-summary.json` |
| Admin page | `/__admin-staging-shell/musician-basic/admin/discography/` |

## Staging admin routes

- `/admin/youtube/` — read-only YouTube config status
- `/admin/discography/` — read-only release list + preview link

## Next (not this phase)

- `site_embeds` Supabase table + read integration (G-9i)
- Discography CMS write
- Operator Save UI
