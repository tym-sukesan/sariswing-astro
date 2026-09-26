# gosaki-youtube-final-content-entry-build

Phase: `gosaki-youtube-final-content-entry-build`  
Date: 2026-09-26  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Temporary production package with **YouTube Supabase Save UI arm only**, on top of visual polish + Home Schedule. No FTP `--apply`, DB write, Secret change, Edge deploy, or push.

```txt
YOUTUBE_FINAL_ENTRY_BUILD_RESULT: PASS
COMMIT: 936cbdb59f9b1920b63bc582264bcd004ab287be
sourceTreeClean: true
armedCount: 1
armedFeatureIds: ["gosaki-youtube-supabase"]
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

Docs from the previous visual-polish production generate were committed so this generate could run git-clean.

```txt
commit: 936cbdb5 docs(gosaki): record visual polish production package
working tree at generate: clean
UI arm: PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true
other Save arms: unset
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset
PUBLIC_SUPABASE_URL / ANON_KEY: tools/.env.local only (kmjq)
```

Prior package relocated to `_stale-backup/gosaki-piano-production/2026-09-26T14-47-41-071Z-936cbdb`.

## Mutex / baked arms

`[save-arm-mutex] PASS · reason=single_operational_save_arm · armedCount=1 · armedFeatureIds=gosaki-youtube-supabase`

| Attribute | Value |
| --- | --- |
| `data-gosaki-youtube-save-armed` | `"true"` |
| `data-gosaki-youtube-write-backend` | `"supabase"` |
| `data-gosaki-schedule-save-armed` | `"false"` |
| `data-gosaki-discography-save-armed` | `"false"` |
| `data-gosaki-about-save-armed` | `"false"` |
| Contents YouTube URL arm | not baked |

## Visual polish still in package

- Home: 4 `.gosaki-home-schedule__item` + `Scheduleを見る`
- CSS: `--gosaki-green` · `#efe4d0` · `#faf8f4` · `.gosaki-home-schedule` · `#comp-jsgv72ui` · `.gosaki-schedule-event-card` · discography album-title
- Schedule supabase 106 · Discography supabase 4 · YouTube json · About json fallback

## Dual-gate note (not this phase)

Client UI arm is baked. Edge Secret `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` was **not** set here (Secret change forbidden). Live owner Save still needs that Secret `true` on kmjq, then unset after entry. Public HTML does not auto-reflect new embeds until a later generate + FileZilla.

## Not done

- FileZilla (operator)
- FTP `--apply`
- push
- DB write / Secret / Edge
- Contents YouTube arm
- After-entry disarm package
