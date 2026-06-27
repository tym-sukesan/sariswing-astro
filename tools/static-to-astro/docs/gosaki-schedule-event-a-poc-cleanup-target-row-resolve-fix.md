# G-13d1b — Gosaki Event A PoC cleanup target row resolve fix

**Phase:** `G-13d1b-gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix`  
**Status:** local implementation complete — **no Save / DB write in this phase**  
**Base commit:** `a428b69`  
**Prior:** G-13d1 selectable row investigation

## Summary

G-13c1 Preview が `data-selectable-rows` に依存し Event A 固定行を解決できなかった問題を修正。`resolveG13c1EventAPocCleanupTargetRow()` が `loadScheduleRowForSiteSlugRead` で Event A を直接 SELECT（read-only）。Save gate（`armed` / `saveEnabled`）は変更なし。

---

## 1. Problem (G-13d1 investigation)

```txt
Event A row (f687ebf3…) not found in selectable rows.
```

G-13c1 UI が row picker SSR の `data-selectable-rows` のみを参照 — DB に行があっても DOM に含まれなければ Preview 失敗。

---

## 2. Fix

| Before | After |
|--------|-------|
| `findTargetRowFromOperatorSection()` → `data-selectable-rows` | `resolveG13c1EventAPocCleanupTargetRow()` → `loadScheduleRowForSiteSlugRead` |
| Row picker `selectableRows` 必須 | 固定 id + legacy_id + site_slug 直接読み取り |

### New module

`src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-target-row-resolve.ts`

- `resolveG13c1EventAPocCleanupTargetRow()` — SELECT only
- Gates: `getReadOnlyDataConfig()` (`ENABLE_ADMIN_STAGING_DATA_READ`, `PUBLIC_ADMIN_DATA_PROVIDER=supabase`, Supabase URL/anon)
- Guards: `assertG13c1EventAPocCleanupWritableRow` (Event A only)

### UI change

`gosaki-schedule-event-a-poc-cleanup-ui.ts` — `runG13c1Preview` calls resolve module; removed `findTargetRowFromOperatorSection`.

---

## 3. Target (Event A only)

| Item | Value |
|------|-------|
| **id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **date** | `2026-03-15` |
| **site_slug** | `gosaki-piano` |

Event B (`aa440e29…`) — **not referenced** in resolve module.

---

## 4. Save gates (unchanged)

| Gate | Routine dev | Execution (armed) |
|------|-------------|-------------------|
| `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED` | off | true |
| `PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED` | off | true |
| `config.saveEnabled` | **false** | true when arm stack OK |
| Save button | `Event A cleanup 保存（無効）` | enabled after `ready_to_save` Preview |

Preview path performs **no** `updateScheduleWrite` / DB mutation.

---

## 5. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventAPocCleanupTargetRowResolveFixComplete` | **true** |
| `readyForG13d1EventAPocCleanupExecutionRetry` | **true** |
| `cursorSaveExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `eventBTouched` | **false** |

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13d1b-gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix.mjs
```

---

## 7. Next

`G-13d1-event-a-poc-cleanup-execution-retry` — operator Preview（direct read 確認）→ Save once（別承認・execution env）。

---

## 8. References

- [gosaki-schedule-event-a-poc-cleanup-selectable-row-investigation.md](./gosaki-schedule-event-a-poc-cleanup-selectable-row-investigation.md)
- [gosaki-schedule-event-a-poc-cleanup-final-preflight.md](./gosaki-schedule-event-a-poc-cleanup-final-preflight.md)
