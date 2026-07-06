# G-22f2 — Gosaki Schedule unpublish UPDATE planning

**Phase:** `G-22f2-gosaki-schedule-unpublish-update-planning`  
**Status:** **complete** — planning / SQL templates / guard policy only; **no implementation / Save / DB write**  
**Date:** 2026-07-06  
**Base commit:** `e2b9f7c`  
**Prior:** [gosaki-schedule-unpublish-dry-run-local-qa.md](./gosaki-schedule-unpublish-dry-run-local-qa.md) (G-22f1)

| Check | Status |
| --- | --- |
| G-22f dry-run UI | **complete** |
| G-22f1 local QA | **PASS** |
| Unpublish UPDATE save implementation | **not implemented** |
| Physical DELETE | **not implemented** (disabled) |
| Save / DB write | **not executed** |
| GRANT / REVOKE | **not executed** |
| SQL mutation | **not executed** |
| package regen / FTP | **not executed** |

---

## Gates

```txt
gosakiScheduleUnpublishUpdatePlanningComplete: true
phase: G-22f2-gosaki-schedule-unpublish-update-planning
approvalId: G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
readyForG22f3ScheduleUnpublishUpdateImplementationOnly: true
readyForG22f4ScheduleUnpublishUpdateFinalPreflight: false
implementationExecuted: false
saveExecuted: false
dbWriteExecuted: false
sqlMutationExecuted: false
grantRevokeExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
physicalDeleteImplemented: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**Approval ID:** `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`

---

## 1. Purpose

Prepare a safe single-slice **UPDATE** path for Gosaki Schedule **unpublish** (`published=true` → `published=false`) after:

- **G-22f** implemented unpublish dry-run UI (`operation=unpublish`, `actualWrite=false`, `saveAllowed=false`, `physicalDelete=false`)
- **G-22f1** verified local UI / module behavior (HTTP 200 + module smoke PASS)
- **G-22d** duplicate INSERT chain closed (`schedule-2026-03-014`, `published=false`)
- **G-22e** new event INSERT chain closed (`schedule-2026-09-001`, `published=false`)

This phase defines approval ID, env/UI gates, payload policy, optimistic lock handling, SQL templates, and implementation phase split. It does **not** add code or run any write.

---

## 2. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` (clean at planning start) |
| `HEAD` | `e2b9f7c` |
| `origin/main` | `e2b9f7c` |

---

## 3. G-22f / G-22f1 baseline

### 3.1 Dry-run preview (verified in G-22f1)

