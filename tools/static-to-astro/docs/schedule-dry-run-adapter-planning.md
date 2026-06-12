# Schedule Dry-run Adapter Planning

**Phase:** `G-6-e3-schedule-dry-run-adapter-planning`  
**Approval ID (planning):** `G-6-e3-schedule-dry-run-adapter-planning`  
**Prerequisites:** [schedule-dry-run-ui-scaffold.md](./schedule-dry-run-ui-scaffold.md), [schedule-dry-run-ui-verification-result.md](./schedule-dry-run-ui-verification-result.md)

## 1. Purpose

This document plans the Schedule dry-run adapter boundary before implementation.

It does not implement the adapter.  
It does not implement real write behavior.  
It does not write schedule records.  
It does not change database schema.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Current status

```txt
Schedule dry-run UI scaffold has been implemented and manually verified.
Update dry-run and duplicate dry-run are visually verified.
actualWrite: false was confirmed.
Delete and non-dry-run remain excluded.
```

| Item | Value |
|------|-------|
| UI scaffold | implemented (`8a1805f`) |
| Manual verification | pass ([verification result](./schedule-dry-run-ui-verification-result.md)) |
| Dry-run payload preview | update + duplicate verified |
| Write adapters | not implemented |
| DB writes | none |

## 3. Why an adapter boundary is needed

The UI currently owns too much dry-run behavior (`staging-schedule-dry-run-ui.ts` calls payload builders directly).

Before any write adapter exists, dry-run behavior should be isolated behind an explicit adapter boundary. This reduces the risk of accidentally replacing dry-run with real write behavior.

**Goals:**

- UIからDB write責務を切り離す
- dry-run result形式を標準化する
- real write adapterとdry-run adapterを明確に分離する
- `actualWrite: false` を設計上強制する
- 将来のnon-dry-run approval gateを作りやすくする

**Target flow:**

```txt
UI form state
↓
ScheduleDryRunAdapter
↓
DryRunResult
```

## 4. Adapter responsibilities

**ScheduleDryRunAdapter responsibilities:**

- accept validated or raw form input
- normalize schedule payload
- calculate derived preview values if needed
- validate operation-specific constraints
- generate `DryRunResult`
- guarantee `actualWrite: false`
- provide rollback hint
- never call Supabase write methods
- never receive service_role key
- never receive write-capable DB client

## 5. Non-responsibilities

**ScheduleDryRunAdapter must not:**

- perform INSERT
- perform UPDATE
- perform DELETE
- perform UPSERT
- call RPC
- touch `schedule_months`
- trigger publish/deploy
- mutate application state outside returning a result
- connect to production

## 6. Proposed file structure for future implementation

**Not implemented in this phase.** Future implementation candidates:

```txt
src/lib/admin/staging-write/schedule-dry-run-adapter.ts
src/lib/admin/staging-write/schedule-dry-run-types.ts
src/lib/admin/staging-write/schedule-dry-run-guards.ts
```

**Existing files (today):**

```txt
src/lib/admin/staging-write/schedule-dry-run-validation.ts
src/lib/admin/staging-write/schedule-dry-run-payload.ts
src/lib/admin/staging-write/staging-schedule-dry-run-ui.ts
src/lib/admin/staging-write/staging-schedule-read.ts
```

**Policy:**

```txt
Keep validation/payload helpers.
Introduce adapter as orchestration boundary in a later implementation phase.
```

The adapter layer will orchestrate validation, payload normalization, derived preview, and result assembly. Helpers remain pure and reusable.

## 7. Input types

```ts
export type ScheduleDryRunOperation = "update" | "duplicate";

export type ScheduleDryRunSource = {
  id: string;
  legacy_id?: string | null;
  date: string;
  year?: number | null;
  month?: string | null;
  title?: string | null;
  venue?: string | null;
  open_time?: string | null;
  start_time?: string | null;
  price?: string | null;
  description?: string | null;
  show_on_home?: boolean | null;
  home_order?: number | null;
  published?: boolean | null;
  sort_order?: number | null;
  source_file?: string | null;
  source_route?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ScheduleDryRunFormInput = {
  date: string;
  title: string;
  venue: string;
  open_time: string;
  start_time: string;
  price: string;
  description: string;
  published: boolean;
  show_on_home: boolean;
  home_order: number | null;
  sort_order: number | null;
};
```

