# Schedule Write Adapter Planning

**Phase:** `G-6-e4-schedule-write-adapter-planning`  
**Approval ID (planning):** `G-6-e4-schedule-write-adapter-planning`  
**Prerequisites:** [schedule-dry-run-adapter-verification-result.md](./schedule-dry-run-adapter-verification-result.md), [schedule-schema-read-audit-result.md](./schedule-schema-read-audit-result.md)

## 1. Purpose

This document plans the real Schedule write adapter before implementation.

It does not implement the write adapter.  
It does not write schedule records.  
It does not change database schema.  
It does not change RLS policies or grants.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Current status

```txt
Schedule dry-run adapter implementation and verification are complete.
The UI is routed through the dry-run adapter.
actualWrite:false has been manually verified.
The next step is planning only for a future real write adapter.
```

**Completed prerequisites:**

```txt
G-6-e2-schedule-dry-run-ui-scaffold: DONE
G-6-e2-schedule-dry-run-ui-verification-result: DONE
G-6-e3-schedule-dry-run-adapter-planning: DONE
G-6-e3-schedule-dry-run-adapter-implementation: DONE
G-6-e3-schedule-dry-run-adapter-verification: DONE
G-6-e3-schedule-dry-run-adapter-verification-result: DONE

manualBrowserVerification: pass
adapterRoutedDryRunUiVerified: true
actualWriteFalseVerified: true
duplicatePayloadSafetyValuesVerified: true
writeAdaptersImplemented: false
dbWritesPerformed: false
```

## 3. Why write adapter planning is separate

The dry-run adapter is intentionally pure and accepts no DB client.

The real write adapter must be designed separately so it cannot be enabled by passing `dryRun:false`.

This separation reduces the risk of accidental writes.

**Do not create a generic function like `runScheduleWrite({ dryRun: boolean })`.**

**Recommended module split:**

```txt
- ScheduleDryRunAdapter: pure functions, no DB client
- ScheduleWriteAdapter: separate module, separate approval, separate RLS/GRANT review
```

| Concern | ScheduleDryRunAdapter (done) | ScheduleWriteAdapter (future) |
|---------|------------------------------|-------------------------------|
| DB client | never | staging authenticated client only |
| `actualWrite` | always `false` | `true` only when approved PoC runs |
| `dryRun` | always `true` | no dry-run mode — separate module |
| Approval | `G-6-e3-schedule-dry-run-adapter-*` | `G-6-e4-*` / `G-6-e5-*` |
| Mode flag | none | none — separate module |

## 4. Proposed first write scope

**First real write scope:**

```txt
- staging only
- update existing pre-seeded schedule row only
- one row only
- one operation only
- no insert
- no duplicate
- no delete
- no schedule_months write
- no publish/deploy trigger
```

**Reason:**

```txt
Updating a known pre-seeded row is safer than creating new rows.
It avoids legacy_id uniqueness issues.
It avoids schedule_months count/route updates.
It makes rollback by before snapshot straightforward.
```

Consistent with G-6-d profile non-dry-run success path ([staging-profile-write-hardening.md](./staging-profile-write-hardening.md)).

## 5. Operation decision

| Operation | First write phase? | Reason |
|-----------|-------------------|--------|
| update existing schedule | YES | safest first non-dry-run operation |
| duplicate schedule | NO | implies insert and legacy_id handling |
| create schedule | NO | implies insert and month/count decisions |
| delete schedule | NO | destructive; exclude until much later |
| schedule_months update | NO | derived/read model for MVP |

## 6. Target table and columns

**Target table:**

```txt
public.schedules
```

**First update candidate columns:**

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
updated_at
```

**`updated_at` handling options:**

| Option | Description |
|--------|-------------|
| A | client payload includes `updated_at` |
| B | DB trigger handles `updated_at` |
| C | leave current behavior for first PoC |

**Recommendation:**

```txt
For the first PoC, avoid introducing updated_at trigger changes.
If the existing write path requires updated_at, include it explicitly.
Do not implement updated_by in this phase.
```

## 7. Excluded fields

The following fields are excluded from the first write adapter:

```txt
legacy_id
year
month
image_url
home_image_url
source_file
source_route
created_at
updated_by
```

**Reason:**

```txt
- legacy_id is unique and should not be modified casually
- year/month may be derived from date in a future phase
- source fields are import metadata
- image fields are out of scope
- updated_by requires separate hardening
```

## 8. RLS / GRANT current state

Based on [schedule-schema-read-audit-result.md](./schedule-schema-read-audit-result.md) (G-6-e1 audit):

**schedules grants currently observed:**

```txt
- anon SELECT
- authenticated SELECT

