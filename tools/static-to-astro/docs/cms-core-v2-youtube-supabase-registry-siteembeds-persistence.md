# CMS Core v2 YouTube — registry siteEmbeds persistence (Gosaki)

- **Phase:** `cms-core-v2-youtube-supabase-registry-siteembeds-persistence`
- **Date:** 2026-07-24
- **Status:** local registry flip + package verify COMPLETE · **FTP not executed**
- **Depends on:** public staging Supabase build-read QA COMPLETE

## Goal

Gosaki `registry.supabaseFeatures.siteEmbeds` を **true** に永続化し、`CMS_KIT_SITE_EMBEDS_BUILD_READ` なしでも public/build が `site_embeds` を prefer する。意図せず JSON 経路へ戻るのを防ぐ。他サイトは変更しない。JSON / Contents fallback は残す。Admin Supabase path 維持 · Save arm **false**。

## Registry change

| Site | Before | After |
| --- | --- | --- |
| `gosaki-piano` | `siteEmbeds: false` | **`siteEmbeds: true`** |
| `pilot-sample-static` | `siteEmbeds: false` | **unchanged** `false` |

File: `tools/static-to-astro/config/sites/registry.json` · gosaki-piano only.

## Build command (executed · no build-read env)

```bash
cd ~/sariswing-astro
unset CMS_KIT_SITE_EMBEDS_BUILD_READ
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=false
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED=false
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
```

## Package result

| Item | Value |
| --- | --- |
| Output | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| `sourceCommit` | `443d1e5bb6ea6b720b1700a60e7fbd4c01e2d420` |
| `generatedAt` | `2026-07-23T17:13:59.367Z` |
| Build / verify:manual-upload | **PASS** |
| `CMS_KIT_SITE_EMBEDS_BUILD_READ` | **UNSET** during build |

## Evidence — registry-driven Supabase read (no env)

| Check | Result |
| --- | --- |
| `loadSiteEmbedsDataForBuild` (BUILD_READ unset) | `embedDataSource: "supabase"` · `rowCount: 1` |
| Baked JSON | **===** `mapSiteEmbedRowsToYoutubeConfig(site_embeds)` · no `$comment` |
| Public home | `youtube-nocookie.com/embed/I-eY9YMq9GI` |
| Admin path | `data-gosaki-youtube-write-backend="supabase"` · Save armed **false** |
| Pilot `loadSiteEmbedsDataForBuild` | **null** (siteEmbeds still false) |

## Fallback retained

| Item | State |
| --- | --- |
| Config JSON | `config/sites/gosaki-piano-youtube-embed.json` retained |
| Contents Edges | `supabase/functions/gosaki-youtube-url-dry-run` (+ save) retained |
| Empty/error path | convert still keeps JSON when Supabase empty/error (`gosaki-home-youtube-embed.mjs`) |
| Env override | `CMS_KIT_SITE_EMBEDS_BUILD_READ` still optional for sites with registry false |

## FTP target (operator · separate gate — not executed)

| Item | Value |
| --- | --- |
| Local | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` contents |
| Remote | `/cms-kit-staging/gosaki-piano/` |
| Note | Full overwrite OK · no mirror/--delete · not production |

## Post-upload browser QA (operator)

1. Public `/` YouTube = `I-eY9YMq9GI`
2. Primary pages spot-check
3. `/admin/youtube/` Supabase path · Save disabled
4. No Save / no Secret / production untouched

## Not executed

- FTP · Save · Secret · SQL · Edge · production · Contents/JSON delete · commit/push

## Gates

```txt
cmsCoreV2YoutubeRegistrySiteEmbedsPersistenceComplete: true
registryGosakiSiteEmbedsTrue: true
registryPilotSiteEmbedsFalse: true
publicBuildReadWorksWithoutCmsKitEnv: true
jsonYoutubeFallbackRetained: true
adminSupabasePathEnabledInPackage: true
saveArmEnabled: false
ftpUploadExecuted: false
readyForOperatorRegistrySiteEmbedsFtpUpload: true
readyForAnyFutureFtpApply: false
contentsYoutubeCutoverExecuted: false
```
