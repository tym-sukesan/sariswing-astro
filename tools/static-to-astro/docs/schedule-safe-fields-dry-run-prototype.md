# Schedule safe-fields dry-run prototype (G-6-f4)

Last updated: 2026-06-14  
Phase: `G-6-f4-schedule-safe-fields-dry-run-prototype`  
Approval ID: `G-6-f4-schedule-safe-fields-dry-run-prototype`

## Prerequisites

- **G-6-f3** — description-only dry-run prototype (Plan A: client-side).
- **G-6-f2** — Schedule read UI SSR binding.
- **G-6-f1** — Hidden PoC disarmed.

## Scope (this phase)

| In scope | Out of scope |
| --- | --- |
| Safe fields dry-run preview | DB UPDATE / INSERT / DELETE |
| Client-side only (Plan A) | Write adapter calls |
| SELECT via `loadSchedulesForDryRunUi` | `schedule_months` |
| Staging shell `#schedule` | `/admin` changes |

### Target fields (editable in dry-run UI)

```txt
title
venue
open_time
start_time
price
description
```

### Excluded fields (not editable)

```txt
id, legacy_id, date, year, month
image_url, home_image_url, source_file, source_route
show_on_home, home_order, published, sort_order
created_at, updated_at
```

Especially **not** touched in this phase: `date`, `year`, `month`, `published`, `show_on_home`, `sort_order`.

## Implementation: Plan A (client-side preview only)

- `buildScheduleSafeFieldsDryRunResult()` — pure function, no Supabase write client.
- `staging-schedule-safe-fields-dry-run-ui.ts` — SELECT load + in-memory preview.
- Write adapter / G-6-e3 `buildScheduleUpdateDryRunResult` **not** called.
- `PUBLIC_ADMIN_WRITE_DRY_RUN=false` **not** used.
- G-6-e5 approval ID **not** used.

G-6-f3 description-only section replaced by `AdminStagingScheduleSafeFieldsDryRunSection` (G-6-f3 files retained for history).

## Dry-run result structure

```json
{
  "module": "schedule",
  "operation": "dry-run-update-preview",
  "targetTable": "schedules",
  "targetFields": ["title", "venue", "open_time", "start_time", "price", "description"],
  "targetId": "<uuid>",
  "dryRun": true,
  "wouldWrite": true,
  "actualWrite": false,
  "approvalId": "G-6-f4-schedule-safe-fields-dry-run-prototype",
  "beforeSnapshot": {
    "id": "...",
    "legacy_id": "...",
    "date": "2026-07-01",
    "safeFields": {
      "title": null,
      "venue": "",
      "open_time": null,
      "start_time": "19:00",
      "price": null,
      "description": "出演： ..."
    }
  },
  "payload": { "title": "", "venue": "...", ... },
  "afterPreview": { "id": "...", "date": "...", "title": "", ... },
  "changedFields": ["description"],
  "validation": { "warnings": [] },
  "safety": {
    "supabaseWriteCalled": false,
    "writeAdapterUsed": false,
    "scheduleMonthsTouched": false,
    "nonDryRunEnabled": false
  }
}
```

## changedFields specification

- Compare normalized values: `null` / `undefined` → `""` for comparison.
- UI displays `(null)`, `(empty)`, or literal value for current values.
- Only fields with differing normalized values appear in `changedFields`.
- No changes → `changedFields: []`, `wouldWrite: false`, no-op preview message.

## Validation warnings (non-blocking)

- Empty `title` — legacy row hint.
- `description` length > 2000 — review hint.
- Time fields — no strict format validation in this phase.

## Why no DB write

1. No Supabase `.update()` / `.upsert()` / RPC.
2. No write adapter invocation.
3. Result built in browser from loaded row + form inputs.
4. `actualWrite` always `false`.

## Why only SELECT from Supabase

Schedule list and picker use `loadSchedulesForDryRunUi` — approved read path from G-6-f2 / G-6-e2. No write path connected.

## readSource / fallback

Same ladder as G-6-f2/G-6-f3: `supabase` → `mock` → `static` with notice when not live Supabase.

## Safe dev startup

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

Open: `http://localhost:4321/__admin-staging-shell/musician-basic/#schedule`

Do **not** set `PUBLIC_ADMIN_WRITE_DRY_RUN=false` or `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true`.

## Hidden PoC / G-6-e5

- Hidden PoC trigger **not** re-armed.
- G-6-e5 approval ID **not** reused.

## Files

| File | Role |
| --- | --- |
| `schedule-safe-fields-dry-run-config.ts` | Env gates + approval ID |
| `schedule-safe-fields-dry-run.ts` | Result builder |
| `staging-schedule-safe-fields-dry-run-ui.ts` | Client UI |
| `AdminStagingScheduleSafeFieldsDryRunSection.astro` | Staging section |

## Next phase proposal

**G-6-f5** — [schedule-safe-fields-non-dry-run-preflight.md](./schedule-safe-fields-non-dry-run-preflight.md) (preflight; no writes).

**G-6-f6** — safe-fields non-dry-run implementation → final preflight → manual execution (venue + optional description first; not all 6 fields).

Defer full non-dry-run to G-6-f6 series; do not use G-6-e5 hidden PoC trigger.

## Risks / open questions

| Risk | Mitigation |
| --- | --- |
| Plan A payload may diverge from write adapter | G-6-f5 align with `dryRunFormInputToWritePayload` |
| null vs "" confusion | Explicit display labels in current-values panel |
| Duplicate G-6-f3 + G-6-f4 files | G-6-f3 files kept; UI uses G-6-f4 section only |

## Invariants

- `/admin` untouched
- `service_role` not used
- `schedule_months` read-only / derived
