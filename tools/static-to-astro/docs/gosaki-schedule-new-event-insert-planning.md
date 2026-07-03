# G-22e2 — Gosaki Schedule new event INSERT planning

**Phase:** `G-22e2-gosaki-schedule-new-event-insert-planning`  
**Status:** **complete** — planning / SQL templates / guard policy only; **no implementation / Save / DB write**  
**Date:** 2026-07-02  
**Base commit:** `4d39598` (G-22e1 local QA committed)  
**Prior:** [gosaki-schedule-new-event-dry-run-local-qa.md](./gosaki-schedule-new-event-dry-run-local-qa.md) (G-22e1)

| Check | Status |
| --- | --- |
| G-22e dry-run UI | **complete** |
| G-22e1 local QA | **PASS** |
| New event INSERT implementation | **not implemented** |
| Save / DB write | **not executed** |
| GRANT / REVOKE | **not executed** |
| SQL mutation | **not executed** |
| package regen / FTP | **not executed** |

---

## Gates

```txt
gosakiScheduleNewEventInsertPlanningComplete: true
phase: G-22e2-gosaki-schedule-new-event-insert-planning
approvalId: G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice
readyForG22e3ScheduleNewEventInsertImplementationOnly: true
readyForG22e4ScheduleNewEventInsertFinalPreflight: false
implementationExecuted: false
saveExecuted: false
dbWriteExecuted: false
sqlMutationExecuted: false
grantRevokeExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**Approval ID:** `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`

---

## 1. Purpose

Prepare a safe single-slice INSERT path for Gosaki Schedule **new event** creation after:

- G-22e implemented the dry-run UI (`operation=new`, `actualWrite=false`, `saveAllowed=false`)
- G-22e1 verified local UI / module behavior
- G-22d duplicate INSERT chain was closed

This phase defines the next implementation shape, guards, approval ID, payload policy, and SQL templates. It does **not** add code or run any write.

---

## 2. Existing implementation inventory (read-only)

| Area | File / finding |
| --- | --- |
| New event dry-run | `gosaki-schedule-new-event-dry-run.ts` — `executeG22eScheduleNewEventDryRun`, `operation="new"`, `actualWrite=false`, `saveAllowed=false` |
| New draft UI | `gosaki-staging-schedule-operator-ui.ts` — `editDraftMode === "new"`, `enterNewEventDraftMode()`, `renderNewEventDryRunResult()` |
| Existing UPDATE Save | `gosaki-schedule-existing-event-save-button-save.ts` — G-9k update-only path, optimistic lock, existing row id required |
| Duplicate INSERT Save | `gosaki-schedule-duplicate-insert-save.ts` — G-22d fixed sourceId / `duplicate-insert` path |
| Duplicate INSERT guards | `gosaki-schedule-duplicate-insert-guards.ts` — fixed `sourceId`, `schedule-2026-03-014`, `sort_order=70`; **do not reuse for new event** |
| INSERT adapter | `schedule-insert-write-adapter.ts` — currently typed / returned as `operation="duplicate-insert"` and requires `sourceId`; G-22e3 must generalize or add a new-event wrapper |
| Approval registry | `schedule-write-types.ts` — currently includes G-22d approval only; G-22e approval must be added in implementation phase |
| Current permissions | `authenticated INSERT` grant already applied in G-22d3b3; RLS `schedules_admin_all` + `is_admin()` protects admin-only INSERT; `anon INSERT` remains no |

---

## 3. Single-slice INSERT policy

### 3.1 Target selection

G-22e2 does **not** choose a dummy event. The next execution should insert one **operator-selected payload** created from the normal UI.

Specific values must be fixed in **G-22e4 final preflight**:

- `date`
- `title`
- `venue`
- `open_time`
- `start_time`
- `price`
- `description`
- `year`
- `month`
- `source_route`
- `source_file`
- `legacy_id`
- `sort_order`
- `published=false`
- `show_on_home=false`
- `home_order=null`
- `site_slug=gosaki-piano`

### 3.2 Fixed defaults

| Field | Policy |
| --- | --- |
| `site_slug` | `gosaki-piano` fixed |
| `published` | `false` fixed — no public reflection in INSERT slice |
| `show_on_home` | `false` fixed |
| `home_order` | `null` fixed |
| `id` | DB UUID default / returned after insert |
| `created_at` / `updated_at` | DB defaults / trigger |

---

## 4. Approval and env gate

### 4.1 Approval ID

```txt
G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice
```

Register in G-22e3:

- `ScheduleG22eNewEventInsertNonDryRunSliceApprovalId`
- `G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID`
- `SCHEDULE_WRITE_APPROVAL_IDS`

### 4.2 Env stack (G-22e5 execution only)

```bash
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_DATA_READ=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=true

