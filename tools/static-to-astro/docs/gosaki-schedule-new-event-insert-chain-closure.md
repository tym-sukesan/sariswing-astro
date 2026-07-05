# G-22e7 — Gosaki Schedule new event INSERT chain closure

**Phase:** `G-22e7-gosaki-schedule-new-event-insert-chain-closure`  
**Status:** **complete** — G-22e → G-22e6 new event dry-run / INSERT single-slice chain **closed**; documentation / verification only  
**Date:** 2026-07-05  
**Base commit:** `c080a1d` (G-22e6 result record committed)  
**Operator:** G-22e5 Save once (戸山さん)

| Check | Status |
| --- | --- |
| G-22e → G-22e6 new event chain | **closed** |
| G-22e5 INSERT single-slice | **success** |
| afterVerification | **PASS** (G-22e6) |
| Protected duplicate row unchanged | **yes** |
| Public reflection | **not executed** (`published=false`) |
| Rollback needed | **no** |
| Rollback SQL archived | **yes** |
| Re-Save G-22e slice | **forbidden** |
| write-armed dev server | **stopped** |
| Cursor Save / SQL / GRANT (this phase) | **no** |

---

## Gates

```txt
gosakiScheduleNewEventInsertChainClosureComplete: true
phase: G-22e7-gosaki-schedule-new-event-insert-chain-closure
g22eNewEventInsertChainClosed: true
g22e5NewEventInsertChainClosed: true
readyForG22eNewEventInsertSaveReExecution: false
readyForG22fScheduleDeleteUnpublishPlanning: true
readyForG22gScheduleCrudClosurePlanning: true
rollbackNeeded: false
rollbackSqlExecuted: false
publicReflectionExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorGrantRevokeExecuted: false
g22e5DbWriteClosed: true
writeArmedDevServerStopped: true
```

**Do not re-click 「新規追加を保存」** for approvalId `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`. G-22e5 DB write is **closed** (single INSERT only).

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`. **STOP** if host is production.

---

## 1. Closure scope

### In scope (this chain)

| Item | Value |
| --- | --- |
| Feature | Gosaki Schedule **new event** dry-run UI → single-slice non-dry-run INSERT |
| Route | `/__admin-staging-shell/musician-basic/admin/schedule/` |
| Inserted row | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` (`schedule-2026-09-001`) |
| approvalId | `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice` |
| DB writes | **1 INSERT** on `public.schedules` (G-22e5) |

### Out of scope (deferred — new phases)

| Item | Status |
| --- | --- |
| Publish `schedule-2026-09-001` | **deferred** — separate approved slice |
| Public site reflection for new event row | **deferred** — `published=false` |
| General new-event INSERT (beyond single-slice) | **deferred** — routineization planning |
| Schedule **delete / unpublish** (G-22f) | **next P0 candidate** |
| Schedule **CRUD closure** (G-22g) | **next P0 candidate** |
| Test row cleanup (`schedule-2026-09-001`, `schedule-2026-03-014`) | **optional** — G-22f or dedicated cleanup phase |
| Sariswing production / `/admin` | **not touched** |
| REVOKE INSERT grant | **not planned** — grant remains for future INSERT slices |

---

## 2. Phase chain (G-22e → G-22e6 — completed)

| Phase | Doc | Outcome |
| --- | --- | --- |
| **G-22e** | `gosaki-schedule-new-event-dry-run-ui-implementation.md` | New event draft + dry-run preview; Save/INSERT disabled |
| **G-22e1** | `gosaki-schedule-new-event-dry-run-local-qa.md` | Operator local QA PASS |
| **G-22e2** | `gosaki-schedule-new-event-insert-planning.md` | INSERT slice planning |
| **G-22e3** | `gosaki-schedule-new-event-insert-implementation.md` | Save path + guards + allocation implemented |
| **G-22e4** | `gosaki-schedule-new-event-insert-final-preflight.md` | Final preflight + target locked |
| **G-22e5-blocker** | `gosaki-schedule-new-event-insert-preview-button-blocker.md` | Scroll discoverability fix (`scrollNewEventDraftIntoView`) |
| **G-22e5** | (operator Save once) | INSERT **success** |
| **G-22e6** | `gosaki-schedule-new-event-insert-execution-result.md` | Result record; G-22e5 DB write closed |
| **G-22e7** | `gosaki-schedule-new-event-insert-chain-closure.md` | **This doc** — full chain closure |

**Foundation:** dry-run UI (G-22e/e1) → guarded single-slice INSERT (G-22e2–e4) → scroll UX fix (G-22e5-blocker) → one operator Save → result record → closure. INSERT grant from G-22d3b3 reused — no new GRANT required.

---

## 3. G-22e5-blocker (scroll-only fix)

During G-22e5 pre-flight, operator reported「変更を確認」button missing after「新規追加案を作成」.

