# Gosaki Schedule image upload implementation

- **Phase:** `gosaki-schedule-image-upload-implementation`
- **Date:** 2026-09-28
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **Status:** **LOCAL PASS · LIVE UPLOAD NOT EXECUTED**

**This phase did not:** Storage write · DB write · SQL/policy · Edge deploy · Secret · production build · FTP · commit · push.

Operator stated kmjq policy `site_assets_gosaki_piano_schedule_insert` is already applied. This phase does not re-apply or verify live policies.

---

## 0. Gates

```txt
SCHEDULE_IMAGE_UPLOAD_IMPLEMENTATION_RESULT: PASS
SAFE_TO_REVIEW_IN_BROWSER: true
SAFE_TO_PROCEED_TO_PRODUCTION_TEST: true
LIVE_STORAGE_UPLOAD_EXECUTED: false
LIVE_SCHEDULE_SAVE_EXECUTED: false
Edge deploy required: false
Storage policy change required: false
RLS change required: false
DB_MIGRATION: false
PRODUCTION_BUILD: false
COMMIT: false
```

`SAFE_TO_REVIEW_IN_BROWSER` = owner login on `/admin/schedule/` after a later package generate/FileZilla. This phase did not click Upload (Storage write) or Save.

`SAFE_TO_PROCEED_TO_PRODUCTION_TEST` = source is ready for a later official generate. Do not generate in this phase.

---

## 1. Reused Sariswing logic

From `src/lib/admin/image-upload.ts`:

- MIME allowlist JPEG/PNG/WebP
- canvas resize long edge **1600**
- WebP-prefer encode, PNG if alpha, else JPEG
- **2MB** after encode
- `upsert: false`

From `mount-image-upload-field.ts` (adapted):

- Keep `image_url` text field + preview
- Upload writes public URL into the field
- Manual URL still works

**Not reused:** Sariswing `images` bucket, `schedule/YYYY-MM/random` path, `image_urls` multi list, immediate-upload-on-file-change (Gosaki: select then **アップロード**).

---

## 2. Storage

| Item | Value |
| --- | --- |
| Bucket | `site-assets` |
| Path | `gosaki-piano/schedule/{legacyId\|new}/{16-hex}{ext}` |
| Unique name | `crypto.randomUUID()` hex slice 16 + processed ext (usually `.webp`) |
| Create without `legacy_id` | folder `new` |
| Authz | logged-in session JWT (`Authorization: Bearer`) + anon `apikey` · **not** service_role · **not** anon-as-writer |
| Public URL | `{supabaseUrl}/storage/v1/object/public/site-assets/{path}` → `schedules.image_url` on Save |

Old objects are not deleted. Replace = new unique object + new URL in the field.

Production URL containing `vsbvndwuajjhnzpohghh` is rejected.

---

## 3. Upload flow

1. Edit/create a schedule event (file UI is in the existing form).
2. **画像を選択** — file only; no Storage, no DB.
3. **アップロード** — process → POST Storage → write public URL into `image_url` → preview.
4. Existing **保存** — `image_url` in the same payload as before.
5. Empty URL still means no image. Hand-typed https URL still works.

---

## 4. Changed files

- `templates/site-extensions/gosaki-piano/gosaki-schedule-image-upload.ts` (new)
- `templates/site-extensions/gosaki-piano/gosaki-staging-schedule-operational-edit.ts`
- `templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleContentPanel.astro`
- `scripts/lib/gosaki-staging-read-only-admin.mjs` (copy new lib into package)
- `scripts/verify-gosaki-schedule-image-upload.mjs` (new)
- `scripts/verify-g20u39b4-gosaki-admin-multi-route-staging-package-prep.mjs`
- `scripts/verify-gosaki-admin-save-success-and-live-read.mjs`
- `package.json`

YouTube / Discography / About / public month-card renderer / Edge / RLS: unchanged.

---

## 5. Verifier

```txt
verify:gosaki-schedule-image-upload: 28 passed, 0 failed
verify:gosaki-schedule-image-ui: 27 passed, 0 failed
verify-gosaki-admin-save-success-and-live-read: PASS
verify-g20u39b4: 278 passed, 0 failed
```

---

## 6. Next (not this phase)

Official generate + FileZilla, then owner: select → upload once → confirm URL/preview → Save once. Public HTML still needs a later generate to show flyers.
