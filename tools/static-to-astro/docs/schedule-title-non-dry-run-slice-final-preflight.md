# Schedule title non-dry-run slice final preflight (G-6-g1)

Last updated: 2026-06-14  
Phase: `G-6-g1-schedule-title-non-dry-run-slice-final-preflight`  
Type: **final-preflight only** — no DB write, no Supabase SQL execution, no Save click, no Run click

## Purpose

Final checks immediately before the first G-6-g1 product-path title non-dry-run execution. Operator runs beforeSnapshot SQL, arms staging shell with G-6-g1 gates, verifies general edit UI — but does **not** click Save in this phase.

**This phase performed:** docs, SQL templates, dev command, UI checklist, Save enable checklist, risk review, AI context.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL execution, non-dry-run Save, Run button click, rollback SQL execution, G-6-e5 / G-6-f6 PoC re-arm, `service_role`, `/admin` changes.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-g1 preflight | Target row, payload, approval ID, env, rollback design |
| G-6-g1 implementation | `AdminStagingScheduleGeneralEditSection`, guards, Save path |
| G-6-f8 | `schedules_set_updated_at` trigger active on staging |
| G-6-f10 | Optimistic lock product path |
| G-6-f6 | venue + description on target row (must remain unchanged) |

```txt
nonDryRunSaveUiExposed: true (gated off by default)
nonDryRunSaveExecuted: false
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
-- G-6-g1 beforeSnapshot — SELECT only; staging project only
select
  id,
  legacy_id,
  date,
  title,
  venue,
  description,
  published,
  show_on_home,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Expected beforeSnapshot (post G-6-f6, post G-6-f8 trigger)

| Field | Expected |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `date` | `2026-07-19` |
| `title` | `<>` |
| `venue` | `[CMS Kit staging] G-6-f6 venue PoC` |
| `description` | `出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]` |
| `published` | `true` |
| `show_on_home` | `false` |
| `sort_order` | `10` |
| `created_at` | `2026-06-05 17:39:44.140168+00` (expect unchanged after execution) |
| `updated_at` | record **exact** value — used as `expectedBeforeUpdatedAt` baseline |

**Row count must be exactly 1.**

Record `updated_at` from this query before execution. UI baseline must match at Save time.

### Abort conditions (beforeSnapshot)

Abort execution phase if:

```txt
- Supabase project is not static-to-astro-cms-staging
- row count ≠ 1
- id ≠ aa440e29-5be8-402e-9190-0d81c48434c0
- legacy_id ≠ schedule-2026-07-010
- title ≠ <> (unless documented intentional staging change + rollback approved)
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
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g1-schedule-title-non-dry-run-slice \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

### Required env (from `schedule-general-edit-config.ts`)

| Env | Value | Notes |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` | Section visible |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` | Write path |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` | |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` | |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-6-g1-schedule-title-non-dry-run-slice` | **Not G-6-e5 / G-6-f6** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` | |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` | Default; explicit recommended |
| `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED` | `true` | G-6-g1 slice arm gate |
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

### Do not use

```txt
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true   (G-6-e5 only)
PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED=true (G-6-f6 only)
PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER=true          (G-6-e5 hidden trigger)
service_role key
production Supabase URL / keys
```

**Warning:** This command arms G-6-g1 non-dry-run Save. In **final-preflight**, verify UI only — **do not click Save**.

---

## 4. UI procedure (operator — execution phase)

**URL:** `http://localhost:<port>/__admin-staging-shell/musician-basic/`

Navigate to **Schedule** section (`#schedule`). Find **Schedule general edit — title slice (G-6-g1)** — **not** G-6-e5 Danger Zone or G-6-f6 PoC section.

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Start dev server with G-6-g1 arm stack (§3) | Gate status shows `armed` |
| 2 | Open `/__admin-staging-shell/musician-basic/` | Not `/admin` |
| 3 | Sign in via staging Supabase Auth | Auth status signed in; staging admin in `admin_users` |
| 4 | Scroll to Schedule section (`#schedule`) | `ScheduleAdminUi` + general edit section visible |
| 5 | Confirm general edit section | Label: G-6-g1 title slice; product path banner |
| 6 | Confirm Supabase host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| 7 | Confirm readSource | `supabase` (not mock/static) |
| 8 | Select target row | `aa440e29-5be8-402e-9190-0d81c48434c0` (auto-selected if present) |
| 9 | Confirm current title | `<>` |
| 10 | Confirm venue / description | G-6-f6 values unchanged (read-only panel) |
| 11 | Enter title | `[CMS Kit staging] G-6-g1 title PoC` |
| 12 | Click **Preview title dry-run** | Preview succeeds |
| 13 | Confirm preview | `changedFields: ["title"]` only; `actualWrite: false` |
| 14 | Confirm stale | No stale banner; `staleDetected: false` |
| 15 | Record baseline | `baseline updated_at` matches beforeSnapshot SQL |
| 16 | Type approval ID | Exact: `G-6-g1-schedule-title-non-dry-run-slice` |
| 17 | Confirm Save enabled | Save disabled reason cleared; button enabled |
| 18 | **Execution phase only** | Click **Save title (non-dry-run)** **once** |

