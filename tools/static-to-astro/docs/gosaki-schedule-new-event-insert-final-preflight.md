# G-22e4 — Gosaki Schedule new event INSERT final preflight

**Phase:** `G-22e4-gosaki-schedule-new-event-insert-final-preflight`  
**Status:** **complete** — target payload locked / SQL templates only; **no Save / DB write**  
**Date:** 2026-07-02  
**Base commit:** `e566855`  
**Prior:** [gosaki-schedule-new-event-insert-implementation.md](./gosaki-schedule-new-event-insert-implementation.md) (G-22e3)

| Check | Status |
| --- | --- |
| G-22e3 implementation reconfirmed | **yes** |
| Target event payload locked | **yes** |
| beforeVerification SQL templates | **yes** |
| afterVerification SQL templates | **yes** |
| rollback SQL template | **yes** (not executed) |
| Code-level dry-run preflight | **PASS** |
| Save / INSERT executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleNewEventInsertFinalPreflightComplete: true
phase: G-22e4-gosaki-schedule-new-event-insert-final-preflight
approvalId: G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice
readyForG22e5ScheduleNewEventInsertOperatorExecution: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
grantRevokeExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** Sariswing production.

**approvalId:** `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` |
| `HEAD` | `e566855` |
| `origin/main` | `e566855` |

---

## 2. Test event — locked target (G-22e5 single slice)

This is a **staging test event** for CMS new-event INSERT verification only.

| Field | Value |
| --- | --- |
| `date` | `2026-09-12` |
| `title` | `【G-22eテスト】新規追加テストイベント` |
| `venue` | `テスト会場` |
| `open_time` | `18:30` |
| `start_time` | `19:30` |
| `price` | `3,500円` |
| `description` | `CMS新規追加機能の動作確認用テストイベントです。公開サイトには反映しません。検証後は非公開維持または削除対象とします。` |
| `published` | `false` (fixed) |
| `show_on_home` | `false` (fixed) |
| `home_order` | `null` (fixed) |
| `site_slug` | `gosaki-piano` (fixed) |

**Public reflection:** `published=false` → **no public site reflection required** for this slice. FTP / package regen **not** part of G-22e4 / G-22e5.

**Protected row (non-touch):** G-22d duplicate test row `schedule-2026-03-014` (`id=434e4051-86c3-473e-9ad0-39d2e5042fb8`) must remain unchanged.

---

## 3. Derived fields (fixed from date)

| Field | Value |
| --- | --- |
| `year` | `2026` |
| `month` | `2026-09` |
| `source_route` | `/schedule/2026-09/` |
| `source_file` | `schedule-2026-09.html` |

---

## 4. planned legacy_id / sort_order — pending → fixed workflow

Allocation is computed at Save time from live DB rows for `month=2026-09`. **Do not lock in doc until beforeVerification SQL runs.**

| Field | Status | Code-level preflight (empty month) | Live rule |
| --- | --- | --- | --- |
| `legacy_id` | **pending** → **fixed after §5** | `schedule-2026-09-001` | `schedule-2026-09-{max_suffix+1}` (3-digit pad) |
| `sort_order` | **pending** → **fixed after §5** | `10` | `max(sort_order)+10` in month; empty month → `10` |

**G-22e4 procedure:**

1. Run §5 beforeVerification SQL on staging (`kmjqppxjdnwwrtaeqjta`)
2. Record live `max_suffix`, `target_month_count`, `target_month_max_sort_order`
3. Compute candidate:
   - `candidate_legacy_id = schedule-2026-09-{LPAD(max_suffix+1,3,'0')}`
   - `candidate_sort_order = target_month_max_sort_order + 10` (or `10` if month empty)
4. Verify `target_legacy_id_count = 0` for candidate
5. Mark §6 payload table **fixed** with candidate values before G-22e5 Save

---

## 5. beforeVerification SQL (SELECT only — operator runs before G-22e5 Save)

**Project:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta.supabase.co`) only.  
**STOP** if host is production. Cursor does **not** execute in G-22e4.

### 5.1 Permissions — authenticated INSERT yes, anon INSERT no

```sql
-- G-22e4 beforeVerification — grants (SELECT only)
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
select grantee,
  max(case when privilege_type = 'INSERT' then 'yes' else 'no' end) as has_insert,
  max(case when privilege_type = 'UPDATE' then 'yes' else 'no' end) as has_update,
  max(case when privilege_type = 'DELETE' then 'yes' else 'no' end) as has_delete
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
group by grantee
order by grantee;
```

**Expected:**

| grantee | has_insert | has_update | has_delete |
| --- | --- | --- | --- |
| `anon` | `no` | per grant | `no` |
| `authenticated` | `yes` | per grant | `no` |

### 5.2 RLS enabled

```sql
-- G-22e4 beforeVerification — RLS (SELECT only)
select c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'schedules';
```

**Expected:** `rls_enabled = true`

### 5.3 Policy schedules_admin_all unchanged

```sql
-- G-22e4 beforeVerification — admin policy (SELECT only)
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
  and policyname = 'schedules_admin_all';
