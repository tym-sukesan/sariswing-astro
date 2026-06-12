# Schedule Dry-run Adapter Implementation

**Phase:** `G-6-e3-schedule-dry-run-adapter-implementation`  
**Approval ID:** `G-6-e3-schedule-dry-run-adapter-implementation`  
**Prerequisite:** [schedule-dry-run-adapter-planning.md](./schedule-dry-run-adapter-planning.md)

## 1. Purpose

Implement the Schedule dry-run adapter as pure functions and route existing staging shell UI dry-run result generation through the adapter boundary.

No schedule records are written.  
No schema is changed.  
No real write adapter is implemented.  
No `/admin` route is connected.

## 2. Implemented files

| File | Role |
|------|------|
| `src/lib/admin/staging-write/schedule-dry-run-types.ts` | `ScheduleDryRunResult`, form/source types |
| `src/lib/admin/staging-write/schedule-dry-run-adapter.ts` | Update/duplicate dry-run builders |
| `src/lib/admin/staging-write/schedule-dry-run-guards.ts` | Safety literals + `assertDryRunOnlyResult` |
| `src/lib/admin/staging-write/schedule-dry-run-validation.ts` | `validateDryRunFormInput`, payload helpers |
| `src/lib/admin/staging-write/staging-schedule-dry-run-ui.ts` | UI calls adapter (not inline payload) |
| `src/lib/admin/staging-write/schedule-dry-run-payload.ts` | `recordToFormState` + deprecated thin wrappers |

**Unchanged (read-only):** `staging-schedule-read.ts`

## 3. Adapter responsibilities

- Accept `ScheduleDryRunSource` + `ScheduleDryRunFormInput`
- Validate via existing validation helpers
- Build normalized write payload (preview only)
- Compute `derivedPreview` (year/month/group)
- Return `ScheduleDryRunResult` with `actualWrite: false` hard-coded
- Include `beforeSnapshot`, `rollbackHint`, `safety` block
- Never import Supabase or accept DB client

## 4. Update dry-run result behavior

`buildScheduleUpdateDryRunResult`:

- `operation: update`, `module: schedule`, `targetId: source.id`
- `dryRun: true`, `actualWrite: false`
- `wouldWrite: true` when `validation.ok`; `false` when invalid
- `beforeSnapshot` = copy of source row
- No Supabase `.update()` call

Message: `Dry-run complete — no Supabase schedule update was called.`

## 5. Duplicate dry-run result behavior

`buildScheduleDuplicateDryRunResult`:

- `operation: duplicate`, `sourceId: source.id`
- Payload forces `legacy_id: null`, `published: false`, `show_on_home: false`, `home_order: null`
- `sort_order` defaults to `0` when unset
- No Supabase `.insert()` call

Message: `Dry-run complete — no Supabase schedule insert was called.`

## 6. actualWrite:false enforcement

- `actualWrite` is typed as `false` literal
- `dryRun` is typed as `true` literal
- `getScheduleDryRunSafety()` returns all-false safety block
- `assertDryRunOnlyResult()` runs on every adapter return
- No `dryRun` mode parameter accepted

## 7. No DB client guarantee

Adapter and guards do not import:

- `@supabase/supabase-js`
- `createClient`
- `PUBLIC_SUPABASE` / `SERVICE_ROLE`

Read path (`staging-schedule-read.ts`) remains separate SELECT-only loader.

## 8. UI integration summary

**Before:** UI called `schedule-dry-run-payload.ts` builders directly.

**After:**

```txt
UI form state + source schedule
→ formStateToDryRunInput
→ buildScheduleUpdateDryRunResult / buildScheduleDuplicateDryRunResult
→ result panel (unchanged layout; shows wouldWrite from result)
```

## 9. Safety verification steps

```bash
git grep -n -E "@supabase/supabase-js|createClient|SERVICE_ROLE" \
  src/lib/admin/staging-write/schedule-dry-run-adapter.ts \
  src/lib/admin/staging-write/schedule-dry-run-guards.ts

git grep -n -E "\\.insert\\(|\\.update\\(|\\.delete\\(|\\.upsert\\(" \
  src/lib/admin/staging-write/schedule-dry-run-adapter.ts \
  src/lib/admin/staging-write/staging-schedule-dry-run-ui.ts
```

Manual: open `/__admin-staging-shell/musician-basic/` with `ENABLE_ADMIN_STAGING_SHELL=true` and verify Update/Duplicate dry-run payloads show `actualWrite: false`.

## 10. Remaining gaps

- No automated adapter unit tests yet
- No real `ScheduleWriteAdapter`
- No non-dry-run schedule PoC
- `schedule_months` write not implemented (by design)
- UI still uses string form boundary (`ScheduleFormState`) — adapter normalizes at boundary

## 11. Recommended next phase

**G-6-e3-schedule-dry-run-adapter-verification（完了）:** [schedule-dry-run-adapter-verification.md](./schedule-dry-run-adapter-verification.md) — static safety checks pass; manual browser checklist prepared; next: G-6-e3-schedule-dry-run-adapter-verification-result.

Write implementation remains blocked (`readyForG6EWriteImplementation: false`).

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-dry-run-adapter-implementation.mjs \
  --out-dir tools/static-to-astro/output/schedule-dry-run-adapter-implementation/gosaki
```
