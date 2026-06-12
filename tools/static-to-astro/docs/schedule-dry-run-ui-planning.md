# Schedule Dry-run UI Planning

## 1. Purpose

**Phase:** `G-6-e2-schedule-dry-run-ui-planning`

This document plans the Schedule CMS dry-run UI before implementation.
It does not implement UI.
It does not implement write adapters.
It does not write schedule records.
It does not change database schema.
It does not connect /admin.
It does not touch production data.

Cursor does not connect to Supabase or execute SQL in this phase.

Follows [schedule-schema-read-audit-result.md](./schedule-schema-read-audit-result.md) and [schedule-cms-planning.md](./schedule-cms-planning.md).

## 2. Current schedule schema basis

```txt
schedules is schema-compatible for MVP.
schedule_months is treated as derived/read model for MVP.
No schema migration is required before dry-run UI.
Future/past grouping works with schedules.date.
```

**Existing columns to use:**

```txt
id
legacy_id
date
year
month
title
venue
open_time
start_time
price
description
show_on_home
home_order
published
sort_order
created_at
updated_at
```

**Deferred (not in first dry-run UI):**

```txt
reservation_url
venue_area
venue_address
structured venue_url
structured performers
updated_by
source_file / source_route — read-only display only
```

## 3. Product goal

**Goal:**

```txt
Allow musicians to safely preview schedule edits in a staging shell before any database write.
The first UI should make schedule editing understandable and useful without enabling production writes.
```

**MVP value:**

```txt
- upcoming / past schedulesを見られる
- 既存ライブ情報を編集できる形で確認できる
- 複製して新規ライブの下書きを作る流れを確認できる
- dry-run payloadを確認できる
- 実DBにはまだ書き込まない
```

## 4. Initial UI scope

**Include:**

```txt
- schedule list
- upcoming / past grouping
- selected schedule detail
- edit form for existing schedule
- update dry-run
- duplicate dry-run
- published toggle
- show_on_home toggle
- dry-run result panel
- rollback hint panel
```

**Exclude:**

```txt
- delete
- schedule_months write
- image upload
- reservation_url structured field
- venue structured table
- recurring events
- publish/deploy trigger
- non-dry-run save
```

## 5. Recommended operation order

```txt
1. Read/list existing schedules
2. Select one schedule
3. Update dry-run existing schedule
4. Duplicate dry-run existing schedule
5. Create dry-run only after update/duplicate UI is stable
6. Non-dry-run only in a later separate phase
```

**First implementation target:**

```txt
update dry-run + duplicate dry-run
```

**Create dry-run:** deferred to G-6-e3+ or shown as disabled/planned in scaffold — not in first scaffold scope unless explicitly approved later.

## 6. Schedule list UI design

**Sections:**

```txt
- Upcoming schedules (date >= today)
- Past schedules (date < today)
```

**List item fields:**

```txt
- date
- title
- venue
- start_time
- published badge
- show_on_home badge
- source_route or legacy_id small text
```

**Actions:**

```txt
- Select (load into edit form)
- Duplicate as dry-run (from list or detail)
```

**Sort order:**

```txt
Upcoming: date ascending
Past: date descending
```

**Data source:** `SELECT` from `public.schedules` via anon/authenticated client (RLS: published-only for anon; admin read all for authenticated admin — verify at scaffold time).

## 7. Schedule edit form design

**Editable fields:**

```txt
date
title
venue
open_time
start_time
price
description
published
show_on_home
home_order
sort_order
```

**Read-only display:**

```txt
id
legacy_id
month
year
source_file
source_route
created_at
updated_at
```

**Notes:**

```txt
year and month can be derived from date in future implementation.
For dry-run, keep existing year/month unless explicitly recalculated in preview.
Do not write schedule_months when year/month change in preview.
```

## 8. Validation rules

**Required:**

```txt
- date
- title or venue or description must have content (at least one non-empty)
- published must be boolean
- show_on_home must be boolean
```

**Recommended:**

```txt
- date must be valid date
- home_order integer or empty
- sort_order integer or empty
- open_time / start_time are free text
- price is free text
```

