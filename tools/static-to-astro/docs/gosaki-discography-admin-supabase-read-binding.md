# G-15a — Gosaki Discography admin Supabase read binding

**Phase:** `G-15a-gosaki-discography-admin-supabase-read-binding`  
**Status:** **complete** — Discography admin reads staging Supabase (`discography` + `discography_tracks`); Save / DB write **disabled**  
**Date:** 2026-06-28  
**Base commit:** `8532413`  
**Prior:** G-15 inventory / plan

| Check | Status |
| --- | --- |
| Admin route confirmed | **yes** |
| Static JSON read replaced | **yes** |
| Supabase SELECT (4 albums) | **yes** |
| Save disabled | **yes** |
| DB write path | **none** |
| Cursor Save / migration / FTP | **no** |

---

## Gates

```txt
gosakiDiscographyAdminSupabaseReadBindingComplete: true
phase: G-15a-gosaki-discography-admin-supabase-read-binding
readyForG15a2DiscographyDryRunPreviewPreflight: true
readyForG15bDiscographySaveSlice: false
supabaseReadEnabled: true
saveEnabled: false
dbWriteEnabled: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorMigrationExecuted: false
```

---

## 1. Admin route / component map

| Item | Path |
| --- | --- |
| **URL** | `/__admin-staging-shell/musician-basic/admin/discography/` |
| **Shell entry** | `src/pages/__admin-staging-shell/musician-basic/admin/discography/index.astro` |
| **Page** | `templates/admin-cms/gosaki/pages/GosakiStagingAdminDiscographyPage.astro` |
| **Operator UI** | `templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro` |
| **Client UI** | `src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts` |

**Before G-15a:** `loadGosakiDiscographyAdminBinding()` → static JSON  
**After G-15a:** `resolveGosakiDiscographySupabaseReadBinding()` → Supabase SELECT

---

## 2. Read binding implementation

| File | Role |
| --- | --- |
| `gosaki-discography-read-types.ts` | Types + expected legacy_ids |
| `staging-discography-read.ts` | `loadDiscographyForAdminRead()` — SELECT only |
| `gosaki-discography-supabase-read-binding.ts` | SSR resolver + host / project gates |

### Tables (read-only)

- `public.discography` — main binding (all rows, no `site_slug` filter)
- `public.discography_tracks` — reference for track list display

### SELECT columns (`discography`)

`id`, `legacy_id`, `title`, `artist`, `release_date`, `year`, `catalog_number`, `label`, `description`, `cover_image_url`, `purchase_url`, `streaming_url`, `sort_order`, `published`, `updated_at`

### Env gates (same as Schedule read)

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_SUPABASE_URL → kmjqppxjdnwwrtaeqjta.supabase.co
PUBLIC_SUPABASE_ANON_KEY
```

Host gate blocks Sariswing production host `vsbvndwuajjhnzpohghh.supabase.co`.

---

## 3. UI behavior

Status panel (explicit):

```txt
Discography Supabase read: enabled
Save: disabled
DB write: disabled
```

List shows **4 albums** with `legacy_id`, `published`, `sort_order`.

Default selected row for edit form: `discography-002` (SKYLARK) when present.

Form fields populated from Supabase values; **editable in UI** but Save buttons disabled.

`cover_image_url` and `discography_tracks` are **read-only** in form.

---

## 4. Expected albums (staging)

| legacy_id | title |
| --- | --- |
| discography-001 | Continuous |
| discography-002 | SKYLARK |
| discography-003 | About Us!! |
| discography-004 | Ja-Jaaaaan! |

---

## 5. Not in scope (G-15a)

- Save / dry-run write / Preview write
- DB UPDATE / INSERT / DELETE
- `site_slug` migration
- Public `/discography/` DB-driven regen
- Image upload
- Track edit Save

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15a-gosaki-discography-admin-supabase-read-binding.mjs
```

---

## 7. Next phase

**G-15a2** — dry-run Preview preflight for one existing row (recommended: `discography-002` / `purchase_url` or `description`).
