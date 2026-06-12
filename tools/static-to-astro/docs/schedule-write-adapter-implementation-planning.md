# Schedule Write Adapter Implementation Planning

**Phase:** `G-6-e4-schedule-write-adapter-implementation-planning`  
**Approval ID (planning):** `G-6-e4-schedule-write-adapter-implementation-planning`  
**Prerequisites:** [schedule-write-adapter-planning.md](./schedule-write-adapter-planning.md), [schedule-dry-run-adapter-verification-result.md](./schedule-dry-run-adapter-verification-result.md)

## 1. Purpose

This document plans the implementation of the real Schedule write adapter.

It does not implement the write adapter.  
It does not write schedule records.  
It does not change database schema.  
It does not change RLS policies or grants.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Current status

```txt
Schedule dry-run adapter is implemented and verified.
Schedule write adapter planning is complete.
Real write implementation is still blocked.
This phase prepares the implementation plan only.
```

**Completed prerequisites:**

```txt
G-6-e3-schedule-dry-run-adapter-implementation: DONE
G-6-e3-schedule-dry-run-adapter-verification-result: DONE
G-6-e4-schedule-write-adapter-planning: DONE

ScheduleDryRunAdapter:
- implemented
- pure function
- no DB client
- actualWrite:false hard-coded
- dryRun:true hard-coded
- update/duplicate dry-run verified
```

## 3. Implementation goal

```txt
Implement, in a later phase, a staging-only ScheduleWriteAdapter that can update exactly one existing schedule row when all guards pass.
```

**This phase does not implement the adapter.** It finalizes types, guards, function signatures, and verification criteria for a future `G-6-e4-schedule-write-adapter-implementation` phase (after grant prep).

## 4. First implementation scope

**First ScheduleWriteAdapter implementation scope:**

```txt
- update only
- existing schedule row only
- target table: public.schedules
- one row per call
- staging shell only
- authenticated Supabase client only
- approval ID required
- beforeSnapshot required
- validation required
- afterSnapshot fetch required if write succeeds
```

**Excluded:**

```txt
- insert
- duplicate
- create
- delete
- schedule_months write
- image upload
- publish/deploy trigger
- production
```

First write target: **one pre-seeded staging schedule row** (id chosen in local PoC prep only — not committed).

## 5. Proposed implementation files

**Not implemented in this phase.** Planned files for a future implementation phase:

```txt
src/lib/admin/staging-write/schedule-write-types.ts
src/lib/admin/staging-write/schedule-write-guards.ts
src/lib/admin/staging-write/schedule-write-adapter.ts
```

**Relationship to existing files:**

```txt
Reuse:
- schedule-dry-run-types.ts for ScheduleDryRunSource if appropriate
- schedule-dry-run-validation.ts for validation if appropriate

Do not modify:
- dry-run adapter to support real write
- dry-run adapter with mode flags
```

**Do not add** `runScheduleWrite({ dryRun: boolean })` or merge dry-run and write adapters.

## 6. Write operation type design

Planning-only types (implement in `schedule-write-types.ts` later):

```ts
export type ScheduleWriteOperation = "update";

export type ScheduleWriteApprovalId = "G-6-e5-schedule-non-dry-run-poc";

export type ScheduleUpdateWritePayload = {
  date?: string;
  title?: string | null;
  venue?: string | null;
  open_time?: string | null;
  start_time?: string | null;
  price?: string | null;
  description?: string | null;
  published?: boolean;
  show_on_home?: boolean;
  home_order?: number | null;
  sort_order?: number | null;
  updated_at?: string;
};
```

**Excluded from payload** (same as [schedule-write-adapter-planning.md](./schedule-write-adapter-planning.md) §7): `legacy_id`, `year`, `month`, image fields, source fields, `created_at`, `updated_by`.

## 7. Write input type design

```ts
export type ScheduleUpdateWriteInput = {
  approvalId: ScheduleWriteApprovalId;
  targetId: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  expectedBeforeUpdatedAt?: string | null;
};
```

**`expectedBeforeUpdatedAt` purpose:**

