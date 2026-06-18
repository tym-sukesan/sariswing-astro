# Staging shell schedule site_slug row picker → general edit binding hardening smoke test result (G-9g3f3d)

**Phase:** `G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test`  
**Status:** **G-9g3f3d hardening smoke passed**  
**Date:** 2026-06-18  
**Prior:** G-9g3f3c hardening — commit `f0fd3af`  
**Type:** operator manual UI + static/source — **no Save, no DB write, no Supabase SQL mutation**

---

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningSmokeTestPassed: true
readyForG9g3gOperationalGeneralEditPlanning: true
operatorManualRowSelectClicked: true
operatorManualPreviewClicked: true
operatorManualStaleInvalidationConfirmed: true
operatorManualDirtySwitchCancelConfirmed: true
operatorManualDirtySwitchContinueConfirmed: true
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

## 2. Rows used (non-PoC)

### First row (identity + dirty switch Cancel)

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |

### Second row (Continue + G-9 Preview + stale)

| Field | Value |
| --- | --- |
| id | `09c149b1-1c4e-4f02-936a-3e191c930468` |
| legacy_id | `schedule-2026-03-002` |
| site_slug | `gosaki-piano` |
| title | `<GG Funky Jazzy>` |
| price baseline | `3,850円(税込)` |
| updated_at | `2026-06-16T16:03:41.551792+00:00` |

PoC audit row `aa440e29-5be8-402e-9190-0d81c48434c0` — **not** selectable.

---

## 3. Selected row identity display — **PASS**

**Panel:** `#site-slug-edit-selected-row-strip`

Operator confirmed after row select:

- id, legacy_id, site_slug (`gosaki-piano`), updated_at, source_route, title displayed
- Loaded DB / Candidate values matched selected row
- **selected row identity confirmed**

---

## 4. G-9 Preview dry-run — **PASS**

### Controls used

| Item | Value |
| --- | --- |
| Preview button label | `Preview G-9 site_slug general edit dry-run` |
| Preview button | `#site-slug-edit-dry-run-preview-btn` |
| Result panel title | `G-9 site_slug general edit preview result` |
| Result panel id | `#site-slug-edit-dry-run-result` |
| Legacy G-6-e2 panel used | **no** |

### Preview result (row `09c149b1-…` after Continue)

| Check | Result |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `price` only |
| target.id | `09c149b1-1c4e-4f02-936a-3e191c930468` |
| target.legacy_id | `schedule-2026-03-002` |
| target.site_slug | `gosaki-piano` |
| optimisticLock.expectedBeforeUpdatedAt | `2026-06-16T16:03:41.551792+00:00` |
| optimisticLock.currentUpdatedAt | `2026-06-16T16:03:41.551792+00:00` |
| optimisticLock.stale | `false` |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| expectedHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| hostGatePassed | `true` |
| payload (changed-fields-only) | `{ "price": "[CMS Kit staging] G-9g3f3d stale smoke price candidate" }` |
| before.price | `3,850円(税込)` |
| after.price | `[CMS Kit staging] G-9g3f3d stale smoke price candidate` |

---

## 5. Preview stale invalidation — **PASS**

After Preview, operator changed price to:

`[CMS Kit staging] G-9g3f3d stale smoke price candidate changed`

| Check | Result |
| --- | --- |
| Stale message | `Preview is stale — run G-9 preview again` |
| Prior preview treated as invalid | **yes** (stale banner / dimmed) |
| Save disabled / frozen / gated | **yes** |

**stale invalidation confirmed**

---

## 6. Dirty row-switch protection — **PASS**

With dirty price candidate on row `888c58f2-…` (`<ごちまきトリオ>`), operator attempted to switch rows.

**Confirm dialog:**

`You have unsaved candidate edits. Switching rows will discard the current candidate values. Continue?`

### Cancel — **PASS**

- Selected row remained `<ごちまきトリオ>`
- Dirty price candidate remained
- No hydrate to other row
- **dirty row-switch Cancel confirmed**

### Continue — **PASS**

Operator clicked OK / Continue on second attempt.

- Row switched to `<GG Funky Jazzy>`
- Loaded DB values updated to new row
- Candidate values updated to new row (`3,850円(税込)`)
- Old dirty price candidate discarded
- No DB write
- **dirty row-switch Continue confirmed**

---

## 7. PoC audit row exclusion — **PASS**

Operator keyword search: `CMS Kit staging`

| Check | Result |
| --- | --- |
| Selectable rows matching keyword | `0` |
| Pilot in picker selectable list | **no** |
| Pilot in read-only audit panel | **yes** |

Pilot row:

| Field | Value |
| --- | --- |
| id | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| title | `[CMS Kit staging] G-9g2 title PoC` |
| selectable | **no** (read-only / audit-only) |

**PoC audit row exclusion confirmed**

---

## 8. Forbidden operations avoided

- Save / DB write / SQL mutation: **not executed**
- FTP / deploy / workflow_dispatch: **not executed**
- `service_role`: **not used**
- Playwright auto-click: **not used**
- `/admin` / production: **not touched**
- G-9g2 / G-9g3b / G-9g3c / G-9g3d Save re-run: **not performed**

Post-check: operator restored or should restore candidate price to baseline without Save.

---

## 9. Verifiers

```bash
node tools/static-to-astro/scripts/verify-g9g3f3d-row-picker-general-edit-binding-hardening-smoke.mjs
node tools/static-to-astro/scripts/verify-g9g3f3c-row-picker-general-edit-binding-hardening.mjs
node tools/static-to-astro/scripts/verify-g9g3f3b-row-picker-general-edit-binding-smoke.mjs
node tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs
```

---

## 10. Next phase

**`G-9g3g-operational-general-edit-planning`**

---

## 11. Git

```txt
G-9g3f3c committed at: f0fd3af
G-9g3f3d smoke: passed (uncommitted)
```
