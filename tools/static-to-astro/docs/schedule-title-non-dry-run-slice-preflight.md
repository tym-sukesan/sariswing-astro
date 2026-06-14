# Schedule title non-dry-run slice preflight (G-6-g1)

Last updated: 2026-06-14  
Phase: `G-6-g1-schedule-title-non-dry-run-slice-preflight`  
Type: **preflight only** — no DB write, no Supabase SQL execution, no Run click, no Save execution

## Purpose

Prepare the first **product-path** Schedule non-dry-run slice: `title` only on one existing staging row, using `executeScheduleGeneralUpdateWrite` with optimistic lock. This is the first write after G-6-g general edit UI planning that uses a **new** `G-6-g*` approval ID (not G-6-e5 / G-6-f6).

**This phase performed:** docs, target/payload/approval/env/rollback/verification design, implementation checklist.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL, non-dry-run execution, Save/Run click, PoC re-arm, `/admin` changes, `service_role`.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-f6 | `venue + description` non-dry-run success on target row |
| G-6-f8 | `schedules_set_updated_at` trigger active on staging |
| G-6-f10 | `buildScheduleLockedWriteRequest`, optimistic lock product path |
| G-6-g | General edit UI planning; G-6-g1 title as first slice |

```txt
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: false
executeScheduleGeneralUpdateWrite: ready (approval ID not yet registered)
```

---

## 1. Target row — final confirmation

### 1.1 Approved target

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
```

**Decision: APPROVED** for G-6-g1 first execution.

| Criterion | Assessment |
| --- | --- |
| Reuse G-6-e5 / G-6-f6 row | **Yes** — proven authenticated UPDATE path; rollback docs exist |
| `title` is `<>` | Legacy static-import placeholder; safe to replace on staging |
| `show_on_home: false` | Low visibility risk — not featured on home |
| `published: true` | Staging-only site; title change does not affect Sariswing production |
| venue / description | **Must remain unchanged** — G-6-f6 PoC results preserved |
| title-only payload | No impact on `date`, routing, or `schedule_months` |

### 1.2 Expected beforeSnapshot (post G-6-f6, post G-6-f8 trigger check)

Operator confirms via SELECT in execution-prep / final-preflight (not in this doc phase).

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
title: <>
venue: [CMS Kit staging] G-6-f6 venue PoC
open_time: null
start_time: null
price: null
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
published: true
show_on_home: false
sort_order: 10
created_at: 2026-06-05 17:39:44.140168+00 (expect unchanged)
updated_at: 2026-06-14 06:49:42.240919+00 (or later if staging touched — record exact value)
```

### 1.3 Meaning of `title: <>`

```txt
Legacy HTML import placeholder (angle brackets as literal title text).
Not a CMS “empty” sentinel — display and routing use date + legacy_id.
Staging replacement with a clear PoC marker is low risk.
```

### 1.4 Abort if beforeSnapshot diverges

```txt
- Wrong Supabase project (not static-to-astro-cms-staging)
- Row count ≠ 1
- id / legacy_id mismatch
- title ≠ <> (unless documented intentional staging change)
- venue or description differ from G-6-f6 expected values (unless rollback approved)
```

---

## 2. Payload (title only)

### 2.1 Proposed UPDATE payload

```json
{
  "title": "[CMS Kit staging] G-6-g1 title PoC"
}
```

| Rule | Value |
| --- | --- |
| Allowed keys | `title` only |
| Forbidden in payload | all other columns (see §2.2) |
| `updated_at` in payload | **No** — trigger sets after UPDATE |

### 2.2 Forbidden payload keys (G-6-g1)

```txt
id, legacy_id, date, year, month, venue, open_time, start_time, price,
description, image_url, home_image_url, source_file, source_route,
show_on_home, home_order, published, sort_order, created_at, updated_at
```

### 2.3 Title-only guard strategy

| Layer | Implementation (G-6-g1 implementation phase) |
| --- | --- |
| **Slice guard (recommended)** | New `assertG6G1TitlePayloadOnly(payload)` in `schedule-write-guards.ts` — mirror `assertG6F6SafeFieldsPayloadOnly` |
| **Base guard** | Existing `assertScheduleUpdatePayloadAllowed` — allows `title` key; does not enforce title-only |
| **Trigger / UI** | General edit UI builds `{ title }` only; dry-run preview validates `changedFields: ["title"]` |
| **PoC triggers** | **Do not** reuse G-6-f6 trigger; use `executeScheduleGeneralUpdateWrite` only |

