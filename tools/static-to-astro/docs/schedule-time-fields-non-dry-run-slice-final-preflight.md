# Schedule time fields non-dry-run slice final preflight (G-6-g2)

Last updated: 2026-06-14  
Phase: `G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight`  
Type: **final-preflight only** — no DB write, no Supabase SQL execution, no Save click, no Preview click

## Purpose

Final checks immediately before the first G-6-g2 product-path `open_time` + `start_time` non-dry-run execution. Operator runs beforeSnapshot SQL, arms staging shell with G-6-g2 gates (G-6-g1 arm **off**), verifies general edit UI — but does **not** click Preview or Save in this phase.

**This phase performed:** docs, SQL templates, dev command, UI checklist, Save enable checklist, risk review, AI context.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL execution, non-dry-run Save, Preview click, Run button click, rollback SQL execution, G-6-g1 Save re-execution, G-6-e5 / G-6-f6 PoC re-arm, `service_role`, `/admin` changes.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-g1 execution | title slice succeeded (`cce3f97`); row title updated |
| G-6-g2 preflight | Target, payload, approval ID, env, rollback design (`e5fa9ba`) |
| G-6-g2 implementation | Guards, trigger, UI extension (`e461155`) |
| G-6-f8 | `schedules_set_updated_at` trigger active on staging |
| G-6-f10 | Optimistic lock product path |
| G-6-f6 | venue + description on target row (must remain unchanged) |

```txt
scheduleTimeFieldsNonDryRunSliceImplementationComplete: true
nonDryRunSaveUiExposed: true (G-6-g2 Save gated off by default)
G-6-g2 Preview / Save executed: false
optimisticLockWiredInProductPath: true
```

---

## 1. Staging project confirmation

Before any SQL or dev server:

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/
Section: AdminStagingScheduleGeneralEditSection (#schedule)
/admin: not used
service_role: not used
schedule_months: read-only / derived (not touched)
```

Abort if project is not `static-to-astro-cms-staging` or production is open.

---

## 2. beforeSnapshot SQL

**Read-only.** Operator runs in Supabase SQL Editor (staging project only). **Cursor does not execute.**

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

### Expected beforeSnapshot (post G-6-g1 execution)

| Field | Expected |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `date` | `2026-07-19` |
| `title` | `[CMS Kit staging] G-6-g1 title PoC` |
| `venue` | `[CMS Kit staging] G-6-f6 venue PoC` |
| `open_time` | `null` |
| `start_time` | `null` |
| `price` | `null` |
| `description` | `出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]` |
| `published` | `true` |
| `show_on_home` | `false` |
| `sort_order` | `10` |
| `created_at` | `2026-06-05 17:39:44.140168+00` (expect unchanged after execution) |
| `updated_at` | `2026-06-14 15:03:08.762993+00` — record **exact** value as optimistic lock baseline |

**Row count must be exactly 1.**

Record `updated_at` from this query before execution. UI `baseline updated_at` must match at Save time. If staging was touched since G-6-g1, use the live SQL value — do not assume the historical baseline without verification.

### Abort conditions (beforeSnapshot)

Abort execution phase if:

```txt
- Supabase project is not static-to-astro-cms-staging
- row count ≠ 1
- id ≠ aa440e29-5be8-402e-9190-0d81c48434c0
- legacy_id ≠ schedule-2026-07-010
- title ≠ [CMS Kit staging] G-6-g1 title PoC
- open_time ≠ null OR start_time ≠ null (unless documented + rollback approved)
- venue ≠ [CMS Kit staging] G-6-f6 venue PoC
- description ≠ 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
- published ≠ true
- show_on_home ≠ false
- sort_order ≠ 10
```

If beforeSnapshot fails, do not arm dev server for execution.

---

## 3. Dev server command (execution phase)

Run **only after** beforeSnapshot passes. Inline env only — do not commit secrets to `.env` / `.env.local`.

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g2-schedule-time-fields-non-dry-run-slice \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

### Required env (from `getScheduleG6G2TimeFieldsEditConfig()`)

| Env | Value | Notes |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` | Section visible |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` | Write path |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` | |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` | |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-6-g2-schedule-time-fields-non-dry-run-slice` | **Not G-6-e5 / G-6-f6 / G-6-g1** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` | |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` | Default; explicit recommended |
| `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED` | `true` | G-6-g2 slice arm gate |
| `PUBLIC_SUPABASE_URL` | staging URL | |
| `PUBLIC_SUPABASE_ANON_KEY` | staging anon key | |