**Final-preflight rule:** Steps 1–17 verification OK. **Step 18 forbidden in final-preflight.**

---

## 5. Save enable checklist (implementation-verified)

From `staging-schedule-general-edit-ui.ts` → `canEnableSave()` + `getScheduleGeneralEditConfig()`:

| # | Condition | Source |
| --- | --- | --- |
| 1 | `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true` | `schedule-general-edit-config.ts` |
| 2 | `PUBLIC_ADMIN_WRITE_DRY_RUN=false` | config `dryRunFlagMatch` |
| 3 | `ENABLE_ADMIN_STAGING_WRITE=true` | config `stagingWriteFlag` |
| 4 | `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g1-schedule-title-non-dry-run-slice` | config `approvalIdMatch` |
| 5 | `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true` | optimistic lock enabled |
| 6 | Dry-run preview valid for current title | `dryRunPreviewValid` |
| 7 | `changedFields` exactly `["title"]` | preview result |
| 8 | `staleDetected: false` | stale check on preview |
| 9 | `readSource: supabase` | live SELECT for stale + Save |
| 10 | Approval ID manual confirm exact match | confirm input |
| 11 | Target row `aa440e29-5be8-402e-9190-0d81c48434c0` | selected row |
| 12 | Title unchanged since preview | form vs `lastPreviewTitle` |
| 13 | Payload title-only | `assertG6G1TitlePayloadOnly` on Save |
| 14 | Auth session present | `executeScheduleGeneralUpdateWrite` |
| 15 | Supabase host staging | UI meta + operator check |
| 16 | No G-6-e5 / G-6-f6 env armed | separate gates |
| 17 | `updated_at` not in payload | trigger sets after UPDATE |

---

## 6. Payload confirmation

```json
{
  "title": "[CMS Kit staging] G-6-g1 title PoC"
}
```

```txt
Approval ID: G-6-g1-schedule-title-non-dry-run-slice
Only title may change.
venue, description, date, published, show_on_home, sort_order must remain unchanged.
schedule_months must not be touched.
updated_at must not be in payload.
expectedBeforeUpdatedAt: beforeSnapshot.updated_at at Save time.
```

---

## 7. afterVerification SQL (execution phase only)

Run after manual Save click in **execution** phase — not in final-preflight.

```sql
-- G-6-g1 afterVerification — SELECT only; staging project only
select
  id,
  legacy_id,
  date,
  title,
  venue,
  description,
  published,
  show_on_home,
  sort_order,
  created_at,
  updated_at,
  title = '[CMS Kit staging] G-6-g1 title PoC' as title_match,
  venue = '[CMS Kit staging] G-6-f6 venue PoC' as venue_unchanged,
  description = '出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]' as description_unchanged,
  date = '2026-07-19' as date_unchanged,
  published = true as published_unchanged,
  show_on_home = false as show_on_home_unchanged,
  sort_order = 10 as sort_order_unchanged
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Expected after successful execution

| Field / flag | Expected |
| --- | --- |
| `title_match` | `true` |
| `venue_unchanged` | `true` |
| `description_unchanged` | `true` |
| `date_unchanged` | `true` |
| `published_unchanged` | `true` |
| `show_on_home_unchanged` | `true` |
| `sort_order_unchanged` | `true` |
| `created_at` | unchanged vs beforeSnapshot |
| `updated_at` | **strictly later** than beforeSnapshot baseline (trigger active) |
| `schedule_months` | not written (no row changes in derived table) |

### UI result panel (execution phase)

| Field | Expected |
| --- | --- |
| `actualWrite` | `true` |
| `changedFields` | `title` (or `["title"]`) |
| `optimisticLock` | enabled; no conflict message |
| `serviceRoleUsed` | `false` |
| `errorCode` | not `optimistic_lock_failed` |

---

## 8. Rollback SQL (template — not executed in final-preflight)

```sql
-- G-6-g1 rollback — staging only; execute only if explicitly approved
-- NOT executed in final-preflight or execution unless rollbackNeeded
update public.schedules
set title = '<>'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

