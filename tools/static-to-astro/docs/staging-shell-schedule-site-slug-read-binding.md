# Staging shell schedule site_slug read binding (G-9f)

**Phase:** `G-9f-staging-shell-schedule-site-slug-read-binding`  
**Date:** 2026-06-17  
**Prior:** G-9e commit `15cf29b`  
**Type:** read-only staging shell UI — no writes, no `/admin` changes

---

## 1. Background

G-9e generalized convert-time schedule read by `site_slug`. G-9f adds **staging shell** read-only visibility for Gosaki (`site_slug=gosaki-piano`) so operators can verify DB rows before future write UI work.

---

## 2. Target shell

| Item | Value |
| --- | --- |
| **Route** | `/__admin-staging-shell/musician-basic/#schedule` |
| **Page** | `src/pages/__admin-staging-shell/musician-basic/index.astro` |
| **Prototype** | `tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro` |
| **NOT touched** | `src/pages/admin/` |

### Env gates (unchanged)

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY
```

---

## 3. site_slug read policy

| Rule | Value |
| --- | --- |
| `site_slug` | `gosaki-piano` (`STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG`) |
| `published` | `true` |
| `source_route` | canonical `/schedule/YYYY-MM/` |
| `months` | 2026-03 … 2026-07 (optional filter) |
| Sort | date → sort_order → legacy_id |
| `service_role` | **not used** |

---

## 4. Read-only guarantee

- Section displays summary + table only
- **No** Save / Update / Delete buttons
- **No** editable inputs in G-9f section
- Marker: `Read-only staging shell. No writes are performed.`
- Existing G-6 write PoC sections **unchanged**

---

## 5. Display

### Summary

```txt
Site slug: gosaki-piano
Rows: 60 (when Supabase env + data read enabled)
Data source: Supabase read-only
Month counts: 2026-03:13, 2026-04:10, …
```

### Row table columns

`date`, `title`, `venue`, `source_route`, `published`, `show_on_home`, `legacy_id`

---

## 6. Implementation

| File | Role |
| --- | --- |
| `src/lib/admin/staging-data/staging-schedule-site-slug-config.ts` | Gosaki constants |
| `src/lib/admin/staging-write/staging-schedule-read.ts` | `loadSchedulesForSiteSlugRead()` |
| `src/lib/admin/staging-data/staging-schedule-site-slug-read-binding.ts` | SSR binding resolver |
| `templates/.../AdminStagingScheduleSiteSlugReadSection.astro` | Read-only UI |
| `musician-basic-admin-prototype.astro` | Wire section in `#schedule` |

---

## 7. Safety

| Rule | Status |
| --- | --- |
| DB write / SQL | none |
| `service_role` | not used |
| FTP | not executed |
| `/admin` | not modified |

---

## 8. Verification

```bash
cd tools/static-to-astro
node scripts/verify-url-to-staging-pipeline.mjs  # G-9f assertions
node scripts/verify-gosaki-schedule-seed-extractor.mjs
# ... standard verifiers
```

Local dev (operator):

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
npm run dev
# → /__admin-staging-shell/musician-basic/#schedule
```

---

## 9. Gates

```txt
stagingShellScheduleSiteSlugReadBindingComplete: true
stagingShellScheduleReadOnly: true
stagingShellScheduleUsesSiteSlug: true
stagingShellGosakiRowsVisible: true
stagingShellNoWriteUiAdded: true
stagingShellNoAdminRouteTouched: true
readyForG9fCommit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 10. Next

- Operator visual check with staging Supabase env (60 rows)
- Future: staging shell write slices with `site_slug` (separate approval IDs)
- Do not modify G-6 PoC write sections without new phase
