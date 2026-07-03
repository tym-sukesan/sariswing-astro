# G-22d3d — Gosaki Schedule duplicate INSERT chain closure

**Phase:** `G-22d3d-gosaki-schedule-duplicate-insert-chain-closure`  
**Status:** **complete** — G-22b → G-22d3c duplicate dry-run / INSERT single-slice chain **closed**; documentation / verification only  
**Date:** 2026-07-02  
**Base commit:** `4e3d55a` (G-22d3c result record committed)  
**Operator:** G-22d3b4 Save once (戸山さん); G-22d3b3 INSERT grant once (戸山さん)

| Check | Status |
| --- | --- |
| G-22b → G-22d3c duplicate chain | **closed** |
| G-22d3 INSERT single-slice | **success** |
| afterVerification | **PASS** (G-22d3c) |
| Source row unchanged | **yes** |
| Public reflection | **not executed** (`published=false`) |
| Rollback needed | **no** |
| Rollback SQL archived | **yes** |
| Re-Save G-22d slice | **forbidden** |
| Cursor Save / SQL / GRANT (this phase) | **no** |

---

## Gates

```txt
gosakiScheduleDuplicateInsertChainClosureComplete: true
phase: G-22d3d-gosaki-schedule-duplicate-insert-chain-closure
g22DuplicateInsertChainClosed: true
g22d3DuplicateInsertChainClosed: true
readyForG22dDuplicateInsertSaveReExecution: false
readyForG22eScheduleNewEventPlanning: true
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
g22d3DbWriteClosed: true
```

**Do not re-click 「複製案を保存」** for approvalId `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice`. G-22d3 DB write is **closed** (single INSERT only).

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`. **STOP** if host is production.

---

## 1. Closure scope

### In scope (this chain)

| Item | Value |
| --- | --- |
| Feature | Gosaki Schedule **duplicate** dry-run UI → single-slice non-dry-run INSERT |
| Route | `/__admin-staging-shell/musician-basic/admin/schedule/` |
| Source row | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` (`schedule-2026-03-003`) |
| Inserted row | `434e4051-86c3-473e-9ad0-39d2e5042fb8` (`schedule-2026-03-014`) |
| approvalId | `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice` |
| DB writes | **1 INSERT** on `public.schedules` (G-22d3b4) |

### Out of scope (deferred — new phases)

| Item | Status |
| --- | --- |
| Publish `schedule-2026-03-014` | **deferred** — separate approved slice |
| Public site reflection for duplicate row | **deferred** — `published=false` |
| General duplicate INSERT (beyond single-slice) | **deferred** — new planning |
| Schedule **new event** creation (G-22e) | **next P0 candidate** |
| Schedule delete / unpublish (G-22f) | **next P0 candidate** |
| Schedule CRUD closure (G-22g) | **next P0 candidate** |
| Sariswing production / `/admin` | **not touched** |
| REVOKE INSERT grant | **not planned** — grant remains for future INSERT slices |

---

## 2. Phase chain (G-22b → G-22d3c — completed)

| Phase | Doc | Outcome |
| --- | --- | --- |
| **G-22b** | `gosaki-schedule-duplicate-dry-run-ui-implementation.md` | Duplicate draft + dry-run preview; Save/INSERT disabled |
| **G-22c** | `gosaki-schedule-duplicate-dry-run-local-qa.md` | Operator local QA PASS |
| **G-22d** | `gosaki-schedule-duplicate-insert-planning.md` | INSERT slice planning |
| **G-22d1** | `gosaki-schedule-duplicate-insert-implementation.md` | Save path + guards implemented |
| **G-22d2** | `gosaki-schedule-duplicate-insert-final-preflight.md` | Final preflight + expected payload |
| **G-22d2b** | (drift fix — commit `974738c`) | `sort_order=70`, `source_file=schedule-2026-03.html` |
| **G-22d3a** | `gosaki-schedule-duplicate-insert-beforeverification.md` | beforeVerification PASS |
| **G-22d3b** | (operator Save — failed) | `permission denied for table schedules` |
| **G-22d3b-blocker** | `gosaki-schedule-duplicate-insert-permission-denied-audit.md` | Root cause: missing `authenticated INSERT` |
| **G-22d3b2** | `gosaki-schedules-insert-grant-final-preflight.md` | GRANT SQL + afterVerification templates |
| **G-22d3b3** | (operator GRANT once) | `grant insert on table public.schedules to authenticated;` |
| **G-22d3b4** | (operator Save once) | INSERT **success** |
| **G-22d3c** | `gosaki-schedule-duplicate-insert-execution-result.md` | Result record; G-22d3 chain closed |
| **G-22d3d** | `gosaki-schedule-duplicate-insert-chain-closure.md` | **This doc** — full chain closure |