# Must be off:
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false
# plus all other Schedule / Discography / PoC non-dry-run arms off
```

Default routine dev remains:

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false
```

---

## 5. UI gate policy

All conditions required before Save can become enabled in G-22e5:

| Gate | Required |
| --- | --- |
| Draft mode | `editDraftMode === "new"` |
| Dry-run | latest G-22e new-event dry-run valid |
| Date | valid `YYYY-MM-DD` |
| Title | non-empty |
| Site | `site_slug === "gosaki-piano"` |
| Published | `published === false` |
| Existing id | **absent** — new event must not carry existing UPDATE id |
| Duplicate sourceId | **absent** — new event must not use G-22d fixed source guard |
| Delete | not present / not enabled |
| Auth | staging admin signed in |
| Env | §4.2 fully armed |
| Host | staging allowlist `kmjqppxjdnwwrtaeqjta` |

Default state: disabled. New mode Save label may remain `保存（現在は無効）` until G-22e3 adds the gated save path.

---

## 6. Payload assertion policy

G-22e3 should add a new guard module, e.g.:

```txt
gosaki-schedule-new-event-insert-config.ts
gosaki-schedule-new-event-insert-guards.ts
gosaki-schedule-new-event-insert-save.ts
```

Recommended guard names:

- `buildG22eNewEventInsertPayload`
- `assertG22eNewEventInsertPayloadOnly`
- `collectG22eNewEventInsertGuardFailures`
- `evaluateG22eNewEventInsertUiGate`

### 6.1 Required payload keys

```txt
legacy_id
site_slug
date
year
month
title
venue
open_time
start_time
price
description
published
show_on_home
home_order
sort_order
source_file
source_route
image_url
```

`image_url` may be `null` for new event unless the UI explicitly supports image selection later.

### 6.2 Assertions

| Assertion | Required |
| --- | --- |
| `operation` | `new-event-insert` (not `duplicate-insert`) |
| `approvalId` | `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice` |
| `site_slug` | `gosaki-piano` |
| `legacy_id` | matches `^schedule-\d{4}-\d{2}-\d{3}$` |
| `legacy_id` uniqueness | SELECT-only preflight count = 0 |
| `date` / `year` / `month` | derived values must agree |
| `source_route` | `/schedule/YYYY-MM/` |
| `source_file` | `schedule-YYYY-MM.html` |
| `published` | `false` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `sort_order` | number; fixed in G-22e4 |
| Existing UPDATE id | no existing row id in payload |
| Duplicate row | must not touch `schedule-2026-03-014` |
| Delete | no delete operation / no DELETE grant dependency |

---

## 7. Derived field policy

### 7.1 `legacy_id`

Use the existing seed convention:

```txt
schedule-YYYY-MM-NNN
```

Algorithm (G-22e4 fixed preflight):

1. Derive `target_month = YYYY-MM` from `date`
2. SELECT existing `legacy_id` for `site_slug='gosaki-piano'` and `legacy_id LIKE 'schedule-{target_month}-%'`
3. Parse trailing 3-digit suffix
4. Candidate suffix = max suffix + 1
5. Candidate `legacy_id = schedule-{target_month}-{candidate_suffix_padded}`
6. Verify `count(*) = 0` for candidate

Do not insert `legacy_id=null`.

### 7.2 `sort_order`

Use the same rule proven in G-22d2b:

```txt
target_month max(sort_order) + 10
```

Rationale:

