# gosaki-schedule-image-upload-production-test-build

Phase: `gosaki-schedule-image-upload-production-test-build`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Official production package for **Schedule file-upload + image_url Save** testing. Client arm Schedule only. No FTP `--apply`, Storage write, DB write, Secret change, Edge deploy, or push.

```txt
SCHEDULE_IMAGE_UPLOAD_TEST_BUILD_RESULT: PASS
COMMIT: a8f18727ded6992dade986cce16a76121e16086c
sourceTreeClean: true
armedCount: 1
armedFeatureIds: ["gosaki-schedule"]
BUILD: PASS
G20I3: 113 passed, 0 failed
SAVE_COMPLETION_VERIFIER: 42 passed, 0 failed
file input present: true
upload button present: true
storage bucket/path: site-assets / gosaki-piano/schedule/
image_url payload present: true
public-dist fileCount: 53
OUTPUT: tools/static-to-astro/output/manual-upload/gosaki-piano-production/
LOCAL_UPLOAD_SOURCE: tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/
SAFE_FOR_FILEZILLA_UPLOAD: true
ftpApply: false
STORAGE_WRITE_THIS_PHASE: false
DB_WRITE_THIS_PHASE: false
EDGE_DEPLOY_THIS_PHASE: false
SECRET_CHANGED: false
```

## Checkpoint

Uncommitted upload implementation + policy/docs were committed so generate could run git-clean.

```txt
commit: a8f18727 feat(gosaki): add schedule admin image file upload
working tree at generate: clean
UI arm: PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=true
other Save arms: unset
CMS_KIT_SITE_EMBEDS_BUILD_READ: unset (registry siteEmbeds=true)
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset (About json fallback)
PUBLIC_SUPABASE_URL / ANON_KEY: tools/.env.local only (kmjq)
```

Prior package relocated to `_stale-backup/gosaki-piano-production/2026-09-28T05-44-33-036Z-a8f1872`.

## Mutex / baked arms

`[save-arm-mutex] PASS · reason=single_operational_save_arm · armedCount=1 · armedFeatureIds=gosaki-schedule`

The generate log line `Save arms: not set (must remain false)` is the **hardcoded** production banner. Trust mutex + HTML datasets.

| Attribute | Value |
| --- | --- |
| `data-gosaki-schedule-save-armed` | `"true"` |
| `data-gosaki-youtube-save-armed` | `"false"` |
| `data-gosaki-discography-save-armed` | `"false"` |
| `data-gosaki-about-save-armed` | `"false"` |

## Admin upload UI + Save payload

`public-dist/admin/schedule/index.html`:

- file input `data-gosaki-schedule-image-file` (`accept=image/jpeg,image/png,image/webp`)
- button `data-gosaki-schedule-image-upload` **アップロード**
- **画像URL** `data-field="image_url"`
- preview `data-gosaki-schedule-image-preview`

Baked admin JS (`GosakiStagingReadOnlyAdminPage*.js`):

- bucket `site-assets`
- path prefix `gosaki-piano/schedule/`
- `"x-upsert":"false"`
- no `/object/images/`
- payload `image_url:String(e.fields.image_url??"").trim()` and `image_url:e.image_url`

## Package contents kept

| Item | Value |
| --- | --- |
| `generatedAt` | `2026-09-28T05:45:15.012Z` |
| `sourceCommit` | `a8f18727ded6992dade986cce16a76121e16086c` |
| backend | `kmjqppxjdnwwrtaeqjta` |
| `includesAdmin` | true |
| `safeForStaticFtp` | true |
| Schedule | supabase **106** events |
| Discography | supabase 4 |
| YouTube | supabase **3** published (`bHyRfDWjd44` · `JcHlZsGOyHg` · `kfIhlDrum_c`) |
| About | json fallback |
| Home | 4 items + month links · Home SP date **26px** |
| CSS | `.gosaki-schedule-event-image` kept |

## Operator test (after FileZilla)

1. Owner login → `/admin/schedule/`
2. Edit an event → 画像を選択 → アップロード (Storage INSERT; not done this phase)
3. Confirm public URL in 画像URL + preview
4. 保存 once (`image_url` only extra vs previous fields)
5. Public month cards need a **later** generate to show the flyer

Live Save still needs Edge Secret `GOSAKI_SCHEDULE_SAVE_ARMED=true` (not changed here).

## Not done

- FileZilla (operator)
- FTP `--apply`
- push
- Storage / DB write this phase
- Secret / Edge
