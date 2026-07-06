# G-22f4 — Gosaki Schedule unpublish UPDATE final preflight

**Phase:** `G-22f4-gosaki-schedule-unpublish-update-final-preflight`  
**Status:** **complete** — SQL templates + target selection procedure; **no Save / DB write**  
**Date:** 2026-07-06  
**Base commit:** `953be40`  
**Prior:** [gosaki-schedule-unpublish-update-implementation.md](./gosaki-schedule-unpublish-update-implementation.md) (G-22f3)

| Check | Status |
| --- | --- |
| G-22f3 implementation reconfirmed | **yes** |
| Candidate list SQL template | **yes** |
| beforeVerification SQL templates | **yes** |
| afterVerification SQL templates | **yes** |
| rollback SQL template | **yes** (not executed) |
| Target row fixed in doc | **pending** — operator selects from `published=true` candidates |
| Code-level preflight | **PASS** |
| Save / UPDATE executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleUnpublishUpdateFinalPreflightComplete: true
phase: G-22f4-gosaki-schedule-unpublish-update-final-preflight
approvalId: G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
targetFixedInDoc: pending
readyForG22f5ScheduleUnpublishUpdateOperatorExecution: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
grantRevokeExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
physicalDeleteImplemented: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**approvalId:** `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`

**This is NOT physical DELETE.** Slice is `published=true` → `published=false` UPDATE only.

---

## 1. Purpose

Prepare the operator single unpublish UPDATE (G-22f5) by:

1. Providing **SELECT-only** SQL to list `published=true` candidates
2. Letting the **operator** choose one row (Cursor does **not** auto-select)
3. Locking `id` / `legacy_id` / `updated_at` / `title` / `date` after beforeVerification
4. Documenting afterVerification + rollback templates for G-22f5 / G-22f6

G-22f4 does **not** click Save, run UPDATE, or execute rollback SQL.

---

## 2. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` (clean at preflight start) |
| `HEAD` | `953be40` |
| `origin/main` | `953be40` |

---

## 3. Target selection policy

| Rule | Detail |
| --- | --- |
| Eligible rows | `site_slug = 'gosaki-piano'` AND `published = true` |
| Selection | **Operator** picks one row from candidate list in staging UI or SQL results |
| Cursor / assistant | **Must not** auto-fix target in G-22f4 without operator paste + confirmation |
| Protected (non-target) | `schedule-2026-03-014`, `schedule-2026-09-001` — `published=false`, do not unpublish |
| Slice | Single UPDATE: `published` only; row **not** deleted |

### G-22f4 workflow

1. Operator runs **§4 candidate list SQL** on staging (`kmjqppxjdnwwrtaeqjta`)
2. Operator pastes results → assistant + operator agree on **one** target row
3. Fill **§5 Target fixed record** with exact `id`, `legacy_id`, `updated_at`, `title`, `date`
4. Run **§6 beforeVerification** with placeholders replaced
5. Confirm `target_id_count = 1`, `published = true`, protected rows unchanged
6. Proceed to **G-22f5** — operator Save **once** only

---

## 4. Candidate list SQL (SELECT only)

**Project:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` ONLY.  
**Do not run on Sariswing production.** Cursor does **not** execute in G-22f4.

```sql
-- G-22f4 candidate list — SELECT ONLY
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
-- Lists published=true rows eligible for unpublish (operator picks one).

select
  id,
  legacy_id,
  date,
  title,
  venue,
  month,
  published,
  updated_at,
  source_route,
  source_file,
  sort_order,
  site_slug
from public.schedules
where site_slug = 'gosaki-piano'
  and published = true
  and legacy_id not in ('schedule-2026-03-014', 'schedule-2026-09-001')
order by date desc, legacy_id asc
limit 30;
```

**Exclude protected legacy_ids in list query** as extra safety (they should already be `published=false`).

---

## 5. Target fixed record — **pending**

Fill this table **after** operator selects a candidate and §6 beforeVerification passes.

| Field | Value |
| --- | --- |
| `id` | **pending** (`:target_id`) |
| `legacy_id` | **pending** (`:target_legacy_id`) |
| `date` | **pending** |
| `title` | **pending** |
| `venue` | **pending** (record for afterVerification; not changed by slice) |
| `month` | **pending** (record for month count check) |
| `published` (before) | `true` (required) |
| `updated_at` (before) | **pending** — `expectedBeforeUpdatedAt` baseline |
| `source_route` | **pending** (unchanged by slice) |
| `source_file` | **pending** (unchanged by slice) |
| `sort_order` | **pending** (unchanged by slice) |
| `site_slug` | `gosaki-piano` (fixed) |

### UPDATE payload (fixed by implementation)

| Field | Before | After |
| --- | --- | --- |
| `published` | `true` | `false` |
| All other columns | unchanged | unchanged |
| `updated_at` | `:target_updated_at_before` | changes via DB trigger (record in G-22f6) |

**Public reflection:** not part of G-22f4 / G-22f5. Package regen / FTP **not** executed.

---

## 6. beforeVerification SQL (SELECT only — operator runs before G-22f5 Save)

Replace placeholders after §5 target fixed:

- `:target_id`
- `:target_legacy_id`
- `:target_updated_at_before`
- `:target_month` (from target row)

**Cursor does not execute in G-22f4.**

### 6.1 Grants — authenticated UPDATE yes, anon UPDATE no, DELETE not required

```sql
-- G-22f4 beforeVerification — grants (SELECT only)
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

