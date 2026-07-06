# G-22g1d — Gosaki Schedule P0 UX QA after G-22g1a/b/c

**Phase:** `G-22g1d-gosaki-schedule-p0-ux-qa`  
**Status:** **complete** — local dry-run QA / record only; **no Save / DB / deploy**  
**Date:** 2026-07-07  
**Base commit:** `b5ccb9f`  
**Prior:** G-22g1a (legacy_id list UX) · G-22g1b (dev/mock isolation) · G-22g1c (save preview / target confirmation)

| Check | Status |
| --- | --- |
| Local dev QA executed | **yes** (HTTP 200 + HTML markers + module smoke) |
| G-22g1a/b/c UX verified | **yes** |
| Save / 保存ボタン clicked | **no** |
| DB write | **no** |
| Blocking regressions | **none** (known RLS read limitation documented) |

---

## Gates

```txt
gosakiScheduleP0UxQaComplete: true
phase: G-22g1d-gosaki-schedule-p0-ux-qa
qaBlockingIssuesFound: false
saveExecuted: false
updateButtonClicked: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
writeArmedDevServerUsed: false
writeArmedDevServerStopped: true
port4321ListenAfterQa: false
readyForG22g2OperatorProcedureHints: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Verify on a live dry-run dev page that G-22g1a (legacy_id list UX), G-22g1b (dev/mock isolation), and G-22g1c (save preview / target confirmation) render and behave as intended. Record PASS/FAIL and residual issues. **No Save, no DB write.**

---

## 2. QA scope

| Area | Source phase |
| --- | --- |
| 公演一覧 legacy_id / filters / keyword | G-22g1a |
| Operator guide / read-source banner | G-22g1b |
| Dev-tools / mock zone isolation | G-22g1b |
| Selected summary | G-22g1a |
| Pre-save preview / save target panel | G-22g1c |
| Save result label distinction | G-22g1c |

**Out of scope:** Save execution, physical DELETE, package regen, FTP, write-armed dev.

---

## 3. Dry-run / read-only dev environment

### Dev command (started for QA, then stopped)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=false \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

| Item | Value |
| --- | --- |
| Route | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| HTTP status | **200** |
| `data-read-source` | **supabase** |
| `ENABLE_ADMIN_STAGING_WRITE` | **false** |
| `data-g9k-staging-write-enabled` | **false** |
| `data-g9k-save-button-save-enabled` | **false** |
| `data-g9k-env-arm-armed` | **false** |
| `data-g9k-write-dry-run-disabled` | **false** (dry-run active) |
| Selectable rows (SSR JSON) | **58** (all `published=true`) |
| QA method | HTTP fetch + HTML marker analysis + dry-run module smoke |
| Save / 保存 | **not clicked** |
| Dev server after QA | **stopped** — port **4321 LISTEN none** |

---

## 4. 公演一覧 UX (G-22g1a) — **PASS**

| Check | Result |
| --- | --- |
| `legacy_id` table column | **PASS** — `<th>legacy_id</th>` + `gosaki-schedule-legacy-id-code` in SSR rows |
| Keyword placeholder | **PASS** — `legacy_id・タイトル・会場で検索` |
| `id` / `updated_at` in row data | **PASS** — present in `data-selectable-rows` JSON (e.g. `schedule-2026-03-001` has `updated_at`) |
| Published filter control | **PASS** — `#gosaki-schedule-operator-published-filter` with options 公開のみ / すべて / 非公開のみ |
| Default filter | **published** — unpublished rows hidden in list UI |
| Keyword includes `legacy_id` | **PASS** (source: `rowMatchesFilters` haystack includes `legacy_id`, `id`) |
| `schedule-2026-07-008` in SSR data | **NOT FOUND** — see §9 (RLS read scope; not a G-22g1a regression) |
| Keyword demo on live data | **PASS** — `schedule-2026-07-001` findable when published filter allows |

**Note:** Default「公開のみ」では `published=false` の行は一覧に出ません。`schedule-2026-07-008` は G-22f 非公開化後 `published=false` のため、**anon read で SSR に含まれない**場合はフィルタを変えても UI 上は見つけられません（G-22f1 と同型の既知制約）。

---

## 5. Operator guide / read source (G-22g1b) — **PASS**

| Check | Result |
| --- | --- |
|「通常の Schedule 操作はこちら」| **PASS** — `.gosaki-schedule-operator-guide` |
| legacy_id in guide copy | **PASS** — guide mentions `legacy_id` |
| Read-source banner element | **PASS** — `#gosaki-schedule-operator-read-source-banner` |
| Supabase vs mock | **PASS** — SSR `data-read-source="supabase"`; live read (not mock) |
| Dev section warning | **PASS** — guide warns 開発者向け詳細 is not for routine ops |

---

## 6. Dev/mock isolation (G-22g1b) — **PASS**

| Check | Result |
| --- | --- |
| Dev-tools panel | **PASS** — `gosaki-schedule-dev-tools-panel` + 開発者向け詳細 copy |
| Mock zone wrapper | **PASS** — `gosaki-schedule-dev-mock-zone` |
| mock-schedule not real data | **PASS** — `mock-schedule-*` + `実データではありません` in HTML |
| `<details>` default closed | **PASS** — no `open` attribute on dev details |
| Operator primary section | **PASS** — `gosaki-schedule-operator-primary` on `#gosaki-schedule-operator` |

---

## 7. Selected summary (G-22g1a) — **PASS**

