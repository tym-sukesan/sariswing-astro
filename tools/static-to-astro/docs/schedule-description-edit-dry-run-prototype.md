# Schedule description edit dry-run prototype (G-6-f3)

> **Superseded in UI by G-6-f4** (`schedule-safe-fields-dry-run-prototype.md`) which extends safe fields to title, venue, times, price, and description. G-6-f3 source files remain for history; staging shell uses `AdminStagingScheduleSafeFieldsDryRunSection`.

Last updated: 2026-06-14  
Phase: `G-6-f3-schedule-description-edit-dry-run-prototype`  
Approval ID: `G-6-f3-schedule-description-edit-dry-run-prototype`

## Prerequisites

- **G-6-f2** — `ScheduleAdminUi` SSR read binding via `loadSchedulesForDryRunUi` (SELECT only).
- **G-6-f1** — Hidden PoC trigger disarmed; `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN` not used.
- **G-6-e5** — One-off non-dry-run PoC completed; approval ID not reused.

## Scope (this phase)

| In scope | Out of scope |
| --- | --- |
| `description` field only | date, title, venue, published, etc. |
| Client-side dry-run preview | DB UPDATE / INSERT / DELETE |
| SELECT read via existing loader | `schedule_months` read/write |
| beforeSnapshot / payload / afterPreview | Write adapter integration |
| changedFields display | Non-dry-run execution |
| Staging shell `#schedule` section | `/admin` changes |

## Implementation approach: Plan A (client-only dry-run)

**Plan A** was used — pure client-side dry-run generation.

- `buildScheduleDescriptionDryRunResult()` in `schedule-description-dry-run.ts` — no Supabase client for writes.
- `staging-schedule-description-dry-run-ui.ts` — browser UI; calls `loadSchedulesForDryRunUi` for SELECT only.
- Write adapter / `buildScheduleUpdateDryRunResult` from G-6-e3 **not** invoked from this UI.
- `PUBLIC_ADMIN_WRITE_DRY_RUN=false` **not** used.
- G-6-e5 approval ID **not** used.

Plan B (existing write adapter dry-run path) deferred to G-6-f4+ general write flow integration.

## UI location

Staging shell schedule section (`#__admin-staging-shell/musician-basic/#schedule`):

1. `ScheduleAdminUi` — read-only table (G-6-f2).
2. `AdminStagingScheduleDescriptionDryRunSection` — G-6-f3 prototype below the table.

## UI elements

- readSource badge (`supabase | mock | static`)
- Data read gate status
- Schedule picker (SELECT-loaded rows)
- Selected row: `id`, `legacy_id`, `date`, `title`
- Current description (read-only)
- Textarea for new description
- **Preview description dry-run** button (not Save / not Run)
- Dry-run result panel: beforeSnapshot, payload, afterPreview, changedFields
- Safety flags panel

## Dry-run result structure

```json
{
  "module": "schedule",
  "operation": "update",
  "targetTable": "schedules",
  "targetField": "description",
  "targetId": "<uuid>",
  "legacyId": "<legacy_id or null>",
  "dryRun": true,
  "wouldWrite": true,
  "actualWrite": false,
  "approvalId": "G-6-f3-schedule-description-edit-dry-run-prototype",
  "readSource": "supabase",
  "beforeSnapshot": { "id", "legacy_id", "date", "title", "venue", "description" },
  "payload": { "description": "<new text>" },
  "afterPreview": { "id", "legacy_id", "date", "title", "venue", "description": "<new text>" },
  "changedFields": ["description"],
  "message": "Description dry-run complete — client-side preview only. No database write.",
  "safety": {
    "supabaseWriteCalled": false,
    "writeAdapterUsed": false,
    "scheduleMonthsTouched": false,
    "nonDryRunEnabled": false
  }
}
```

When description is unchanged: `changedFields: []`, `wouldWrite: false`.

## Why no DB write occurs

1. No call to Supabase `.update()` / `.upsert()` / RPC.
2. No schedule write adapter or non-dry-run PoC trigger.
3. Dry-run result built in memory from loaded row + textarea value.
4. `actualWrite` is always `false` in the result type.

## readSource / fallback

| Condition | readSource | Behavior |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_DATA_READ=true` + `PUBLIC_ADMIN_DATA_PROVIDER=supabase` + URL/key | `supabase` | Live SELECT rows |
| Loader error or empty | `mock` | Mock fixtures from dry-run loader |
| Gates off | `static` | Mock/static fixtures + notice |

Notice shown when source is not `supabase`.

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

Do **not** set:

- `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
- `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true`

## Hidden PoC / G-6-e5 policy

- G-6-e5 hidden PoC trigger **not** re-armed.
- G-6-e5 approval ID **not** reused.
- Existing `AdminStagingScheduleNonDryRunPocTriggerSection` unchanged.

## Files

| File | Role |
| --- | --- |
| `schedule-description-dry-run-config.ts` | Env gates |
| `schedule-description-dry-run.ts` | Pure dry-run result builder |
| `staging-schedule-description-dry-run-ui.ts` | Client UI + SELECT load |
| `AdminStagingScheduleDescriptionDryRunSection.astro` | Staging shell section |
| `config/admin/schedule-description-edit-dry-run-prototype.json` | Phase metadata |

## Next phase proposal

**G-6-f4-schedule-safe-fields-dry-run-prototype** — extend dry-run to additional safe fields (title, venue, etc.) via G-6-e3 adapter or unified Plan B path; still dry-run only.

## Risks / open questions

| Risk | Mitigation |
| --- | --- |
| SSR read table vs client picker out of sync | Same `loadSchedulesForDryRunUi` loader |
| User expects Save button | Explicit "Preview dry-run" label + banners |
| Plan A diverges from write adapter payload | G-6-f4 unify with `buildScheduleUpdateDryRunResult` for multi-field |

## Invariants

- `/admin` untouched
- `service_role` not used
- `schedule_months` read-only / derived
- No Playwright auto-click on write controls
