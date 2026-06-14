# Schedule time fields non-dry-run slice preflight (G-6-g2)

Last updated: 2026-06-14  
Phase: `G-6-g2-schedule-time-fields-non-dry-run-slice-preflight`  
Type: **preflight only** — no DB write, no Supabase SQL execution, no Run click, no Save execution

## Purpose

Prepare the second **product-path** Schedule non-dry-run slice: `open_time` + `start_time` only on the same proven staging row, using `executeScheduleGeneralUpdateWrite` with optimistic lock and a **new** `G-6-g2` approval ID (not G-6-e5 / G-6-f6 / G-6-g1).

**This phase performed:** docs, target/payload/approval/env/rollback/verification design, implementation checklist.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL, non-dry-run execution, Save/Run click, PoC re-arm, G-6-g1 Save re-execution, `/admin` changes, `service_role`.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-g1 execution | title slice succeeded (`cce3f97`); optimistic lock verified |
| G-6-g2 planning | time fields selected as next slice (`b3cd295`) |
| G-6-f6 | venue + description on target row (must remain unchanged) |
| G-6-f8 | `schedules_set_updated_at` trigger active on staging |
| G-6-f10 | `buildScheduleLockedWriteRequest`, optimistic lock product path |

```txt
scheduleTitleNonDryRunSliceExecutionSucceeded: true
scheduleGeneralEditNextSlicePlanningComplete: true
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: true (G-6-g1 path; G-6-g2 not yet wired)
```

---

## 1. Target row — final confirmation

### 1.1 Approved target

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
```

**Decision: APPROVED** for G-6-g2 first execution.

| Criterion | Assessment |
| --- | --- |
| Reuse G-6-g1 row | **Yes** — continuous audit trail (G-6-e5 → G-6-f6 → G-6-g1 → G-6-g2) |
| `open_time` / `start_time` are `null` | **Low risk** — null→text; no routing or month impact |
| G-6-g1 title already set | **Required precondition** — title must stay `[CMS Kit staging] G-6-g1 title PoC` |
| venue / description | **Must remain unchanged** — G-6-f6 PoC markers preserved |
| `show_on_home: false` | **Low visibility** — time fields not featured on home |
| `published: true` | Staging-only site; time text change does not affect Sariswing production |
| time-fields-only payload | No impact on `date`, routing, or `schedule_months` |
| `price: null` | Unchanged; reserved for G-6-g3 |

### 1.2 Expected beforeSnapshot (post G-6-g1 execution)

Operator confirms via SELECT in final-preflight / execution-prep (not in this doc phase).

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
date: 2026-07-19
title: [CMS Kit staging] G-6-g1 title PoC
venue: [CMS Kit staging] G-6-f6 venue PoC
open_time: null
start_time: null
price: null
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
published: true
show_on_home: false
sort_order: 10
created_at: 2026-06-05 17:39:44.140168+00 (expect unchanged)
updated_at: 2026-06-14 15:03:08.762993+00 (G-6-g1 lock baseline — record exact value)
```

**Optimistic lock baseline:** `2026-06-14T15:03:08.762993+00:00` (from G-6-g1 execution result). Operator must record **exact** `updated_at` from beforeSnapshot SQL at execution time — if staging was touched since G-6-g1, use the live value.

### 1.3 Abort if beforeSnapshot diverges

```txt
- Wrong Supabase project (not static-to-astro-cms-staging)
- Row count ≠ 1
- id / legacy_id mismatch
- title ≠ [CMS Kit staging] G-6-g1 title PoC (unless documented intentional change + rollback approved)
- open_time ≠ null OR start_time ≠ null (unless documented intentional change)
- venue or description differ from G-6-f6 expected values
- published ≠ true OR show_on_home ≠ false OR sort_order ≠ 10
```

---

## 2. Payload (open_time + start_time only)

### 2.1 Payload candidates compared

| Option | open_time | start_time | Pros | Cons |
| --- | --- | --- | --- | --- |
| **A (recommended)** | `[CMS Kit staging] G-6-g2 open PoC` | `[CMS Kit staging] G-6-g2 start PoC` | Matches G-6-g1/G-6-f6 marker pattern; unambiguous in SQL `=` checks; staging-only obvious | Not realistic clock display |
| B | `[CMS Kit staging] open G-6-g2` | `[CMS Kit staging] start G-6-g2` | Clear markers | Slightly inconsistent naming vs G-6-g1 `G-6-g1 title PoC` pattern |
| C | `Open [G-6-g2]` | `Start [G-6-g2]` | Shorter | Weaker uniqueness in verification; less consistent with prior slices |
| D | `18:00 [G-6-g2]` | `19:00 [G-6-g2]` | Time-like for future CMS UX | Format/locale ambiguity; harder to distinguish from real production data later |

