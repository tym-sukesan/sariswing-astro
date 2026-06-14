# Schedule safe-fields non-dry-run PoC implementation (G-6-f6)

Last updated: 2026-06-14  
Phase: `G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation`  
Type: **implementation only** — no DB write, no non-dry-run execution, no Run click

## Purpose

Wire G-6-f5 preflight decisions into staging shell UI, config, write flow, and docs. Prepare for final preflight and manual execution in later phases.

**This phase performed:** implementation scaffold, Astro section, client UI, trigger, guards, config JSON, SQL templates in docs.  
**This phase did not:** UPDATE / INSERT / DELETE, non-dry-run execution, Run button click, rollback SQL execution, G-6-e5 hidden trigger re-arm, `service_role`, `/admin` changes.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-f5 | Preflight: target row, payload, rollback, beforeSnapshot, approval ID, `updated_at` policy |
| G-6-f4 | Safe-fields dry-run UI (client-only) |
| G-6-e5 | `description` non-dry-run success on staging row (reuse row, not approval ID) |
| G-6-f1 | G-6-e5 hidden trigger disarmed by default |

## Implementation scope

### Target row

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
```

Reuses G-6-e5 staging row. G-6-e5 approval ID and hidden trigger are **not** reused.

### Target fields (first execution)

```txt
venue
description
```

**Not changed in this PoC:**

```txt
title
open_time
start_time
price
date
year
month
published
show_on_home
home_order
sort_order
source_file
source_route
image_url
home_image_url
created_at
updated_at
```

### Fixed payload

```json
{
  "venue": "[CMS Kit staging] G-6-f6 venue PoC",
  "description": "出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]"
}
```

Enforced by `assertG6F6SafeFieldsPayloadOnly` and `G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_FIXED_PAYLOAD`.

### Approval ID

```txt
G-6-f6-schedule-safe-fields-non-dry-run-poc
```

Do **not** reuse `G-6-e5-schedule-non-dry-run-poc`.

## Env gates

Section visible when: `DEV` + `ENABLE_ADMIN_STAGING_SHELL=true` (default dev staging shell).

Non-dry-run **armed** only when **all** of:

| Env | Value |
| --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-6-f6-schedule-safe-fields-non-dry-run-poc` |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED` | `true` |
| `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` | staging project configured |

Optional target override:

| Env | Value |
| --- | --- |
| `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_TARGET_ID` | `aa440e29-5be8-402e-9190-0d81c48434c0` (or unset for default) |

**Not used for G-6-f6:**

- `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN` (G-6-e5 only)
- `service_role`

### Dry-run default

Day-to-day dev keeps `PUBLIC_ADMIN_WRITE_DRY_RUN=true`. G-6-f6 Run button and confirm input are hidden/disabled until armed.

### Manual confirm

When armed, operator must type exactly:

```txt
G-6-f6-schedule-safe-fields-non-dry-run-poc
```

into the confirm field before Run enables.

## Implementation artifacts

| Artifact | Path |
| --- | --- |
| Config JSON | `tools/static-to-astro/config/admin/schedule-safe-fields-non-dry-run-poc-implementation.json` |
| PoC config | `src/lib/admin/staging-write/schedule-safe-fields-non-dry-run-poc-config.ts` |
| Trigger | `src/lib/admin/staging-write/schedule-safe-fields-non-dry-run-poc-trigger.ts` |
| Error / panel | `src/lib/admin/staging-write/schedule-safe-fields-non-dry-run-poc-error.ts` |
| Client UI | `src/lib/admin/staging-write/staging-schedule-safe-fields-non-dry-run-poc-ui.ts` |
| Astro section | `tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSafeFieldsNonDryRunPocSection.astro` |
| Prototype wire | `tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro` |
| Write types | `src/lib/admin/staging-write/schedule-write-types.ts` |
| Write guards | `src/lib/admin/staging-write/schedule-write-guards.ts` |
| Write adapter | `src/lib/admin/staging-write/schedule-write-adapter.ts` |

## UI behavior

- Label: **G-6-f6 safe-fields non-dry-run PoC** (not G-6-e5 Danger Zone).
- Shows approval ID, target fields, payload preview, gate status, Supabase host, expected project.
- Result panel: beforeSnapshot / payload / afterSnapshot / changedFields / error panel (populated after execution phase).
- Explicit: `service_role` not used; `schedule_months` not touched.
- Default: section visible in dev staging shell; **not armed**; Run hidden.

## beforeSnapshot SQL

Run at start of final preflight / execution (SELECT only in G-6-f6 implementation phase):

```sql
-- G-6-f6 beforeSnapshot — run before manual non-dry-run click
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

**Abort execution if:**

- `id` or `legacy_id` mismatch
- `description` ≠ `出演： [G-6-e5 non-dry-run PoC]` (unless documented rollback occurred)
- Row missing

Record exact `updated_at`; do not assume it changes on UPDATE.

## afterVerification SQL

Run after execution phase manual click:

```sql
-- G-6-f6 afterVerification
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

Also verify unchanged: `title`, `open_time`, `start_time`, `price`, `published`, `show_on_home`, `sort_order`.

## Rollback SQL (template — **not executed in G-6-f6 implementation**)

```sql
-- G-6-f6 rollback — staging only; manual if needed after execution
update public.schedules
set
  venue = '',
  description = '出演： [G-6-e5 non-dry-run PoC]'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

## `updated_at` policy

| Rule | G-6-f6 |
| --- | --- |
| Include in payload | **No** |
| Optimistic lock | **No** |
| Record in beforeSnapshot / afterVerification | **Yes** |
| Future hardening | DB trigger or explicit adapter update |

## Separation from G-6-e5

| Item | G-6-e5 | G-6-f6 |
| --- | --- | --- |
| Approval ID | `G-6-e5-schedule-non-dry-run-poc` | `G-6-f6-schedule-safe-fields-non-dry-run-poc` |
| Arm env | `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN` | `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED` |
| UI | Hidden Danger Zone | Visible G-6-f6 section in `#schedule` |
| Payload | description only | venue + description |
| Re-arm hidden trigger | **No** | **No** |

## Safety statement (G-6-f6 implementation phase)

```txt
DB write: none
non-dry-run execution: none
Supabase SELECT: not run by Cursor in implementation phase (operator may SELECT manually)
Run button click: none
hidden G-6-e5 PoC re-arm: none
G-6-e5 approval ID reuse: none
rollback SQL executed: none
service_role: not used
/admin: not modified
schedule_months: not touched
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN: not used
```

## Risks / open questions

| Risk | Mitigation |
| --- | --- |
| Accidental Run click before final preflight | Armed gate + manual confirm; docs say do not click in implementation phase |
| Description drift on target row | beforeSnapshot abort in trigger |
| `updated_at` static after UPDATE | Observe in afterVerification; no optimistic lock |
| Confusion with G-6-e5 UI | Separate section, labels, approval ID, arm env |

## Next phases (recommended)

| Order | Phase | Scope |
| --- | --- | --- |
| 1 | `G-6-f6-schedule-safe-fields-non-dry-run-final-preflight` | Run beforeSnapshot SQL; confirm auth; verify gates |
| 2 | `G-6-f6-schedule-safe-fields-non-dry-run-execution` | Single manual Run click; result doc |
| 3 | `G-6-f6-schedule-safe-fields-write-ui-hardening` (optional) | `updated_at` policy, error parity |

## Related docs

- `tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-preflight.md`
- `tools/static-to-astro/docs/schedule-poc-isolation-dry-run-default.md`
- `tools/static-to-astro/docs/schedule-non-dry-run-poc-explicit-retry-result.md`