| Check | Result |
| --- | --- |
| Summary container | **PASS** — `#gosaki-schedule-operator-selected-summary` |
| Fields in renderer (source) | **PASS** — legacy_id, id, date, title, published, updated_at in `renderSelectedRowSummary()` |
| Form id / legacy_id fields | **PASS** — `#gosaki-edit-legacy-id`, `#gosaki-edit-id` in operator page |

Interactive population verified via source wiring (`selectRowById` → `renderEditForm` → summary update). Save not clicked.

---

## 8. Pre-save preview / target confirmation (G-22g1c) — **PASS**

**Method:** Dry-run module smoke (duplicate / new / unpublish) + `renderDryRunResult` / sibling renderers in source. **Save not clicked.** No Playwright auto-click per project safety rules.

### Static shell (live HTML)

| Check | Result |
| --- | --- |
| `#gosaki-schedule-save-target-panel` | **PASS** — present above save actions |
| Preview CSS classes in bundle | **PASS** — page loads G-22g1c admin.css rules |

### Module smoke (mirrors UI dry-run path)

| Operation | Result | Key fields |
| --- | --- | --- |
| 複製 preview | **PASS** | `dryRun=true`, `actualWrite=false`, `wouldInsert=true`, `saveAllowed=false`, `approvalId=G-22b-gosaki-schedule-duplicate-dry-run` |
| 新規追加 preview | **PASS** | `dryRun=true`, `actualWrite=false`, `wouldInsert=true`, `saveAllowed=false`, `approvalId=G-22e-gosaki-schedule-new-event-dry-run` |
| 非公開化 preview | **PASS** | `dryRun=true`, `actualWrite=false`, `wouldUpdate=true`, `physicalDelete=false`, `saveAllowed=false`, `approvalId=G-22f-gosaki-schedule-unpublish-dry-run` |
| 通常更新 preview | **PASS (source)** | `renderDryRunResult` emits `renderPreviewBadge`, `renderTargetIdentitySection`, `renderPreviewSafetySection` with `wouldUpdate=true`, `physicalDelete=false`, `actualWrite=false`, `approvalId`, `expectedBeforeUpdatedAt` |

### G-22g1c preview content (source verification)

| Item | Result |
| --- | --- |
| Operation labels (既存公演を更新 / 複製… / 新規… / 非公開…) | **PASS** |
| `actualWrite=false` badge | **PASS** |
|「行は削除しません」| **PASS** |
| Workflow steps | **PASS** — `renderWorkflowStepIndicator` per operation |
| Save target panel | **PASS** — `updateSaveTargetPanel()` on select / draft / dry-run |

---

## 9. Save result labels (G-22g1c) — **PASS**

Display-only improvement; save logic unchanged.

| Label | Result |
| --- | --- |
| `保存前 updated_at（before updated_at）` | **PASS** — in `renderSaveResult` / unpublish save result |
| `保存後 updated_at（saved updated_at）` | **PASS** |
| `optimistic lock 基準（expectedBeforeUpdatedAt）` | **PASS** |
| Optimistic lock explanation | **PASS** — `renderOptimisticLockExplanation()` |
| Preview vs result badge | **PASS** — `renderPreviewBadge` vs `renderSaveResultBadge` |

No Save executed in this QA — labels verified in source + prior G-22f execution docs.

---

## 10. Issues / residual work

| Issue | Severity | Notes |
| --- | --- | --- |
| `schedule-2026-07-008` not in anon SSR rows | **known / non-blocking** | After G-22f unpublish (`published=false`); staging anon SELECT likely RLS-scoped to published rows. UI filters cannot show rows not loaded. Not introduced by G-22g1a/b/c. |
| Interactive preview panel click QA | **deferred** | No Playwright Save/preview auto-click. Module smoke + renderer source used instead. |
| Operator spot-check | **optional** | Human can confirm workflow step highlight + save target panel after row select +「変更を確認」with dry-run dev (Save still off). |

**Fix required?** **No** for G-22g1 chain. Unpublished row visibility is a separate read/RLS product decision (deferred).

---

## 11. Safety confirmation

| Item | Status |
| --- | --- |
| Save clicked | **no** |
| DB write | **no** |
| SQL mutation | **no** |
| Rollback SQL | **no** |
| Package regen | **no** |
| FTP / upload / workflow_dispatch | **no** |
| Write-armed env | **no** — all non-dry-run arms **false** |
| Dev server | **started dry-run only** → **stopped**; port 4321 **LISTEN none** |
| Sariswing production ref | **not used** |

---

## 12. Next candidates

1. **G-22g2** — operator procedure hints (step-by-step copy in UI or doc)
2. **追加 UX 微修正** — if operator spot-check finds copy/layout nits
3. **Schedule P0 まとめ** — close G-22g chain documentation
4. **physical DELETE planning** — still deferred (not P0)

---

## 13. References

- [gosaki-schedule-list-ux-legacy-id.md](./gosaki-schedule-list-ux-legacy-id.md) (G-22g1a)
- [gosaki-schedule-dev-mock-section-isolation.md](./gosaki-schedule-dev-mock-section-isolation.md) (G-22g1b)
- [gosaki-schedule-save-preview-target-confirmation.md](./gosaki-schedule-save-preview-target-confirmation.md) (G-22g1c)
- [gosaki-schedule-unpublish-dry-run-local-qa.md](./gosaki-schedule-unpublish-dry-run-local-qa.md) (G-22f1 — published=false read limitation precedent)