### 2.2 Proposed UPDATE payload (Option A)

```json
{
  "open_time": "[CMS Kit staging] G-6-g2 open PoC",
  "start_time": "[CMS Kit staging] G-6-g2 start PoC"
}
```

| Rule | Value |
| --- | --- |
| Allowed keys | `open_time`, `start_time` only |
| Both keys required | Yes — mirror `assertG6F6SafeFieldsPayloadOnly` pattern |
| Forbidden in payload | all other columns (see §2.3) |
| `updated_at` in payload | **No** — trigger sets after UPDATE |

**Rationale for Option A:** Same `[CMS Kit staging] G-6-gN … PoC` convention as G-6-g1 title and G-6-f6 venue markers. afterVerification SQL uses exact string equality. Realistic times (`18:00`) can be validated in a later UX-focused phase after write path is proven.

### 2.3 Forbidden payload keys (G-6-g2)

```txt
id, legacy_id, date, year, month, title, venue, price, description,
image_url, home_image_url, source_file, source_route,
show_on_home, home_order, published, sort_order, created_at, updated_at
```

### 2.4 Time-fields-only guard strategy

| Layer | Implementation (G-6-g2 implementation phase) |
| --- | --- |
| **Slice guard (required)** | New `assertG6G2TimeFieldsPayloadOnly(payload)` in `schedule-write-guards.ts` — mirror `assertG6G1TitlePayloadOnly` / `assertG6F6SafeFieldsPayloadOnly` |
| **Base guard** | Existing `assertScheduleUpdatePayloadAllowed` — allows `open_time` / `start_time` keys; does not enforce time-fields-only |
| **Trigger** | New `executeG6G2TimeFieldsNonDryRunSave` → `assertG6G2TimeFieldsPayloadOnly` → `executeScheduleGeneralUpdateWrite` |
| **beforeSnapshot** | New `validateG6G2TimeFieldsBeforeSnapshot` — expects G-6-g1 title + G-6-f6 venue/description + null times |
| **PoC triggers** | **Do not** reuse G-6-e5 / G-6-f6 / G-6-g1 triggers |

**Recommendation:** Add `assertG6G2TimeFieldsPayloadOnly` called from G-6-g2 Save handler. Require both `open_time` and `start_time` keys in payload (even if one value unchanged in future multi-edit — for this slice both change null→marker).

---

## 3. Approval ID

### 3.1 G-6-g2 approval ID (new — frozen after first success)

```txt
G-6-g2-schedule-time-fields-non-dry-run-slice
```

Dry-run preview ID (implementation phase):

```txt
G-6-g2-schedule-time-fields-dry-run-preview
```

### 3.2 Frozen IDs (do not reuse)

```txt
G-6-e5-schedule-non-dry-run-poc
G-6-f6-schedule-safe-fields-non-dry-run-poc
G-6-g1-schedule-title-non-dry-run-slice
```

### 3.3 Where to register (implementation phase)

| Location | Change |
| --- | --- |
| `schedule-write-types.ts` | `G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID` constant + union member |
| `SCHEDULE_WRITE_APPROVAL_IDS` | Append G-6-g2 ID |
| `schedule-general-edit-config.ts` | G-6-g2 env gates + approval ID match (extend or slice-aware config) |
| `schedule-g6g2-time-fields-non-dry-run-trigger.ts` | New trigger module |
| UI confirm input | User types exact `G-6-g2-schedule-time-fields-non-dry-run-slice` |
| Result panel / docs | `approvalId` metadata |
| This preflight doc | Reference |

**Current state:** G-6-g2 ID is **not** in `SCHEDULE_WRITE_APPROVAL_IDS` yet — adapter will `guard_failed` until implementation registers it.

---

## 4. Env gates

