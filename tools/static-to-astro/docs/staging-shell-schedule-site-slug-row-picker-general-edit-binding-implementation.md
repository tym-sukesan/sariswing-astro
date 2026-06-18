# Staging shell schedule site_slug row picker → general edit binding implementation (G-9g3f3a)

**Phase:** `G-9g3f3a-row-picker-general-edit-binding-implementation`  
**Date:** 2026-06-18  
**Prior:** G-9g3f3 planning — commit `bf27151`  
**Type:** implementation only — **no Save, no Preview execution, no DB write, no Supabase SQL execution by Cursor**

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked | **no** |
| DB write executed | **no** |
| SQL executed | **no** |
| Operational Save | **not implemented** |
| Operational arm | **not implemented** |

Prior docs:

- [staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md](./staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md)
- [staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md](./staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingImplementationComplete: true
readyForG9g3f3bRowPickerGeneralEditBindingSmokeTest: true
generalEditOperationalSaveNotImplemented: true
```

**Save not implemented.** **Preview was not clicked.** **DB write not implemented.**

---

## 1. Summary

G-9g3f3a wires the read-only row picker to the general edit form via **CustomEvent bridge**. Pilot SSR preload removed; edit form hydrates from operator-selected non-PoC rows only.

| Check | Status |
| --- | --- |
| CustomEvent bridge | **yes** |
| Selected row hydrates edit form | **yes** |
| Pilot SSR preload removed | **yes** |
| Selected row null disables edit | **yes** |
| PoC audit row edit blocked | **yes** |
| site_slug mismatch STOP | **yes** |
| Preview execution | **deferred G-9g3f3b** |
| Save / operational arm | **not implemented** |
| `/admin` touched | **no** |
| service_role used | **no** |

---

## 2. CustomEvent bridge

Events (`staging-schedule-site-slug-row-picker-events.ts`):

| Event | When |
| --- | --- |
| `staging-schedule-site-slug-row-selected` | Valid non-PoC row selected |
| `staging-schedule-site-slug-row-cleared` | Clear selection / block |
| `staging-schedule-site-slug-row-reloaded` | Reload selected row (SELECT only) |

Detail includes: `id`, `legacy_id`, `site_slug`, `updated_at`, `date`, `title`, `venue`, `open_time`, `start_time`, `price`, `description`, `source_route`, `published`, `show_on_home`, `home_order`, `sort_order`.

---

## 3. Files

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-row-picker-events.ts` | Event names + detail builders |
| `staging-schedule-site-slug-edit-picker-binding.ts` | Edit-side listener + hydrate |
| `staging-schedule-site-slug-row-picker-ui.ts` | Dispatch on select/clear/reload |
| `staging-schedule-site-slug-edit-binding.ts` | SSR `targetRow: null`; picker-driven |
| `staging-schedule-site-slug-edit-ui.ts` | Preview deferred; Save blocked |
| `AdminStagingScheduleSiteSlugEditSection.astro` | Picker-driven UI markers |
| `AdminStagingScheduleSiteSlugRowPickerSection.astro` | `data-general-edit-binding-deferred="false"` |

---

## 4. Pilot SSR preload removal

- `resolveGosakiScheduleSiteSlugEditBinding` no longer calls `loadScheduleRowForSiteSlugRead` for pilot row
- `targetId` / `legacyId` empty at SSR; `targetRow: null`
- Pilot row remains in PoC audit panel only — not default edit target

---

## 5. Selected row safety

- `site_slug !== gosaki-piano` → STOP + hydrate blocked
- `isPocAuditScheduleRow()` → STOP + hydrate blocked
- Null selection → candidate inputs disabled; placeholder shown
- Dirty candidate on row switch → `window.confirm` discard prompt
- Reload / `updated_at` change → preview session invalidated; stale banner

---

## 6. Preview / Save

- **Preview:** button present but disabled; execution deferred to **G-9g3f3b**
- **Save:** frozen (G-9g3d PoC executed) + G-9g3f3a operational path not implemented
- **No** `PUBLIC_ADMIN_SCHEDULE_SITE_SLUG_GENERAL_EDIT_ENABLED`
- **operational arm not implemented**
- **No** DB mutation path added

---

## 7. Next

**G-9g3f3b-row-picker-general-edit-binding-smoke-test** — dry-run Preview on selected row; no Save / DB write.
