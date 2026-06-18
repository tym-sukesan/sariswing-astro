# Staging shell schedule site_slug row picker → general edit binding hardening (G-9g3f3c)

**Phase:** `G-9g3f3c-row-picker-general-edit-binding-hardening`  
**Status:** **G-9g3f3c hardening completed**  
**Date:** 2026-06-18  
**Prior:** G-9g3f3b smoke — commit `8d277d8`  
**Type:** implementation only — **no Save, no Preview click by Cursor, no DB write, no Supabase SQL mutation**

---

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningComplete: true
readyForG9g3f3dRowPickerGeneralEditBindingHardeningSmokeTest: true
cursorClickedSave: false
cursorClickedPreview: false
```

**Save not clicked.** **DB write not executed.** **SQL mutation not executed.** **service_role not used.** **production untouched.**

---

## 1. Hardening scope

| Feature | Implementation |
| --- | --- |
| Dirty candidate row-switch protection | `confirmDiscardDirtyCandidateIfNeeded` in picker before selection; constant `G9G3F3C_ROW_SWITCH_UNSAVED_CONFIRM_MSG` |
| Preview stale invalidation | `markG9PreviewStale` — field input, row identity change, reload `updated_at` change |
| Selected row identity display | `#site-slug-edit-selected-row-strip` — id, legacy_id, site_slug, updated_at, source_route, title |
| G-9 / G-6 preview distinction | `#site-slug-edit-dry-run-preview-btn` / `#site-slug-edit-dry-run-result` maintained; legacy G-6-e2 not valid |
| PoC audit row excluded | `isPocAuditScheduleRow` — pilot `aa440e29-5be8-402e-9190-0d81c48434c0` not selectable |

---

## 2. Dirty candidate row-switch protection

When general edit has candidate values differing from loaded DB baseline:

- Row picker calls `confirmDiscardDirtyCandidateIfNeeded(nextRowId)` **before** updating picker selection
- Confirm message: `You have unsaved candidate edits. Switching rows will discard the current candidate values. Continue?`
- **Cancel:** picker selection unchanged; edit form keeps current row + candidates
- **Continue:** picker dispatches `row-selected`; edit form hydrates new row; preview cleared

---

## 3. Preview stale invalidation

Stale triggers:

| Trigger | Behavior |
| --- | --- |
| Candidate field input | `markG9PreviewStale` — banner `Preview is stale — run G-9 preview again`; prior result dimmed |
| Row picker switch | `hydrateFromRow` clears preview placeholder |
| `updated_at` change on reload | Placeholder with stale message |
| Save gate | Stale preview keeps Save disabled (operational Save not exposed) |

G-9 panel ids unchanged:

- Preview button: `#site-slug-edit-dry-run-preview-btn`
- Result panel: `#site-slug-edit-dry-run-result`

---

## 4. Selected row identity

Edit form strip (`data-selected-row-identity="true"`) shows:

- `id`, `legacy_id`, `site_slug`, `updated_at`, `source_route`, `title`

---

## 5. Forbidden operations avoided

- Save / DB write / SQL mutation: **not executed**
- FTP / deploy / workflow_dispatch: **not executed**
- `service_role`: **not used**
- Playwright auto-click: **not used**
- `/admin` / production: **not touched**
- G-9g2 / G-9g3b / G-9g3c / G-9g3d Save re-run: **not performed**

---

## 6. Verifiers

```bash
node tools/static-to-astro/scripts/verify-g9g3f3c-row-picker-general-edit-binding-hardening.mjs
node tools/static-to-astro/scripts/verify-g9g3f3b-row-picker-general-edit-binding-smoke.mjs
node tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs
```

---

## 7. Next phase

**`G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test`** — operator manual smoke for dirty switch confirm + preview stale UX.

Later: `G-9g3g-operational-general-edit-planning`

---

## 8. Git

```txt
G-9g3f3c committed at: f0fd3af
G-9g3f3d smoke: passed (see hardening-smoke-test-result.md)
```
