# Staging shell schedule site_slug row picker → general edit binding smoke test result (G-9g3f3b)

**Phase:** `G-9g3f3b-row-picker-general-edit-binding-smoke-test`  
**Status:** **G-9g3f3b smoke passed**  
**Date:** 2026-06-18  
**Prior:** G-9g3f3a implementation — commit `1ec29eb`  
**Type:** operator manual UI + static/source — **no Save, no DB write, no Supabase SQL mutation**

---

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingSmokeTestPassed: true
readyForG9g3f3cRowPickerGeneralEditBindingHardening: true
operatorManualRowSelectClicked: true
operatorManualPreviewClicked: true
g9g3dChangedFieldsOnlyPreviewConfirmed: true
g9ManualReSmokePassed: true
cursorClickedSave: false
cursorClickedPreview: false
```

**Save not clicked.** **DB write not executed.** **SQL mutation not executed.** **service_role not used.** **production untouched.**

---

## 1. Route

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
```

---

## 2. Selected row (non-PoC)

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |

Pilot row `aa440e29-…` was **not** used (audit-only; not in picker selectable list).

---

## 3. Row picker → general edit hydrate — **PASS**

- CustomEvent bridge hydrate from row picker selection
- No fixed pilot SSR preload
- Loaded DB / Candidate values matched selected row
- legacy PoC UI default hidden
- Save general edit disabled / frozen

---

## 4. G-9 Preview dry-run — **PASS (manual re-smoke)**

### Controls used (successful re-smoke)

| Item | Value |
| --- | --- |
| Preview button | `#site-slug-edit-dry-run-preview-btn` |
| Result panel title | `G-9 site_slug general edit preview result` |
| Result panel id | `#site-slug-edit-dry-run-result` |
| approvalId (expected / confirmed) | `G-9g1-schedule-site-slug-edit-dry-run-preview` |
| Legacy G-6-e2 panel used | **no** (successful re-smoke) |

### Preview result

| Check | Result |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `price` only |
| payload (changed-fields-only) | `{ "price": "[CMS Kit staging] G-9g3f3b row-picker binding smoke price candidate" }` |
| before.price | `3,500円` |
| after.price | `[CMS Kit staging] G-9g3f3b row-picker binding smoke price candidate` |
| title / venue / open_time / start_time / description | unchanged |
| optimisticLock.expectedBeforeUpdatedAt | `2026-06-16T16:03:41.551792+00:00` |
| optimisticLock.currentUpdatedAt | `2026-06-16T16:03:41.551792+00:00` |
| optimisticLock.stale | `false` |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| expectedHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| hostGatePassed | `true` |

Post-check: operator restored price candidate input to baseline `3,500円` without Save.

---

## 5. False-path note (first attempt — not pass criteria)

First operator Preview attempt showed **legacy G-6-e2** semantics (`approvalId=G-6-e2-schedule-dry-run-ui`, full payload, no `changedFields` / `optimisticLock` / `hostGatePassed`). That was an **operator guidance / UI confusion issue**, not a G-9 wiring bug.

**Legacy G-6-e2 result was not accepted as pass.** UI labels were clarified; successful re-smoke used the G-9 button and panel above.

---

## 6. Forbidden operations avoided

- Save / DB write / SQL mutation: **not executed**
- FTP / deploy / workflow_dispatch: **not executed**
- `service_role`: **not used**
- Playwright auto-click: **not used**
- `/admin` / production: **not touched**
- G-9g2 / G-9g3b / G-9g3c / G-9g3d Save re-run: **not performed**

---

## 7. Verifiers

```bash
node tools/static-to-astro/scripts/verify-g9g3f3b-row-picker-general-edit-binding-smoke.mjs
node tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs
```

---

## 8. Next phase

**`G-9g3f3c-row-picker-general-edit-binding-hardening`** — reload/stale invalidation, row-switch discard confirm, optional UX polish.

---

## 9. Git

```txt
G-9g3f3a committed at: 1ec29eb
G-9g3f3b smoke: passed (uncommitted)
```
