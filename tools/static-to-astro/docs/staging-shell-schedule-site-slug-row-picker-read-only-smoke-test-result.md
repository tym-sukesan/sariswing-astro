# Staging shell schedule site_slug row picker read-only smoke test result (G-9g3f2)

**Phase:** `G-9g3f2-row-picker-read-only-smoke-test`  
**Status:** **G-9g3f2 smoke completed**  
**Date:** 2026-06-18  
**Prior:** G-9g3f1 implementation — commit `c3d49ee`  
**Type:** SSR + static/source smoke — **no Save, no Preview click, no DB write, no manual SQL**

**Click policy this phase:**

| Actor | Preview | Save | Row select |
| --- | --- | --- | --- |
| Operator (manual) | **not performed** | **not performed** | **optional — not required for gate** |
| Cursor / AI / Playwright | **not performed** | **not performed** | **not performed** |

**UI verification:** HTTP GET / SSR smoke (`curl` / `fetch` staging shell HTML).  
**Static verification:** source marker reads + `verify-g9g3f-row-picker-read-only-smoke.mjs`.

**actualWrite:** `false` always. **DB write:** none. **Manual SQL:** none.

---

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerReadOnlySmokeTestPassed: true
readyForG9g3f3RowPickerGeneralEditBindingPlanning: true
cursorClickedSave: false
cursorClickedPreview: false
cursorClickedRowSelect: false
operatorManualRowSelectClicked: false
```

**Save was not clicked.** **Preview was not clicked.** **DB write was not executed.** **Manual SQL was not executed.**

**HTTP GET / SSR smoke completed.** **row picker is read-only** (Read-only row picker UI). **site_slug fixed to `gosaki-piano`**. **pilot row audit-only confirmed**. **PoC marker rows excluded from default selectable rows**. **general edit binding deferred**. **service_role not used**. **production untouched**.

---

## 1. Route

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
```

| Check | Result |
| --- | --- |
| Staging shell route | **PASS** |
| `/admin` | **not used** |

---

## 2. Routine dev safety (verified)

| Env / condition | Expected | Result |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_WRITE` | `false` | **PASS** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `true` | **PASS** |
| All G-9 arms | off | **PASS** |
| `PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE` | off | **PASS** |
| `PUBLIC_SUPABASE_URL` host | `kmjqppxjdnwwrtaeqjta.supabase.co` | **PASS** |
| Production host | not active | **PASS** |
| `service_role` | not used | **PASS** |

---

## 3. UI smoke — HTTP GET / SSR only

Dev server: routine `.env.local` (`npm run dev` on port 4321).  
**HTTP GET only** — no Cursor / AI / Playwright clicks.

| Check | Result |
| --- | --- |
| Row picker section (`admin-staging-schedule-site-slug-row-picker`) | **PASS** |
| G-9g3f1 title | **PASS** |
| `data-general-edit-binding-deferred="true"` | **PASS** |
| `data-site-slug="gosaki-piano"` | **PASS** |
| Read-only banner | **PASS** |
| activeHost staging | **PASS** |
| Production host absent from SSR body | **PASS** |
| `data-host-gate-passed="true"` (routine dev) | **PASS** |
| Production STOP (conditional — hidden when host OK) | **PASS** (source + host gate) |
| PoC audit rows panel | **PASS** |
| Selected row summary area | **PASS** |
| Row detail preview area | **PASS** |
| Clear / Reload row / Reload page buttons | **PASS** |
| Filters: time / month / published / keyword | **PASS** |
| Published filter default `true` | **PASS** |
| No Save / Preview in picker section | **PASS** |
| Selectable rows in SSR (`data-selectable-rows`) | **59 rows** |
| PoC audit rows in SSR (`data-audit-rows`) | **1 row** (pilot) |
| Pilot `aa440e29-…` excluded from selectable JSON | **PASS** |
| `[CMS Kit staging]` marker excluded from selectable JSON | **PASS** |
| Pilot in audit JSON | **PASS** |
| General edit deferred note (G-9g3f3) | **PASS** |

**Automated SSR checks:** see `verify-g9g3f-row-picker-read-only-smoke.mjs`.

---

## 4. Operator manual UI smoke

**Cursor / AI did not click.** Operator manual selection is **optional** for this gate.

| Check | Cursor smoke | Operator manual |
| --- | --- | --- |
| Select one selectable row | not performed | optional follow-up |
| Selected summary fields | SSR elements present | optional follow-up |
| Clear selection | button present | optional follow-up |
| Reload selected row (read-only SELECT) | button present | optional follow-up |
| Save / Preview | not clicked | not clicked |

SSR proves selectable row data is loaded and UI controls exist. Operator may manually verify selection UX before G-9g3f3.

---

## 5. Static / source smoke

| Check | Result |
| --- | --- |
| `.eq("site_slug", siteSlug)` on list load | **PASS** |
| Reload `.eq("id", …).eq("site_slug", …)` | **PASS** |
| `row.site_slug !== siteSlug` validation | **PASS** |
| `STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG` binding | **PASS** |
| Operator cannot edit site_slug | **PASS** |
| No DB mutation path in row picker | **PASS** |
| `service_role` not used | **PASS** |
| `/admin` untouched | **PASS** |
| General edit binding deferred | **PASS** |
| Pilot + PoC marker audit policy | **PASS** |

---

## 6. Forbidden operations avoided

- Save / Preview: **not clicked**
- DB write / manual SQL mutation: **not executed**
- FTP / deploy / workflow_dispatch: **not executed**
- `service_role`: **not used**
- Playwright auto-click: **not used**
- `/admin` / production: **not touched**

---

## 7. Next phase

**`G-9g3f3-row-picker-general-edit-binding-planning`** — planning only; bind general edit form to picker selection; no Save / DB write unless explicitly approved in later execution phases.