**Recommendation:** Add `assertG6G1TitlePayloadOnly` called from G-6-g1 Save handler before `executeScheduleGeneralUpdateWrite`. Do not rely on base guard alone.

---

## 3. Approval ID

### 3.1 G-6-g1 approval ID (new — frozen after first success)

```txt
G-6-g1-schedule-title-non-dry-run-slice
```

### 3.2 Frozen IDs (do not reuse)

```txt
G-6-e5-schedule-non-dry-run-poc
G-6-f6-schedule-safe-fields-non-dry-run-poc
```

### 3.3 Where to register (implementation phase)

| Location | Change |
| --- | --- |
| `schedule-write-types.ts` | `G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID` constant + union member |
| `SCHEDULE_WRITE_APPROVAL_IDS` | Append G-6-g1 ID |
| `schedule-general-edit-config.ts` (new) | Env approval ID match |
| UI confirm input | User types exact string |
| Result panel / docs | `approvalId` metadata |
| This preflight doc | Reference |

**Current state:** G-6-g1 ID is **not** in `SCHEDULE_WRITE_APPROVAL_IDS` yet — adapter will `guard_failed` until implementation registers it.

---

## 4. Env gates

### 4.1 Default dev (unchanged)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
ENABLE_ADMIN_STAGING_WRITE=false
```

### 4.2 G-6-g1 arm stack (execution only — inline env, not committed)

```bash
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g1-schedule-title-non-dry-run-slice
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
# Optional first execution — lock to proven row:
PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID=aa440e29-5be8-402e-9190-0d81c48434c0
```

### 4.3 Env variable reference

| Env | Role |
| --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` (staging shell route) |
| `ENABLE_ADMIN_STAGING_WRITE` | Master write enable |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | Must match G-6-g1 ID |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` for non-dry-run Save |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` (default) |
| `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED` | **Slice-specific arm** — default off |
| `PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID` | Optional single-row lock |

### 4.4 PoC env isolation

```txt
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN — G-6-e5 only; do not set for G-6-g1
PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED — G-6-f6 only; do not set for G-6-g1
```

### 4.5 UI when not armed

```txt
Save button: hidden or disabled
Section: visible in implementation with banner "not armed"
Manual confirm input: disabled
```

---

## 5. Optimistic lock (mandatory)

| Step | Behavior |
| --- | --- |
| Row select | Store `beforeSnapshot` + `baselineUpdatedAt = beforeSnapshot.updated_at` |
| Dry-run preview | SELECT-only stale check (G-6-f10); block Save if stale |
| Save | `executeScheduleGeneralUpdateWrite` → `buildScheduleLockedWriteRequest` |
| Lock token | `expectedBeforeUpdatedAt: beforeSnapshot.updated_at` |
| Payload | **No** `updated_at` |
| Success | `afterSnapshot.updated_at` > baseline; refresh session baseline |
| `optimistic_lock_failed` | Show JA message; **Reload**; **no auto-retry** |
| `optimistic_lock_select_failed` | Show error; Reload |
| Silent overwrite | **Forbidden** |

Messages: `schedule-write-utils.ts` (`SCHEDULE_OPTIMISTIC_LOCK_CONFLICT_MESSAGE_JA`, etc.).

---

## 6. Dry-run first UX

**Policy: CONFIRMED** — non-dry-run Save requires successful dry-run preview for **current** form state.

### 6.1 Preview requirements

```txt
changedFields: ["title"] only
wouldWrite: true
actualWrite: false
staleDetected: false
readSource: supabase (for meaningful stale check)
```

### 6.2 Save enable conditions

```txt
[ ] G-6-g1 slice armed (env)
[ ] ENABLE_ADMIN_STAGING_WRITE=true
[ ] PUBLIC_ADMIN_WRITE_DRY_RUN=false
[ ] approval ID env match
[ ] authenticated staging admin session
[ ] Supabase host = kmjqppxjdnwwrtaeqjta.supabase.co
[ ] dry-run preview valid for current title value
[ ] !staleDetected
[ ] manual confirm === G-6-g1-schedule-title-non-dry-run-slice
[ ] optional: target id matches slice target env
[ ] !executionInFlight
```

---