| Field | Value |
| --- | --- |
| `operation` | `unpublish` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldUpdate` | `true` (when `published=true`) |
| `wouldDelete` | `false` (`wouldDelete: false`) |
| `saveAllowed` | `false` |
| `physicalDelete` | `false` |
| `before.published` | `true` |
| `after.published` | `false` |
| `payload` | `{ published: false }` |
| dry-run `approvalId` | `G-22f-gosaki-schedule-unpublish-dry-run` |

### 3.2 Closed test rows (non-target)

| `legacy_id` | `id` | `published` | Chain |
| --- | --- | --- | --- |
| `schedule-2026-03-014` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | `false` | G-22d duplicate INSERT closed |
| `schedule-2026-09-001` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | `false` | G-22e new event INSERT closed |

Both rows are **not unpublish targets** (`published=false`). Operator `selectableRows` excludes POC audit rows; exclusion also enforced by `validateG22fUnpublishDryRunTarget()`.

---

## 4. Why unpublish UPDATE before physical DELETE

| Reason | Detail |
| --- | --- |
| Safety | `published=false` removes public visibility without row loss |
| Permissions | `authenticated DELETE` grant not confirmed; UPDATE reuses existing G-9k / `updateScheduleWrite` path |
| Closed test rows | Already `published=false` — safe from accidental unpublish |
| Pattern | Same single-slice approach as G-9k UPDATE / G-22d INSERT / G-22e INSERT |
| Rollback | UPDATE rollback restores `published=true` without re-INSERT |

Physical DELETE deferred to a **separate future phase** after unpublish slice is proven.

---

## 5. Existing implementation inventory (read-only)

| Area | File / finding |
| --- | --- |
| Unpublish dry-run | `gosaki-schedule-unpublish-dry-run.ts` — `executeG22fScheduleUnpublishDryRun`, `validateG22fUnpublishDryRunTarget`, `operation="unpublish"` |
| Dry-run adapter | `schedule-dry-run-adapter.ts` — `buildScheduleUnpublishDryRunResult()`, payload `{ published: false }` |
| Operator UI | `gosaki-staging-schedule-operator-ui.ts` — `editDraftMode === "unpublish"`, Save alert-only, `executeG22fScheduleUnpublishDryRun` in preview |
| Existing UPDATE Save | `gosaki-schedule-existing-event-save-button-save.ts` — G-9k update path, optimistic lock, `updateScheduleWrite` |
| UPDATE trigger | `schedule-general-update-trigger.ts` — `buildScheduleLockedWriteRequest`, `executeScheduleGeneralUpdateWrite` |
| UPDATE adapter | `schedule-write-adapter.ts` — `updateScheduleWrite()` (`.update().eq("id")`) |
| Optimistic lock | `schedule-optimistic-lock-config.ts` + `schedules_set_updated_at` trigger (staging, G-6-f8) |
| Duplicate INSERT Save | `gosaki-schedule-duplicate-insert-save.ts` — **INSERT only**; do not reuse for unpublish |
| New event INSERT Save | `gosaki-schedule-new-event-insert-save.ts` — **INSERT only**; do not reuse for unpublish |
| Approval registry | `schedule-write-types.ts` — G-22d / G-22e IDs registered; **G-22f unpublish UPDATE ID not yet registered** |
| Unpublish UPDATE save | **does not exist** — G-22f3 scope |

**G-22f3 should reuse UPDATE infrastructure** (`executeScheduleGeneralUpdateWrite` / `updateScheduleWrite`), not INSERT adapter.

---

## 6. Single-slice UPDATE policy

### 6.1 Target selection

**G-22f2 does not choose a target event.** The operator selects a `published=true` row from the operator UI. G-22f4 final preflight will lock:

- `:target_id` (UUID)
- `:target_legacy_id`
- `:target_updated_at_before` (optimistic lock baseline)
- all protected field before-values for afterVerification

### 6.2 Allowed change

| Field | Before | After |
| --- | --- | --- |
| `published` | `true` | `false` |
| `updated_at` | `:target_updated_at_before` | new value (DB trigger / UPDATE path) — **record only** |

### 6.3 Must not change

`date`, `year`, `month`, `title`, `venue`, `open_time`, `start_time`, `price`, `description`, `source_route`, `source_file`, `show_on_home`, `home_order`, `sort_order`, `legacy_id`, `site_slug`, `created_at`, `image_url`, `home_image_url`

`schedule_months`: **read-only / derived** — not touched.

---

## 7. Approval ID

```txt
G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
```

Register in **G-22f3** in `schedule-write-types.ts` → `SCHEDULE_WRITE_APPROVAL_IDS`.

Dry-run approval remains separate:

```txt
G-22f-gosaki-schedule-unpublish-dry-run
```

---

## 8. Env gate (execution phase only — not armed in G-22f2)

All conditions required for unpublish Save:

| Gate | Required value |
| --- | --- |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice` |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED` | `true` |

**Explicitly false (recommended):**

```bash
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false
# All Discography non-dry-run arms false
# All other schedule non-dry-run arms false (G-9k, G-6-g*, G-13c*, etc.)
```

**Also required at runtime:**

- `ENABLE_ADMIN_STAGING_SHELL=true`
- `ENABLE_ADMIN_STAGING_AUTH=true`
- `ENABLE_ADMIN_STAGING_DATA_READ=true`
- `PUBLIC_ADMIN_AUTH_PROVIDER=supabase`
- `PUBLIC_ADMIN_DATA_PROVIDER=supabase`
- Staging host allowlist: `kmjqppxjdnwwrtaeqjta`
- Signed-in admin session
- **`service_role` never**

### 8.1 Dev arm command (G-22f4 / G-22f5 only — documented, not run in G-22f2)

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

---

## 9. UI gate

Unpublish Save enabled only when **all** are true:

| # | Condition |
| --- | --- |
| 1 | `editDraftMode === "unpublish"` |
| 2 | Latest dry-run `operation === "unpublish"` |
| 3 | Latest dry-run has no blocking errors (`ok === true`, validation ok) |
| 4 | Target `id` exists |
| 5 | Target `legacy_id` exists |
| 6 | Target `site_slug === "gosaki-piano"` |
| 7 | `before.published === true` |
| 8 | `after.published === false` |
| 9 | `wouldUpdate === true` |
| 10 | `wouldDelete === false` |
| 11 | `physicalDelete === false` |
| 12 | Not in `duplicate` or `new` draft mode |
| 13 | Env gate fully armed (`getG22fUnpublishUpdateConfig().saveEnabled === true`) |
| 14 | `PUBLIC_ADMIN_WRITE_DRY_RUN === false` |
| 15 | `PUBLIC_ADMIN_WRITE_APPROVAL_ID` matches G-22f unpublish UPDATE slice |

**Default (routine dev):** Save label **非公開化を保存（現在は無効）** — **disabled**.

**Armed execution (G-22f5):** label **非公開化を保存** — operator Save once.

`runEditSave()` unpublish branch: call G-22f save adapter when armed; keep alert when not armed.

**Audience:** staging shell only (`/__admin-staging-shell/musician-basic/admin/schedule/`). Not production `/admin`.

---

## 10. Payload policy

### 10.1 Save request shape (G-22f3)

```txt
operation: unpublish-update
approvalId: G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
id: :target_id
legacy_id: :target_legacy_id
site_slug: gosaki-piano
before.published: true
after.published: false
expectedBeforeUpdatedAt: :target_updated_at_before
patch: { published: false }
changedFields: ["published"]
```

### 10.2 Supabase UPDATE payload

```json
{ "published": false }
```

`.eq("id", targetId)` + optimistic lock filter on `updated_at` when enabled (same as G-9k).

### 10.3 Payload assertion (`assertG22fUnpublishUpdatePayloadOnly` — G-22f3)

| Assertion | Required |
| --- | --- |
| `operation` | `unpublish-update` |
| `approvalId` | `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice` |
| `id` | non-empty UUID |
| `legacy_id` | non-empty |
| `site_slug` | `gosaki-piano` |
| `before.published` | `true` |
| `after.published` | `false` |
| `patch` keys | `published` only (or `published` + lock metadata in request builder — not in DB patch) |
| `wouldDelete` | `false` (`wouldDelete: false`) |
| `physicalDelete` | `false` |
| DELETE in save path | **absent** |
| `schedule-2026-03-014` | **must not touch** |
| `schedule-2026-09-001` | **must not touch** |
| Target `published=false` at save time | **blocked** (stale / wrong target) |
| Other field changes | **blocked** — `changedFields` must be `["published"]` only |
| `schedule_months` | not touched |
| Rows affected | exactly **1** |

---

## 11. Optimistic lock / `updated_at` policy

| Item | Policy |
| --- | --- |
| Trigger | `schedules_set_updated_at` active on staging (`public.schedules`) — G-6-f8 |
| Lock baseline | `beforeSnapshot.updated_at` from dry-run / row selection → `expectedBeforeUpdatedAt` |
| Write path | Reuse `buildScheduleLockedWriteRequest()` + `executeScheduleGeneralUpdateWrite()` (G-9k pattern) |
| Stale detection | Pre-save: dry-run stale check; Save: adapter rejects if `updated_at` mismatch |
| After save | `updated_at` **will change** — record `before` / `after` in G-22f6 result |
| Changed fields | Only `published` is intentional; `updated_at` change is **expected side effect** |
| afterVerification | Compare protected columns unchanged; `updated_at` may differ from `:target_updated_at_before` |

Do **not** include `updated_at` in UPDATE patch payload — DB trigger sets it on row update.

---

## 12. DB permission assumptions

| Item | State (verify in beforeVerification) |
| --- | --- |
| `authenticated UPDATE` on `public.schedules` | **expected yes** (G-9k path proven) |
| `anon UPDATE` | **no** |
| `authenticated DELETE` | **no** or not required |
| DELETE grant work | **not needed** for G-22f |
| `authenticated INSERT` | exists (G-22d) but **irrelevant** to unpublish UPDATE |
| RLS on `public.schedules` | **enabled** |
| Policy `schedules_admin_all` | `authenticated`, `ALL`, `is_admin()` — final defense |
| `service_role` | **never** |

**No GRANT / REVOKE in G-22f2.** beforeVerification confirms grants only.

---

## 13. SQL templates

All SQL below is **template only**. **Cursor does not connect to DB.** **Do not execute in G-22f2.**

Replace placeholders in G-22f4:

- `:target_id`
- `:target_legacy_id`
- `:target_updated_at_before`
- `:target_updated_at_after` (after G-22f5 Save)

### 13.1 beforeVerification — SELECT-only

```sql
-- G-22f4 beforeVerification template — SELECT ONLY
-- Project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta ONLY
-- Do not run on Sariswing production (vsbvndwuajjhnzpohghh).
-- Cursor does NOT execute.

