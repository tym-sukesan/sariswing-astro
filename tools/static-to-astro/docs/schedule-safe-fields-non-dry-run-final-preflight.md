# Schedule safe-fields non-dry-run final preflight (G-6-f6)

Last updated: 2026-06-14  
Phase: `G-6-f6-schedule-safe-fields-non-dry-run-final-preflight`  
Type: **final-preflight only** — no DB write, no non-dry-run execution, no Run click

## Purpose

Final checks immediately before the first G-6-f6 safe-fields non-dry-run execution. Operator runs beforeSnapshot SQL, arms staging shell with G-6-f6 gates, verifies UI — but does **not** click Run in this phase.

**This phase performed:** docs, SQL templates, dev command, UI checklist, abort conditions.  
**This phase did not:** UPDATE / INSERT / DELETE, non-dry-run execution, Run button click, rollback SQL execution, G-6-e5 hidden trigger re-arm, `service_role`, `/admin` changes.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-f6 implementation | G-6-f6 section, config, trigger, UI, write guards |
| G-6-f5 preflight | Target row, payload, approval ID, `updated_at` policy |
| G-6-e5 | `description` non-dry-run success on same row |
| G-6-f1 | G-6-e5 hidden trigger disarmed; `EXPLICIT_RERUN` not for G-6-f6 |

## 1. Staging project confirmation

Before any SQL or dev server:

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/
/admin: not used
service_role: not used
schedule_months: read-only / derived (not touched)
```

Abort if project is not `static-to-astro-cms-staging` or production is open.

## 2. beforeSnapshot SQL

**Read-only.** Run in Supabase SQL Editor after confirming project.

```sql
-- G-6-f6 beforeSnapshot — SELECT only; run before execution phase
select
  id,
  legacy_id,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  published,
  show_on_home,
  sort_order,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Expected beforeSnapshot

| Field | Expected |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `title` | `<>` (observe; not in payload) |
| `venue` | empty string or `null` |
| `open_time` | `null` (observe) |
| `start_time` | `null` (observe) |
| `price` | `null` (observe) |
| `description` | `出演： [G-6-e5 non-dry-run PoC]` |
| `published` | `true` |
| `show_on_home` | `false` |
| `sort_order` | `10` |
| `updated_at` | record exact value (may not change on UPDATE) |

**Row count must be exactly 1.**

### Abort conditions (beforeSnapshot)

Abort execution phase if:

```txt
- Supabase project is not static-to-astro-cms-staging
- row count is not 1
- id ≠ aa440e29-5be8-402e-9190-0d81c48434c0
- legacy_id ≠ schedule-2026-07-010
- venue is not empty (non-null non-empty string)
- description ≠ 出演： [G-6-e5 non-dry-run PoC]
- published ≠ true
- show_on_home ≠ false
- sort_order ≠ 10
```

If beforeSnapshot fails, do not arm dev server for execution. Investigate or rollback to G-6-e5 state first.

## 3. Dev server command (final-preflight / execution)

Run **only after** beforeSnapshot passes. Inline env only — do not commit secrets.

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-f6-schedule-safe-fields-non-dry-run-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

### Required env (from `schedule-safe-fields-non-dry-run-poc-config.ts`)

| Env | Value | Notes |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` | Section visible |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` | Write path |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` | |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` | |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-6-f6-schedule-safe-fields-non-dry-run-poc` | **Not G-6-e5** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` | |
| `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED` | `true` | G-6-f6 arm gate |
| `PUBLIC_SUPABASE_URL` | staging URL | |
| `PUBLIC_SUPABASE_ANON_KEY` | staging anon key | |

### Recommended (not required for arm, but needed for auth / read UI)