```txt
Optional optimistic safety check.
If provided, adapter can confirm the row has not changed since beforeSnapshot.
```

## 8. Supabase client boundary

Unlike the dry-run adapter, the real write adapter will need a Supabase client.

However, the client must be:

```txt
- authenticated user client
- never service_role
- only passed into the write adapter implementation
- never imported inside dry-run adapter
```

**Design sketch (narrow boundary for planning):**

```ts
export type ScheduleWriteClient = {
  from: (table: "schedules") => {
    update: (payload: ScheduleUpdateWritePayload) => unknown;
    select: (columns?: string) => unknown;
    eq: (column: string, value: string) => unknown;
    single: () => unknown;
  };
};
```

At implementation time, align with existing Supabase client types from the staging shell (same pattern as profile write PoC).

**Important:**

```txt
Do not use service_role.
Do not use admin API.
Do not use RPC.
```

## 9. Guard design

**Required guards** (future `schedule-write-guards.ts`):

```txt
- assertStagingWriteAllowed()
- assertApprovalId()
- assertUpdateOnlyOperation()
- assertTargetTableSchedules()
- assertBeforeSnapshotMatchesTarget()
- assertNoScheduleMonthsPayload()
- assertNoDeleteOperation()
- assertNoPublishTrigger()
```

Guards run **before** any client `.update()` call. On failure, return `ScheduleWriteFailureResult` with `actualWrite: false`.

### 9.1 Staging gate

Write adapter must require explicit staging write env/config flags. It must not run merely because the function exists.

**Future env gate candidates** (mirror G-6-d profile pattern; extend `staging-write-config.ts` in a later phase):

```txt
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-e5-schedule-non-dry-run-poc
PUBLIC_ADMIN_WRITE_DRY_RUN: non-dry-run (false) — manual PoC only; never committed
```

**This phase:**

```txt
This phase does not enable these flags.
This phase only documents the future guard requirement.
Default remains dry-run (PUBLIC_ADMIN_WRITE_DRY_RUN=true) for day-to-day staging work.
```

### 9.2 Approval ID guard

The adapter must only accept:

```txt
G-6-e5-schedule-non-dry-run-poc
```

**Reason:**

```txt
Prevents accidental write execution from generic calls.
```

Reject any other `approvalId` before touching the database.

## 10. Function signature design

**Operation-specific function** (not generic):

```ts
export async function updateScheduleWrite(input: {
  client: ScheduleWriteClient;
  approvalId: "G-6-e5-schedule-non-dry-run-poc";
  targetId: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  expectedBeforeUpdatedAt?: string | null;
}): Promise<ScheduleWriteResult | ScheduleWriteFailureResult>;
```

**Important:**

```txt
Function name must not be generic like runScheduleWrite.
It must be operation-specific.
```

No `insertScheduleWrite`, `deleteScheduleWrite`, or duplicate helpers in the first implementation.

## 11. Write result type design

```ts
export type ScheduleWriteResult = {
  module: "schedule";
  operation: "update";
  targetTable: "schedules";
  targetId: string;
  dryRun: false;
  actualWrite: true;
  approvalId: "G-6-e5-schedule-non-dry-run-poc";
  rowsAffected?: number;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  afterSnapshot?: ScheduleDryRunSource;
  changedFields: string[];
  rollbackHint: string;
  safety: {
    stagingOnly: true;
    productionBlocked: true;
    serviceRoleUsed: false;
    scheduleMonthsTouched: false;
    deleteEnabled: false;
    publishTriggered: false;
  };
};
```

`dryRun: false` and `actualWrite: true` are **literal types**, not runtime flags.

## 12. Failure result type

```ts
export type ScheduleWriteFailureResult = {
  module: "schedule";
  operation: "update";
  targetTable: "schedules";
  targetId?: string;
  dryRun: false;
  actualWrite: false;
  approvalId?: string;
  errorCode: string;
  errorMessage: string;
  beforeSnapshot?: ScheduleDryRunSource;
  payload?: ScheduleUpdateWritePayload;
  rollbackHint?: string;
  safety: {
    stagingOnly: true;
    productionBlocked: true;
    serviceRoleUsed: false;
    scheduleMonthsTouched: false;
    deleteEnabled: false;
    publishTriggered: false;
  };
};
```

