# Gosaki schedule existing event price field slice Save success finalization (G-9k6b)

**Phase:** `G-9k6b-gosaki-schedule-existing-event-price-field-slice-save-success-finalization`  
**Status:** **complete** — operator manual G-9k6b `price` field slice UI Save **succeeded**; documentation only (no re-Save, no DB write in this phase)  
**Date:** 2026-06-22  
**Prior:** G-9k6a field slice planning; G-9k4b `description` slice succeeded

| Check | Status |
| --- | --- |
| G-9k6b `price` UI Save executed | **yes** (operator manual — once) |
| Cursor / AI clicked Save / Run (this phase) | **no** |
| DB write in this phase | **no** |
| `service_role` used | **no** |
| sari-site / Sariswing production touched | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior docs:

- [gosaki-schedule-existing-event-field-slice-verification-planning.md](./gosaki-schedule-existing-event-field-slice-verification-planning.md) (G-9k6a)
- [gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md](./gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md) (G-9k4b)

---

## Gates

```txt
gosakiScheduleExistingEventPriceFieldSliceSaveSuccess: true
gosakiScheduleExistingEventPriceFieldSliceSaveSuccessFinalizationComplete: true
phase: G-9k6b
readyForG9k6bPriceFieldSliceReExecution: false
readyForG9k6cOpenTimeFieldSliceManualSave: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedRun: false
rollbackNeeded: false
```

**Do not re-click G-9k6b Save** without a new approval ID and fresh live row reconfirmation.

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`.

---

## 1. Success summary

Second Gosaki **operator UI path** G-9k field slice Save on staging Supabase project `static-to-astro-cms-staging` **succeeded** — **`price` only**.

| Policy | Result |
| --- | --- |
| Path | Operator UI 「変更を確認」 dry-run → 「更新する」 Save |
| Operation | **existing event UPDATE only** |
| Field slice | **`price` only** — `changedFields: ["price"]`, `payload keys: ["price"]` |
| Rows | `rowsAffected: 1` |
| approvalId | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| Auth path | anon client + staging admin session |
| `service_role` | **not used** |
| Project | `kmjqppxjdnwwrtaeqjta` — **PASS** |
| Post-save UI | **保存成功** panel visible; `rowsAffected=1`; post-save `updated_at` and `price` confirmed (G-9k4b fix retained) |

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
changedFields: ["price"]
payload keys: ["price"]
rowsAffected: 1
```

### before (confirmed at Save)

| Field | Value |
| --- | --- |
| **price** | `3,000円` |
| **updated_at** | `2026-06-22T02:20:07.217037+00:00` |

### after (post-save — UI confirmed)

| Field | Value |
| --- | --- |
| **price** | `3,000円（G-9k6 price UI保存テスト）` |
| **updated_at** | `2026-06-22T06:53:39.857434+00:00` |

Other safe fields (`title`, `venue`, `open_time`, `start_time`, `description`) unchanged in this slice.

---

## 5. UI confirmation

Operator manual procedure on Gosaki staging Schedule admin (`/__admin-staging-shell/musician-basic/admin/schedule/`):

1. G-9k4b-equivalent armed dev env stack
2. Select target row `schedule-2026-03-007`
3. Edit **price field only**
4. 「変更を確認」 — dry-run OK; `changedFields` and `payload keys` = `price` only
5. 「更新する」 **once**
6. Post-save result panel: **保存成功**
7. Confirmed: `rowsAffected = 1`, `post-save updated_at`, `changedFields = ["price"]`, `payload keys = ["price"]`
8. G-9k4b post-save result panel fix — panel **remained visible** (not cleared)

---

## 6. Next slice

| Item | Value |
| --- | --- |
| **Next field** | `open_time` |
| **Next phase** | `G-9k6c-gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization` (or execution + finalization) |
| **Baseline for G-9k6c** | `price` = `3,000円（G-9k6 price UI保存テスト）`; `updated_at` = `2026-06-22T06:53:39.857434+00:00` |
| **Planned after** | `open_time` → `18:00` (per G-9k6a matrix) |

**Do not** combine `open_time` with other fields in one Save.