**Note:** Existing `ScheduleFormState` uses string fields for `home_order` / `sort_order` at the UI boundary. The adapter should normalize strings to `number | null` before building results.

## 8. Update dry-run adapter design

```ts
export function buildScheduleUpdateDryRunResult(input: {
  source: ScheduleDryRunSource;
  form: ScheduleDryRunFormInput;
  approvalId: "G-6-e3-schedule-dry-run-adapter";
  todayIso?: string;
}): ScheduleDryRunResult;
```

**Result characteristics:**

- `operation: update`
- `targetTable: schedules`
- `targetId: source.id`
- `dryRun: true`
- `wouldWrite: true` when `validation.ok` is true; `false` when validation fails
- `actualWrite: false` (always)
- `beforeSnapshot` included (copy of source row)
- `payload` included
- `validation` included
- `rollbackHint` included

## 9. Duplicate dry-run adapter design

```ts
export function buildScheduleDuplicateDryRunResult(input: {
  source: ScheduleDryRunSource;
  overrides?: Partial<ScheduleDryRunFormInput>;
  approvalId: "G-6-e3-schedule-dry-run-adapter";
  todayIso?: string;
}): ScheduleDryRunResult;
```

**Duplicate constraints:**

- `legacy_id` must be `null`
- `published` must default `false`
- `show_on_home` must default `false`
- `home_order` must default `null`
- `actualWrite` must be `false`
- no insert call

## 10. DryRunResult common format

```ts
export type ScheduleDryRunResult = {
  module: "schedule";
  operation: "update" | "duplicate";
  targetTable: "schedules";
  targetId?: string;
  sourceId?: string;
  dryRun: true;
  wouldWrite: boolean;
  actualWrite: false;
  approvalId: string;
  validation: {
    ok: boolean;
    errors: string[];
    warnings: string[];
  };
  beforeSnapshot?: ScheduleDryRunSource;
  payload: Record<string, unknown>;
  derivedPreview?: {
    recalculatedYear?: number | null;
    recalculatedMonth?: string | null;
    scheduleGroup?: "future" | "past";
  };
  rollbackHint: string;
  message: string;
  safety: {
    dbClientReceived: false;
    supabaseWriteCalled: false;
    scheduleMonthsTouched: false;
    deleteEnabled: false;
    nonDryRunEnabled: false;
  };
};
```

**Migration note:** Current scaffold uses `validation.valid` and `wouldWrite: true` even on validation failure. Implementation phase may align to `validation.ok` and conditional `wouldWrite` as defined above.

## 11. actualWrite:false guard design

The dry-run adapter must hard-code `actualWrite: false`.

`actualWrite` must not be accepted as a caller-provided option.  
`dryRun` must be literal `true`.  
The adapter must not accept a mode parameter such as `dryRun: false`.

**Forbidden design:**

```ts
// Do not design this:
runScheduleWrite({ dryRun: boolean });
```

**Preferred design:**

```ts
// Prefer explicit dry-run only functions:
buildScheduleUpdateDryRunResult(...);
buildScheduleDuplicateDryRunResult(...);
```

**Guard helpers (future `schedule-dry-run-guards.ts`):**

```ts
export function assertDryRunOnlyResult(
  result: ScheduleDryRunResult,
): asserts result is ScheduleDryRunResult & { actualWrite: false; dryRun: true } {
  if (result.actualWrite !== false || result.dryRun !== true) {
    throw new Error("Schedule dry-run adapter must return actualWrite:false");
  }
}
```

## 12. DB client boundary

The dry-run adapter must not accept a Supabase client.  
It must not import Supabase client helpers.  
It should be a pure function where possible.

