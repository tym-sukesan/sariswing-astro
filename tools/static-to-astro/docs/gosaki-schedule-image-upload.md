# Gosaki Schedule image upload — STOP (reuse gap)

Phase: `gosaki-schedule-image-upload`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

```txt
SCHEDULE_IMAGE_UPLOAD_RESULT: STOP
REASON: Sariswing client Storage upload cannot be reused as-is on Gosaki kmjq without a new Storage write policy (and bucket/path/client wiring)
IMPLEMENTATION: not started (no alternate upload architecture)
Edge deploy required: false
Storage policy change required: true
RLS change required: false
verifier result: not run (no code change)
SAFE_TO_REVIEW_IN_BROWSER: false
SAFE_TO_PROCEED_TO_PRODUCTION_ROLLOUT: false
```

No DB migration, no Storage policy SQL, no Edge deploy, no Secret change, no production build, no FTP, no push, no commit, no live Storage write.

---

## 1. Sariswing source implementation

Live Schedule admin is **not** the Kit scaffold `AdminImageUploader.astro` (G-5n, `disabled=true`, “no Storage upload”).

Sariswing production admin:

| Role | File |
| --- | --- |
| Core upload | `src/lib/admin/image-upload.ts` |
| News-style single URL UI | `src/lib/admin/mount-image-upload-field.ts` |
| Schedule multi-image UI | `src/lib/admin/schedule-image-fields.ts` |
| Schedule list wiring | `src/lib/admin/create-schedule-list-item.ts` |
| Schedule save payload | `src/scripts/admin/schedule.ts` |
| Supabase client | `src/lib/supabase.ts` (`createClient` + anon; JWT from Auth session) |

Schedule UI label: **画像（複数可）**. Save writes `image_urls` (array). `image_url` in the payload is set to `null` on that form; public pages fall back `image_urls` → `image_url`.

Gosaki already uses a **single** `schedules.image_url` field (previous phase). The closer Sariswing UI is `mount-image-upload-field.ts` (file button → public URL → `data-field="image_url"`), not the multi-image list.

---

## 2. File selection UI

`schedule-image-fields.ts`:

- Hidden `input[type=file]` created on click
- `accept = image/jpeg,image/png,image/webp`
- Button **アップロード** → processing label **処理中...**
- Preview `<img class="schedule-images__preview">`
- Manual URL input kept

`mount-image-upload-field.ts` (news / single URL):

- Button **画像をアップロード**
- Processing **画像を処理中...**
- Writes `urlInput.value` and dispatches `input`
- Hint: JPG/PNG/WebP · long edge 1600px · 2MB

---

## 3–4. Upload destination / bucket / path

```txt
bucket: PUBLIC_STORAGE_BUCKET || "images"
path:   {prefix}/{YYYY-MM}/{16-char-random}{ext}
prefix: "schedule" | "news" | "discography"
upsert: false
cacheControl: 31536000
```

Example public URL (Sariswing project):

```txt
https://{project}.supabase.co/storage/v1/object/public/images/schedule/2026-09/{random}.webp
```

Replace: **new object each time**. Old Storage objects are **not** deleted. Previous URL in the form is overwritten only after a successful upload.

Kit / Gosaki design (docs, not live admin upload):

```txt
bucket: site-assets
path:   {siteSlug}/schedule/{legacyId}/flyer.{ext}
example: site-assets/gosaki/discography/{legacy_id}/cover.{ext}  (already public on kmjq)
```

Documented SQL: `tools/static-to-astro/docs/sql/staging-site-assets-bucket.sql`

- Public **SELECT** only (`site-assets public read`)
- Writes described as **service_role implicit**
- **No authenticated INSERT / UPDATE / DELETE policy**

---

## 5. Upload API / Edge / client logic

**Client-only.** No Edge Function for bytes.

1. `processImageForUpload` — MIME check, canvas resize (max long edge 1600), prefer WebP, else PNG if alpha, else JPEG
2. `supabase.storage.from(bucket).upload(path, file, { upsert: false })`
3. `getPublicUrl(storagePath)` → return string

Gosaki Schedule Save of `image_url` remains the existing Edge `gosaki-schedule-save-dry-run` (URL string only). That path does **not** upload files.

---

## 6. Public URL format after upload

`storage.from(IMAGE_UPLOAD_BUCKET).getPublicUrl(storagePath).data.publicUrl`

HTTPS object URL under `/storage/v1/object/public/{bucket}/{path}`.

---

## 7. Authz

- Browser must have a logged-in Supabase session (same as Sariswing `/admin`)
- Upload uses that JWT against Storage RLS
- **service_role is not used** in the Sariswing admin client (correct; must stay unused)
- kmjq `site-assets` documented policies: **anon/authenticated can SELECT; cannot INSERT**
- Discography covers already in kmjq `site-assets` were **CLI / service_role era**, not admin JWT upload