```

**Expected:** policy present; `roles` includes `authenticated`; `cmd = ALL`; uses `is_admin()`

### 5.4 Target month inventory

```sql
-- G-22e4 beforeVerification — 2026-09 month count
select count(*) as target_month_count
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-09';
```

Record result → used for afterVerification `+1` check.

### 5.5 legacy_id suffix max for 2026-09

```sql
-- G-22e4 beforeVerification — legacy_id list
select legacy_id, date, title, sort_order, published
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-09-%'
order by legacy_id asc;

-- G-22e4 beforeVerification — max suffix
select max((regexp_match(legacy_id, '^schedule-2026-09-(\d{3})$'))[1]::int) as max_suffix
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-09-%';
```

**Compute candidate:** `schedule-2026-09-{max_suffix+1 padded}` or `schedule-2026-09-001` if `max_suffix` is null.

### 5.6 sort_order max for 2026-09

```sql
-- G-22e4 beforeVerification — max sort_order in 2026-09
select coalesce(max(sort_order), 0) as target_month_max_sort_order
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-09';
```

**Compute candidate:** `target_month_max_sort_order + 10`, or `10` if month count is 0.

### 5.7 No duplicate date/title

```sql
-- G-22e4 beforeVerification — same date + title absent
select id, legacy_id, title, date, published
from public.schedules
where site_slug = 'gosaki-piano'
  and date = '2026-09-12'
  and title = '【G-22eテスト】新規追加テストイベント';
```

**Expected:** **0 rows**

### 5.8 No duplicate title globally

```sql
-- G-22e4 beforeVerification — target title absent
select id, legacy_id, title, date, published
from public.schedules
where site_slug = 'gosaki-piano'
  and title = '【G-22eテスト】新規追加テストイベント';
```

**Expected:** **0 rows**

### 5.9 Candidate legacy_id must not exist

Replace `:candidate_legacy_id` after §5.5 computation.

```sql
-- G-22e4 beforeVerification — candidate legacy_id absent
select count(*) as target_legacy_id_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = ':candidate_legacy_id';
```

**Expected:** `target_legacy_id_count = 0`

### 5.10 G-22d duplicate row unchanged (non-touch)

```sql
-- G-22e4 beforeVerification — protected duplicate row snapshot
select id, legacy_id, title, date, published, sort_order, updated_at
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-014';
```

**Expected:**

| Field | Expected |
| --- | --- |
| `id` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` |
| `legacy_id` | `schedule-2026-03-014` |
| `title` | `<Live & Session>（コピー）` |
| `published` | `false` |
| `sort_order` | `70` |

Record `updated_at` for §7 unchanged check.

---

## 6. Expected INSERT payload (locked operator fields + pending allocation)

| Field | Value | Status |
| --- | --- | --- |
| `date` | `2026-09-12` | **fixed** |
| `year` | `2026` | **fixed** |
| `month` | `2026-09` | **fixed** |
| `title` | `【G-22eテスト】新規追加テストイベント` | **fixed** |
| `venue` | `テスト会場` | **fixed** |
| `open_time` | `18:30` | **fixed** |
| `start_time` | `19:30` | **fixed** |
| `price` | `3,500円` | **fixed** |
| `description` | *(see §2)* | **fixed** |
| `site_slug` | `gosaki-piano` | **fixed** |
| `source_route` | `/schedule/2026-09/` | **fixed** |
| `source_file` | `schedule-2026-09.html` | **fixed** |
| `published` | `false` | **fixed** |
| `show_on_home` | `false` | **fixed** |
| `home_order` | `null` | **fixed** |
| `image_url` | `null` | **fixed** |
| `legacy_id` | *(§5.5 candidate)* | **pending → fixed** |
| `sort_order` | *(§5.6 candidate)* | **pending → fixed** |
| `id` | *(omit — DB UUID default)* | — |
| `created_at` / `updated_at` | *(DB default)* | — |

**Code-level preflight (empty month assumption):** `legacy_id=schedule-2026-09-001`, `sort_order=10` — supersede if §5 live data differs.

---

## 7. Code-level / module dry-run preflight (G-22e4 — no DB)

Executed via `executeG22eScheduleNewEventDryRun` + `buildG22eNewEventInsertPayload` (empty month rows):

| Check | Result |
| --- | --- |
| `operation` | `new` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `saveAllowed` | `false` |
| `wouldInsert` | `true` |
| `site_slug` | `gosaki-piano` |
| `published` | `false` |
| `derivedMonth` | `2026-09` |
| `source_route` | `/schedule/2026-09/` |
| `source_file` | `schedule-2026-09.html` |