**Reason:**

```txt
If a guard fails before write, actualWrite must remain false.
```

Suggested `errorCode` values: `STAGING_GATE_DENIED`, `APPROVAL_ID_MISMATCH`, `BEFORE_SNAPSHOT_MISMATCH`, `OPTIMISTIC_LOCK_FAILED`, `VALIDATION_FAILED`, `UPDATE_DENIED`, `UNEXPECTED_ERROR`.

## 13. Before / after snapshot flow

**Future non-dry-run update flow** (not executed in this phase):

```txt
1. Select target row by id
2. Store beforeSnapshot
3. Validate payload
4. Check approval ID and staging guards
5. Perform exactly one update on public.schedules by id
6. Select the same row again
7. Store afterSnapshot
8. Compute changedFields
9. Return ScheduleWriteResult
```

**Caller responsibility (future PoC):** fetch beforeSnapshot via existing read path (`staging-schedule-read.ts`) before invoking `updateScheduleWrite`. Adapter verifies `beforeSnapshot.id === targetId`.

**This phase does not implement this flow.**

## 14. Rollback plan

```txt
Rollback is manual for the first PoC.
Rollback restores beforeSnapshot fields by id.
Rollback SQL must be prepared before non-dry-run PoC.
```

**rollbackHint generation (future adapter):**

```txt
Include target id and list of changed field names.
Point to beforeSnapshot values stored in WriteResult / PoC report.
State that rollback is manual in Supabase SQL Editor.
```

**Rollback SQL template (planning only — do not run in this phase):**

```sql
-- PLANNING ONLY. Do not run in this phase.
-- restore public.schedules row from beforeSnapshot:
-- set
--   date = '<before-date>',
--   title = '<before-title>',
--   venue = '<before-venue>',
--   open_time = '<before-open-time>',
--   start_time = '<before-start-time>',
--   price = '<before-price>',
--   description = '<before-description>',
--   published = <before-published>,
--   show_on_home = <before-show-on-home>,
--   home_order = <before-home-order>,
--   sort_order = <before-sort-order>,
--   updated_at = '<before-updated-at>'
-- where id = '<target-id>';
```

## 15. RLS / GRANT dependency

```txt
Current schedules grants observed:
- anon SELECT
- authenticated SELECT

Real UPDATE likely requires:
- authenticated UPDATE on public.schedules (table-level grant)
- existing RLS policy schedules_admin_all with is_admin()
```

**Important:**

```txt
This implementation planning phase does not add UPDATE grant.
A separate grant-prep phase is required before non-dry-run execution.
```

**Next grant prep phase:**

```txt
G-6-e4-schedule-update-grant-prep
```

**Can implementation be coded before grant prep?**

```txt
Guarded write adapter code can be written in theory (Option A),
but non-dry-run execution remains blocked until grant exists and PoC is approved.
Recommended order: grant prep first, then write adapter implementation (see §16).
```

## 16. Implementation sequencing options

### Option A

```txt
Implement guarded write adapter first, but do not enable it until grant prep and PoC.
```

**Pros:**

```txt
Can review code before enabling DB write.
Keeps implementation and DB permission change separate.
```

**Cons:**

```txt
Code contains Supabase update call, so static safety expectations change.
Requires very clear gating.
```

### Option B

```txt
Do grant prep first, then implement write adapter.
```

**Pros:**

```txt
DB permission path clarified before code.
```

**Cons:**

```txt
Adds write permission before code is ready.
```

### Recommendation

```txt
Prefer Option A only if the write adapter remains inaccessible behind strict guards and no UI button is added.
Otherwise, do grant prep first.
```

**Final recommendation:**

```txt
Recommended next: G-6-e4-schedule-update-grant-prep
```

**Reason:**