**Foundation:** dry-run UI (G-22b/c) → guarded single-slice INSERT (G-22d*) → grant fix (G-22d3b*) → one operator Save → result record → closure.

---

## 3. Current DB state (staging — closure reference)

**Supabase:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`)

### 3.1 Inserted row (G-22d3b4 — persists)

| Field | Value |
| --- | --- |
| `id` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` |
| `legacy_id` | `schedule-2026-03-014` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-03-08` |
| `year` | `2026` |
| `month` | `2026-03` |
| `title` | `<Live & Session>（コピー）` |
| `venue` | `学芸大学 珈琲美学` |
| `open_time` | `11:30` |
| `start_time` | `12:30` |
| `price` | `3,850円(税込)` |
| `source_file` | `schedule-2026-03.html` |
| `source_route` | `/schedule/2026-03/` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `published` | **`false`** |
| `sort_order` | `70` |
| `created_at` / `updated_at` | `2026-07-02 06:14:55.55128+00` |

### 3.2 Source row (unchanged)

| Field | Value |
| --- | --- |
| `id` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `legacy_id` | `schedule-2026-03-003` |
| `title` | `<Live & Session>` |
| `published` | `true` |
| `sort_order` | `50` |
| `updated_at` | `2026-06-19 07:27:53.256604+00` |

### 3.3 March 2026 inventory (afterVerification — G-22d3c)

| Check | Value |
| --- | --- |
| `inserted_legacy_count` for `schedule-2026-03-014` | **1** |
| `march_count` (`site_slug=gosaki-piano`, `month=2026-03`) | **14** (was 13 pre-INSERT) |
| Source `schedule-2026-03-003` count | **1** (unchanged) |

### 3.4 Public site impact

```txt
published: false on schedule-2026-03-014
public reflection: NOT executed
schedule-2026-03-014 does NOT appear on public Gosaki site
```

---

## 4. Current permission state (staging — closure reference)

Applied in G-22d3b3; **unchanged** at closure.

| Item | State |
| --- | --- |
| RLS on `public.schedules` | **enabled** |
| Policy `schedules_admin_all` | **exists** — `authenticated`, `ALL`, `qual=is_admin()`, `with_check=is_admin()` |
| Policy `schedules_public_select` | **exists** |
| `authenticated` SELECT | **yes** |
| `authenticated` UPDATE | **yes** (G-6-e4) |
| `authenticated` INSERT | **yes** (G-22d3b3) |
| `authenticated` DELETE | **no** |
| `anon` INSERT | **no** |
| Operator admin (`ysktoyamax@gmail.com`) | **admin** in `admin_users` |
| Browser client role | **`authenticated`** (anon key + Auth session) |
| `service_role` in browser | **no** |

**Lesson:** PostgreSQL table-level **GRANT** is required before RLS is evaluated. G-22d3b failed because `INSERT` grant was missing despite `schedules_admin_all` allowing admin INSERT under RLS.

**Grant rollback archive (not executed):**

```sql
-- revoke insert on table public.schedules from authenticated;
```

No REVOKE planned at closure — INSERT grant supports future G-22e new-event slices.

---

## 5. Rollback status

```txt
rollbackNeeded: false
rollbackSqlExecuted: false
```

Operator accepts staging test row. Rollback SQL archived in [gosaki-schedule-duplicate-insert-execution-result.md](./gosaki-schedule-duplicate-insert-execution-result.md) §9 — **do not execute** unless operator explicitly approves cleanup in a future phase.

---

## 6. Save re-execution — forbidden

| Operation | Status |
| --- | --- |
| Re-click G-22d duplicate Save | **forbidden** |
| Second INSERT for `schedule-2026-03-014` | **forbidden** |
| Re-arm `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED` for same slice | **forbidden** |

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; G-22d arm **off**.

---

## 7. Dry-run vs INSERT payload (closure note)

G-22b dry-run preview JSON showed `legacy_id=null`, `sort_order=50` (source mirror).  
G-22d INSERT path uses `buildG22dDuplicateInsertPayload()` constants:

- `legacy_id`: `schedule-2026-03-014`
- `sort_order`: `70`
- `title`: `<Live & Session>（コピー）`

**Lesson:** UI must clearly distinguish dry-run preview fields from actual INSERT payload. G-22d3b-final-gate-check confirmed Save path uses INSERT constants, not dry-run JSON.

---

## 8. Next P0 candidates

| Phase | Scope | Notes |
| --- | --- | --- |
| **G-22e** | Schedule **new event** creation | INSERT grant already applied; needs **new** guard, approvalId, preflight — **not** duplicate `sourceId` guard |
| **G-22f** | Schedule **delete / unpublish** | DELETE grant missing; may need GRANT + RLS review |
| **G-22g** | Schedule **CRUD closure** | Inventory remaining gaps after G-22e/f |

**Recommended order:** G-22e planning → single-slice new-event INSERT → G-22f → G-22g closure doc.

### G-22e new-event cautions

1. **INSERT grant exists** — no repeat of G-22d3b3 blocker for table-level INSERT.
2. **Separate guard stack** — `assertG22eNewEventPayloadOnly` (name TBD); do not reuse `assertG22dDuplicateInsertPayloadOnly` / fixed `sourceId`.
3. **New approvalId** — e.g. `G-22e-gosaki-schedule-new-event-non-dry-run-slice` (register in planning).
4. **New preflight** — beforeVerification for target month inventory, `legacy_id` allocation, `sort_order` baseline.
5. **Single-slice first** — one new row, dry-run default, operator Save once, result record, closure — same pattern as G-22d3.

---

## 9. Generalization lessons (CMS Kit)

| Lesson | Detail |
| --- | --- |
| **GRANT + RLS both required** | Missing table GRANT fails before RLS; audit both in preflight |
| **Dry-run ≠ INSERT payload** | Show planned INSERT fields explicitly in UI before Save |
| **Single-slice → routine** | Prove one guarded INSERT before generalizing duplicate/new-event flows |
| **Grant once, slice many** | G-22d3b3 INSERT grant enables G-22e; each slice still needs own guard/approvalId |
| **Unpublished by default** | Duplicate row `published=false` — safe staging test without public reflection |
| **Permission denied playbook** | Read-only audit → GRANT preflight → operator GRANT → Save retry → result → closure |

---

## 10. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Save / SQL INSERT / UPDATE / DELETE | **no** |
| GRANT / REVOKE | **no** |
| rollback SQL | **no** |
| package regen | **no** |
| FTP / upload / deploy | **no** |
| production / Sariswing | **no** |
| `service_role` | **no** |
| commit / push | **no** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22d3d-gosaki-schedule-duplicate-insert-chain-closure.mjs
```

---

## 12. Fix required?

**No.** G-22b → G-22d3c duplicate INSERT chain **complete and closed**. Proceed to G-22e / G-22f / G-22g planning when prioritized.