**Expected:** `authenticated` has `UPDATE = yes`; `anon` has `UPDATE = no`; DELETE not required for this slice.

### 6.2 RLS enabled

```sql
-- G-22f4 beforeVerification — RLS (SELECT only)
select c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'schedules';
```

**Expected:** `rls_enabled = true`

### 6.3 Policy schedules_admin_all unchanged

```sql
-- G-22f4 beforeVerification — admin policy (SELECT only)
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
  and policyname = 'schedules_admin_all';
```

**Expected:** policy present; `authenticated`; `cmd = ALL`; uses `is_admin()`

### 6.4 Protected rows — must exist and remain published=false

```sql
-- G-22f4 beforeVerification — protected test rows (SELECT only)
select id, legacy_id, published, updated_at, title, date
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id in ('schedule-2026-03-014', 'schedule-2026-09-001')
order by legacy_id;
```

**Expected:**

| `legacy_id` | `id` | `published` |
| --- | --- | --- |
| `schedule-2026-03-014` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | `false` |
| `schedule-2026-09-001` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | `false` |

### 6.5 Target row — full beforeSnapshot

```sql
-- G-22f4 beforeVerification — target beforeSnapshot (SELECT only)
select
  id,
  legacy_id,
  date,
  year,
  month,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  source_route,
  source_file,
  show_on_home,
  home_order,
  sort_order,
  published,
  site_slug,
  created_at,
  updated_at
from public.schedules
where id = ':target_id'
  and legacy_id = ':target_legacy_id'
  and site_slug = 'gosaki-piano';
```

**Expected:** exactly **1** row; `published = true`; record `updated_at` as `:target_updated_at_before`.

### 6.6 Target uniqueness checks

```sql
-- G-22f4 beforeVerification — target id count (SELECT only)
select count(*) as target_id_count
from public.schedules
where id = ':target_id'
  and site_slug = 'gosaki-piano';

-- G-22f4 beforeVerification — target legacy_id count (SELECT only)
select count(*) as target_legacy_id_count
from public.schedules
where legacy_id = ':target_legacy_id'
  and site_slug = 'gosaki-piano';

-- G-22f4 beforeVerification — target not already unpublished (SELECT only)
select count(*) as target_already_unpublished_count
from public.schedules
where id = ':target_id'
  and site_slug = 'gosaki-piano'
  and published = false;

-- G-22f4 beforeVerification — target is not protected legacy (SELECT only)
select count(*) as target_is_protected_legacy_count
from public.schedules
where id = ':target_id'
  and legacy_id in ('schedule-2026-03-014', 'schedule-2026-09-001');
```

**Expected:**

| Check | Expected |
| --- | --- |
| `target_id_count` | `1` |
| `target_legacy_id_count` | `1` |
| `target_already_unpublished_count` | `0` |
| `target_is_protected_legacy_count` | `0` |

### 6.7 Target month count (baseline for afterVerification)

```sql
-- G-22f4 beforeVerification — month count baseline (SELECT only)
select count(*) as target_month_count_before
from public.schedules
where site_slug = 'gosaki-piano'
  and month = ':target_month';
```

Record result for G-22f6 afterVerification (must be unchanged).

---

## 7. afterVerification SQL (SELECT only — G-22f5 success / G-22f6)

Replace placeholders:

- `:target_id`
- `:target_legacy_id`
- `:target_updated_at_before`
- `:target_updated_at_after` (from post-Save row)
- `:before_date`, `:before_title`, `:before_venue`, etc. (from §5 / §6.5)
- `:target_month_count_before`

```sql
-- G-22f6 afterVerification — target row (SELECT only)
-- Run after G-22f5 operator Save once.

select
  id,
  legacy_id,
  date,
  year,
  month,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  source_route,
  source_file,
  show_on_home,
  home_order,
  sort_order,
  published,
  site_slug,
  created_at,
  updated_at
from public.schedules
where id = ':target_id'
  and site_slug = 'gosaki-piano';
```

**Expected:** `published = false`; `updated_at` ≠ `:target_updated_at_before` (trigger updated).

```sql
-- G-22f6 afterVerification — legacy_id uniqueness (SELECT only)
select count(*) as target_legacy_id_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = ':target_legacy_id';
```

