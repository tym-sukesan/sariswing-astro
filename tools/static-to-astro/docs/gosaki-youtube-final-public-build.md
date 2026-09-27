# gosaki-youtube-final-public-build

Phase: `gosaki-youtube-final-public-build`  
Date: 2026-09-26  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Official production package: bake **published** kmjq `site_embeds` YouTube rows into public static HTML. Save arms all OFF. No FTP `--apply`, DB write, Secret change, Edge deploy, Contents/GitHub write, or push.

```txt
YOUTUBE_PUBLIC_BUILD_RESULT: PASS
COMMIT: 01e6b74143dc9e69b70e9bf7ef4dcf7ef04eac35
sourceTreeClean: true
armedCount: 0
armedFeatureIds: []
embedDataSource: supabase
publishedYoutubeRows: 3
videosBakedIntoPublicSite: 3
BUILD: PASS
G20I3: 113 passed, 0 failed
SAVE_COMPLETION_VERIFIER: 42 passed, 0 failed
public-dist fileCount: 53
OUTPUT: tools/static-to-astro/output/manual-upload/gosaki-piano-production/
LOCAL_UPLOAD_SOURCE: tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/
SAFE_FOR_FILEZILLA_UPLOAD: true
ftpApply: false
EDGE_SECRET_CHANGED: false
```

## Checkpoint

Leftover YouTube UI-arm docs were committed first so generate could run git-clean.

```txt
commit: 01e6b741 docs(gosaki): record YouTube UI-arm production package
working tree at generate: clean
Save arms: unset (YouTube / Schedule / Discography / About / Contents YouTube)
CMS_KIT_SITE_EMBEDS_BUILD_READ: unset (not required — registry.siteEmbeds=true)
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset (About json fallback)
PUBLIC_SUPABASE_URL / ANON_KEY: tools/.env.local only (kmjq)
```

Prior UI-arm package relocated to `_stale-backup/gosaki-piano-production/2026-09-26T15-07-12-701Z-01e6b74`.

## READ-ONLY published rows (kmjq)

SELECT-only, anon key, `site_slug='gosaki-piano'` `provider='youtube'`. Host confirmed kmjq. No write.

| legacy_item_id | published | sort_order | source_url |
| --- | --- | --- | --- |
| `yt-2ba73001` | true | 10 | `https://www.youtube.com/watch?v=bHyRfDWjd44` |
| `yt-7c6592e2` | true | 20 | `https://www.youtube.com/watch?v=JcHlZsGOyHg` |
| `yt-467bc5d4` | true | 30 | `https://www.youtube.com/watch?v=kfIhlDrum_c` |

`youtube_total: 3` · `youtube_published: 3` · `youtube_unpublished: 0`

## Exact build-read env / flag

Public YouTube bake does **not** need a Save arm.

| Gate | This generate |
| --- | --- |
| `config/sites/registry.json` `gosaki-piano.supabaseFeatures.siteEmbeds` | **true** (required; enables `loadSiteEmbedsDataForBuild`) |
| `CMS_KIT_SITE_EMBEDS_BUILD_READ` | **unset** (optional override only when registry is false) |
| `PUBLIC_SUPABASE_URL` | exported from `tools/static-to-astro/.env.local` (kmjq) |
| `PUBLIC_SUPABASE_ANON_KEY` | exported from `tools/static-to-astro/.env.local` |
| YouTube / Schedule / Discography / About Save UI arms | **unset** |
| Contents YouTube arm | **unset** (not used) |

Loader: `loadSiteEmbedsDataForBuild` → anon SELECT `site_embeds` where `published=true` `provider=youtube` `site_slug=gosaki-piano` order `sort_order` asc. Empty/error → JSON fallback. Production ref STOP.

## Home data path

1. Convert calls `loadSiteEmbedsDataForBuild` (registry `siteEmbeds: true`).
2. `applyGosakiHomeYouTubeEmbed` prefers `siteEmbedsBundle` when `embedDataSource === "supabase"` and `embeds.length > 0`.
3. `mapSiteEmbedRowsToYoutubeConfig` writes `src/data/gosaki-youtube-embed.json`.
4. `YouTubeEmbedSection.astro` → `resolvePublishedGosakiYoutubeItems`.

Display: **all** `published === true` items with a valid YouTube id. **No max count.** Sort: `sort_order` / `sortOrder` ascending, then `id`. Home HTML this package: 3 iframes `youtube-nocookie.com/embed/{id}` in that order.

Convert log: `YouTube: embedDataSource=supabase`.

## Package

| Item | Value |
| --- | --- |
| `generatedAt` | `2026-09-26T15:07:47.396Z` |
| `sourceCommit` | `01e6b74143dc9e69b70e9bf7ef4dcf7ef04eac35` |
| backend | `kmjqppxjdnwwrtaeqjta` |
| `includesAdmin` | true |
| `safeForStaticFtp` | true |
| Schedule | supabase **106** events |
| Discography | supabase 4 releases |
| YouTube | **supabase 3 published** |
| About | json fallback (`page_fields_not_supabase`) |
| Home list | 4 `.gosaki-home-schedule__item` + `Scheduleを見る` |

Baked public ids: `bHyRfDWjd44` · `JcHlZsGOyHg` · `kfIhlDrum_c`.

## Visual polish still in package

CSS `_astro/index.yR7byThm.css` + `index.DOdX15yD.css` contain `--gosaki-green` · `#efe4d0` · `#faf8f4` · `.gosaki-home-schedule` · `#comp-jsgv72ui` · `.gosaki-schedule-event-card` · discography markers.

## Save arms

`[save-arm-mutex] PASS · reason=no_operational_save_arm · armedCount=0 · armedFeatureIds=(none)`

| Attribute | Value |
| --- | --- |
| `data-gosaki-youtube-save-armed` | `"false"` |
| `data-gosaki-youtube-write-backend` | `"supabase"` |
| `data-gosaki-schedule-save-armed` | `"false"` |
| `data-gosaki-discography-save-armed` | `"false"` |
| `data-gosaki-about-save-armed` | `"false"` |
| Contents YouTube URL arm | not baked |

## Verifiers (this generate)

| Verifier | Result |
| --- | --- |
| G-20i3 production package admin inclusion | **113 / 0** |
| `verify:gosaki-production-cms-save-completion` | **42 / 0** |
| static-public artifact | **PASS** · `safeForStaticFtp: true` |

## Not done

- FileZilla (operator)
- FTP `--apply`
- push
- DB write / Secret / Edge
- Contents / GitHub write
- YouTube Save UI (intentionally OFF)