| Env | Value |
| --- | --- |
| `ENABLE_ADMIN_STAGING_AUTH` | `true` |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` |
| `PUBLIC_ADMIN_AUTH_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_DATA_PROVIDER` | `supabase` |

### Optional

| Env | Value |
| --- | --- |
| `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_TARGET_ID` | `aa440e29-5be8-402e-9190-0d81c48434c0` (default when unset) |

### Do not use

```txt
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true   (G-6-e5 only)
PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER=true          (G-6-e5 hidden trigger)
service_role key
```

**Warning:** This command arms G-6-f6 non-dry-run. In **final-preflight**, verify UI only — **do not click Run**.

## 4. Staging shell UI checklist

**URL:** `http://localhost:<port>/__admin-staging-shell/musician-basic/`

Navigate to **Schedule** section (`#schedule`). Find **G-6-f6 safe-fields non-dry-run PoC** (not G-6-e5 Danger Zone).

| # | Check | Expected |
| --- | --- | --- |
| 1 | Route | `/__admin-staging-shell/musician-basic/` — not `/admin` |
| 2 | Supabase host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| 3 | Expected project | `static-to-astro-cms-staging` |
| 4 | Auth | Signed in via staging Supabase Auth (staging admin user in `admin_users`) |
| 5 | Section label | G-6-f6 safe-fields PoC — **not** G-6-e5 Danger Zone |
| 6 | Gate status | `armed` (when env correct) |
| 7 | Approval ID | `G-6-f6-schedule-safe-fields-non-dry-run-poc` |
| 8 | Target ID | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| 9 | Target legacy_id | `schedule-2026-07-010` |
| 10 | Target fields | `venue`, `description` only |
| 11 | Before description | `出演： [G-6-e5 non-dry-run PoC]` |
| 12 | After venue | `[CMS Kit staging] G-6-f6 venue PoC` |
| 13 | After description | `出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]` |
| 14 | Payload scope | No `title`, `open_time`, `start_time`, `price` in payload UI |
| 15 | service_role | Display shows not used |
| 16 | schedule_months | Display shows read-only / not touched |
| 17 | G-6-e5 reused | Display shows `false` for G-6-e5 approval / trigger re-arm |
| 18 | Manual confirm | Must type full approval ID |
| 19 | Run before confirm | Button **disabled** |
| 20 | Run after confirm | Button **enabled** (verify only — **do not click** in final-preflight) |
| 21 | updated_at in payload | Display shows `false` |

**Final-preflight rule:** Typing approval ID to confirm button enables is OK. **Run button click is forbidden in this phase.**

## 5. Payload confirmation

```json
{
  "venue": "[CMS Kit staging] G-6-f6 venue PoC",
  "description": "出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]"
}
```

```txt
Approval ID: G-6-f6-schedule-safe-fields-non-dry-run-poc
Only venue and description may change.
schedule_months must not be touched.
updated_at must not be in payload.
```

## 6. afterVerification SQL (execution phase only)

Run after manual Run click in **execution** phase — not in final-preflight.

```sql
-- G-6-f6 afterVerification — run after execution phase manual click
select
  id,
  legacy_id,
  venue,
  description,
  venue = '[CMS Kit staging] G-6-f6 venue PoC' as venue_match,
  description = '出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]' as description_match,
  title,
  open_time,
  start_time,
  price,
  published,
  show_on_home,
  sort_order,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Expected after successful execution

| Field | Expected |
| --- | --- |
| `venue` | `[CMS Kit staging] G-6-f6 venue PoC` |
| `description` | `出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]` |
| `venue_match` | `true` |
| `description_match` | `true` |
| `title` | unchanged (`<>`) |
| `open_time` | unchanged (`null`) |
| `start_time` | unchanged (`null`) |
| `price` | unchanged (`null`) |
| `published` | `true` |
| `show_on_home` | `false` |
| `sort_order` | `10` |
| `updated_at` | observe — may equal beforeSnapshot (G-6-e5 pattern) |

## 7. Rollback SQL (template — not executed in final-preflight)

```sql
-- G-6-f6 rollback — staging only; manual if needed after execution
-- NOT executed in final-preflight
update public.schedules
set
  venue = '',
  description = '出演： [G-6-e5 non-dry-run PoC]'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