No authenticated INSERT/UPDATE grants were observed for schedules.
TRUNCATE / TRIGGER / REFERENCES are absent after cleanup.
```

**Important conclusion:**

```txt
Current grants are enough for read/list/dry-run UI.
Current grants may not be enough for real UPDATE.
Before non-dry-run update, authenticated UPDATE grant must be reviewed and possibly added manually in a separate approved phase.
```

Reference: [staging-rls-grant-cleanup-result.md](./staging-rls-grant-cleanup-result.md)

## 9. RLS policy current state

**Current policies on `public.schedules`:**

```txt
schedules_public_select:
- roles: anon, authenticated
- cmd: SELECT
- qual: published = true

schedules_admin_all:
- roles: authenticated
- cmd: ALL
- qual: is_admin()
- with_check: is_admin()
```

**Evaluation:**

```txt
RLS appears to allow admin-only writes in principle through is_admin().
However, table-level UPDATE grant for authenticated may still be required.
```

**Note:**

```txt
This planning phase does not change RLS or GRANT.
```

## 10. Pre-flight manual SQL needed later

Read-only confirmation SQL for a **future** approved phase. Cursor does not execute these in this phase.

### Check current grants

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
```

### Check target test row

```sql
select *
from public.schedules
where id = '<target-schedule-id>';
```

Or by `legacy_id`:

```sql
select *
from public.schedules
where legacy_id = '<target-legacy-id>';
```

### Check admin row for current user

```sql
select user_id, email, role
from public.admin_users
where email = '<your-admin-email>';
```

**Note:** Do not include real email in committed docs. Use placeholders only.

## 11. Required GRANT planning

Future GRANT that may be required — **planning only**. Do not run in this phase.

```sql
-- PLANNING ONLY. Do not run in this phase.
-- grant update on table public.schedules to authenticated;
```

```txt
Do not grant INSERT for first update-only PoC.
Do not grant DELETE.
Do not grant TRUNCATE/TRIGGER/REFERENCES.
```

**Important:**

```txt
This SQL must not be run in this phase.
A separate G-6-e4-grant-prep or G-6-e5-poc-prep phase is required before any grant change.
```

Suggested future approval ID for grant prep: `G-6-e4-schedule-update-grant-prep`

## 12. Write adapter boundary design

**Future file candidates (not implemented in this phase):**

```txt
src/lib/admin/staging-write/schedule-write-adapter.ts
src/lib/admin/staging-write/schedule-write-types.ts
src/lib/admin/staging-write/schedule-write-guards.ts
```

**ScheduleWriteAdapter responsibilities:**

```txt
- accept authenticated Supabase client only in staging
- accept explicit approval ID
- accept target id
- accept validated payload
- require before snapshot
- perform exactly one update operation
- return WriteResult
- never handle delete
- never handle schedule_months
- never trigger publish/deploy
```

**Non-responsibilities:**

```txt
- no duplicate/create/delete paths
- no schedule_months writes
- no Storage upload
- no publish / GitHub dispatch / FTP deploy
- no production project connection
- no service_role key
- no /admin route wiring in first PoC
```

## 13. Write adapter input design

Planning-only type sketch (do not implement now):

```ts
export type ScheduleWriteOperation = "update";

export type ScheduleUpdateWriteInput = {
  approvalId: "G-6-e5-schedule-non-dry-run-poc";
  targetId: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: {
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
};
```

Reuse `ScheduleDryRunSource` from [schedule-dry-run-types.ts](../../../src/lib/admin/staging-write/schedule-dry-run-types.ts) for snapshot shape parity with dry-run adapter.

## 14. Write result design

Planning-only type sketch (do not implement now):

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
  payload: Record<string, unknown>;
  afterSnapshot?: ScheduleDryRunSource;
  rollbackHint: string;
  safety: {
    stagingOnly: true;
    productionBlocked: true;
    scheduleMonthsTouched: false;
    deleteEnabled: false;
    publishTriggered: false;
  };
};
```

**Important:**

```txt
This type is planning only.
Do not implement it now.
```

Contrast with dry-run result: `dryRun: true`, `actualWrite: false`, `wouldWrite: true` when validation passes.

## 15. Approval ID design

```txt
Planning phase:
G-6-e4-schedule-write-adapter-planning

Future write adapter implementation planning:
G-6-e4-schedule-write-adapter-implementation-planning

Future grant prep:
G-6-e4-schedule-update-grant-prep