| Finding | Detail |
| --- | --- |
| Button missing from DOM? | **No — button NOT missing from DOM** — `#gosaki-schedule-edit-dry-run-btn` present in SSR + wired by JS |
| Root cause | **Discoverability / scroll** — two-form layout: top add form has no preview button; draft renders in bottom edit panel; prior `block:"nearest"` scroll left button below fold |
| Fix | `scrollNewEventDraftIntoView()` in `gosaki-staging-schedule-operator-ui.ts` — `block:"start"` on edit panel + center dry-run btn after 350ms |
| Fix type | **scroll-only** — no gate/guard/payload/env/write change |
| Doc | `gosaki-schedule-new-event-insert-preview-button-blocker.md` |

**Lesson:** Operator UX must account for two-form layout; dry-run button location should be obvious after「新規追加案を作成」.

---

## 4. New event INSERT single-slice success (G-22e5)

| Field | Value |
| --- | --- |
| `operation` | `new-event-insert` |
| `approvalId` | `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice` |
| `insertedId` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` |
| `legacy_id` | `schedule-2026-09-001` |
| `actualWrite` | `true` |
| `sort_order` | `10` |
| `source_route` | `/schedule/2026-09/` |
| `source_file` | `schedule-2026-09.html` |
| Write path | `executeG22eScheduleNewEventInsertSave` → `insertNewEventScheduleWrite` |
| `service_role` | **not used** |
| Session | `authenticated` (staging Supabase Auth) |

---

## 5. Current DB state (staging — closure reference)

**Supabase:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`)

### 5.1 Inserted row (G-22e5 — persists)

| Field | Value |
| --- | --- |
| `id` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` |
| `legacy_id` | `schedule-2026-09-001` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-09-12` |
| `year` | `2026` |
| `month` | `2026-09` |
| `title` | `【G-22eテスト】新規追加テストイベント` |
| `venue` | `テスト会場` |
| `open_time` | `18:30` |
| `start_time` | `19:30` |
| `price` | `3,500円` |
| `description` | `CMS新規追加機能の動作確認用テストイベントです。公開サイトには反映しません。検証後は非公開維持または削除対象とします。` |
| `published` | **`false`** |
| `show_on_home` | **`false`** |
| `home_order` | **`null`** |
| `sort_order` | `10` |
| `source_route` | `/schedule/2026-09/` |
| `source_file` | `schedule-2026-09.html` |
| `created_at` / `updated_at` | `2026-07-05 16:50:35.410285+00` |

### 5.2 September 2026 inventory (afterVerification — G-22e6)

| Check | Value |
| --- | --- |
| `inserted_legacy_id_count` for `schedule-2026-09-001` | **1** |
| `target_month_count_after` (`site_slug=gosaki-piano`, `month=2026-09`) | **1** (was 0 pre-INSERT) |
| Exact target row field check | **PASS** |

### 5.3 Protected duplicate row (unchanged — G-22d test row)