**UI preview (G-22e5 procedure):** enter §2 values in new-event draft → **変更を確認** → verify same flags. **Do not click Save** in G-22e4.

**Safe dev env (G-22e4):**

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false
```

---

## 8. Execution env stack (G-22e5 only — **not started in G-22e4**)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

**Verify before Save:**

- `PUBLIC_SUPABASE_URL` host = `kmjqppxjdnwwrtaeqjta.supabase.co`
- Dev panel: `insert saveEnabled=true`, `planned legacy_id` matches §6 fixed candidate
- **Never** Sariswing production

---

## 9. G-22e5 operator execution procedure (not executed in G-22e4)

1. Run §5 beforeVerification SQL — all PASS; fix §6 `legacy_id` / `sort_order`
2. Run §8 env stack; sign in staging admin
3. Open `/__admin-staging-shell/musician-basic/admin/schedule/`
4. Click **新規追加案を作成**; enter §2 values exactly
5. Click **変更を確認** — verify `operation=new`, `wouldInsert=true`, `actualWrite=false`
6. Dev details: `insert saveEnabled=true`, `planned legacy_id` = §6 fixed value
7. Click **新規追加を保存** **once** only
8. Record `insertedId` from save result UI
9. Run §10 afterVerification SQL
10. **Do not** re-Save; **do not** touch `schedule-2026-03-014`

---

## 10. afterVerification SQL (SELECT only — G-22e5 post-execution)

Replace `:inserted_id` and `:fixed_legacy_id` after G-22e5 Save.

```sql
-- G-22e4 afterVerification — inserted row (SELECT only)
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
select
  id,
  legacy_id,
  site_slug,
  date,
  year,
  month,
  title,
  venue,
  open_time,
  start_time,
  price,
  left(description, 80) as description_prefix,
  published,
  show_on_home,
  home_order,
  sort_order,
  source_route,
  source_file,
  created_at,
  updated_at
from public.schedules
where id = ':inserted_id';
```

**Expected:**

| Field | Expected |
| --- | --- |
| `legacy_id` | `:fixed_legacy_id` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-09-12` |
| `title` | `【G-22eテスト】新規追加テストイベント` |
| `published` | `false` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `source_route` | `/schedule/2026-09/` |
| `source_file` | `schedule-2026-09.html` |

```sql
-- G-22e4 afterVerification — fixed legacy_id count = 1
select count(*) as inserted_legacy_id_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = ':fixed_legacy_id';
```

**Expected:** `inserted_legacy_id_count = 1`

```sql
-- G-22e4 afterVerification — 2026-09 month count +1
select count(*) as target_month_count_after
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-09';
```

**Expected:** `target_month_count_after = target_month_count_before + 1`

```sql
-- G-22e4 afterVerification — protected duplicate row unchanged
select id, legacy_id, title, published, sort_order, updated_at
from public.schedules
where legacy_id = 'schedule-2026-03-014';
```

**Expected:** same as §5.10 beforeSnapshot (`updated_at` unchanged)

---

## 11. rollback SQL template (DELETE — **not executed in G-22e4**)

**G-22e4: rollback execution forbidden.** Template for operator emergency use after G-22e5 only, with explicit approval.

Replace placeholders after G-22e5:

- `:inserted_id` — UUID from save result
- `:fixed_legacy_id` — from §6 fixed allocation
- `:fixed_title` — `【G-22eテスト】新規追加テストイベント`

```sql
-- G-22e4 rollback template — DELETE (staging only; operator approval required)
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
-- STOP if host is production.
-- Guards: id + legacy_id + title + published=false must all match.

delete from public.schedules
where id = ':inserted_id'
  and legacy_id = ':fixed_legacy_id'
  and title = ':fixed_title'
  and published = false
  and site_slug = 'gosaki-piano'
returning id, legacy_id, title, published;
```

**Expected:** exactly **1** row deleted if rollback approved.  
**Do not** delete `schedule-2026-03-014`.

---

## 12. Not done in G-22e4

- Save execution
- Supabase mutation / SQL INSERT / UPDATE / DELETE / UPSERT
- rollback SQL execution
- GRANT / REVOKE
- package regen / production build
- FTP / upload / deploy / workflow_dispatch
- public reflection (not required — `published=false`)
- secrets / env file changes
- commit / push
- Live beforeVerification SQL execution (operator runs before G-22e5)

---

## 13. Handoff

| Phase | Action |
| --- | --- |
| **G-22e5** | Operator runs §5 SQL → fixes §6 allocation → Save once with §8 env |
| **G-22e6** | Execution result record |
| **G-22e7** | Chain closure |
