# G-22e — Gosaki Schedule new event dry-run + UI wire implementation

**Phase:** `G-22e-gosaki-schedule-new-event-dry-run-ui-implementation`  
**Status:** **complete** — local dry-run UI only (no Save / DB write)  
**Date:** 2026-07-02  
**Base commit:** `2ed6122`  
**Prior:** [gosaki-schedule-duplicate-insert-chain-closure.md](./gosaki-schedule-duplicate-insert-chain-closure.md) (G-22d3d)

| Check | Status |
| --- | --- |
| Add button wired (operator UI) | **yes** |
| New event draft UI | **yes** |
| New event dry-run preview | **yes** |
| Save / DB INSERT | **no** |
| package regen / FTP | **no** |

---

## Gates

```txt
gosakiScheduleNewEventDryRunUiImplementationComplete: true
phase: G-22e-gosaki-schedule-new-event-dry-run-ui-implementation
readyForG22e1ScheduleNewEventDryRunLocalQa: true
saveBehaviorChanged: false
saveExecuted: false
dbWriteExecuted: false
insertSaveModuleCreated: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorDbWriteExecuted: false
sariswingProductionRefUsed: false
```

**approvalId:** `G-22e-gosaki-schedule-new-event-dry-run`  
**INSERT non-dry-run:** deferred to **G-22e2–G-22e5**

**Do not use** duplicate INSERT guards (`assertG22dDuplicateInsertPayloadOnly`, fixed `sourceId`) for new event.

---

## 1. UI behaviour

### Add button

- Label: **新規追加案を作成**
- Enabled in routine operator UI (no env arm required)
- Does **not** write to Supabase
- Opens **new event draft mode** in the edit panel (scrolls into view)

### New event draft flow

1. Operator fills optional fields in the add card (or leaves empty)
2. Clicks **新規追加案を作成**
3. Edit panel switches to **新規追加案を編集** with green banner:
   - 「新規追加案」
   - 「まだ保存されていません」
   - 「保存は戸山が確認して反映します」
   - 「変更を確認すると…保存は現在無効です」
4. Form shows empty / safe initial values (`published=false`)
5. Operator edits fields, then clicks **変更を確認**
6. Preview shows new-event dry-run (`operation=new`, `wouldInsert`, `actualWrite=false`, `saveAllowed=false`)
7. **保存（現在は無効）** stays disabled

### Existing UPDATE path (unchanged)

- `editDraftMode === "existing"` uses G-9k dry-run / Save gates unchanged

### Duplicate mode (unchanged)

- G-22b duplicate dry-run + G-22d INSERT gate unchanged
- `schedule-2026-03-014` re-Save **forbidden** (G-22d3d closure)

### Still disabled

- **保存** in new event mode
- **削除** (`#gosaki-schedule-delete-btn`)

---

## 2. New draft mode specification

| Field | New event draft |
| --- | --- |
| `mode` | `new` |
| `sourceId` | **none** (not duplicate) |
| `draft.id` | `__gosaki-new-event-draft-unsaved__` (display only) |
| `draft.legacy_id` | `null` → UI `（未保存・採番予定）` |
| `draft.updated_at` | `null` → UI `（未保存）` |
| `draft.published` | **`false`** (forced on preview) |
| `draft.show_on_home` | `false` |
| `draft.home_order` | `null` |
| `draft.sort_order` | `null` (computed at future INSERT) |
| `draft.site_slug` | `gosaki-piano` |
| DB persistence | **none** |

### Initial values

| Field | Initial |
| --- | --- |
| date | empty (add card seed if filled) |
| title / venue / times / price / description | empty |
| published | `false` |
| legacy_id | 採番予定 |

---

## 3. Validation / warnings (dry-run preview)

Module: `validateG22eNewEventDryRunForm()`

| Condition | Level |
| --- | --- |
| date empty | **warning** |
| date invalid format | **error** |
| title empty | **warning** |
| venue empty | **warning** |

- Preview renders even with warnings (guard errors only block on auth / staging host)
- `wouldInsert=true` only when date valid + title present
- `saveAllowed=false` always

---

## 4. Dry-run preview specification

Module: `gosaki-schedule-new-event-dry-run.ts`  
Wraps: `buildScheduleNewEventDryRunResult()` from `schedule-dry-run-adapter.ts`

| Property | Value |
| --- | --- |
| `operation` | `new` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldInsert` | `true` when validation ok |
| `saveAllowed` | **`false`** |
| `legacy_id` | `null` / 採番予定 |
| `published` | `false` |
| `site_slug` | `gosaki-piano` |

**payload keys:** `legacy_id`, `date`, `title`, `venue`, `open_time`, `start_time`, `price`, `description`, `published`, `show_on_home`, `home_order`, `sort_order`, `site_slug`

---

## 5. Save / DB write — not implemented

| Item | Status |
| --- | --- |
| `executeG22eScheduleNewEventInsertSave` | **not created** |
| `insertScheduleWrite` for new event | **not wired** |
| Save button in new mode | **always disabled** |
| `runEditSave()` new branch | **alert only** |

---

## 6. Mode separation

| Mode | `editDraftMode` | sourceId | Save |
| --- | --- | --- | --- |
| existing | `existing` | row UUID | G-9k UPDATE (env gated) |
| duplicate | `duplicate` | fixed source | G-22d INSERT (env gated) |
| **new** | **`new`** | **none** | **disabled** |

---

## 7. Next phases

| Phase | Scope |
| --- | --- |
| **G-22e1** | Local QA (operator spot-check) |
| **G-22e2** | New event INSERT planning (guard / approvalId / legacy_id allocation) |
| **G-22e3** | New event INSERT implementation only (no execution) |
| **G-22e4** | Final preflight |
| **G-22e5** | Operator single INSERT execution |

---

## 8. Forbidden (this phase)

| Operation | Executed |
| --- | --- |
| Save / SQL / DB write | **no** |
| package regen / FTP / deploy | **no** |
| duplicate re-Save | **no** |
| production / Sariswing | **no** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22e-gosaki-schedule-new-event-dry-run-ui-implementation.mjs
```