### 4.1 Default dev (unchanged)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
ENABLE_ADMIN_STAGING_WRITE=false
```

### 4.2 G-6-g2 arm stack (execution only — inline env, not committed)

```bash
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_DATA_READ=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g2-schedule-time-fields-non-dry-run-slice
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
# Optional first execution — lock to proven row:
PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID=aa440e29-5be8-402e-9190-0d81c48434c0
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>"
```

### 4.3 Env variable reference

| Env | Role |
| --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` (staging shell route) |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` + `PUBLIC_ADMIN_DATA_PROVIDER=supabase` for live read / stale check |
| `ENABLE_ADMIN_STAGING_WRITE` | Master write enable |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | Must match G-6-g2 ID |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` for non-dry-run Save |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` (default) |
| `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED` | **Slice-specific arm** — default off |
| `PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID` | Optional single-row lock |

### 4.4 PoC / G-6-g1 env isolation

```txt
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN — G-6-e5 only; do not set for G-6-g2
PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED — G-6-f6 only; do not set for G-6-g2
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED — G-6-g1 only; do not set for G-6-g2
```

Only one slice arm env should be `true` at a time.

### 4.5 UI when not armed

```txt
G-6-g2 Save button: hidden or disabled
G-6-g2 time inputs: visible for dry-run preview when section visible
Manual confirm input: disabled until G-6-g2 armed
G-6-g1 title Save: must remain disabled when G-6-g2 armed (no dual-arm)
```

---

## 5. Optimistic lock (mandatory)

| Step | Behavior |
| --- | --- |
| Row select | Store `beforeSnapshot` + `baselineUpdatedAt = beforeSnapshot.updated_at` |
| Dry-run preview | SELECT-only stale check (G-6-f10); block Save if stale |
| Save | `executeG6G2TimeFieldsNonDryRunSave` → `executeScheduleGeneralUpdateWrite` |
| Lock token | `expectedBeforeUpdatedAt: beforeSnapshot.updated_at` |
| Payload | **No** `updated_at` |
| Success | `afterSnapshot.updated_at` > baseline; refresh session baseline |
| `optimistic_lock_failed` | Show JA message; **Reload**; **no auto-retry** |
| `optimistic_lock_select_failed` | Show error; Reload |
| Silent overwrite | **Forbidden** |

Messages: `schedule-write-utils.ts` (`SCHEDULE_OPTIMISTIC_LOCK_CONFLICT_MESSAGE_JA`, etc.).

**G-6-g2 baseline:** Expect `updated_at` from G-6-g1 Save (`2026-06-14T15:03:08.762993+00`). After G-6-g2 Save, `updated_at` must advance again via `schedules_set_updated_at` trigger.

---

## 6. Dry-run first UX

**Policy: CONFIRMED** — non-dry-run Save requires successful dry-run preview for **current** open_time / start_time form state.

### 6.1 Preview requirements

```txt
changedFields: ["open_time", "start_time"] only
wouldWrite: true
actualWrite: false
staleDetected: false
readSource: supabase (for meaningful stale check)
```

### 6.2 Save enable conditions

```txt
[ ] G-6-g2 slice armed (PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true)
[ ] G-6-g1 slice NOT armed
[ ] ENABLE_ADMIN_STAGING_WRITE=true
[ ] PUBLIC_ADMIN_WRITE_DRY_RUN=false
[ ] PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g2-schedule-time-fields-non-dry-run-slice
[ ] authenticated staging admin session
[ ] Supabase host = kmjqppxjdnwwrtaeqjta.supabase.co
[ ] dry-run preview valid for current open_time + start_time values
[ ] !staleDetected
[ ] manual confirm === G-6-g2-schedule-time-fields-non-dry-run-slice
[ ] optional: target id matches slice target env
[ ] readSource === supabase
[ ] !executionInFlight
```

---

## 7. Rollback SQL (staging only — NOT executed in preflight)

```sql
-- G-6-g2 rollback — staging only; execute only if explicitly approved
update public.schedules
set
  open_time = null,
  start_time = null
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

| Note | Detail |
| --- | --- |
| Scope | `open_time`, `start_time` only; title / venue / description unchanged |
| `schedule_months` | Not written; not rollback target |
| `updated_at` | Rollback UPDATE will advance `updated_at` (trigger) — expected |
| Approval | Separate explicit operator approval to run rollback SQL |

---

## 8. beforeSnapshot SQL (execution-prep — NOT run in preflight)

