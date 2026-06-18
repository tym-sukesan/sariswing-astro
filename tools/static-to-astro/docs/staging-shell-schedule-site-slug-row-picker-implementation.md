# Staging shell schedule site_slug row picker implementation (G-9g3f1)

**Phase:** `G-9g3f1-row-picker-implementation`  
**Date:** 2026-06-18  
**Prior:** G-9g3f planning — commit `9333e2c`  
**Type:** implementation only — **no Save, no Preview click, no DB write, no Supabase SQL execution by Cursor**

---

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerImplementationComplete: true
readyForG9g3f2RowPickerReadOnlySmokeTest: true
```

**Save was not clicked.** **Preview was not clicked.** **DB write was not executed.**

---

## 1. Summary

Read-only schedule row picker for staging shell `#schedule` — site_slug-scoped list, client filters, selected row summary. General edit form binding **deferred** to G-9g3f3.

| Check | Status |
| --- | --- |
| Row picker read-only | **yes** |
| site_slug fixed (`gosaki-piano`) | **yes** |
| Pilot row audit-only exclusion | **yes** |
| General edit binding changed | **no** (deferred G-9g3f3) |
| G-9g3d / PoC Save freeze | **unchanged** |
| `/admin` touched | **no** |
| service_role used | **no** |

---

## 2. Files

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | `G9G3F1_PHASE`, `POC_AUDIT_STAGING_MARKER` |
| `staging-schedule-read.ts` | `publishedFilter` option on `loadSchedulesForSiteSlugRead` |
| `staging-schedule-site-slug-row-picker-utils.ts` | PoC audit row detection + split |
| `staging-schedule-site-slug-row-picker-binding.ts` | SSR binding (`publishedFilter: "all"`) |
| `staging-schedule-site-slug-row-picker-ui.ts` | Client filters, selection, reload SELECT |
| `AdminStagingScheduleSiteSlugRowPickerSection.astro` | Read-only UI |
| `musician-basic-admin-prototype.astro` | Wire picker between read + edit sections |

---

## 3. Row picker UI

- Schedule row table (selectable rows only)
- Filters: future/past, month, published (default **true**), keyword search
- Row detail preview (JSON)
- Selected row summary: `id`, `legacy_id`, `site_slug`, `updated_at`, `date`, `title`, …
- Clear selection / Reload selected row (SELECT only) / Reload page
- PoC audit rows in collapsed `<details>` (not selectable)
- Production host STOP banner when host gate fails

---

## 4. site_slug safety

- Binding uses `STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG` constant
- Loader: `.eq("site_slug", siteSlug)` always
- Reload selected row: `.eq("id", …).eq("site_slug", siteSlug)` + post-check
- Operator cannot change site_slug in UI

---

## 5. Pilot row / PoC audit policy

Excluded from selectable rows:

- `id === aa440e29-5be8-402e-9190-0d81c48434c0` (pilot row)
- Any row with `[CMS Kit staging]` in safe text fields

Shown in **PoC audit rows** panel (read-only).

---

## 6. General edit safety (unchanged)

- Edit section still loads fixed pilot row via `resolveGosakiScheduleSiteSlugEditBinding`
- G-9g3d PoC freeze, legacy audit-only UI, changed-fields-only guards — **not modified**
- Operational Save / approval ID — **deferred G-9g3g**

---

## 7. Next

**G-9g3f2-row-picker-read-only-smoke-test** — HTTP GET + operator row select smoke; no Save / Preview / DB write.
