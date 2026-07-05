# G-22e6 — Gosaki Schedule new event INSERT execution result

**Phase:** `G-22e6-gosaki-schedule-new-event-insert-execution-result`  
**Status:** **complete** — operator Save + afterVerification recorded; **G-22e5 DB write closed**  
**Date:** 2026-07-05  
**Base commit:** `82d06bc`  
**Prior:** [gosaki-schedule-new-event-insert-final-preflight.md](./gosaki-schedule-new-event-insert-final-preflight.md) (G-22e4); G-22e5 operator single INSERT execution

| Check | Status |
| --- | --- |
| Save executed (operator once) | **yes** |
| afterVerification | **PASS** |
| Protected duplicate row unchanged | **yes** |
| rollback needed | **no** |
| public reflection | **not executed** (`published=false`) |
| Cursor Save / SQL | **no** |
| Save re-execution | **forbidden** |
| write-armed dev server | **stopped** |

---

## Gates

```txt
gosakiScheduleNewEventInsertExecutionResultComplete: true
phase: G-22e6-gosaki-schedule-new-event-insert-execution-result
g22e5NewEventInsertChainClosed: true
readyForG22eNewEventInsertSaveReExecution: false
rollbackNeeded: false
rollbackSqlExecuted: false
publicReflectionExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
g22e5DbWriteClosed: true
writeArmedDevServerStopped: true
```

**approvalId:** `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`  
**Supabase:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`) only. **Never** `vsbvndwuajjhnzpohghh`.

**Do not re-click 「新規追加を保存」** for this slice. G-22e5 DB write is **closed** (single INSERT only).

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` |
| `HEAD` | `82d06bc` |
| `origin/main` | `82d06bc` |

---

## 2. Execution summary

```txt
Execution: PASS
beforeVerification: PASS (G-22e4 / operator pre-G-22e5)
Save button clicked: yes (operator manual, exactly once — G-22e5)
DB write performed: yes (one INSERT on public.schedules)
operation: new-event-insert
actualWrite: true
insertedId: 18b48259-9a9a-4b00-b136-6c0c4ff3b2f3
legacy_id: schedule-2026-09-001
september_count (2026-09, gosaki-piano): 0 → 1
service_role used: false
production touched: false
/admin touched: false
rollback needed: false
rollback executed: false
public reflection: not executed (published=false)
write-armed dev server: stopped (G-22e6 doc phase)
```

---

## 3. Execution context

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
Approval ID: G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice
Env arm: PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=true
Write path: executeG22eScheduleNewEventInsertSave → insertNewEventScheduleWrite
Session: authenticated (staging Supabase Auth)
Protected row (non-touch): schedule-2026-03-014 (G-22d duplicate test row)
```

---

## 4. Save result (operator — G-22e5)

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

---

## 5. Inserted row (afterVerification confirmed)

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
| `created_at` | `2026-07-05 16:50:35.410285+00` |
| `updated_at` | `2026-07-05 16:50:35.410285+00` |

Matches G-22e4 locked target payload and planned allocation (`schedule-2026-09-001` / `sort_order=10`).

---

## 6. Protected duplicate row afterVerification (unchanged)

G-22d duplicate INSERT test row — must **never** be touched by G-22e slice.

| Field | Value |
| --- | --- |
| `id` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` |
| `legacy_id` | `schedule-2026-03-014` |
| `title` | `<Live & Session>（コピー）` |
| `published` | `false` |
| `sort_order` | `70` |
| `updated_at` | `2026-07-02 06:14:55.55128+00` |

**Judgment:** protected duplicate row **unchanged** by new-event INSERT.

---

## 7. afterVerification (operator — PASS)

| Check | Expected | Result |
| --- | --- | --- |
| `inserted_legacy_id_count` for `schedule-2026-09-001` | **1** | **PASS** |
| `target_month_count_after` (2026-09, gosaki-piano) | **1** | **PASS** |
| Exact target row field check | **PASS** | **PASS** |
| Inserted row `published` | **`false`** | **PASS** |
| Inserted row `show_on_home` | **`false`** | **PASS** |
| Inserted row `home_order` | **`null`** | **PASS** |
| Protected `schedule-2026-03-014` unchanged | **yes** | **PASS** |

### Reference SELECT (read-only archive)

```sql
-- G-22e6 afterVerification archive (SELECT only)
select id, legacy_id, title, published, show_on_home, home_order, sort_order,
       source_route, source_file, created_at, updated_at
from public.schedules
where id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3';

select count(*) as inserted_legacy_id_count
from public.schedules
where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-09-001';

select count(*) as target_month_count_after
from public.schedules
where site_slug = 'gosaki-piano' and month = '2026-09';

-- Protected duplicate row (unchanged check)
select id, legacy_id, title, published, sort_order, updated_at
from public.schedules
where id = '434e4051-86c3-473e-9ad0-39d2e5042fb8';
```

---

## 8. Public reflection

```txt
published: false on inserted row
show_on_home: false
public site build / FTP / package regen: NOT executed in G-22e5 / G-22e6
```

**Expected behavior:** `schedule-2026-09-001` does **not** appear on public Gosaki site until explicitly published and reflected in a future approved phase.

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
where id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3';

-- DELETE template (NOT executed — G-22e6)
-- delete from public.schedules
-- where id = '18b48259-9a9a-4b00-b136-6c0c4ff3b2f3'
--   and site_slug = 'gosaki-piano'
--   and legacy_id = 'schedule-2026-09-001'
--   and title = '【G-22eテスト】新規追加テストイベント'
--   and published = false;
```

Operator accepts staging test row — **no rollback**.

---

## 10. G-22e chain closure

| Phase | Outcome |
| --- | --- |
| G-22e / G-22e1 | New event dry-run UI + local QA |
| G-22e2 | INSERT planning |
| G-22e3 | INSERT implementation |
| G-22e4 | Final preflight + target locked |
| G-22e5-blocker | Preview button scroll fix |
| G-22e5 | Operator Save once → **success** |
| **G-22e6** | **Result record — G-22e5 DB write closed** |

**G-22e5 DB writes:** **1 INSERT only** — do not repeat.

---

## 11. Forbidden going forward

| Operation | Status |
| --- | --- |
| Re-click G-22e new-event Save | **forbidden** |
| Second INSERT for this slice | **forbidden** |
| rollback SQL | **not executed** |
| package regen / FTP | **not executed** |
| publish inserted row without new phase | **deferred** |
| Touch `schedule-2026-03-014` | **forbidden** |
| Restart write-armed dev server for G-22e5 | **forbidden** |

---

## 12. Next work (outside G-22e5)

- Future: publish `schedule-2026-09-001` via separate approved slice (if desired)
- Future: general new-event INSERT (beyond single-slice) — new planning phase
- Routine dev: restart with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; G-22e arm **off**; G-22d arm **off**

---

## 13. Fix required?

**No.** G-22e5 new event INSERT single-slice PoC **complete**. G-22e5 DB write safely closed.