-- 1) Grants: authenticated UPDATE yes, anon UPDATE no, DELETE not required.
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

-- 4) Candidate list: published=true rows (operator may choose; G-22f4 locks one).
select id,
  legacy_id,
  date,
  title,
  published,
  updated_at,
  source_route,
  source_file
from public.schedules
where site_slug = 'gosaki-piano'
  and published = true
order by date desc, legacy_id
limit 10;

-- 5) G-22f4 fixed target row (replace placeholders after operator selection).
select id,
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

-- expect: published = true, updated_at = :target_updated_at_before

-- 6) Target uniqueness.
select count(*) as same_target_count
from public.schedules
where id = ':target_id'
  and legacy_id = ':target_legacy_id'
  and site_slug = 'gosaki-piano';

-- expect: 1

-- 7) Target is not already unpublished.
select count(*) as target_already_unpublished_count
from public.schedules
where id = ':target_id'
  and site_slug = 'gosaki-piano'
  and published = false;

-- expect: 0

-- 8) Protected rows — must exist and remain published=false (non-touch).
select id, legacy_id, published, updated_at, title
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id in ('schedule-2026-03-014', 'schedule-2026-09-001')
order by legacy_id;

-- expect:
--   schedule-2026-03-014  id=434e4051-86c3-473e-9ad0-39d2e5042fb8  published=false
--   schedule-2026-09-001  id=18b48259-9a9a-4b00-b136-6c0c4ff3b2f3  published=false
```

### 13.2 afterVerification — SELECT-only (G-22f5 Save success)

```sql
-- G-22f6 afterVerification template — SELECT ONLY
-- Run after operator single unpublish Save in G-22f5.
-- Cursor does NOT execute.

