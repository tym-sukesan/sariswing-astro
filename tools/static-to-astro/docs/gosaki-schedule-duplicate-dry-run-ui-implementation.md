# G-22b — Gosaki Schedule duplicate dry-run + UI wire implementation

**Phase:** `G-22b-gosaki-schedule-duplicate-dry-run-ui-implementation`  
**Status:** **complete** — local dry-run UI only (no Save / DB write)  
**Date:** 2026-07-02  
**Base commit:** `f8580ec`  
**Prior:** [gosaki-sariswing-parity-gap-inventory.md](./gosaki-sariswing-parity-gap-inventory.md) (G-22a)

| Check | Status |
| --- | --- |
| Duplicate button wired (operator UI) | **yes** |
| Duplicate draft UI | **yes** |
| Duplicate dry-run preview | **yes** |
| Save / DB INSERT | **no** |
| package regen / FTP | **no** |

---

## Gates

```txt
gosakiScheduleDuplicateDryRunUiImplementationComplete: true
phase: G-22b-gosaki-schedule-duplicate-dry-run-ui-implementation
readyForG22cScheduleDuplicateDryRunLocalQa: true
saveBehaviorChanged: false
saveExecuted: false
dbWriteExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorDbWriteExecuted: false
sariswingProductionRefUsed: false
```

**approvalId:** `G-22b-gosaki-schedule-duplicate-dry-run`  
**INSERT non-dry-run:** deferred to **G-22d**

---

## 1. UI behaviour

### Duplicate button

- Label: **複製案を作成**
- Enabled in routine operator UI (no env arm required for draft creation)
- Requires a selected source row from the list
- Does **not** write to Supabase

### Duplicate draft flow

1. Operator selects an existing event from the list
2. Clicks **複製案を作成**
3. Edit panel switches to **複製案を編集** with a blue banner:
   - 「複製案」
   - 「まだ保存されていません」
   - 「保存は戸山が確認して反映します」
   - source `id` / `legacy_id` shown
4. Form fields are prefilled from the source event (title gets `（コピー）` suffix when absent)
5. Operator may edit fields, then click **変更を確認**
6. Preview shows duplicate dry-run result (`operation=duplicate`, `wouldInsert=true`, `actualWrite=false`, `saveAllowed=false`)
7. **更新する** stays disabled in duplicate mode

### Existing UPDATE path (unchanged)

- `editDraftMode === "existing"` uses G-9k dry-run / Save gates unchanged
- Optimistic lock / env arm / `G9K_SAVE_BUTTON_SAVE_ENABLED` behaviour preserved

### Still disabled

- **新規追加** (`#gosaki-schedule-add-btn`)
- **削除** (`#gosaki-schedule-delete-btn`)

---

## 2. Duplicate draft specification

| Field | Duplicate draft |
| --- | --- |
| `mode` | `duplicate` |
| `sourceId` | Original row UUID |
| `sourceLegacyId` | Original `legacy_id` |
| `draft.id` | `__gosaki-duplicate-draft-unsaved__` (display only) |
| `draft.legacy_id` | `null` → UI `（未保存・採番予定）` |
| `draft.updated_at` | `null` → UI `（未保存）` |
| Copied fields | date, title, venue, open_time, start_time, price, description, published |
| Title suffix | `（コピー）` when not already suffixed |
| DB persistence | **none** |

---

## 3. Dry-run preview specification

Module: `gosaki-schedule-duplicate-dry-run.ts`  
Wraps: `buildScheduleDuplicateDryRunResult()` from `schedule-dry-run-adapter.ts`

| Property | Value |
| --- | --- |
| `operation` | `duplicate` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldInsert` / `wouldWrite` | `true` when validation passes |
| `saveAllowed` | `false` |
| `site_slug` | `gosaki-piano` in payload |
| `legacy_id` in payload | `null` (assignment deferred to G-22d) |
| `published` in payload | `false` (adapter safety default) |

Developer details (`phase`, `approvalId`, raw JSON payload) are in `<details>開発者向け詳細</details>` inside the preview panel.

---

## 4. Files changed

| File | Change |
| --- | --- |
| `src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts` | **new** — G-22b dry-run module |
| `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts` | duplicate draft mode + preview wiring |
| `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro` | banner, button, copy |
| `tools/static-to-astro/templates/admin-cms/styles/admin.css` | duplicate banner + dev preview styles |

**Not changed:** `gosaki-schedule-existing-event-save-button-save.ts`, `schedule-write-adapter.ts` (no INSERT path)

---

## 5. Sariswing parity position

| Sariswing | Gosaki G-22b |
| --- | --- |
| `duplicate` → Edge INSERT | duplicate draft + dry-run preview only |
| Immediate DB copy | Operator preview → 戸山確認 → G-22d INSERT |

P0 parity gap **Schedule 複製** — first slice (dry-run UI) complete. Non-dry-run INSERT: **G-22d**.

---

## 6. Next phase

**G-22c** — operator local QA on staging shell (`/__admin-staging-shell/musician-basic/admin/schedule/`)

- Select row → 複製案を作成 → edit → 変更を確認 → verify preview flags
- Confirm UPDATE path still works in existing mode
- No Save / DB write in G-22c unless explicitly approved for G-22d

---

## 7. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Save / DB write | **no** |
| SQL INSERT/UPDATE/DELETE | **no** |
| package regen / FTP | **no** |
| Sariswing production ref | **no** |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22b-gosaki-schedule-duplicate-dry-run-ui-implementation.mjs
```
