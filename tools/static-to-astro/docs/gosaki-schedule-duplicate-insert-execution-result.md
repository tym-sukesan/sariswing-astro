# G-22d3c — Gosaki Schedule duplicate INSERT execution result

**Phase:** `G-22d3c-gosaki-schedule-duplicate-insert-execution-result`  
**Status:** **complete** — operator Save + afterVerification recorded; **G-22d3 chain closed**  
**Date:** 2026-07-02  
**Base commit:** `a3c8f7c`  
**Prior:** G-22d3b4 Save retry (success); [gosaki-schedules-insert-grant-final-preflight.md](./gosaki-schedules-insert-grant-final-preflight.md) (G-22d3b2/b3)

| Check | Status |
| --- | --- |
| Save executed (operator once) | **yes** |
| afterVerification | **PASS** |
| Source row unchanged | **yes** |
| rollback needed | **no** |
| public reflection | **not executed** (`published=false`) |
| Cursor Save / SQL | **no** |
| Save re-execution | **forbidden** |

---

## Gates

```txt
gosakiScheduleDuplicateInsertExecutionResultComplete: true
phase: G-22d3c-gosaki-schedule-duplicate-insert-execution-result
g22d3DuplicateInsertChainClosed: true
readyForG22dDuplicateInsertSaveReExecution: false
rollbackNeeded: false
rollbackSqlExecuted: false
publicReflectionExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
g22d3DbWriteClosed: true
```

**approvalId:** `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice`  
**Supabase:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`) only. **Never** `vsbvndwuajjhnzpohghh`.

**Do not re-click 「複製案を保存」** for this slice. G-22d3 DB write is **closed** (single INSERT only).

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` |
| `HEAD` | `a3c8f7c` |
| `origin/main` | `a3c8f7c` |

---

## 2. Execution summary

```txt
Execution: PASS
beforeVerification: PASS (G-22d3a, re-run after G-22d2b)
INSERT grant applied: yes (G-22d3b3)
Save button clicked: yes (operator manual, exactly once — G-22d3b4)
DB write performed: yes (one INSERT on public.schedules)
operation: duplicate-insert
actualWrite: true
insertedId: 434e4051-86c3-473e-9ad0-39d2e5042fb8
legacy_id: schedule-2026-03-014
source row mutated: no
march_count: 13 → 14
service_role used: false
production touched: false
/admin touched: false
rollback needed: false
rollback executed: false
public reflection: not executed (published=false)
```

---

## 3. Execution context

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
Approval ID: G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice
Env arm: PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=true
Source id: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
Source legacy_id: schedule-2026-03-003
Write path: executeG22dScheduleDuplicateInsertSave → insertScheduleWrite
Session: authenticated (staging Supabase Auth)
Prior failure: G-22d3b permission denied (resolved by G-22d3b3 INSERT grant)
```

---

## 4. Save result (operator — G-22d3b4)

| Field | Value |
| --- | --- |
| `operation` | `duplicate-insert` |
| `approvalId` | `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice` |
| `sourceId` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `insertedId` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` |
| `legacy_id` | `schedule-2026-03-014` |
| `actualWrite` | `true` |

---

## 5. Inserted row (afterVerification confirmed)

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
| `created_at` | `2026-07-02 06:14:55.55128+00` |
| `updated_at` | `2026-07-02 06:14:55.55128+00` |

Matches G-22d2b expected INSERT payload (sort_order 70, source_file `schedule-2026-03.html`).

---

## 6. Source row afterVerification (unchanged)

| Field | Value |
| --- | --- |
| `id` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `legacy_id` | `schedule-2026-03-003` |
| `title` | `<Live & Session>` |
| `published` | `true` |
| `sort_order` | `50` |
| `updated_at` | `2026-06-19 07:27:53.256604+00` |

**Judgment:** source row **not mutated** by duplicate INSERT (UPDATE path not invoked).

---

## 7. afterVerification (operator — PASS)

| Check | Expected | Result |
| --- | --- | --- |
| `inserted_legacy_count` for `schedule-2026-03-014` | **1** | **PASS** |
| `march_count` (2026-03, gosaki-piano) | **14** | **PASS** |
| March inventory includes `schedule-2026-03-014` | **yes** | **PASS** |
| Inserted row `published` | **`false`** | **PASS** |
| Source `schedule-2026-03-003` count | **1** | **PASS** |
| Source `updated_at` unchanged | **yes** | **PASS** |

### Reference SELECT (read-only archive)

```sql
-- G-22d3c afterVerification archive (SELECT only)
select id, legacy_id, title, published, sort_order, created_at, updated_at
from public.schedules
where id = '434e4051-86c3-473e-9ad0-39d2e5042fb8';

select id, legacy_id, title, updated_at
from public.schedules
where id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69';

select count(*) as insert_legacy_count
from public.schedules
where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-03-014';

select count(*) as march_count
from public.schedules
where site_slug = 'gosaki-piano' and month = '2026-03';
```

---

## 8. Public reflection

```txt
published: false on inserted row
public site build / FTP / package regen: NOT executed in G-22d3c
```

**Expected behavior:** `schedule-2026-03-014` does **not** appear on public Gosaki site until explicitly published and reflected in a future approved phase.

---

## 9. Rollback

```txt
rollbackNeeded: false
rollbackSqlExecuted: false
```

**Archive only** — do not execute unless operator explicitly approves cleanup in a future phase:

```sql
-- Count candidates (SELECT only)
select id, legacy_id, site_slug, title, published, created_at
from public.schedules
where id = '434e4051-86c3-473e-9ad0-39d2e5042fb8';

-- DELETE template (NOT executed — G-22d3c)
-- delete from public.schedules
-- where id = '434e4051-86c3-473e-9ad0-39d2e5042fb8'
--   and site_slug = 'gosaki-piano'
--   and legacy_id = 'schedule-2026-03-014'
--   and title = '<Live & Session>（コピー）'
--   and published = false;
```

Operator accepts staging test row — **no rollback**.

---

## 10. G-22d3 chain closure

| Phase | Outcome |
| --- | --- |
| G-22d2 / G-22d2b | Preflight + payload drift fix |
| G-22d3a | beforeVerification PASS |
| G-22d3b | First Save failed (permission denied) |
| G-22d3b-blocker | Root cause audit |
| G-22d3b2/b3 | INSERT grant preflight + apply |
| G-22d3b4 | Save once → **success** |
| **G-22d3c** | **Result record — chain closed** |

**G-22d3 DB writes:** **1 INSERT only** — do not repeat.

---

## 11. Forbidden going forward

| Operation | Status |
| --- | --- |
| Re-click G-22d duplicate Save | **forbidden** |
| Second INSERT for this slice | **forbidden** |
| rollback SQL | **not executed** |
| package regen / FTP | **not executed** |
| publish inserted row without new phase | **deferred** |

---

## 12. Next work (outside G-22d3)

- Future: publish `schedule-2026-03-014` via separate approved slice (if desired)
- Future: general duplicate INSERT (beyond single-slice) — new planning phase
- Routine dev: restart with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; G-22d arm **off**

---

## 13. Fix required?

**No.** G-22d3 duplicate INSERT single-slice PoC **complete**. Chain safely closed.