```sql
-- G-6-g2 beforeSnapshot — SELECT only; staging project only
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
-- G-6-g2 afterVerification — SELECT only
select
  id,
  legacy_id,
  open_time,
  start_time,
  title,
  venue,
  description,
  date,
  published,
  show_on_home,
  sort_order,
  created_at,
  updated_at,
  open_time = '[CMS Kit staging] G-6-g2 open PoC' as open_time_match,
  start_time = '[CMS Kit staging] G-6-g2 start PoC' as start_time_match,
  title = '[CMS Kit staging] G-6-g1 title PoC' as title_unchanged,
  venue = '[CMS Kit staging] G-6-f6 venue PoC' as venue_unchanged,
  description = '出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]' as description_unchanged,
  date = '2026-07-19' as date_unchanged,
  published is true as published_unchanged,
  show_on_home is false as show_on_home_unchanged,
  sort_order = 10 as sort_order_unchanged
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Success criteria

```txt
target row exists: 1 row
open_time_match: true
start_time_match: true
title_unchanged: true
venue_unchanged: true
description_unchanged: true
date unchanged (2026-07-19)
published unchanged (true)
show_on_home unchanged (false)
sort_order unchanged (10)
created_at unchanged
updated_at advanced (strictly later than beforeSnapshot baseline)
schedule_months: not written
result panel changedFields: ["open_time", "start_time"]
result panel actualWrite: true
rowsAffected: 1
serviceRoleUsed: false
optimistic lock: expectedBeforeUpdatedAt matched at save time
no optimistic_lock_failed
rollbackNeeded: false (unless team chooses restore)
```

---

## 10. UI implementation design (next phase)

### 10.1 Extend existing general edit section

| Component | G-6-g2 change |
| --- | --- |
| `AdminStagingScheduleGeneralEditSection.astro` | Add time field group (`open_time`, `start_time` inputs); G-6-g2 banner when armed |
| `staging-schedule-general-edit-ui.ts` | G-6-g2 dry-run preview + Save handler; title group read-only when G-6-g2 armed |
| `schedule-time-fields-dry-run.ts` | New — mirror `schedule-title-dry-run.ts` |
| `schedule-general-edit-config.ts` | G-6-g2 constants + `getScheduleG6G2TimeFieldsConfig()` or slice-aware extension |

### 10.2 Single-arm rule

```txt
When PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true:
  - G-6-g2 Save + confirm enabled (if all gates pass)
  - G-6-g1 title Save disabled
  - Title field shows current DB value (read-only or disabled)
```

### 10.3 Reuse from G-6-g1

```txt
Row picker + Reload rows
runDryRunStaleCheck + stale banner
executeScheduleGeneralUpdateWrite (product path)
mergeStagingShellEnv for client data read gates (cf24c09 pattern)
Result panel structure (before/after snapshots, safety flags)
```

---

## 11. Implementation checklist (next phase)

```txt
[ ] schedule-write-types.ts — G6G2 approval ID + union
[ ] schedule-write-guards.ts — assertG6G2TimeFieldsPayloadOnly
[ ] schedule-g6g2-time-fields-non-dry-run-trigger.ts — validateG6G2TimeFieldsBeforeSnapshot + executeG6G2TimeFieldsNonDryRunSave
[ ] schedule-time-fields-dry-run.ts — buildScheduleTimeFieldsDryRunResult
[ ] schedule-general-edit-config.ts — G-6-g2 env gates (SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED)
[ ] AdminStagingScheduleGeneralEditSection.astro — time field group + G-6-g2 gated Save
[ ] staging-schedule-general-edit-ui.ts — G-6-g2 session, dry-run, save handler
[ ] schedule-general-edit-g6g2.json or extend g6g1 config — phase metadata
[ ] No changes to G-6-e5 / G-6-f6 / G-6-g1 PoC trigger modules (G-6-g1 trigger kept; not re-armed)
[ ] npm run build
```

**No DB write in implementation phase** — Save gated off by default until final-preflight + execution approval.

---

## 12. Recommended phase split

| Order | Phase | Scope | DB write |
| --- | --- | --- | --- |
| **1** | `G-6-g2-schedule-time-fields-non-dry-run-slice-preflight` | **DONE** — this doc | None |
| **2** | `G-6-g2-schedule-time-fields-non-dry-run-slice-implementation` | UI, guards, config, approval ID registration | None |
| **3** | `G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight` | beforeSnapshot SQL, dev command, UI checklist | None |
| **4** | `G-6-g2-schedule-time-fields-non-dry-run-slice-execution` | User manual Save **once**; afterVerification | **Yes** (one UPDATE) |

---

## 13. Gate decision

```txt
scheduleTimeFieldsNonDryRunSlicePreflightComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceImplementation: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: false
scheduleGeneralEditNextSlicePlanningComplete: true
scheduleTitleNonDryRunSliceExecutionSucceeded: true
nonDryRunSaveUiExposed: true
rollbackNeeded: false
dbWriteInLatestPhase: false
```

---

## 14. G-6-g2 preflight safety statement

```txt
DB write: none
Supabase SQL executed: none
Run button click: none
Save button click: none
G-6-g1 Save re-execution: none
G-6-e5 / G-6-f6 PoC re-click: none
/admin: not modified
schedule_months: read-only / derived (not touched)
service_role: not used
production: not touched
```

## Related docs

- [schedule-general-edit-next-slice-planning.md](./schedule-general-edit-next-slice-planning.md)
- [schedule-title-non-dry-run-slice-execution-result.md](./schedule-title-non-dry-run-slice-execution-result.md)
- [schedule-title-non-dry-run-slice-preflight.md](./schedule-title-non-dry-run-slice-preflight.md)
- [schedule-general-edit-ui-planning.md](./schedule-general-edit-ui-planning.md)
- [schedule-optimistic-lock-enablement-implementation.md](./schedule-optimistic-lock-enablement-implementation.md)