**Rationale:**

```txt
Musician schedules often contain irregular time/price/performance text.
Do not over-structure too early.
```

**show_on_home limit (future non-dry-run):** Sariswing pattern caps featured home rows — dry-run may warn only; enforce at write phase.

## 9. Update dry-run payload

**Payload specification (display only — no Supabase call):**

```json
{
  "operation": "update",
  "targetTable": "schedules",
  "targetId": "<schedule-id>",
  "dryRun": true,
  "wouldWrite": true,
  "actualWrite": false,
  "approvalId": "G-6-e2-schedule-dry-run-ui",
  "payload": {
    "date": "YYYY-MM-DD",
    "title": "...",
    "venue": "...",
    "open_time": "...",
    "start_time": "...",
    "price": "...",
    "description": "...",
    "published": true,
    "show_on_home": false,
    "home_order": null,
    "sort_order": 0
  }
}
```

**Important:**

```txt
No Supabase update is called during dry-run.
PUBLIC_ADMIN_WRITE_DRY_RUN=true remains default during scaffold phase.
```

## 10. Duplicate dry-run payload

**Payload specification:**

```json
{
  "operation": "duplicate",
  "targetTable": "schedules",
  "sourceId": "<source-schedule-id>",
  "dryRun": true,
  "wouldWrite": true,
  "actualWrite": false,
  "approvalId": "G-6-e2-schedule-dry-run-ui",
  "payload": {
    "legacy_id": null,
    "date": "<copied-or-adjusted-date>",
    "title": "<copied title>",
    "venue": "<copied venue>",
    "open_time": "<copied open_time>",
    "start_time": "<copied start_time>",
    "price": "<copied price>",
    "description": "<copied description>",
    "published": false,
    "show_on_home": false,
    "home_order": null,
    "sort_order": 0
  }
}
```

**Important:**

```txt
For duplicate dry-run, legacy_id should not be copied as-is because schedules.legacy_id is unique.
Published should default to false for duplicated draft.
Actual write phase must generate new legacy_id (e.g. schedule-YYYY-MM-NNN pattern).
```

## 11. schedule_months handling

```txt
schedule_months is read-only in the first Schedule dry-run UI.
No insert/update/delete against schedule_months.
Month grouping should be calculated from schedules.date or schedules.month for UI display.
schedule_months table may be used for read-only month nav labels/routes if present.
Do not sync or update schedule_months.count from dry-run UI.
```

## 12. Dry-run result panel

**Display fields:**

```txt
- operation type (update | duplicate)
- selected schedule id (or source id for duplicate)
- dry-run status
- would write table: schedules
- payload preview (JSON or formatted fields)
- validation result (pass | field_errors)
- actualWrite: false
- rollback hint
- next step note
```

**Primary message (align with profile PoC):**

```txt
Dry-run complete — no Supabase schedule update was called.
```

**Debug Panel alignment (staging shell):**

```txt
Auth status: authenticated
Dry-run mode: true
Write enabled: true (UI) / actualWrite: false
Operation: update | duplicate
```

## 13. Rollback hint design

Dry-run does not require real rollback. Hints prepare for future non-dry-run phases.

**Update:**

```txt
Rollback hint:
Keep before snapshot of the selected schedule row.
Manual rollback would restore previous field values by id.
```

**Duplicate / future create:**

```txt
Rollback hint:
Manual rollback would delete the created test row by id.
```

**Note:** Delete is not executed in initial implementation. Rollback hints are documentation-only until G-6-e5/e6 prep.

## 14. Approval ID design

**Dry-run UI scaffold:**

```txt
G-6-e2-schedule-dry-run-ui
```

**Future non-dry-run PoC (not this phase):**

```txt
G-6-e5-schedule-non-dry-run-poc
G-6-e6-manual-schedule-non-dry-run-poc
```

Display `approvalId` in dry-run result panel for traceability.

## 15. Staging shell integration plan

**Route (unchanged):**

```txt
/__admin-staging-shell/musician-basic/
```