- G-22d2b corrected March live drift to `max(sort_order)=60` → `70`
- Existing seed convention is 10-step ordering within a month
- G-22e4 should verify current target month max before fixing payload

If the target month has no rows:

```txt
sort_order = 10
```

### 7.3 `year` / `month`

Derived from `date`:

```txt
year = Number(YYYY)
month = YYYY-MM
```

### 7.4 `source_route` / `source_file`

For Gosaki live/staging schedule month routes:

```txt
source_route = /schedule/YYYY-MM/
source_file = schedule-YYYY-MM.html
```

This matches G-22d3c inserted duplicate row:

```txt
source_route = /schedule/2026-03/
source_file = schedule-2026-03.html
```

---

## 8. DB permission assumptions

| Item | State |
| --- | --- |
| `authenticated INSERT` on `public.schedules` | **yes** (G-22d3b3) |
| RLS on `public.schedules` | **enabled** |
| Policy `schedules_admin_all` | `authenticated`, `ALL`, `is_admin()` |
| `anon INSERT` | **no** |
| `authenticated DELETE` | **no** |
| DELETE grant | **not needed** for G-22e |
| `service_role` | **never** |

No GRANT / REVOKE is planned in G-22e2.

---

## 9. SQL templates

All SQL below is **template only**. Cursor does not execute. G-22e2 does not connect to DB.

Before G-22e4, replace:

- `:target_date`
- `:target_month`
- `:target_year`
- `:target_legacy_id`
- `:target_sort_order`
- `:target_title`
- `:target_venue`
- `:target_open_time`
- `:target_start_time`
- `:target_price`
- `:target_description`

### 9.1 beforeVerification — SELECT-only

```sql
-- G-22e4 beforeVerification template — SELECT ONLY
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
-- Do not run on Sariswing production.

-- 1) Permissions: authenticated INSERT yes, anon INSERT no.
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

-- 2) RLS enabled.
select c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'schedules';

-- 3) Admin policy unchanged.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
  and policyname = 'schedules_admin_all';

-- 4) Candidate legacy_id must not exist.
select count(*) as target_legacy_id_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = ':target_legacy_id';

-- 5) Target month inventory / next suffix source.
select count(*) as target_month_count
from public.schedules
where site_slug = 'gosaki-piano'
  and month = ':target_month';

select legacy_id
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-:target_month-%'
order by legacy_id;

select max((regexp_match(legacy_id, '^schedule-\d{4}-\d{2}-(\d{3})$'))[1]::int) as max_suffix
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-:target_month-%';

select coalesce(max(sort_order), 0) as target_month_max_sort_order
from public.schedules
where site_slug = 'gosaki-piano'
  and month = ':target_month';

-- 6) Same date/title duplicate check.
select id, legacy_id, date, title, venue, published, sort_order
from public.schedules
where site_slug = 'gosaki-piano'
  and date = ':target_date'
  and title = ':target_title';

-- 7) G-22d duplicate row remains present and untouched.
select id, legacy_id, title, published, sort_order, updated_at
from public.schedules
where id = '434e4051-86c3-473e-9ad0-39d2e5042fb8'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-014';
```

Expected beforeVerification:

| Check | Expected |
| --- | --- |
| `authenticated.has_insert` | `yes` |
| `anon.has_insert` | `no` |
| RLS | enabled |
| `schedules_admin_all` | unchanged, `is_admin()` |
| `target_legacy_id_count` | `0` |
| same date/title duplicate | `0 rows` or operator-approved non-conflict |
| duplicate row `schedule-2026-03-014` | present, `published=false`, `sort_order=70` |

### 9.2 afterVerification — SELECT-only

Replace `:inserted_id` after G-22e5 Save returns inserted UUID.