**Allowed inputs:**

- source record object
- form input object
- approval ID
- current date/time if needed for grouping preview

**Forbidden inputs:**

- supabase client
- service role key
- env secrets
- fetch write endpoints

## 13. Validation integration

The adapter should call or reuse `schedule-dry-run-validation.ts` helpers. Validation should happen before result creation, but even invalid results should remain dry-run-only.

**Recommended behavior on validation failure:**

```txt
If validation fails:
- validation.ok: false
- wouldWrite: false
- actualWrite: false
- payload may be included for preview
```

`wouldWrite` may be `boolean` (not always `true`) to distinguish “would have written if valid” from invalid preview-only results.

## 14. Derived preview

**Derived preview may include:**

- `recalculatedYear` from `date`
- `recalculatedMonth` from `date` as `YYYY-MM`
- `scheduleGroup`: `future` | `past` (compare `date` to `todayIso`)

**Constraint:**

```txt
Derived preview must not update year/month in DB.
```

## 15. Rollback hint strategy

**Update:**

```txt
Use beforeSnapshot to show rollback values.
Manual rollback would restore previous field values by id.
```

**Duplicate:**

```txt
No row is created.
If this were a real insert, rollback would delete the created row by id.
```

## 16. UI integration plan

**No UI changes in this phase.** Future integration:

```txt
Future UI integration:
- replace UI-local dry-run result construction with ScheduleDryRunAdapter
- keep UI rendering behavior unchanged
- keep actualWrite:false result display
- verify no Supabase write methods are introduced
```

**Migration steps (implementation phase):**

1. Implement `schedule-dry-run-adapter.ts` as pure functions
2. Wire `staging-schedule-dry-run-ui.ts` to call adapter instead of `schedule-dry-run-payload.ts` directly
3. Keep `schedule-dry-run-payload.ts` as thin re-exports or deprecate after adapter parity
4. Re-run manual browser verification

## 17. Real write adapter separation

**ScheduleWriteAdapter** is not created in this phase.

```txt
ScheduleWriteAdapter must be created in a separate approved phase.
It must not share a generic mode flag with dry-run adapter.
It must require separate approval ID, RLS/GRANT review, rollback plan, and manual staging PoC.
```

| Concern | ScheduleDryRunAdapter | ScheduleWriteAdapter (future) |
|---------|----------------------|------------------------------|
| DB client | never | staging anon + RLS (future) |
| `actualWrite` | always `false` | may be `true` when approved |
| Approval | `G-6-e3-schedule-dry-run-adapter-*` | `G-6-e4-schedule-write-adapter-*` |
| Mode flag | none | none — separate module |

## 18. Approval IDs

```txt
Dry-run adapter planning:
G-6-e3-schedule-dry-run-adapter-planning

Future dry-run adapter implementation:
G-6-e3-schedule-dry-run-adapter-implementation

Future write adapter planning:
G-6-e4-schedule-write-adapter-planning

Future non-dry-run PoC:
G-6-e5-schedule-non-dry-run-poc
```

## 19. Gate decision

```txt
readyForG6E3ScheduleDryRunAdapterImplementation: true
readyForG6EWriteAdapterPlanning: false
readyForG6EWriteImplementation: false
readyForNonDryRunSchedulePoC: false
```

Adapter implementation (next phase) remains **dry-run only** — no real writes.

## 20. Recommended next phase

```txt
Recommended next:
G-6-e3-schedule-dry-run-adapter-implementation
```

**Scope:**

```txt
Implement pure dry-run adapter functions only.
Do not implement real writes.
Do not change UI behavior beyond routing dry-run result creation through the adapter.
```

## 21. Final safety statement

This phase is planning only.

No adapter code is implemented.  
No schedule records are written.  
No schema is changed.  
No production data is touched.  
No `/admin` route is connected.

Schedule write implementation remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-dry-run-adapter-planning.mjs \
  --out-dir tools/static-to-astro/output/schedule-dry-run-adapter-planning/gosaki
```