| Note | Detail |
| --- | --- |
| Scope | `title` only |
| `updated_at` | Rollback UPDATE advances `updated_at` (trigger) — expected side effect |
| `schedule_months` | Not rollback target |
| Approval | Separate explicit operator approval to run rollback SQL |
| Production | **Never** run on production |

---

## 9. Execution success criteria

Next phase `G-6-g1-schedule-title-non-dry-run-slice-execution` succeeds when:

```txt
actualWrite: true
changedFields: ["title"]
rowsAffected: 1 (adapter result)
title: [CMS Kit staging] G-6-g1 title PoC
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
| `before_snapshot_mismatch` | Abort; investigate staging row state |
| `write_guard_failed` | Abort; payload not title-only |
| `auth_session_missing` | Sign in as staging admin; retry from Preview |

---

## 10. Risk review

| Risk | Mitigation |
| --- | --- |
| Save UI exposed (`nonDryRunSaveUiExposed: true`) | Default dev uses `DRY_RUN=true` + arm gate off; Save disabled until full stack |
| Env gate misconfiguration | UI shows `armFailureReason`; verify §3 table before execution |
| Stale row | Preview stale check blocks Save; Reload rows required |
| Approval ID typo | Manual confirm must match exactly; Save stays disabled |
| Wrong target row | Save requires `aa440e29-…`; UI auto-selects when present |
| Non-title payload | `assertG6G1TitlePayloadOnly` + UI builds `{ title }` only |
| Rollback `updated_at` side effect | Documented; rollback restores title only; `updated_at` will advance |
| `published: true` | Staging-only site; row not on home (`show_on_home: false`); Sariswing production untouched |
| G-6-e5 / G-6-f6 accidental re-arm | Do not set PoC env vars; use G-6-g1 section only |
| Accidental double Save | Operator clicks Save **once**; no auto-retry on conflict |

---

## 11. Staging shell UI checklist (final-preflight)

| # | Check | Expected |
| --- | --- | --- |
| 1 | Route | `/__admin-staging-shell/musician-basic/` — not `/admin` |
| 2 | Section | **G-6-g1 general edit** — not G-6-e5 / G-6-f6 |
| 3 | Supabase host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| 4 | Expected project | `static-to-astro-cms-staging` |
| 5 | Gate status | `armed` when env correct; `not armed` in default dev |
| 6 | Approval ID display | `G-6-g1-schedule-title-non-dry-run-slice` |
| 7 | Target fields | `title` only |
| 8 | Target ID | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| 9 | Product path | `executeScheduleGeneralUpdateWrite` — not PoC trigger |
| 10 | Optimistic lock | baseline `updated_at` shown |
| 11 | Dry-run first | Preview button works; Save disabled without preview |
| 12 | Stale UX | Stale banner blocks Save |
| 13 | service_role | not used |
| 14 | schedule_months | read-only / not touched |
| 15 | G-6-e5 / G-6-f6 reused | `false` |
| 16 | Manual confirm | Must type full approval ID |
| 17 | Save before gates | **disabled** |
| 18 | Save after all gates | **enabled** (verify only — **do not click** in final-preflight) |

---

## 12. Gate decision

```txt
scheduleTitleNonDryRunSliceFinalPreflightComplete: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: true
nonDryRunSaveUiExposed: true
nonDryRunSaveExecuted: false
rollbackNeeded: false
```

---

## 13. G-6-g1 final-preflight safety statement

```txt
DB write: none
Supabase SQL executed by Cursor: none
Save button click: none
Run button click: none
G-6-e5 / G-6-f6 PoC re-click: none
/admin: not modified
schedule_months: read-only / derived (not touched)
service_role: not used
```

## Related docs

- [schedule-title-non-dry-run-slice-preflight.md](./schedule-title-non-dry-run-slice-preflight.md)
- [schedule-title-non-dry-run-slice-implementation.md](./schedule-title-non-dry-run-slice-implementation.md)
- [schedule-updated-at-staging-migration-execution-result.md](./schedule-updated-at-staging-migration-execution-result.md)
- [schedule-optimistic-lock-enablement-implementation.md](./schedule-optimistic-lock-enablement-implementation.md)