```sql
-- G-22e6 afterVerification template — SELECT ONLY
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY

-- 1) Inserted row by id.
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
  description,
  published,
  show_on_home,
  home_order,
  sort_order,
  source_file,
  source_route,
  created_at,
  updated_at
from public.schedules
where id = ':inserted_id';

-- 2) Candidate legacy_id exactly once.
select count(*) as inserted_legacy_id_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = ':target_legacy_id';

-- 3) Target month count after INSERT.
select count(*) as target_month_count_after
from public.schedules
where site_slug = 'gosaki-piano'
  and month = ':target_month';

-- 4) Exact field match.
select count(*) as inserted_exact_match_count
from public.schedules
where id = ':inserted_id'
  and site_slug = 'gosaki-piano'
  and legacy_id = ':target_legacy_id'
  and date = ':target_date'
  and year = :target_year
  and month = ':target_month'
  and title = ':target_title'
  and coalesce(venue, '') = coalesce(':target_venue', '')
  and coalesce(open_time, '') = coalesce(':target_open_time', '')
  and coalesce(start_time, '') = coalesce(':target_start_time', '')
  and coalesce(price, '') = coalesce(':target_price', '')
  and coalesce(description, '') = coalesce(':target_description', '')
  and published = false
  and show_on_home = false
  and home_order is null
  and sort_order = :target_sort_order
  and source_file = 'schedule-:target_month.html'
  and source_route = '/schedule/:target_month/';

-- 5) created_at / updated_at present.
select
  (created_at is not null) as created_at_present,
  (updated_at is not null) as updated_at_present
from public.schedules
where id = ':inserted_id';

-- 6) G-22d duplicate row remains unchanged.
select id, legacy_id, title, published, sort_order, updated_at
from public.schedules
where id = '434e4051-86c3-473e-9ad0-39d2e5042fb8'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-014';
```

Expected afterVerification:

| Check | Expected |
| --- | --- |
| inserted row by id | 1 row |
| `inserted_legacy_id_count` | `1` |
| `target_month_count_after` | before count + 1 |
| `inserted_exact_match_count` | `1` |
| `published` | `false` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `source_route` / `source_file` | match derived month |
| timestamps | present |
| G-22d duplicate row | unchanged |

### 9.3 Rollback SQL template — DO NOT EXECUTE IN G-22e2

Only if operator explicitly requests cleanup after a bad G-22e5 INSERT.

```sql
-- G-22e rollback template — staging only
-- DO NOT EXECUTE IN G-22e2.
-- Replace :inserted_id and :target_legacy_id after G-22e5.

begin;

delete from public.schedules
where id = ':inserted_id'
  and site_slug = 'gosaki-piano'
  and legacy_id = ':target_legacy_id'
  and published = false
  and show_on_home = false
  and home_order is null;

-- Expect exactly 1 row deleted.
-- If row count is not exactly 1: rollback; stop; ask operator.

commit;
```

Rollback is **not executed** in G-22e2.

---

## 10. Implementation phase split

| Phase | Scope |
| --- | --- |
| **G-22e3** | Implementation only: config / approval registry / new-event guards / save wrapper / UI gate; no Save |
| **G-22e4** | Final preflight: operator-selected payload fixed; beforeVerification SELECT-only; rollback template finalized |
| **G-22e5** | Operator single INSERT execution: manual Save exactly once |
| **G-22e6** | afterVerification / result record |
| **G-22e7** | New event INSERT chain closure |

Optional later phase: publish/public reflection for inserted row. Not part of G-22e INSERT slice because `published=false`.

---

## 11. STOP conditions

Stop immediately if:

- target event values are ambiguous
- target month / legacy_id / sort_order cannot be fixed
- beforeVerification suggests duplicate conflict
- `authenticated INSERT` missing
- `anon INSERT` present
- RLS disabled or `schedules_admin_all` changed unexpectedly
- production project / `vsbvndwuajjhnzpohghh` appears as active target
- implementation would require `service_role`
- `/admin` changes appear necessary
- `schedule_months` write appears necessary
- rollback may be needed now

---

## 12. Not done in G-22e2

| Operation | Executed |
| --- | --- |
| Implementation | **no** |
| Save | **no** |
| DB write | **no** |
| SQL INSERT / UPDATE / DELETE / UPSERT | **no** |
| GRANT / REVOKE | **no** |
| rollback SQL | **no** |
| package regen | **no** |
| FTP/upload/deploy/workflow_dispatch | **no** |
| secrets/env changes | **no** |

---

## 13. Fix required?

**No implementation fix in G-22e2.** Planning is complete. Proceed to G-22e3 implementation only when ready.