Future first non-dry-run PoC:
G-6-e5-schedule-non-dry-run-poc
```

**Recommended first non-dry-run approval ID:**

```txt
G-6-e5-schedule-non-dry-run-poc
```

No write adapter code or non-dry-run UI may run without the matching approval ID constant.

## 16. Before snapshot and rollback

**Before any non-dry-run update:**

```txt
- fetch target row
- store beforeSnapshot in result/report
- update only allowed fields
- fetch after row
- compare changed fields
- rollback plan must restore beforeSnapshot values by id
```

**First PoC field change recommendation:**

```txt
Change one low-risk field only (e.g. append to description).
Avoid toggling published/show_on_home in the first PoC unless explicitly approved.
```

**Rollback SQL (planning only — do not run in this phase):**

```sql
-- PLANNING ONLY. Do not run in this phase.
-- Restore beforeSnapshot values for target id:
-- update public.schedules
-- set
--   date = '<before-date>',
--   title = '<before-title>',
--   venue = '<before-venue>',
--   open_time = '<before-open_time>',
--   start_time = '<before-start_time>',
--   price = '<before-price>',
--   description = '<before-description>',
--   published = <before-published>,
--   show_on_home = <before-show_on_home>,
--   home_order = <before-home_order>,
--   sort_order = <before-sort_order>,
--   updated_at = '<before-updated_at>'
-- where id = '<target-schedule-id>';
```

**Rollback hint string (future adapter):**

```txt
Restore schedules row <id> using beforeSnapshot from WriteResult or PoC report.
Run rollback SQL manually in Supabase SQL Editor after PoC verification.
```

## 17. Pre-seeded test row policy

```txt
Use an existing staging row; prefer published=false for first PoC.
Do not commit real row ids or legacy_ids in docs — record in local PoC report only.
Identify target row manually in a future prep phase using read-only SQL (§10).
Dedicated test row is safer than mutating production-like published content.
Existing audit noted 60 schedule rows; a dedicated unpublished test row is recommended before non-dry-run.
```

**Selection criteria (future prep phase):**

```txt
- staging project only (static-to-astro-cms-staging)
- published = false preferred
- known legacy_id for easy lookup
- non-critical content (safe to mutate and restore)
- beforeSnapshot captured and stored before any write
```

## 18. Manual verification plan (future phases)

This phase performs no manual DB verification. Future phases should follow:

```txt
1. Run read-only pre-flight SQL (§10) in Supabase SQL Editor
2. Confirm authenticated UPDATE grant exists (after separate grant prep)
3. Confirm admin_users row for test user (is_admin() path)
4. Run dry-run UI one more time; confirm actualWrite:false
5. Execute write adapter or manual PoC with approval ID G-6-e5-schedule-non-dry-run-poc
6. Re-query target row; compare to beforeSnapshot
7. Confirm schedule_months unchanged (read-only derived model)
8. Confirm no publish/deploy side effects
9. Roll back using beforeSnapshot if PoC complete
10. Record result in G-6-e5 result doc (future)
```

**Staging shell URL (dry-run only until PoC approved):**

```txt
/__admin-staging-shell/musician-basic/
```

Non-dry-run Save UI is **not** planned in this phase.

## 19. Guard design (future implementation)

Future `schedule-write-guards.ts` should enforce:

```txt
- approvalId must equal G-6-e5-schedule-non-dry-run-poc (for first PoC)
- targetId must be non-empty UUID
- beforeSnapshot.id must match targetId
- payload must not include excluded fields (§7)
- operation must be update only
- staging host/project check (block production URLs)
- reject if scheduleMonthsTouched requested
- assert actualWrite:true and dryRun:false literals in result
```

**Keep separate from dry-run guards:**

```txt
schedule-dry-run-guards.ts — assertDryRunOnlyResult(), actualWrite:false
schedule-write-guards.ts — staging + approval + single-row update only
```

Do not merge guard modules with a shared `dryRun` boolean.

## 20. Gate decision

```txt
readyForG6E4ScheduleWriteAdapterPlanning: true (this document)
readyForG6E4ScheduleWriteAdapterImplementationPlanning: false until this doc is reviewed
readyForG6E4ScheduleUpdateGrantPrep: false until implementation planning completes
readyForG6EWriteImplementation: false
readyForNonDryRunSchedulePoC: false
writeAdaptersImplemented: false
dbWritesPerformed: false
grantChangesPerformed: false
policyChangesPerformed: false
```

Write adapter **implementation** and any **GRANT/RLS change** remain blocked after this planning phase.

## 21. Recommended next phase

```txt
Recommended next:
G-6-e4-schedule-write-adapter-implementation-planning
```

**Scope of next phase (still planning / design — no DB writes):**

```txt
- finalize write adapter function signatures and guard tests
- define static verification checklist for write adapter scaffold
- confirm grant prep SQL and manual apply checklist
- confirm pre-seeded row selection process (local only, not committed)
- still no ScheduleWriteAdapter DB calls
- still no GRANT/RLS execution
```

**Later sequence (after implementation planning):**

```txt
G-6-e4-schedule-update-grant-prep — manual GRANT review/apply (user in SQL Editor)
G-6-e4-schedule-write-adapter-implementation — write adapter code (staging guards, no UI non-dry-run yet)
G-6-e5-schedule-non-dry-run-poc — first manual staging update of one pre-seeded row
```

## 22. Final safety statement

This phase is **planning only**.

No write adapter code is implemented.  
No schedule records are written.  
No database schema is changed.  
No RLS policies or grants are changed.  
No SQL is executed by Cursor.  
No production data is touched.  
No `/admin` route is connected.

Schedule real write implementation remains blocked until separate approved phases complete.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-write-adapter-planning.mjs \
  --out-dir tools/static-to-astro/output/schedule-write-adapter-planning/gosaki
```