**Do not connect:**

```txt
/admin
```

**New section (scaffold phase):**

```txt
Schedule dry-run PoC
```

**Layout alongside existing:**

```txt
- Profile update PoC (existing)
- Schedule dry-run PoC (new section)
```

**Implementation notes for scaffold:**

```txt
- Reuse staging auth / dry-run gate patterns from profile PoC
- New components under tools/static-to-astro/templates/admin-cms/ (not src/pages/admin/)
- Read schedules via existing anon client + RLS SELECT
- No new API routes that perform writes in scaffold phase
```

## 16. RLS / GRANT implications

```txt
Current grants on schedules/schedule_months are SELECT only for anon/authenticated.
This is enough for read/list and dry-run UI.
Actual INSERT/UPDATE non-dry-run will require separate grant/policy review.
Do not add INSERT/UPDATE grants in this planning phase.
```

**Important:**

```txt
Dry-run UI can proceed with SELECT-only grants.
Authenticated admin must be able to SELECT all schedules for edit form (via is_admin() RLS on admin_all policies — verify at scaffold).
```

## 17. Implementation gate

**After this planning phase:**

```txt
readyForG6E2ScheduleDryRunUiScaffold: true
readyForG6EWriteImplementation: false
readyForG6EImplementation: false
```

**Scaffold phase may start when:**

```txt
- UI scope defined (this document)
- fields defined
- validation defined
- update/duplicate payload defined
- schedule_months read-only decision recorded
- no delete decision recorded
```

**Write implementation blocked until:**

```txt
- dry-run UI scaffold complete (G-6-e2-schedule-dry-run-ui-scaffold)
- dry-run payload verified (G-6-e4)
- write adapter separately planned (G-6-e3)
- RLS/GRANT for write separately planned
- rollback plan drafted
- manual approval ID defined for non-dry-run
```

## 18. Recommended next phase

```txt
Recommended next: G-6-e2-schedule-dry-run-ui-scaffold — DONE (see schedule-dry-run-ui-scaffold.md)
G-6-e2-schedule-dry-run-ui-verification-result — DONE (see schedule-dry-run-ui-verification-result.md)
G-6-e3-schedule-dry-run-adapter-planning — DONE (see schedule-dry-run-adapter-planning.md)
G-6-e3-schedule-dry-run-adapter-implementation — DONE (see schedule-dry-run-adapter-implementation.md)
Next: G-6-e3-schedule-dry-run-adapter-verification
```

**G-6-e2-schedule-dry-run-ui-scaffold（完了）:** [schedule-dry-run-ui-scaffold.md](./schedule-dry-run-ui-scaffold.md) — Schedule dry-run UI scaffold in staging shell; update + duplicate dry-run only; no delete; no `schedule_months` write; no schema migration; no DB write.

**G-6-e2-schedule-dry-run-ui-verification-result（完了）:** [schedule-dry-run-ui-verification-result.md](./schedule-dry-run-ui-verification-result.md) — Manual browser verification passed; port `4322` accepted; update + duplicate dry-run verified; no DB write.

**G-6-e3-schedule-dry-run-adapter-planning（完了）:** [schedule-dry-run-adapter-planning.md](./schedule-dry-run-adapter-planning.md) — Dry-run adapter boundary; pure functions; no DB client; `actualWrite: false` hard-coded.

**G-6-e3-schedule-dry-run-adapter-implementation（完了）:** [schedule-dry-run-adapter-implementation.md](./schedule-dry-run-adapter-implementation.md) — Pure dry-run adapter; UI routed through adapter; write implementation remains blocked.

## 19. Final safety statement

```txt
This phase was planning only.
UI scaffold is implemented in a separate phase (G-6-e2-schedule-dry-run-ui-scaffold).
No schedule records are written by the scaffold.
No schema is changed.
No production data is touched.
No /admin route is connected.
Schedule write implementation remains blocked until a separate approved phase.
```

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-dry-run-ui-planning.mjs \
  --out-dir tools/static-to-astro/output/schedule-dry-run-ui-planning/gosaki
```