| Field | Value |
| --- | --- |
| `id` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` |
| `legacy_id` | `schedule-2026-03-014` |
| `title` | `<Live & Session>（コピー）` |
| `published` | `false` |
| `sort_order` | `70` |
| `updated_at` | `2026-07-02 06:14:55.55128+00` |

**Judgment:** G-22e INSERT did **not** touch G-22d protected duplicate row.

### 5.4 Public site impact

```txt
published: false on schedule-2026-09-001
show_on_home: false
public reflection: NOT executed
schedule-2026-09-001 does NOT appear on public Gosaki site
```

---

## 6. Current permission state (staging — closure reference)

Applied in G-22d3b3; **unchanged** at G-22e7 closure. G-22e5 reused existing INSERT grant — **no new GRANT** in G-22e chain.

| Item | State |
| --- | --- |
| RLS on `public.schedules` | **enabled** |
| Policy `schedules_admin_all` | **exists** — `authenticated`, `ALL`, `qual=is_admin()`, `with_check=is_admin()` |
| Policy `schedules_public_select` | **exists** |
| `authenticated` SELECT | **yes** |
| `authenticated` UPDATE | **yes** (G-6-e4) |
| `authenticated` INSERT | **yes** (G-22d3b3 — reused by G-22e5) |
| `authenticated` DELETE | **no** |
| `anon` INSERT | **no** |
| Operator admin (`ysktoyamax@gmail.com`) | **admin** in `admin_users` |
| Browser client role | **`authenticated`** (anon key + Auth session) |
| `service_role` in browser | **no** |

**Lesson:** G-22e succeeded without repeat of G-22d3b3 grant blocker because INSERT grant was already applied. Future DELETE slices (G-22f) will likely need separate GRANT review.

---

## 7. Rollback status

```txt
rollbackNeeded: false
rollbackSqlExecuted: false
```

Operator accepts staging test row. Rollback SQL archived in [gosaki-schedule-new-event-insert-execution-result.md](./gosaki-schedule-new-event-insert-execution-result.md) §9 — **do not execute** unless operator explicitly approves cleanup in a future phase.

---

## 8. Save re-execution — forbidden

| Operation | Status |
| --- | --- |
| Re-click G-22e new-event Save | **forbidden** |
| Second INSERT for `schedule-2026-09-001` | **forbidden** |
| Re-arm `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED` for same slice | **forbidden** |
| Restart write-armed dev server for G-22e5 | **forbidden** |

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; G-22e arm **off**; G-22d arm **off**. **write-armed dev server stopped.**

---

## 9. Dry-run vs INSERT payload (closure note)

G-22e dry-run preview shows `legacy_id=null`, `sort_order=null` (pending allocation).  
G-22e5 INSERT path uses `computeG22ePlannedAllocation()` at Save time:

- `legacy_id`: `schedule-2026-09-001` (first in empty month)
- `sort_order`: `10`
- `published`: `false` (fixed)
- `show_on_home`: `false` (fixed)
- `home_order`: `null` (fixed)

**Lesson:** UI dev details show **planned** allocation after dry-run; actual INSERT allocates from live DB at Save. Single-slice preflight locked expected values via beforeVerification SQL.

---

## 10. Test row handling

| Row | Status | Notes |
| --- | --- | --- |
| `schedule-2026-09-001` | **staging test** | `published=false` — not on public site |
| `schedule-2026-03-014` | **staging test** (G-22d) | `published=false` — protected, non-touch |

**Options (future phases):**
- Keep both unpublished indefinitely (safe default)
- G-22f delete/unpublish slice — `schedule-2026-09-001` is a **candidate delete test target**
- Dedicated test-row cleanup phase with explicit approval

---

## 11. Routineization cautions (new event beyond single-slice)

| Topic | Single-slice (G-22e5) | Routineization (future) |
| --- | --- | --- |
| `legacy_id` allocation | Computed once from empty month | **Race risk** if two operators save same month concurrently |
| Re-click prevention | Operator discipline + env arm | Need UI stale lock / Save disable after success |
| UX | Two-form layout + scroll fix | Consider inline preview button or single-form flow |
| approvalId | One dedicated slice ID | Per-slice or operational registry pattern |
| Public reflection | Explicitly deferred | Separate approved phase after `published=true` |
| DELETE | Not in scope | G-22f — DELETE grant missing |

**Pattern proven:** dry-run default → guarded single-slice INSERT → operator Save once → result record → closure (same as G-22d3).

---

## 12. Next P0 candidates

| Phase | Scope | Notes |
| --- | --- | --- |
| **G-22f** | Schedule **delete / unpublish** | DELETE grant missing; `schedule-2026-09-001` candidate for delete test |
| **G-22g** | Schedule **CRUD closure** | Inventory remaining gaps after G-22e + G-22f |
| **Optional** | Test rows cleanup / unpublish policy | `schedule-2026-09-001`, `schedule-2026-03-014` |

**Recommended order:** G-22f planning → single-slice delete/unpublish → G-22g closure doc.

**Completed chains (do not re-Save):**
- G-22d duplicate INSERT (`schedule-2026-03-014`) — **closed**
- G-22e new event INSERT (`schedule-2026-09-001`) — **closed**

---

## 13. Generalization lessons (CMS Kit)

| Lesson | Detail |
| --- | --- |
| **Grant once, slice many** | G-22d3b3 INSERT grant enabled G-22e without repeat blocker |
| **Dynamic allocation at Save** | `legacy_id` / `sort_order` from live DB — preflight SQL required |
| **Two-form UX trap** | Top add form ≠ edit panel; scroll/discoverability matters |
| **Dry-run ≠ INSERT payload** | Show planned allocation in dev details; lock via preflight |
| **Unpublished by default** | `published=false` — safe staging test without public reflection |
| **Protected rows** | Cross-slice mutual exclusion (`schedule-2026-03-014` in G-22e guards) |
| **Single-slice → routine** | Prove one guarded INSERT before generalizing |

---

## 14. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Save / SQL INSERT / UPDATE / DELETE | **no** |
| GRANT / REVOKE | **no** |
| rollback SQL | **no** |
| package regen | **no** |
| FTP / upload / deploy | **no** |
| production / Sariswing | **no** |
| `service_role` | **no** |
| write-armed dev server restart | **no** |
| commit / push | **no** |

---

## 15. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22e7-gosaki-schedule-new-event-insert-chain-closure.mjs
```

---

## 16. Fix required?

**No.** G-22e → G-22e6 new event INSERT chain **complete and closed**. Proceed to G-22f / G-22g planning when prioritized.
