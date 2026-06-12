# Schedule Dry-run UI Scaffold

**Phase:** `G-6-e2-schedule-dry-run-ui-scaffold`  
**Approval ID:** `G-6-e2-schedule-dry-run-ui`  
**Route:** `/__admin-staging-shell/musician-basic/` (staging shell only)

## 1. Purpose

Implement the Schedule CMS dry-run UI scaffold in the staging shell. This phase adds read/list UI, an edit form, client-side validation, and update/duplicate dry-run payload preview — without any database writes, write adapters, or `/admin` route connection.

Prerequisite: [schedule-dry-run-ui-planning.md](./schedule-dry-run-ui-planning.md) and [schedule-schema-read-audit-result.md](./schedule-schema-read-audit-result.md).

## 2. Implemented UI scope

Staging shell section **Schedule dry-run PoC** (`AdminStagingScheduleDryRunPocSection.astro`):

- Upcoming schedules (date ≥ today, ascending)
- Past schedules (date < today, descending)
- List item fields: date, title, venue, start_time, published badge, show_on_home badge, legacy_id or source_route
- Actions: Select, Duplicate dry-run (per row)
- Edit form for selected schedule (MVP columns)
- Update dry-run and Duplicate dry-run buttons (form area)
- Dry-run result panel with validation, payload preview, rollback hint
- Safety flags display

**Not implemented:** delete UI, non-dry-run buttons, `schedule_months` write, write adapters, `/admin` connection.

**Source files:**

| Area | Path |
|------|------|
| UI section | `tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleDryRunPocSection.astro` |
| Browser logic | `src/lib/admin/staging-write/staging-schedule-dry-run-ui.ts` |
| Read loader | `src/lib/admin/staging-write/staging-schedule-read.ts` |
| Validation | `src/lib/admin/staging-write/schedule-dry-run-validation.ts` |
| Payload builders | `src/lib/admin/staging-write/schedule-dry-run-payload.ts` |
| Config | `tools/static-to-astro/config/admin/schedule-dry-run-ui-scaffold.json` |

## 3. Update dry-run behavior

On **Update dry-run**:

1. Read form state from the selected schedule
2. Run client-side validation
3. Build update payload (`operation: update`, `targetTable: schedules`, `targetId`, `dryRun: true`, `wouldWrite: true`, `actualWrite: false`)
4. Display recalculated year/month preview from date (not written to DB)
5. **No** Supabase `.update()` call
6. **No** write adapter call

Message on success: `Dry-run complete — no Supabase schedule update was called.`

## 4. Duplicate dry-run behavior

On **Duplicate dry-run** (list row or form button):

1. Copy editable fields from source schedule (or current form)
2. Set `legacy_id: null`, `published: false`, `show_on_home: false`, `home_order: null`
3. Build duplicate payload (`operation: duplicate`, `sourceId`, `dryRun: true`, `actualWrite: false`)
4. **No** Supabase `.insert()` call
5. **No** write adapter call

Message on success: `Dry-run complete — no Supabase schedule insert was called.`

## 5. Validation behavior

**Required:**

- `date` present
- at least one of `title`, `venue`, or `description` has content
- `published` and `show_on_home` are booleans

**Recommended:**

- `date` valid `YYYY-MM-DD`
- `home_order` and `sort_order` integer or empty
- `open_time`, `start_time`, `price` free text

Validation results appear in the dry-run result panel.

## 6. schedule_months read-only decision

`schedule_months` remains a **read-only derived model** for MVP. This scaffold does not read or write `schedule_months`. Year/month on `schedules` are shown read-only; date changes preview recalculated year/month in the dry-run panel only.

## 7. Safety flags

| Flag | Value |
|------|-------|
| Schedule dry-run only | true |
| Schedule write adapter implemented | false |
| Schedule DB writes performed | false |
| Schedule months mode | read_only_derived_model |
| Delete enabled | false |
| Non-dry-run enabled | false |
| adminRouteConnected | false |
| productionDataTouched | false |

Data read: SELECT-only via anon client when staging env is configured; mock fallback otherwise.

## 8. Manual verification steps

1. `ENABLE_ADMIN_STAGING_SHELL=true` and dev server running
2. Open `/__admin-staging-shell/musician-basic/`
3. Confirm **Schedule dry-run PoC** appears after Profile update PoC overview
4. Confirm Upcoming and Past lists render
5. Select a schedule — form populates
6. Click **Update dry-run** — payload preview, `actualWrite: false`, validation shown
7. Click **Duplicate dry-run** — duplicate payload, `published: false`, `legacy_id: null`
8. Confirm no Delete or non-dry-run buttons
9. Confirm Profile PoC and Debug Panel still work

Report CLI:

```bash
node tools/static-to-astro/scripts/report-schedule-dry-run-ui-scaffold.mjs \
  --out-dir tools/static-to-astro/output/schedule-dry-run-ui-scaffold/gosaki
```

## 9. Remaining gaps

- Real write adapter (blocked: `readyForG6EWriteImplementation: false`)
- Delete dry-run / non-dry-run operations (excluded)
- `schedule_months` aggregation write
- `/admin` route integration
- Schema migration (not required for this phase)
- WRITE grants for schedule (not required for dry-run UI)

## 10. Recommended next phase

**G-6-e2-schedule-dry-run-ui-verification** — DONE (see [schedule-dry-run-ui-verification-result.md](./schedule-dry-run-ui-verification-result.md)).

**G-6-e2-schedule-dry-run-ui-verification-result（完了）:** Manual browser verification passed; verified local URL used port `4322`; update + duplicate dry-run visually verified.

**G-6-e3-schedule-dry-run-adapter-planning（完了）:** [schedule-dry-run-adapter-planning.md](./schedule-dry-run-adapter-planning.md) — dry-run adapter boundary as pure functions; no DB client; `actualWrite: false` hard-coded; next: G-6-e3-schedule-dry-run-adapter-implementation.

Write implementation remains blocked (`readyForG6EWriteImplementation: false`).

## 11. Final safety statement

- **No schedule records are written.**
- **No schema is changed.**
- **No write adapter is implemented.**
- **No `/admin` route is connected.**
