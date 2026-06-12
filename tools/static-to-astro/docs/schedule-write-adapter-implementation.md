# Schedule Write Adapter Implementation

**Phase:** `G-6-e4-schedule-write-adapter-implementation`  
**Approval ID:** `G-6-e4-schedule-write-adapter-implementation`  
**Prerequisites:** [schedule-write-adapter-implementation-planning.md](./schedule-write-adapter-implementation-planning.md), [schedule-update-grant-manual-apply-result.md](./schedule-update-grant-manual-apply-result.md)

## 1. Purpose

Implement a guarded, staging-only Schedule write adapter (`updateScheduleWrite`) separate from the dry-run adapter.

No schedule records are written in this phase (adapter not invoked).  
No UI non-dry-run control is added.  
No `/admin` route is connected.  
No schema or RLS change.

## 2. Implemented files

| File | Role |
|------|------|
| `src/lib/admin/staging-write/schedule-write-types.ts` | Write input/result types, client boundary |
| `src/lib/admin/staging-write/schedule-write-guards.ts` | Approval, target, payload guards |
| `src/lib/admin/staging-write/schedule-write-adapter.ts` | `updateScheduleWrite` only |

**Unchanged:** `schedule-dry-run-adapter.ts` — no DB client, no mode flag, no `.update()`.

**Not wired:** staging shell Schedule UI, Profile PoC, `/admin`.

## 3. Adapter responsibilities

- `updateScheduleWrite` — update-only on `public.schedules` by `id`
- Approval ID must be `G-6-e5-schedule-non-dry-run-poc`
- `beforeSnapshot` required and must match `targetId`
- Payload limited to allowed columns (no `legacy_id`, images, source fields, etc.)
- Optional `expectedBeforeUpdatedAt` optimistic check
- Returns `ScheduleWriteResult` or `ScheduleWriteFailureResult` (guard failures → `actualWrite: false`)
- No insert / duplicate / delete / upsert / RPC / `schedule_months`

## 4. Separation from dry-run adapter

```txt
ScheduleDryRunAdapter: pure functions, actualWrite:false hard-coded, no DB client
ScheduleWriteAdapter: separate module, updateScheduleWrite only, no dryRun mode flag
```

Forbidden: `runScheduleWrite({ dryRun: boolean })`.

## 5. Supabase `.update()` boundary

`.update()` exists **only** in `schedule-write-adapter.ts` for schedule writes.

Existing profile PoC: `profile-update-poc-adapter.ts` (unchanged).

## 6. UI policy

```txt
updateScheduleWrite is not imported by staging shell UI.
No non-dry-run Save button for schedules.
Schedule dry-run UI remains dry-run-only (actualWrite:false).
```

Future G-6-e5 may wire the adapter behind explicit env gates — not in this phase.

## 7. Invocation status

```txt
writeAdapterImplemented: true
writeAdapterInvoked: false
dbWritesPerformed: false
scheduleRecordsUpdated: false
uiConnected: false
nonDryRunUiExposed: false
```

## 8. Safety verification steps

```bash
git grep -n "\\.update(" src/lib/admin/staging-write
# schedule-write-adapter.ts and profile-update-poc-adapter.ts only

git grep -n "updateScheduleWrite" src/
# schedule-write-adapter.ts export only (no UI imports)

npm run build
node tools/static-to-astro/scripts/report-schedule-write-adapter-implementation.mjs \
  --out-dir tools/static-to-astro/output/schedule-write-adapter-implementation/gosaki
```

## 9. Gate decision

```txt
writeAdapterImplemented: true
writeAdapterInvoked: false
dbWritesPerformed: false
scheduleRecordsUpdated: false
readyForG6E4ScheduleWriteAdapterVerification: true
readyForG6EWriteImplementation: false
readyForNonDryRunSchedulePoC: false
```

## 10. Recommended next phase

```txt
G-6-e4-schedule-write-adapter-verification — DONE (see schedule-write-adapter-verification.md)
Next: G-6-e5-schedule-non-dry-run-poc-prep
```

**G-6-e4-schedule-write-adapter-verification（完了）:** [schedule-write-adapter-verification.md](./schedule-write-adapter-verification.md) — guarded ScheduleWriteAdapter verified as isolated; `.update()` location verified; write adapter not invoked; UI not connected; no DB write; no schedule record update; `readyForG6E5ScheduleNonDryRunPocPrep: true`; actual non-dry-run PoC remains blocked.

## 11. Final safety statement

Guarded ScheduleWriteAdapter code is implemented but not invoked.

No schedule DB update was performed in this phase.  
No non-dry-run UI was exposed.  
Non-dry-run PoC remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-write-adapter-implementation.mjs \
  --out-dir tools/static-to-astro/output/schedule-write-adapter-implementation/gosaki
```
