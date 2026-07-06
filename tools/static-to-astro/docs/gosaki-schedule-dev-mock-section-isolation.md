# G-22g1b — Gosaki Schedule UX improvement: dev/mock section isolation

**Phase:** `G-22g1b-gosaki-schedule-dev-mock-section-isolation`  
**Status:** **complete** — UI display only; **no DB write**  
**Date:** 2026-07-07  
**Base commit:** `406cf16`  
**Prior:** [gosaki-schedule-list-ux-legacy-id.md](./gosaki-schedule-list-ux-legacy-id.md) (G-22g1a)

| Check | Status |
| --- | --- |
| Dev/mock section visually isolated | **yes** |
| Operator UI guidance added | **yes** |
| G-22f5 confusion addressed | **yes** |
| Save / DB write / FTP | **no** |

---

## Gates

```txt
gosakiScheduleDevMockSectionIsolationComplete: true
phase: G-22g1b-gosaki-schedule-dev-mock-section-isolation
readyForG22g1cPreSavePanelEnhancement: true
readyForG22g2OperatorProcedureHints: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
writeArmedDevServerStarted: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

G-22f5 operator confused the page-bottom **開発者向け詳細** mock / dry-run PoC UI (e.g. `Selected schedule: mock-schedule-2026-07-07`) with the top **Gosaki operator UI**. G-22g1b isolates dev sections visually and adds operator guidance so routine work uses only the top UI.

---

## 2. G-22f5 confusion (what happened)

| Symptom | Cause |
| --- | --- |
| Could not find unpublish buttons | Operator was in dev-tools row picker / G-6 dry-run block, not top operator UI |
| Page search for `unpublish` found nothing | Real UI uses Japanese「非公開」 |
| `mock-schedule-2026-07-07` shown as selected | Mock fixture in dev PoC section — not live Supabase row |
| Read source banner said mock/fixtures | Dev section uses dry-run loader when not live Supabase |

---

## 3. Dev/mock isolation changes

| Location | Change |
| --- | --- |
| **GosakiStagingAdminSchedulePage** | `<details>` summary →「開発者向け詳細 — mock / dry-run PoC（通常操作では使わない）」; amber warning panel; `gosaki-schedule-dev-mock-zone` wrapper around all PoC sections |
| **AdminGosakiStagingScheduleOperatorPage** | G-13c1/G-13c2 PoC cleanup in `gosaki-schedule-dev-tools-panel` + warning + mock zone |
| **AdminStagingScheduleSiteSlugRowPickerSection** | Section banner: `mock-schedule-*` is not real data |
| **AdminStagingScheduleSafeFieldsDryRunSection** | Banner: `Selected schedule: mock-schedule-*` is not real data |
| **AdminStagingScheduleGeneralEditSection** | Banner: dev PoC — not operator target |
| **admin.css** | Warning styles: `gosaki-schedule-dev-tools-panel`, `gosaki-schedule-dev-mock-zone`, section banners |

**Default state:** `<details>` closed (no `open` attribute).

---

## 4. Operator UI guidance

| Element | Content |
| --- | --- |
| `#gosaki-schedule-operator` | Class `gosaki-schedule-operator-primary` |
| `.gosaki-schedule-operator-guide` |「通常の Schedule 操作はこちら」— use top 公演一覧; 非公開 flow; dev section is not for ops |
| `#gosaki-schedule-operator-read-source-banner` | JS: green when Supabase live; amber alert when mock/unavailable |
| `renderOperatorReadSourceBanner()` | In `gosaki-staging-schedule-operator-ui.ts` init |

---

## 5. Files changed

| File | Role |
| --- | --- |
| `gosaki-staging-schedule-operator-ui.ts` | Read-source banner render |
| `AdminGosakiStagingScheduleOperatorPage.astro` | Operator guide + dev PoC isolation |
| `GosakiStagingAdminSchedulePage.astro` | Main dev-tools panel isolation |
| `AdminStagingScheduleSiteSlugRowPickerSection.astro` | Mock row picker banner |
| `AdminStagingScheduleSafeFieldsDryRunSection.astro` | Mock dry-run banner |
| `AdminStagingScheduleGeneralEditSection.astro` | Dev PoC banner |
| `admin.css` | Isolation / guide / banner styles |

**Not changed:** save modules, guards, approval IDs, env arms, write adapters.

---

## 6. Safety confirmation

| Check | Status |
| --- | --- |
| Save executed | **no** |
| DB write executed | **no** |
| SQL mutation | **no** |
| package regen / FTP | **no** |
| write-armed dev server | **not started** |
| Save/delete/update behavior | **unchanged** |

---

## 7. Next phases

| Phase | Scope |
| --- | --- |
| **G-22g1c** | Pre-save panel target emphasis (legacy_id / date / title when write-armed) |
| **G-22g2** | Operator procedure hints + Save result label fix |

---

**G-22g1b complete.** Recommended next: **G-22g1c** or **G-22g2**.