## 8. `updated_at` policy

| Rule | Value |
| --- | --- |
| In payload | **No** |
| Optimistic lock | **No** |
| Record in beforeSnapshot / afterVerification | **Yes** |
| Success criterion | `venue_match` + `description_match` + unchanged non-target fields |

## 9. G-6-e5 separation

```txt
G-6-e5 hidden trigger: not used
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN: not used
G-6-e5 approval ID: not used
G-6-e5 Danger Zone: not armed (disarmed by default)
```

## 10. Final abort conditions (execution phase)

Abort execution if any of:

```txt
- beforeSnapshot abort conditions (§2)
- route is not /__admin-staging-shell/musician-basic/
- /admin involved
- service_role appears anywhere
- approval ID ≠ G-6-f6-schedule-safe-fields-non-dry-run-poc
- payload differs from fixed G-6-f6 payload
- G-6-e5 Danger Zone visible and armed (wrong env)
- auth session not signed in
- Run button clicked more than once
- unexpected prior DB write on target row
```

## 11. Execution phase browser plan (next phase only)

```txt
1. Confirm beforeSnapshot SQL (§2) — PASS
2. Start dev server (§3)
3. Open /__admin-staging-shell/musician-basic/#schedule
4. Sign in as staging admin if needed
5. Complete UI checklist (§4)
6. Type approval ID: G-6-f6-schedule-safe-fields-non-dry-run-poc
7. Confirm Run enables
8. In execution phase ONLY: click Run exactly once
9. Record result panel + run afterVerification SQL (§6)
```

**This document does not authorize step 8.** Final-preflight ends at step 7 without clicking.

## 12. Result capture template (execution phase)

```txt
G-6-f6-schedule-safe-fields-non-dry-run-execution result

Preflight:
- staging project confirmed:
- beforeSnapshot row count:
- before venue:
- before description:
- before updated_at:

Browser:
- approval ID typed:
- Run clicked: (execution phase only)
- auth email:

Result panel:
- actualWrite:
- changedFields:
- beforeVenue / afterVenue:
- beforeDescription / afterDescription:
- errorCode / errorMessage:

After verification SQL:
- venue_match:
- description_match:
- title / times / price unchanged:
- updated_at after:
- schedule_months touched: false
```

## 13. Gate decision (final-preflight phase)

```txt
finalPreflightDocPrepared: true
beforeSnapshotSqlAvailable: true
devServerCommandAvailable: true
uiChecklistAvailable: true
afterVerificationSqlAvailable: true
rollbackSqlAvailable: true
executionResultTemplatePrepared: true
runButtonClicked: false
nonDryRunExecuted: false
dbWritesPerformed: false
g6e5TriggerReArmed: false
readyForG6F6ScheduleSafeFieldsNonDryRunExecution: true (after operator confirms beforeSnapshot + UI)
```

## 14. Recommended next phase

```txt
G-6-f6-schedule-safe-fields-non-dry-run-execution
- User manual Run click exactly once
- Record result doc
- Run afterVerification SQL
- Do not execute rollback unless needed
```

## 15. Final safety statement

This final-preflight document prepares the last checks before G-6-f6 execution.

It does not authorize clicking Run.  
No write adapter invocation in this phase.  
No schedule record update in this phase.  
Cursor / Playwright must not auto-click Run.

## Related docs

- [schedule-safe-fields-non-dry-run-poc-implementation.md](./schedule-safe-fields-non-dry-run-poc-implementation.md)
- [schedule-safe-fields-non-dry-run-preflight.md](./schedule-safe-fields-non-dry-run-preflight.md)
- [schedule-poc-isolation-dry-run-default.md](./schedule-poc-isolation-dry-run-default.md)
- [schedule-non-dry-run-poc-explicit-retry-result.md](./schedule-non-dry-run-poc-explicit-retry-result.md)