-- 1) Target row by id.
select id,
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

-- expect: published = false, updated_at changed from :target_updated_at_before

-- 2) legacy_id uniqueness.
select count(*) as target_legacy_id_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = ':target_legacy_id';

-- expect: 1

-- 3) Protected fields unchanged (compare to G-22f4 beforeSnapshot).
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
  (legacy_id = :target_legacy_id) as legacy_id_unchanged,
  (site_slug = 'gosaki-piano') as site_slug_unchanged
from public.schedules
where id = ':target_id';

-- expect: all true

-- 4) Physical row still exists (not DELETE).
select count(*) as target_row_exists
from public.schedules
where id = ':target_id';

-- expect: 1

-- 5) Month count unchanged.
select count(*) as target_month_count
from public.schedules
where site_slug = 'gosaki-piano'
  and month = :before_month;

-- expect: same as G-22f4 beforeVerification

-- 6) Protected test rows unchanged.
select id, legacy_id, published, updated_at, title, date, venue
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id in ('schedule-2026-03-014', 'schedule-2026-09-001')
order by legacy_id;

-- expect: identical to G-22f4 beforeSnapshot for these rows
```

### 13.3 Rollback SQL template — UPDATE (execution forbidden in G-22f2)

```sql
-- G-22f6 rollback template — staging kmjqppxjdnwwrtaeqjta ONLY
-- Restores published=true on unpublish target.
-- DO NOT EXECUTE IN G-22f2. Operator / assistant confirmation required.
-- Use only if unpublish was wrong and cleanup needed before public reflection.

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

