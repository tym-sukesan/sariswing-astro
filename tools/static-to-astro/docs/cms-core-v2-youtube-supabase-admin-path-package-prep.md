# CMS Core v2 YouTube — cutover stage 1: Admin Supabase path package prep

- **Phase:** `cms-core-v2-youtube-supabase-admin-path-package-prep`
- **Date:** 2026-07-24
- **Status:** package prepared → **operator manual FTP + browser QA COMPLETE**
- **Scope at prep:** Local package regenerate · no Cursor FTP/Save/Secret/Edge/SQL
- **Live now:** staging Admin YouTube path = Supabase · Save arm false · public JSON unchanged

## Goal

Staging admin YouTube **live-read / dry-run** を Contents 既定から Supabase Edge へ切り替えた package を生成し、operator 手動 FTP 用に準備する。Public/build JSON SoT と Save arm は変更しない。

## Build command (executed)

```bash
cd ~/sariswing-astro
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=false
export PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED=false
unset CMS_KIT_SITE_EMBEDS_BUILD_READ
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
```

Env 適用箇所:

| Layer | How |
| --- | --- |
| Package CLI | `build-gosaki-staging-admin-package.mjs` → `runSitePackageBuild` |
| Convert / Astro | `buildEnv` inherits process env → `npm run build` bakes `import.meta.env.PUBLIC_*` |
| Path flag | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true` → admin HTML `data-gosaki-youtube-write-backend="supabase"` |
| Save arms | both client arms **false** (explicit) |
| Public build-read | `CMS_KIT_SITE_EMBEDS_BUILD_READ` **unset** · `registry.siteEmbeds=false` |

## Package result

| Item | Value |
| --- | --- |
| Output | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| Upload contents | `public-dist/` **contents** (not the folder name itself) |
| `sourceCommit` | `8c3e79ffb065717c15ac536a8439fbe6c957fd31` |
| `generatedAt` | `2026-07-23T16:29:47.312Z` |
| `targetEnvironment` | staging |
| `includesAdmin` | true |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| `safeForStaticFtp` | true |
| `fileCount` | 35 |
| Build / verify:manual-upload | **PASS** |

## Admin path ON — evidence

From `public-dist/admin/youtube/index.html`:

- `data-gosaki-youtube-write-backend="supabase"`
- dry-run / save endpoint URLs → `…/functions/v1/gosaki-youtube-supabase-save-dry-run` (staging ref `kmjqppxjdnwwrtaeqjta`)
- Contents endpoints `gosaki-youtube-url-dry-run` / `gosaki-youtube-url-save` **absent** from that HTML
- `data-gosaki-youtube-save-armed="false"` · `data-g11c6-save-enabled="false"`
- Save button: `data-gosaki-save-allowed="false"` · `disabled` · `aria-disabled="true"`
- production ref `vsbvndwuajjhnzpohghh` appears only as **STOP / block** constant in client JS (not as live endpoint host)

## Public / build path unchanged — evidence

- `registry.supabaseFeatures.siteEmbeds === false`
- `CMS_KIT_SITE_EMBEDS_BUILD_READ` unset during build
- Baked `src/data/gosaki-youtube-embed.json` **identical** to `config/sites/gosaki-piano-youtube-embed.json`
- Public home embed: `youtube-nocookie.com/embed/I-eY9YMq9GI` (JSON SoT)

## Save arm

| Arm | State |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | **false** (build env) |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | **false** (build env) |
| Server `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | **not changed** (remains false; no Secret edit) |

## FTP procedure (operator)

**STOP:** no auto FTP · no `mirror --delete` · not account root `/` · not production.

| Item | Value |
| --- | --- |
| Local source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| Remote target | `/cms-kit-staging/gosaki-piano/` |
| What to upload | **Contents** of `public-dist/` (overwrite existing files) |
| Primary overwrite (this cutover) | `admin/` (esp. `admin/youtube/`) + matching `_astro/*` admin assets |
| Also overwritten (full package) | public HTML / CSS / schedule / robots / sitemap — expected for full regen |
| Do **not** | delete-sync · upload nested `public-dist/` folder · touch production |

## Operator manual FTP + browser QA result (2026-07-24)

| Item | Result |
| --- | --- |
| FTP | **PASS** — human manual overwrite of **entire** `public-dist/` → `/cms-kit-staging/gosaki-piano/` |
| production `vsbvndwuajjhnzpohghh` | **unchanged** |
| `/admin/` · `/admin/youtube/` | normal display |
| Owner login | **success** |
| YouTube admin display | **normal** (Supabase path) |
| Save button | **disabled** (unchanged) |
| No-change dry-run | **PASS** — see table below |
| Public home YouTube | **unchanged** (JSON SoT) |
| Other primary pages | **OK** |
| Save / Secret / SQL / Edge deploy | **not executed** |

### No-change dry-run (operator)

| Field | Value |
| --- | --- |
| `invokeError` | `null` |
| `ok` | `true` |
| `operation` | `dryRun` |
| `didWrite` | `false` |
| `dbWrite` | `false` |
| `noChange` | `true` |
| `changedItemIds` | `[]` |

## Rollback (if needed later)

Rebuild **without** `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED` (or `=false`) → manual re-upload same remote path → Contents admin path restored. Public JSON path already unchanged.

## Not executed (this record phase / still forbidden without new approval)

- Cursor FTP / auto FTP apply
- Secret / arm change
- SQL / DB
- Edge deploy
- Save / Function Save invoke
- `CMS_KIT_SITE_EMBEDS_BUILD_READ`
- production
- commit / push

## Gates

```txt
cmsCoreV2YoutubeSupabaseAdminPathPackagePrepared: true
cmsCoreV2YoutubeAdminStagingSupabasePathCutoverQaComplete: true
adminSupabasePathEnabledInPackage: true
adminStagingSupabasePathLive: true
publicSiteEmbedsBuildReadEnabled: false
saveArmEnabled: false
ftpUploadExecuted: true
operatorManualFtpOnly: true
contentsYoutubeCutoverExecuted: false
readyForOperatorAdminPathFtpUpload: false
readyForAnyFutureFtpApply: false
```
