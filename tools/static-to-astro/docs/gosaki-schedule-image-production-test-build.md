# gosaki-schedule-image-production-test-build

Phase: `gosaki-schedule-image-production-test-build`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Official production package for **Schedule image_url Save UI testing**. Client arm Schedule only. No FTP `--apply`, DB write, Secret change, Edge deploy, or push.

```txt
SCHEDULE_IMAGE_TEST_BUILD_RESULT: PASS
COMMIT: b573086d640376760896b421a887ef7b800ec23f
sourceTreeClean: true
armedCount: 1
armedFeatureIds: ["gosaki-schedule"]
BUILD: PASS
G20I3: 113 passed, 0 failed
SAVE_COMPLETION_VERIFIER: 42 passed, 0 failed
admin image input present: true
image_url payload present: true
public-dist fileCount: 53
OUTPUT: tools/static-to-astro/output/manual-upload/gosaki-piano-production/
LOCAL_UPLOAD_SOURCE: tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/
SAFE_FOR_FILEZILLA_UPLOAD: true
ftpApply: false
EDGE_DEPLOY_THIS_PHASE: false
SECRET_CHANGED: false
```

## Checkpoint

Uncommitted UX + image-UI source was committed so generate could run git-clean.

```txt
commit: b573086d feat(gosaki): add schedule image URL admin and home SP date size
working tree at generate: clean
UI arm: PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=true
other Save arms: unset
CMS_KIT_SITE_EMBEDS_BUILD_READ: unset (registry siteEmbeds=true)
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset (About json fallback)
PUBLIC_SUPABASE_URL / ANON_KEY: tools/.env.local only (kmjq)
```

Prior package relocated to `_stale-backup/gosaki-piano-production/2026-09-27T15-57-44-601Z-b573086`.

## Mutex / baked arms

`[save-arm-mutex] PASS · reason=single_operational_save_arm · armedCount=1 · armedFeatureIds=gosaki-schedule`

The generate log line `Save arms: not set (must remain false)` is the **hardcoded** production banner (does not mean unarmed). Trust mutex + HTML datasets.

| Attribute | Value |
| --- | --- |
| `data-gosaki-schedule-save-armed` | `"true"` |
| `data-gosaki-youtube-save-armed` | `"false"` |
| `data-gosaki-discography-save-armed` | `"false"` |
| `data-gosaki-about-save-armed` | `"false"` |
| Contents YouTube / About arms | not baked |

## Admin image URL + Save payload

`public-dist/admin/schedule/index.html`:

- label **画像URL**
- `data-field="image_url"` (`type="url"`)
- `data-gosaki-schedule-image-preview`

Baked admin JS:

- form read/write `image_url`
- Edge request payload `image_url:String(e.fields.image_url??"").trim()`
- dry-run/Save field objects include `image_url:e.image_url`
- live-read SELECT `description,image_url,published`
- safe-field list includes `"image_url"`

## Package contents kept

| Item | Value |
| --- | --- |
| `generatedAt` | `2026-09-27T15:58:16.482Z` |
| `sourceCommit` | `b573086d640376760896b421a887ef7b800ec23f` |
| backend | `kmjqppxjdnwwrtaeqjta` |
| `includesAdmin` | true |
| `safeForStaticFtp` | true |
| Schedule | supabase **106** events (`image_url` currently empty in bake) |
| Discography | supabase 4 |
| YouTube | supabase **3** published (`bHyRfDWjd44` · `JcHlZsGOyHg` · `kfIhlDrum_c`) |
| About | json fallback |
| Home | 4 `.gosaki-home-schedule__item` + month links + `Scheduleを見る` · no Home flyers |
| CSS | `--gosaki-green` · `#efe4d0` · `#faf8f4` · Home SP date **26px** · `.gosaki-schedule-event-image` |

## Dual-gate note (not this phase)

Client UI arm is baked. Edge `gosaki-schedule-save-dry-run` was **not** redeployed here (operator said already done). Secret `GOSAKI_SCHEDULE_SAVE_ARMED` was **not** changed. Live Save still needs that Secret exact `"true"` on kmjq. Public HTML does not auto-reflect a saved `image_url` until a later generate + FileZilla.

## Not done

- FileZilla (operator)
- FTP `--apply`
- push
- DB write / Secret / Edge
- After-test disarm package