### Recommended (auth + live read for stale check)

| Env | Value |
| --- | --- |
| `ENABLE_ADMIN_STAGING_AUTH` | `true` |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` |
| `PUBLIC_ADMIN_AUTH_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_DATA_PROVIDER` | `supabase` |

### Optional

| Env | Value |
| --- | --- |
| `PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID` | `aa440e29-5be8-402e-9190-0d81c48434c0` |

### Do not use (single-arm + PoC isolation)

```txt
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true   (G-6-g1 only — must be OFF)
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true            (G-6-e5 only)
PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED=true       (G-6-f6 only)
PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER=true                 (G-6-e5 hidden trigger)
service_role key
production Supabase URL / keys
```

**Warning:** This command arms G-6-g2 non-dry-run Save. In **final-preflight**, verify UI only — **do not click Preview or Save**.

---

## 4. UI procedure (operator — execution phase)

**URL:** `http://localhost:<port>/__admin-staging-shell/musician-basic/#schedule`

Find **Schedule general edit — title (G-6-g1) + time fields (G-6-g2)** — **not** G-6-e5 Danger Zone or G-6-f6 PoC section.

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Start dev server with G-6-g2 arm stack (§3) | G-6-g2 gate status shows `armed` |
| 2 | Open `/__admin-staging-shell/musician-basic/#schedule` | Not `/admin` |
| 3 | Sign in via staging Supabase Auth | Auth signed in; staging admin in `admin_users` |
| 4 | Confirm Data read gate | `enabled` |
| 5 | Confirm readSource | `supabase` (not mock/static) |
| 6 | Confirm Supabase host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| 7 | Select target row | `aa440e29-5be8-402e-9190-0d81c48434c0` (auto-selected if present) |
| 8 | Confirm G-6-g1 title slice | Title input **read-only** or Save **disabled** when G-6-g2 armed |
| 9 | Confirm G-6-g1 gate | `not armed` (G-6-g1 gate status) |
| 10 | Confirm G-6-g2 gate | `armed` |
| 11 | Confirm current title | `[CMS Kit staging] G-6-g1 title PoC` |
| 12 | Confirm open_time / start_time | `(null)` in read-only panel |
| 13 | Confirm venue / description | G-6-f6 values unchanged |
| 14 | Enter open_time | `[CMS Kit staging] G-6-g2 open PoC` |
| 15 | Enter start_time | `[CMS Kit staging] G-6-g2 start PoC` |
| 16 | Click **Preview time fields dry-run** | Preview succeeds |
| 17 | Confirm preview | `changedFields: ["open_time", "start_time"]` only; `actualWrite: false` |
| 18 | Confirm stale | No stale banner; `staleDetected: false` |
| 19 | Record baseline | `baseline updated_at` matches beforeSnapshot SQL |
| 20 | Type approval ID | Exact: `G-6-g2-schedule-time-fields-non-dry-run-slice` |
| 21 | Confirm G-6-g2 Save enabled | Disabled reason cleared; button enabled |
| 22 | **Execution phase only** | Click **Save time fields (non-dry-run)** **once** |

**Final-preflight rule:** Steps 1–21 verification OK. **Steps 16–22 forbidden in final-preflight** (no Preview / Save click).

---

## 5. Save enable checklist (implementation-verified)

From `staging-schedule-general-edit-ui.ts` → `canEnableG6G2Save()` + `getScheduleG6G2TimeFieldsEditConfig()`:

| # | Condition | Source |
| --- | --- | --- |
| 1 | `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true` | `schedule-general-edit-config.ts` |
| 2 | `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED` **not** `true` | single-arm; G-6-g1 Save blocked |
| 3 | `PUBLIC_ADMIN_WRITE_DRY_RUN=false` | config `dryRunFlagMatch` |
| 4 | `ENABLE_ADMIN_STAGING_WRITE=true` | config `stagingWriteFlag` |
| 5 | `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g2-schedule-time-fields-non-dry-run-slice` | config `approvalIdMatch` |
| 6 | `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true` | optimistic lock enabled |
| 7 | G-6-g2 dry-run preview valid | `g6g2DryRunPreviewValid` |
| 8 | `changedFields` exactly `["open_time", "start_time"]` | preview result |
| 9 | `staleDetected: false` | stale check on preview |
| 10 | `readSource: supabase` | live SELECT for stale + Save |
| 11 | Approval ID manual confirm exact match | G-6-g2 confirm input |
| 12 | Target row `aa440e29-5be8-402e-9190-0d81c48434c0` | selected row |
| 13 | open_time / start_time unchanged since preview | form vs `lastG6g2Preview*` |
| 14 | Payload time-fields-only | `assertG6G2TimeFieldsPayloadOnly` on Save |
| 15 | Auth session present | `executeScheduleGeneralUpdateWrite` |
| 16 | Supabase host staging | UI meta + operator check |
| 17 | No G-6-e5 / G-6-f6 env armed | separate PoC gates |
| 18 | `updated_at` not in payload | trigger sets after UPDATE |