Live kmjq Storage policies were **not** dumped (no Dashboard / no service_role). Documented SQL is the source of truth used here.

---

## 8. File restrictions

| Constraint | Value |
| --- | --- |
| MIME | `image/jpeg`, `image/png`, `image/webp` only |
| Extension | `.jpg` / `.png` / `.webp` |
| Max after encode | **2 MB** (`IMAGE_UPLOAD_MAX_BYTES`) |
| Max long edge | **1600 px** |
| Encode quality | 0.82 (step down to 0.42 for lossy) |
| Bucket SQL MIME (site-assets) | jpeg/png/webp/gif/avif, size limit **5 MB** (CLI bucket; not the admin 2 MB cap) |

---

## 9. Existing image replacement

- Form URL replaced with new public URL
- Storage: `upsert: false` + random path → **orphan previous object**
- No delete API
- Manual URL paste still works independently of upload

---

## 10. What can be reused vs why STOP

**Reusable as design (do not copy into Gosaki until policy exists):**

- `processImageForUpload` / MIME / 2MB / 1600px / WebP
- File button + uploading state + preview
- Write public URL into existing `image_url` input
- Keep URL field
- `upsert: false`
- Single-field UI (`mount-image-upload-field.ts`), **not** `image_urls` multi list
- Public month cards already render `image_url` (previous phase)

**Cannot reuse as-is:**

| Gap | Sariswing | Gosaki kmjq |
| --- | --- | --- |
| Bucket | `images` | `site-assets` (covers already there). Using production `images` is forbidden. |
| Client import | `src/lib/supabase.ts` | Static admin `createClient` + `getAccessToken`; no that module |
| Storage write | Auth session + production Storage policies | Documented `site-assets` = **SELECT only** |
| Schema | `image_urls[]` | Single `image_url` |
| Path | `schedule/YYYY-MM/random.ext` | Kit: `{siteSlug}/schedule/{legacyId}/flyer.{ext}` |

Copying `image-upload.ts` unchanged would either:

- hit a missing `images` bucket / wrong project, or
- hit `site-assets` and **fail INSERT** without a new policy, or
- require **service_role** (forbidden)

Inventing Edge-proxy upload, GitHub blob, or unsigned anon write would be a **new** upload architecture. Per phase rules: **stop**.

---

## Required deltas (not executed)

1. **Storage policy (kmjq only, additive, operator-approved SQL later)**  
   Authenticated INSERT (and optional UPDATE) on `storage.objects` where `bucket_id = 'site-assets'` and `name` like `{siteSlug}/schedule/%`, gated the same way as table writes (`can_write_site` / equivalent). Public SELECT stays. **Do not apply in this phase.**
2. **Client adapter** (after policy): inject Gosaki logged-in `createClient` into the Sariswing upload helpers; bucket `site-assets`; never vsbvnd.
3. **Path**: prefer Kit `{siteSlug}/schedule/{legacyId}/flyer.{ext}` so Gosaki objects stay isolated from Sariswing `images/schedule/...`. Create-event without `legacy_id` needs a defined temp path or upload-after-create — **decide in implementation phase**, do not invent now.
4. **UI**: port `mountImageUploadField` onto existing 画像URL (`data-field="image_url"`). Do not add `image_urls`.
5. **Edge**: not required for bytes. Schedule Save of the resulting URL already uses `gosaki-schedule-save-dry-run` (`image_url` allowlist from prior phase).
6. **RLS on `public.schedules`**: no change (column already saved as text URL).
7. **Do not** enable `AdminImageUploader.astro` scaffold as a second mechanism.

---

## Changed files

None (source / templates / Edge / SQL). This document + AI SoT only.

---

## Admin UI behavior / upload flow / image_url integration

**Unchanged.** `/admin/schedule/` still has 画像URL text + preview from `gosaki-schedule-image-ui-and-home-date`. No file input / upload button added.

Upload flow: **not implemented**.

`image_url` Save path: existing (empty → null; http(s); max ~2000). `home_image_url` still out of scope.

---

## Safety gates

| Gate | Value |
| --- | --- |
| Edge deploy required | **false** (upload is Storage client; Edge already holds URL) |
| Storage policy change required | **true** (not executed) |
| RLS change required (`public.schedules`) | **false** |
| DB migration | false |
| Secret change | false |
| Production build / FTP / push / commit | false |
| Live Storage write this phase | false |

```txt
SAFE_TO_REVIEW_IN_BROWSER: false
SAFE_TO_PROCEED_TO_PRODUCTION_ROLLOUT: false
```

Next (operator): approve a **kmjq-only** Storage write policy + then a follow-up phase to wire Sariswing `image-upload.ts` + `mount-image-upload-field.ts` to Gosaki admin. Do not FileZilla for this phase (no package change).
