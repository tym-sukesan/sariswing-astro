# CMS Core v2 YouTube — cutover stage 2: public build-read package prep

- **Phase:** `cms-core-v2-youtube-supabase-public-build-read-package-prep`
- **Date:** 2026-07-24
- **Status:** package prepared → **operator manual FTP + browser QA COMPLETE**
- **Depends on:** Admin staging Supabase path cutover QA COMPLETE
- **Live now:** public home YouTube baked from staging `site_embeds` · Admin Supabase path retained · Save arm false

## Goal

`CMS_KIT_SITE_EMBEDS_BUILD_READ=true` で公開トップ YouTube 埋め込みを staging `site_embeds` から bake した package を生成・検証する。Admin Supabase path ON を維持。JSON file / Contents Edges は削除しない（fallback / rollback）。Save arm **false**。

## Build command (executed)

```bash
cd ~/sariswing-astro
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=false
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED=false
export CMS_KIT_SITE_EMBEDS_BUILD_READ=true
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
```

| Knob | Value |
| --- | --- |
| Admin path | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true` |
| Public build-read | `CMS_KIT_SITE_EMBEDS_BUILD_READ=true` |
| Client Save arms | **false** |
| `registry.supabaseFeatures.siteEmbeds` | **false** (env-only prefer-DB; lasting registry flip not done) |

## Package result

| Item | Value |
| --- | --- |
| Output | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| Upload contents | `public-dist/` **contents** |
| `sourceCommit` | `b3bbae653c14ae5bf872b0261641c4fbf01bcf10` |
| `generatedAt` | `2026-07-23T16:55:53.993Z` |
| `targetEnvironment` | staging |
| `includesAdmin` | true |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| `safeForStaticFtp` | true |
| `fileCount` | 35 |
| Build / verify:manual-upload | **PASS** |

## Supabase build-read — evidence

| Check | Result |
| --- | --- |
| `loadSiteEmbedsDataForBuild` (env ON) | `embedDataSource: "supabase"` · `rowCount: 1` · `legacy_item_id: yt-placeholder-01` · `source_url: https://youtu.be/I-eY9YMq9GI` · `sort_order: 10` |
| Baked `src/data/gosaki-youtube-embed.json` | **exact match** of `mapSiteEmbedRowsToYoutubeConfig(site_embeds rows)` |
| Config file `$comment` | present on `config/sites/gosaki-piano-youtube-embed.json` · **absent** on baked file (not a verbatim JSON copy) |
| Public home | `youtube-nocookie.com/embed/I-eY9YMq9GI` |
| Admin path retained | `data-gosaki-youtube-write-backend="supabase"` · Save armed **false** |

## JSON fallback / registry — confirmation

| Item | State |
| --- | --- |
| `registry.siteEmbeds` | **false** (env gate only) |
| Config JSON file | **retained** at `config/sites/gosaki-piano-youtube-embed.json` |
| Code path | `loadSiteEmbedsDataForBuild` returns `null` when build-read off → convert keeps JSON |
| Empty/error DB | convert keeps JSON (no blank home) — see `gosaki-home-youtube-embed.mjs` / `site-cms-features.mjs` |
| Contents YouTube Edges | **not deleted** |

## Save arm

| Arm | State |
| --- | --- |
| Client Supabase / Contents Save arms | **false** |
| Server `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | **not changed** |

## FTP target (operator · separate gate — not executed by Cursor)

**STOP:** no auto FTP · no `mirror --delete` · not account root `/` · not production.

| Item | Value |
| --- | --- |
| Local | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| Remote | `/cms-kit-staging/gosaki-piano/` |
| Upload | **contents** of `public-dist/` (full overwrite OK; delete-sync **not** OK) |
| Focus | `index.html` (home YouTube) + `_astro/` CSS/JS · admin already Supabase from stage 1 |

## Post-upload browser QA (operator)

Base: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

1. Public `/` — YouTube section visible · embed `I-eY9YMq9GI` (matches staging `site_embeds`)
2. Spot-check About / Discography / Schedule / Contact — no regression
3. `/admin/youtube/` — still Supabase path · Save **disabled**
4. Optional: owner no-change dry-run only (no Save)
5. Confirm production / Wix untouched
6. Do **not** arm Save · do **not** flip `registry.siteEmbeds` in this QA

## Operator manual FTP + browser QA result (2026-07-24)

| Item | Result |
| --- | --- |
| FTP | **PASS** — human manual overwrite of **entire** `public-dist/` → `/cms-kit-staging/gosaki-piano/` |
| production `vsbvndwuajjhnzpohghh` | **unchanged** |
| Public home YouTube | **normal** · videoId `I-eY9YMq9GI` |
| Other primary pages | visual OK |
| `/admin/youtube/` | **normal** · Admin Supabase path **retained** |
| Save button | **disabled** |
| `saveArmEnabled` | **false** |
| JSON / Contents fallback | **retained** |
| Save / Secret / SQL / Edge deploy | **not executed** |

## Rollback (if needed later)

Rebuild with `CMS_KIT_SITE_EMBEDS_BUILD_READ` unset/false (keep Admin path ON if desired) → manual re-upload → public returns to JSON bake. Config JSON + Contents Edges remain.

## Not executed (this record phase / still forbidden without new approval)

- Cursor FTP / auto FTP apply
- Save / Secret change
- SQL / DB / Edge deploy
- `registry.siteEmbeds=true` commit
- Contents / JSON deletion
- production
- commit / push

## Gates

```txt
cmsCoreV2YoutubeSupabasePublicBuildReadPackagePrepared: true
cmsCoreV2YoutubePublicStagingSupabaseBuildReadQaComplete: true
publicSiteEmbedsBuildReadEnabledInPackage: true
publicSiteEmbedsBuildReadLive: true
registrySiteEmbedsStillFalse: true
jsonYoutubeFallbackRetained: true
adminSupabasePathEnabledInPackage: true
adminStagingSupabasePathLive: true
saveArmEnabled: false
ftpUploadExecuted: true
operatorManualFtpOnly: true
publicBuildReadFtpUploadExecuted: true
readyForOperatorPublicBuildReadFtpUpload: false
readyForAnyFutureFtpApply: false
contentsYoutubeCutoverExecuted: false
```