### G-6-g1 disabled when G-6-g2 armed

| Check | Expected |
| --- | --- |
| G-6-g1 Save | disabled — reason: `G-6-g2 armed — G-6-g1 Save disabled` |
| G-6-g1 Preview | disabled when G-6-g2 armed |
| G-6-g1 title input | read-only when G-6-g2 armed |

---

## 6. Payload confirmation

```json
{
  "open_time": "[CMS Kit staging] G-6-g2 open PoC",
  "start_time": "[CMS Kit staging] G-6-g2 start PoC"
}
```

```txt
Approval ID: G-6-g2-schedule-time-fields-non-dry-run-slice
Only open_time and start_time may change.
title, venue, description, date, published, show_on_home, sort_order, price must remain unchanged.
schedule_months must not be touched.
updated_at must not be in payload.
expectedBeforeUpdatedAt: beforeSnapshot.updated_at at Save time.
```

---

## 7. afterVerification SQL (execution phase only)

Run after manual Save click in **execution** phase — not in final-preflight.

```sql
-- G-6-g2 afterVerification — SELECT only; staging project only
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

### Expected after successful execution

| Field / flag | Expected |
| --- | --- |
| `open_time_match` | `true` |
| `start_time_match` | `true` |
| `title_unchanged` | `true` |
| `venue_unchanged` | `true` |
| `description_unchanged` | `true` |
| `date_unchanged` | `true` |
| `published_unchanged` | `true` |
| `show_on_home_unchanged` | `true` |
| `sort_order_unchanged` | `true` |
| `created_at` | unchanged vs beforeSnapshot |
| `updated_at` | **strictly later** than beforeSnapshot baseline (trigger active) |
| `schedule_months` | not written |

### UI result panel (execution phase)

| Field | Expected |
| --- | --- |
| `actualWrite` | `true` |
| `changedFields` | `open_time`, `start_time` (or `["open_time", "start_time"]`) |
| `optimisticLock` | enabled; no conflict message |
| `serviceRoleUsed` | `false` |
| `errorCode` | not `optimistic_lock_failed` |

---

## 8. Rollback SQL (template — not executed in final-preflight)

```sql
-- G-6-g2 rollback — staging only; execute only if explicitly approved
-- NOT executed in final-preflight or execution unless rollbackNeeded
update public.schedules
set
  open_time = null,
  start_time = null
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

| Note | Detail |
| --- | --- |
| Scope | `open_time`, `start_time` only; title / venue / description unchanged |
| `updated_at` | Rollback UPDATE advances `updated_at` (trigger) — expected side effect |
| `schedule_months` | Not rollback target |
| Approval | Separate explicit operator approval to run rollback SQL |
| Production | **Never** run on production |

---

## 9. Execution success criteria

Next phase `G-6-g2-schedule-time-fields-non-dry-run-slice-execution` succeeds when:

```txt
user manual Save exactly once
actualWrite: true
changedFields: ["open_time", "start_time"]
rowsAffected: 1
open_time: [CMS Kit staging] G-6-g2 open PoC
start_time: [CMS Kit staging] G-6-g2 start PoC
title: unchanged ([CMS Kit staging] G-6-g1 title PoC)
venue: unchanged (G-6-f6 value)
description: unchanged (G-6-f6 value)
date, published, show_on_home, sort_order: unchanged
created_at: unchanged
updated_at: advanced (strictly > beforeSnapshot baseline)
expectedBeforeUpdatedAt: matched at Save time
no optimistic_lock_failed
no optimistic_lock_select_failed
schedule_months: not written
serviceRoleUsed: false
rollbackNeeded: false (unless team chooses restore)
```

### Failure handling