## 7. Rollback SQL (staging only — NOT executed in preflight)

```sql
-- G-6-g1 rollback — staging only; execute only if explicitly approved
update public.schedules
set title = '<>'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

| Note | Detail |
| --- | --- |
| Scope | `title` only; venue/description unchanged |
| `schedule_months` | Not written; not rollback target |
| `updated_at` | Rollback UPDATE will advance `updated_at` (trigger) — expected |
| Approval | Separate explicit operator approval to run rollback SQL |

---

## 8. beforeSnapshot SQL (execution-prep — NOT run in preflight)

```sql
-- G-6-g1 beforeSnapshot — SELECT only; staging project only
select
  id,
  legacy_id,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  published,
  show_on_home,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

---

## 9. After verification (execution phase)

Run after user manual Save once.

```sql
-- G-6-g1 afterVerification — SELECT only
select
  id,
  legacy_id,
  title,
  venue,
  description,
  date,
  published,
  show_on_home,
  sort_order,
  created_at,
  updated_at,
  title = '[CMS Kit staging] G-6-g1 title PoC' as title_match,
  venue = '[CMS Kit staging] G-6-f6 venue PoC' as venue_unchanged,
  description = '出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]' as description_unchanged
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Success criteria

```txt
target row exists: 1 row
title_match: true
venue_unchanged: true
description_unchanged: true
date unchanged
published unchanged (true)
show_on_home unchanged (false)
sort_order unchanged (10)
created_at unchanged
updated_at advanced (strictly later than beforeSnapshot baseline)
schedule_months: not written
result panel changedFields: ["title"]
result panel actualWrite: true
serviceRoleUsed: false
optimistic lock: expectedBeforeUpdatedAt matched at save time
rollbackNeeded: false (unless team chooses restore)
```

---

## 10. Implementation checklist (next phase)

```txt
[ ] schedule-write-types.ts — G6G1 approval ID + union
[ ] schedule-write-guards.ts — assertG6G1TitlePayloadOnly
[ ] schedule-general-edit-config.ts — G-6-g1 env gates
[ ] AdminStagingScheduleGeneralEditSection.astro — title field + preview + gated Save
[ ] staging-schedule-general-edit-ui.ts — session, dry-run, save via executeScheduleGeneralUpdateWrite
[ ] Wire assertG6G1TitlePayloadOnly in save handler
[ ] No changes to G-6-e5 / G-6-f6 PoC modules
[ ] npm run build
```

**No DB write in implementation phase** — Save button gated off or handler not wired until final-preflight + execution approval.

---

## 11. Recommended phase split

| Order | Phase | Scope | DB write |
| --- | --- | --- | --- |
| **1** | `G-6-g1-schedule-title-non-dry-run-slice-preflight` | **DONE** — this doc | None |
| **2** | `G-6-g1-schedule-title-non-dry-run-slice-implementation` | UI, guards, config, approval ID registration | None |
| **3** | `G-6-g1-schedule-title-non-dry-run-slice-final-preflight` | beforeSnapshot SQL, dev command, UI checklist | None |
| **4** | `G-6-g1-schedule-title-non-dry-run-slice-execution` | User manual Save **once**; afterVerification | **Yes** (one UPDATE) |

Alternative: merge final-preflight into execution if operator runs checks in one session — split only if team prefers separate approval for Save.

---

## 12. Gate decision

```txt
scheduleTitleNonDryRunSlicePreflightComplete: true
readyForG6G1ScheduleTitleNonDryRunSliceImplementation: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: false
nonDryRunSaveUiExposed: false
rollbackNeeded: false
```

---

## 13. G-6-g1 preflight safety statement

```txt
DB write: none
Supabase SQL executed: none
Run button click: none
Save button click: none
G-6-e5 / G-6-f6 PoC re-click: none
/admin: not modified
schedule_months: read-only / derived (not touched)
service_role: not used
```

## Related docs

- [schedule-general-edit-ui-planning.md](./schedule-general-edit-ui-planning.md)
- [schedule-optimistic-lock-enablement-implementation.md](./schedule-optimistic-lock-enablement-implementation.md)
- [schedule-safe-fields-non-dry-run-execution-result.md](./schedule-safe-fields-non-dry-run-execution-result.md)
- [schedule-updated-at-staging-migration-execution-result.md](./schedule-updated-at-staging-migration-execution-result.md)