**Expected:** `1` (physical DELETE did not occur).

```sql
-- G-22f6 afterVerification — protected fields unchanged (SELECT only)
select
  (date = :before_date) as date_unchanged,
  (title = :before_title) as title_unchanged,
  (venue is not distinct from :before_venue) as venue_unchanged,
  (open_time is not distinct from :before_open_time) as open_time_unchanged,
  (start_time is not distinct from :before_start_time) as start_time_unchanged,
  (price is not distinct from :before_price) as price_unchanged,
  (description is not distinct from :before_description) as description_unchanged,
  (source_route is not distinct from :before_source_route) as source_route_unchanged,
  (source_file is not distinct from :before_source_file) as source_file_unchanged,
  (sort_order is not distinct from :before_sort_order) as sort_order_unchanged,
  (legacy_id = ':target_legacy_id') as legacy_id_unchanged,
  (site_slug = 'gosaki-piano') as site_slug_unchanged
from public.schedules
where id = ':target_id';
```

**Expected:** all `true`.

```sql
-- G-22f6 afterVerification — row still exists (SELECT only)
select count(*) as target_row_exists
from public.schedules
where id = ':target_id';
```

**Expected:** `1`

```sql
-- G-22f6 afterVerification — month count unchanged (SELECT only)
select count(*) as target_month_count_after
from public.schedules
where site_slug = 'gosaki-piano'
  and month = ':target_month';
```

**Expected:** `target_month_count_after = :target_month_count_before`

```sql
-- G-22f6 afterVerification — protected rows unchanged (SELECT only)
select id, legacy_id, published, updated_at, title, date, venue
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id in ('schedule-2026-03-014', 'schedule-2026-09-001')
order by legacy_id;
```

**Expected:** identical to §6.4 beforeSnapshot.

---

## 8. Rollback SQL template (UPDATE — rollback execution forbidden in G-22f4)

Staging only (`kmjqppxjdnwwrtaeqjta`). Operator / assistant confirmation required. **DO NOT EXECUTE in G-22f4.**

```sql
-- G-22f6 rollback template — staging kmjqppxjdnwwrtaeqjta ONLY
-- Restores published=true on unpublish target.
-- DO NOT EXECUTE IN G-22f4. Use only if unpublish was wrong.

begin;

update public.schedules
set published = true
where id = ':target_id'
  and legacy_id = ':target_legacy_id'
  and site_slug = 'gosaki-piano'
  and published = false
  and updated_at = ':target_updated_at_after';

-- expect: 1 row updated
-- verify with afterVerification-style SELECT before commit

commit;
```

**Rollback policy:** needed only if wrong row unpublished or operator requests revert before public reflection. Not needed if G-22f6 afterVerification PASS.

---

## 9. Code-level preflight (G-22f4 — no DB)

Verified against `gosaki-schedule-unpublish-update-guards.ts` + module smoke:

| Check | Result |
| --- | --- |
| `buildG22fUnpublishUpdatePayload()` | `{ published: false }` only |
| `assertG22fUnpublishUpdatePayloadOnly` | rejects `updated_at` in patch |
| `expectedBeforeUpdatedAt` | from target `updated_at` at Save time |
| `wouldDelete` / `physicalDelete` | `false` in dry-run + save guards |
| Protected legacy blocked | `schedule-2026-03-014` / `schedule-2026-09-001` |
| `published=false` target | blocked by `assertG22fUnpublishUpdateWritableTarget` |
| Default env | `getG22fUnpublishUpdateConfig().saveEnabled = false` |

---

## 10. G-22f5 dev arm command (documented — not run in G-22f4)

Run **only after** §5 target fixed + §6 beforeVerification PASS. Operator clicks Save **once** in G-22f5 only.

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
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

### G-22f5 UI procedure (operator)

1. Open `/__admin-staging-shell/musician-basic/admin/schedule/`
2. Select **fixed target row** (`published=true`)
3. **非公開化案を作成** → **変更を確認** (dry-run `operation=unpublish`)
4. Verify dev panel: `update saveEnabled=true`, `expectedBeforeUpdatedAt` matches §5
5. **非公開化を保存** — click **once** only
6. Do **not** re-click Save; do **not** unpublish protected rows

---

## 11. Not executed in G-22f4

| Item | Status |
| --- | --- |
| Save click | **no** |
| DB write / Supabase mutation | **no** |
| SQL INSERT / UPDATE / DELETE | **no** |
| Rollback SQL execution | **no** |
| GRANT / REVOKE | **no** |
| package regen / FTP / deploy | **no** |
| commit / push | **no** |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22f4-gosaki-schedule-unpublish-update-final-preflight.mjs
```

---

## 13. Fix required?

**No.** Templates and procedure are ready. Target row remains **pending** until operator runs §4 SQL and confirms selection. G-22f5 is operator Save once only.
