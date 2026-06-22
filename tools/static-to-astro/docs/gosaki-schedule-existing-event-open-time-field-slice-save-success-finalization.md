# Gosaki schedule existing event open_time field slice Save success finalization (G-9k6c)

**Phase:** `G-9k6c-gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization`  
**Status:** **complete** — operator manual G-9k6c `open_time` field slice UI Save **succeeded**; documentation only (no re-Save, no DB write in this phase)  
**Date:** 2026-06-22  
**Prior:** G-9k6b `price` slice succeeded; G-9k6a field slice planning

| Check | Status |
| --- | --- |
| G-9k6c `open_time` UI Save executed | **yes** (operator manual — once) |
| Cursor / AI clicked Save / Run (this phase) | **no** |
| DB write in this phase | **no** |
| `service_role` used | **no** |
| sari-site / Sariswing production touched | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior docs:

- [gosaki-schedule-existing-event-field-slice-verification-planning.md](./gosaki-schedule-existing-event-field-slice-verification-planning.md) (G-9k6a)
- [gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md](./gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md) (G-9k6b)

---

## Gates

```txt
gosakiScheduleExistingEventOpenTimeFieldSliceSaveSuccess: true
gosakiScheduleExistingEventOpenTimeFieldSliceSaveSuccessFinalizationComplete: true
phase: G-9k6c
readyForG9k6cOpenTimeFieldSliceReExecution: false
readyForG9k6dStartTimeFieldSliceManualSave: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedRun: false
rollbackNeeded: false
```

**Do not re-click G-9k6c Save** without a new approval ID and fresh live row reconfirmation.

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`.

---

## 1. Success summary

Gosaki **operator UI path** G-9k field slice Save on staging Supabase project `static-to-astro-cms-staging` **succeeded** — **`open_time` only**.

| Policy | Result |
| --- | --- |
| Path | Operator UI 「変更を確認」 dry-run → 「更新する」 Save |
| Operation | **existing event UPDATE only** |
| Field slice | **`open_time` only** — `changedFields: ["open_time"]`, `payload keys: ["open_time"]` |
| Rows | `rowsAffected: 1` |
| approvalId | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| Auth path | anon client + staging admin session |
| `service_role` | **not used** |
| Project | `kmjqppxjdnwwrtaeqjta` — **PASS** |
| Post-save UI | **保存成功** panel visible; diff table 開場 `15:00` → `18:00` only |

**UI note:** post-save result panel also displayed `post-save description` (informational field on record). **changedFields**, **payload keys**, and **before/after diff table** were **`open_time` only** — no other field written in this slice.

---

## 2. Target project

```txt
project name: static-to-astro-cms-staging
project ref: kmjqppxjdnwwrtaeqjta
blocked sari-site ref: vsbvndwuajjhnzpohghh — not active
```

---

## 3. Target row

| Field | Value |
| --- | --- |
| **id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **site_slug** | `gosaki-piano` |
| **title** | `<Duo>` |
| **date** | `2026-03-15` |
| **venue** | `川崎 ぴあにしも` (unchanged) |

---

## 4. UPDATE result

```txt
approvalId: G-9k-gosaki-schedule-existing-event-save-button-non-dry-run
changedFields: ["open_time"]
payload keys: ["open_time"]
rowsAffected: 1
```

### before (confirmed at Save)

| Field | Value |
| --- | --- |
| **open_time** | `15:00` |
| **updated_at** | `2026-06-22T06:53:39.857434+00:00` |

### after (post-save — UI confirmed)

| Field | Value |
| --- | --- |
| **open_time** | `18:00` |
| **updated_at** | `2026-06-22T07:30:35.391238+00:00` |

Other safe fields (`title`, `venue`, `start_time`, `price`, `description`) unchanged in this slice.

---

## 5. UI confirmation

Operator manual procedure on Gosaki staging Schedule admin (`/__admin-staging-shell/musician-basic/admin/schedule/`):

1. G-9k4b-equivalent armed dev env stack
2. Select target row `schedule-2026-03-007`
3. Edit **open_time field only** (`15:00` → `18:00`)
4. 「変更を確認」 — dry-run OK; `changedFields` and `payload keys` = `open_time` only
5. 「更新する」 **once**
6. Post-save result panel: **保存成功**
7. Confirmed: `rowsAffected = 1`, `post-save updated_at`, `changedFields = ["open_time"]`, `payload keys = ["open_time"]`
8. Diff table: 開場 `15:00` → `18:00` only
9. Post-save description shown in panel (display only) — not in `changedFields` / diff

---

## 6. Next slice

| Item | Value |
| --- | --- |
| **Next field** | `start_time` |
| **Next phase** | `G-9k6d-gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization` |
| **Baseline for G-9k6d** | `open_time` = `18:00`; `updated_at` = `2026-06-22T07:30:35.391238+00:00` |
| **Planned after** | `start_time` → `19:00` (per G-9k6a matrix) |

**Do not** combine `start_time` with other fields in one Save.
