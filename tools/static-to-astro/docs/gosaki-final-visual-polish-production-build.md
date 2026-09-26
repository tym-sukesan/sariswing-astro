# gosaki-final-visual-polish-production-build

Phase: `gosaki-final-visual-polish-production-build`  
Date: 2026-09-26  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Official production package for reviewed Gosaki visual polish + Home latest schedule. No FTP `--apply`, DB write, Secret change, Edge deploy, or push.

```txt
PRODUCTION_VISUAL_POLISH_BUILD_RESULT: PASS
COMMIT: 2b4bd226f519b77c47d2131f79befef762851a5a
sourceTreeClean: true
armedCount: 0
armedFeatureIds: []
BUILD: PASS
G20I3: 113 passed, 0 failed
SAVE_COMPLETION_VERIFIER: 42 passed, 0 failed
public-dist fileCount: 53
OUTPUT: tools/static-to-astro/output/manual-upload/gosaki-piano-production/
LOCAL_UPLOAD_SOURCE: tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/
SAFE_FOR_FILEZILLA_UPLOAD: true
ftpApply: false
```

## Checkpoint

Uncommitted polish / Home Schedule / JST today / docs were committed first so generate could run git-clean.

```txt
commit: 2b4bd226 feat(gosaki): add home latest schedule and remaining visual polish
working tree at generate: clean
Save arms: not set
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset (About json fallback)
PUBLIC_SUPABASE_URL / ANON_KEY: exported from tools/.env.local only (kmjq)
```

Prior package relocated to `_stale-backup/gosaki-piano-production/2026-09-26T14-24-35-480Z-2b4bd22`.

## Package

| Item | Value |
| --- | --- |
| `generatedAt` | `2026-09-26T14:25:23.766Z` |
| `sourceCommit` | `2b4bd226f519b77c47d2131f79befef762851a5a` |
| backend | `kmjqppxjdnwwrtaeqjta` |
| `includesAdmin` | true |
| `safeForStaticFtp` | true |
| Schedule | supabase **106** events |
| Discography | supabase 4 releases |
| YouTube | json (no new live registration) |
| About | json fallback (`page_fields_not_supabase`) |
| Home list | 4 published upcoming (JST today `2026-09-26`) |

Baked Home rows: 2026-09-26 丸山朝光…用賀 / 09-27 YOKOHAMA SWINGIN REVIEW / 09-28 3 clarinet / 09-30 Duo.

## Visual polish in package

CSS `_astro/index.yR7byThm.css` + `index.DOdX15yD.css` contain:

- `--gosaki-green` · `#efe4d0` · `#faf8f4`
- `.gosaki-home-schedule` (+ title)
- `#comp-jsgv72ui` (Link box)
- `.gosaki-schedule-event-card`
- discography album-title hierarchy

`public-dist/index.html` has 4 `.gosaki-home-schedule__item` and CTA `Scheduleを見る`.

## Save arms

`[save-arm-mutex] PASS · reason=no_operational_save_arm · armedCount=0 · armedFeatureIds=(none)`

Admin HTML: schedule / discography / youtube / about save-armed all `"false"`.

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
- YouTube live registration
- Save arm