| Error | Action |
| --- | --- |
| `optimistic_lock_failed` | Reload rows; re-run beforeSnapshot SQL; do not auto-retry Save |
| `optimistic_lock_select_failed` | Check auth / network; Reload |
| `before_snapshot_mismatch` | Abort; investigate staging row state (title / null times) |
| `write_guard_failed` | Abort; payload not time-fields-only |
| `auth_session_missing` | Sign in as staging admin; retry from Preview |
| `slice_not_armed` | Verify G-6-g2 env stack; G-6-g1 arm must be off |

---

## 10. Risk review

| Risk | Mitigation |
| --- | --- |
| Multiple slice Save UIs exposed | Single-arm: G-6-g1 / G-6-g2 cannot both be armed; G-6-g1 disabled when G-6-g2 armed |
| Accidental G-6-g1 Save re-execution | G-6-g1 arm env off; title read-only; G-6-g1 Save disabled when G-6-g2 armed |
| Single-arm env misconfiguration | Both configs reject dual-arm; UI shows `armFailureReason` |
| Stale row | Preview stale check blocks Save; Reload rows required |
| Approval ID typo | G-6-g2 confirm input must match exactly |
| Wrong target row | Save requires `aa440e29-…`; UI auto-selects when present |
| Non-time-fields payload | `assertG6G2TimeFieldsPayloadOnly` + UI builds `{ open_time, start_time }` only |
| Rollback `updated_at` side effect | Documented; rollback restores null times only |
| `published: true` | Staging-only site; `show_on_home: false`; Sariswing production untouched |
| G-6-e5 / G-6-f6 accidental re-arm | Do not set PoC env vars; use general edit G-6-g2 section only |
| Accidental double Save | Operator clicks G-6-g2 Save **once**; no auto-retry on conflict |
| Preview without supabase read | Save blocked when `readSource !== supabase` |

---

## 11. Staging shell UI checklist (final-preflight)

| # | Check | Expected |
| --- | --- | --- |
| 1 | Route | `/__admin-staging-shell/musician-basic/#schedule` — not `/admin` |
| 2 | Section | **General edit G-6-g2** — not G-6-e5 / G-6-f6 |
| 3 | Supabase host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| 4 | Expected project | `static-to-astro-cms-staging` |
| 5 | G-6-g2 gate status | `armed` when env correct |
| 6 | G-6-g1 gate status | `not armed` |
| 7 | Approval ID display | `G-6-g2-schedule-time-fields-non-dry-run-slice` |
| 8 | Target fields | `open_time`, `start_time` only |
| 9 | Target ID | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| 10 | Product path | `executeG6G2TimeFieldsNonDryRunSave` → `executeScheduleGeneralUpdateWrite` |
| 11 | Optimistic lock | baseline `updated_at` shown |
| 12 | Dry-run first | G-6-g2 Preview works; Save disabled without preview |
| 13 | Stale UX | Stale banner blocks G-6-g2 Save |
| 14 | G-6-g1 title | read-only / Save disabled when G-6-g2 armed |
| 15 | service_role | not used |
| 16 | schedule_months | read-only / not touched |
| 17 | G-6-e5 / G-6-f6 reused | `false` |
| 18 | Manual confirm | Must type full G-6-g2 approval ID |
| 19 | G-6-g2 Save before gates | **disabled** |
| 20 | G-6-g2 Save after all gates | **enabled** (verify only — **do not click** in final-preflight) |

---

## 12. Gate decision

```txt
scheduleTimeFieldsNonDryRunSliceFinalPreflightComplete: true
readyForG6G2ScheduleTimeFieldsNonDryRunSliceExecution: true
nonDryRunSaveUiExposed: true
G-6-g2 nonDryRunSaveExecuted: false
rollbackNeeded: false
```

---

## 13. G-6-g2 final-preflight safety statement

```txt
DB write: none
Supabase SQL executed by Cursor: none
Preview button click: none
Save button click: none
Run button click: none
G-6-g1 Save re-execution: none
G-6-e5 / G-6-f6 PoC re-click: none
/admin: not modified
schedule_months: read-only / derived (not touched)
service_role: not used
production: not touched
```

## Related docs

- [schedule-time-fields-non-dry-run-slice-preflight.md](./schedule-time-fields-non-dry-run-slice-preflight.md)
- [schedule-time-fields-non-dry-run-slice-implementation.md](./schedule-time-fields-non-dry-run-slice-implementation.md)
- [schedule-title-non-dry-run-slice-execution-result.md](./schedule-title-non-dry-run-slice-execution-result.md)
- [schedule-optimistic-lock-enablement-implementation.md](./schedule-optimistic-lock-enablement-implementation.md)