**Rollback policy:**

- **Needed only if:** wrong row unpublished, accidental re-execution, operator requests revert
- **Not needed if:** afterVerification PASS and operator accepts staging test unpublish
- **Staging only** — never production
- **G-22f2:** `rollbackSqlExecuted: false` — template recorded only

---

## 14. Public reflection policy

| Step | G-22f5 unpublish | Later phase |
| --- | --- | --- |
| UPDATE `published=false` | **yes** (operator Save once) | — |
| Visible on staging static site | row hidden when build filters `published=true` | regen after operator approval |
| Local package regen | **no** in G-22f5 | separate approved phase |
| Manual FTP upload | **no** | operator checklist |
| `schedule_months` | derived at build | unchanged |

Unpublish without package regen is **safe** — row remains in DB but not public until regen reflects filter.

---

## 15. Non-dry-run implementation plan (G-22f3 — not executed in G-22f2)

### 15.1 New modules

| File | Role |
| --- | --- |
| `gosaki-schedule-unpublish-update-config.ts` | Env arm, approval ID, host gate, single-arm vs G-22d/G-22e |
| `gosaki-schedule-unpublish-update-guards.ts` | `assertG22fUnpublishUpdatePayloadOnly`, writable row, changedFields only |
| `gosaki-schedule-unpublish-update-save.ts` | `executeG22fScheduleUnpublishUpdateSave()` — orchestration |
| `schedule-write-types.ts` | Add `G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID` |
| `gosaki-staging-schedule-operator-ui.ts` | Unpublish Save gate + `runEditSave()` branch |

**Reuse (do not duplicate):**

- `executeScheduleGeneralUpdateWrite()` / `updateScheduleWrite()`
- `buildScheduleLockedWriteRequest()`
- `assertG9kRowsAffectedExactlyOne()` pattern

**Do not** add unpublish to INSERT save modules.

### 15.2 G-22f vs G-22f3 separation

| Layer | G-22f (dry-run) | G-22f3 (save) |
| --- | --- | --- |
| Preview | `executeG22fScheduleUnpublishDryRun` | unchanged |
| Save | alert only | `executeG22fScheduleUnpublishUpdateSave` |
| Adapter | `buildScheduleUnpublishDryRunResult` | `updateScheduleWrite` |
| `operation` | `unpublish` | `unpublish-update` |
| Approval | `G-22f-gosaki-schedule-unpublish-dry-run` | `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice` |

---

## 16. Phase split

| Phase | Scope |
| --- | --- |
| **G-22f3** | Implementation only — config, guards, save, UI gate, verifier; **no Save / DB write** |
| **G-22f4** | Final preflight — operator selects target; lock `id` / `legacy_id` / `updated_at`; beforeVerification SQL |
| **G-22f5** | Operator single unpublish Save once (manual) |
| **G-22f6** | afterVerification + result record |
| **G-22f7** | Unpublish UPDATE chain closure |
| **Future** | Physical DELETE — separate phase after unpublish proven |
| **Future** | Public reflection / package regen — separate approved phase |

---

## 17. Not executed in G-22f2

| Item | Status |
| --- | --- |
| Implementation (G-22f3 code) | **no** |
| Save click | **no** |
| DB write / Supabase mutation | **no** |
| SQL INSERT / UPDATE / DELETE / UPSERT | **no** |
| GRANT / REVOKE | **no** |
| Rollback SQL execution | **no** |
| package regen | **no** |
| FTP / upload / deploy | **no** |
| `workflow_dispatch` | **no** |
| secrets / env file changes | **no** |
| Sariswing production | **not touched** |
| commit / push | **no** (per operator instruction) |

---

## 18. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22f2-gosaki-schedule-unpublish-update-planning.mjs
```

---

## 19. Fix required?

**No implementation fix required from G-22f2 planning.** Dry-run UI and G-22f1 QA are sufficient to proceed to G-22f3 implementation-only phase.