```txt
Current grants appear SELECT-only. Confirming/preparing the minimum UPDATE grant before writing code clarifies the permission boundary.
```

**Sequence after grant prep:**

```txt
G-6-e4-schedule-update-grant-prep — review/apply minimum UPDATE grant (user manual SQL)
G-6-e4-schedule-write-adapter-implementation — guarded adapter code; no non-dry-run UI
G-6-e5-schedule-non-dry-run-poc — one manual staging update of one pre-seeded row
```

## 17. UI policy

```txt
Do not add a non-dry-run button in the next implementation.
Do not expose write adapter from UI until G-6-e5 PoC.
The staging shell may continue to show dry-run only.
```

Schedule dry-run UI (`staging-schedule-dry-run-ui.ts`) must **not** import `schedule-write-adapter.ts` until an explicit G-6-e5 UI phase is approved.

## 18. Verification plan for future implementation

When `G-6-e4-schedule-write-adapter-implementation` runs (future):

```txt
- src/pages/admin no diff
- no service_role import
- no insert/delete/upsert
- exactly one Supabase update call in schedule-write-adapter.ts only
- write adapter not imported by UI unless explicitly approved
- dry-run adapter remains pure (no DB client, no mode flag)
- schedule-write-guards.ts blocks without staging env + approval ID
- npm run build success
- report CLI success
- static grep: no write adapter wired to staging schedule dry-run UI
```

**Future report CLI candidate:** `report-schedule-write-adapter-implementation.mjs`

**Manual PoC verification (G-6-e5 only):** beforeSnapshot, afterSnapshot, changedFields, rollback executed, `schedule_months` unchanged.

## 19. Gate decision

```txt
readyForG6E4ScheduleUpdateGrantPrep: true (see schedule-update-grant-prep.md)
readyForG6E4ScheduleUpdateGrantManualApplyPrep: true
readyForG6E4ScheduleWriteAdapterImplementation: true (see schedule-update-grant-manual-apply-result.md)
readyForG6EWriteImplementation: false
readyForNonDryRunSchedulePoC: false
writeAdapterImplemented: false
dbWritesPerformed: false
grantChangesPerformed: false
policyChangesPerformed: false
```

Grant prep SQL is prepared; GRANT not executed. Write adapter **code** remains blocked.

## 20. Recommended next phase

```txt
Recommended next:
G-6-e4-schedule-update-grant-prep — DONE (see schedule-update-grant-prep.md)
G-6-e4-schedule-update-grant-manual-apply-prep — DONE (see schedule-update-grant-manual-apply-prep.md)
G-6-e4-schedule-update-grant-manual-apply-result — DONE (see schedule-update-grant-manual-apply-result.md)
Next: G-6-e4-schedule-write-adapter-implementation
```

**G-6-e4-schedule-update-grant-prep（完了）:** [schedule-update-grant-prep.md](./schedule-update-grant-prep.md) — authenticated UPDATE grant on `public.schedules` prepared; pre-check/after-verify/rollback SQL; is_admin() review required; INSERT/DELETE/TRUNCATE/TRIGGER/REFERENCES excluded.

**G-6-e4-schedule-update-grant-manual-apply-prep（完了）:** [schedule-update-grant-manual-apply-prep.md](./schedule-update-grant-manual-apply-prep.md) — final manual apply steps; abort conditions; result template.

**G-6-e4-schedule-update-grant-manual-apply-result（完了）:** [schedule-update-grant-manual-apply-result.md](./schedule-update-grant-manual-apply-result.md) — `authenticated UPDATE` applied in staging; dry-run smoke test pass; readyForG6E4ScheduleWriteAdapterImplementation: true; non-dry-run PoC remains blocked.

## 21. Final safety statement

This phase is planning only.

No write adapter code is implemented.  
No schedule records are written.  
No schema is changed.  
No RLS policy or GRANT is changed.  
No production data is touched.  
No `/admin` route is connected.

Schedule write implementation remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-write-adapter-implementation-planning.mjs \
  --out-dir tools/static-to-astro/output/schedule-write-adapter-implementation-planning/gosaki
```
