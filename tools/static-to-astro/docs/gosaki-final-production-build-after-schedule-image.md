# gosaki-final-production-build-after-schedule-image

Phase: `gosaki-final-production-build-after-schedule-image`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Delivery final production package **after** the Schedule image-upload live test. kmjq build-read of published Schedule / YouTube. **All Save arms OFF.** No FTP `--apply`, DB write, Storage write, Secret change, Edge deploy, or push.

```txt
FINAL_PRODUCTION_BUILD_RESULT: PASS
COMMIT: 14615839af23e1820276e4d8838287fc5eec3493
sourceTreeClean: true
armedCount: 0
armedFeatureIds: []
schedule image rows baked: 1 (schedule-2026-09-017)
YouTube videos baked: 3
Home Schedule count: 4
BUILD: PASS
G20I3: 113 passed, 0 failed
SAVE_COMPLETION_VERIFIER: 42 passed, 0 failed
UX_VERIFIER: 12 passed, 0 failed
HOME_VERIFIER: 18 passed, 0 failed
public-dist fileCount: 53
OUTPUT: tools/static-to-astro/output/manual-upload/gosaki-piano-production/
LOCAL_UPLOAD_SOURCE: tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/
SAFE_FOR_FILEZILLA_UPLOAD: true
ftpApply: false
DB_WRITE_THIS_PHASE: false
STORAGE_WRITE_THIS_PHASE: false
EDGE_DEPLOY_THIS_PHASE: false
SECRET_CHANGED: false
```

## Checkpoint / git-clean

Working tree after leftover test-build docs commit was **clean**. No extra checkpoint this phase.

```txt
commit: 14615839 docs(gosaki): record schedule image upload production test package
working tree at generate: clean
Save arms: unset (Schedule / YouTube / Discography / About / Contents YouTube)
CMS_KIT_SITE_EMBEDS_BUILD_READ: unset (registry siteEmbeds=true)
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset (About json fallback)
PUBLIC_SUPABASE_URL / ANON_KEY: tools/.env.local only (kmjq)
```

Prior (armed test) package relocated to `_stale-backup/gosaki-piano-production/2026-09-28T09-32-32-407Z-1461583`.

## Mutex / baked arms

`[save-arm-mutex] PASS · reason=no_operational_save_arm · armedCount=0 · armedFeatureIds=(none)`

The generate log line `Save arms: not set (must remain false)` is the hardcoded production banner. Trust mutex + HTML datasets.

| Attribute | Value |
| --- | --- |
| `data-gosaki-schedule-save-armed` | `"false"` |
| `data-gosaki-youtube-save-armed` | `"false"` |
| `data-gosaki-discography-save-armed` | `"false"` |
| `data-gosaki-about-save-armed` | `"false"` |
| Contents YouTube URL arm | not baked |

All five `/admin/` routes match the table. Admin `/admin/schedule/` still contains file input + アップロード UI, but Save is **not** armed.

## Schedule image bake (kmjq build-read)

Convert log: `Schedule data: scheduleDataSource=supabase (106 events)`.

`src/data/gosaki-schedules.json` rows with `image_url`: **1**.

| Field | Value |
| --- | --- |
| `legacy_id` | `schedule-2026-09-017` |
| `title` | `<3 clarinet>` |
| `date` | `2026-09-28` |
| `published` | true |
| `image_url` | `https://kmjqppxjdnwwrtaeqjta.supabase.co/storage/v1/object/public/site-assets/gosaki-piano/schedule/schedule-2026-09-017/3330aea5c02d49c7.webp` |

Public month HTML `public-dist/schedule/2026-09/index.html` includes `.gosaki-schedule-event-image` `<img src="…3330aea5c02d49c7.webp">` on that card. Legacy stub `public-dist/2026-09/index.html` is a move page (no event cards) — expected.

## YouTube bake

Convert log: `YouTube: embedDataSource=supabase`.

Published ids baked into Home iframes (`youtube-nocookie.com/embed/{id}`):

1. `bHyRfDWjd44`
2. `JcHlZsGOyHg`
3. `kfIhlDrum_c`

## Home Schedule

`.gosaki-home-schedule__item` **4** · each wrapped as `.gosaki-home-schedule__link` to `/schedule/YYYY-MM/` (this package: `/schedule/2026-09/` ×2 + `/schedule/2026-10/` ×2). CTA `Scheduleを見る` remains `/schedule/`.

## Final UX / visual polish still in package

CSS `_astro/index.C1Da63Nf.css` + `index.BTl7NcTm.css`: `--gosaki-green` · `#efe4d0` · `#faf8f4` · `.gosaki-home-schedule` · `.gosaki-schedule-event-image` · `font-size:26px!important` · SP hamburger × (`rotate(45deg)`) · `aria-expanded` / Open menu / Close menu.

UX verifier **12/0**. Home verifier **18/0**.

## Package

| Item | Value |
| --- | --- |
| `generatedAt` | `2026-09-28T09:33:14.416Z` |
| `sourceCommit` | `14615839af23e1820276e4d8838287fc5eec3493` |
| `runId` | `33102e3f-2fae-417c-9d56-9cd59f2d3e1c` |
| backend | `kmjqppxjdnwwrtaeqjta` |
| `includesAdmin` | true |
| `safeForStaticFtp` | true |
| `ftpAutoDeployUsed` | false |
| Schedule | supabase **106** events |
| Discography | supabase 4 releases |
| YouTube | **supabase 3 published** |
| About | json fallback (`page_fields_not_supabase`) |
| Home list | **4** |

## Verifiers (this generate)

| Verifier | Result |
| --- | --- |
| G-20i3 production package admin inclusion | **113 / 0** |
| `verify:gosaki-production-cms-save-completion` | **42 / 0** |
| `verify:gosaki-final-ux-fixes` | **12 / 0** |
| `verify:gosaki-home-latest-schedule` | **18 / 0** |
| static-public artifact | **PASS** · `safeForStaticFtp: true` |

## Not done

- FileZilla (operator)
- FTP `--apply`
- push
- DB write / Storage write / Secret / Edge
- Contents / GitHub write
- re-arming any Save module (intentionally all OFF)
