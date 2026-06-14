# Schedule title non-dry-run slice implementation (G-6-g1)

Last updated: 2026-06-14  
Phase: `G-6-g1-schedule-title-non-dry-run-slice-implementation`  
Type: **implementation only** — no DB write, no Supabase SQL, no Save click, no Run click

## Purpose

Implement G-6-g1 title-only non-dry-run slice UI and product write path on staging shell, per preflight doc. Save button wired but **not executed** in this phase.

**This phase performed:** guards, approval ID, config, UI, trigger, verify script, build.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL, non-dry-run execution, Save/Run click, PoC re-arm, `/admin` changes.

## Implementation summary

| Area | Deliverable |
| --- | --- |
| Approval ID | `G-6-g1-schedule-title-non-dry-run-slice` in `schedule-write-types.ts` |
| Guard | `assertG6G1TitlePayloadOnly` in `schedule-write-guards.ts` |
| Config | `schedule-general-edit-config.ts` — env `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED` |
| Dry-run | `schedule-title-dry-run.ts` — title-only preview |
| Save trigger | `schedule-g6g1-title-non-dry-run-trigger.ts` → `executeScheduleGeneralUpdateWrite` |
| UI | `AdminStagingScheduleGeneralEditSection.astro` + `staging-schedule-general-edit-ui.ts` |
| Placement | `#schedule` below `ScheduleAdminUi`, above G-6-f4/f6 sections |

## Changed / new files

```txt
src/lib/admin/staging-write/schedule-write-types.ts
src/lib/admin/staging-write/schedule-write-guards.ts
src/lib/admin/staging-write/schedule-general-edit-config.ts (new)
src/lib/admin/staging-write/schedule-title-dry-run.ts (new)
src/lib/admin/staging-write/schedule-g6g1-title-non-dry-run-trigger.ts (new)
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts (new)
tools/static-to-astro/config/admin/schedule-general-edit-g6g1.json (new)
tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleGeneralEditSection.astro (new)
tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro
tools/static-to-astro/scripts/verify-schedule-g6g1-title-guard.mjs (new)
```

## Safety result

```txt
DB write: none
Supabase SQL executed: none
Save button click: none
Run button click: none
G-6-e5 / G-6-f6 PoC: unchanged, not re-armed
/admin: not modified
schedule_months: read-only / derived (not touched)
service_role: not used
```

## Approval ID

```txt
G-6-g1-schedule-title-non-dry-run-slice
```

Registered in `SCHEDULE_WRITE_APPROVAL_IDS`. G-6-e5 / G-6-f6 IDs unchanged.

## Env gate

```txt
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
```

Full arm stack documented in UI. Separated from G-6-e5 `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN` and G-6-f6 `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED`.

## Title-only guard

`assertG6G1TitlePayloadOnly` — allows `title` only; rejects venue, description, updated_at, etc.

## Optimistic lock path

```txt
Save → executeG6G1TitleNonDryRunSave
     → executeScheduleGeneralUpdateWrite
     → buildScheduleLockedWriteRequest
     → expectedBeforeUpdatedAt from beforeSnapshot.updated_at
```

Stale blocks Save; reload required; no auto-retry.

## Dry-run first

Save enabled only when:

```txt
[ ] Preview succeeded for current title
[ ] changedFields === ["title"]
[ ] !staleDetected
[ ] readSource === supabase
[ ] approval ID confirm matches
[ ] env armed
[ ] target row === aa440e29-5be8-402e-9190-0d81c48434c0
[ ] title unchanged since preview
```

## Non-dry-run Save

UI and code path wired. **Not executed** in implementation phase.

## Verification

```bash
node --experimental-strip-types tools/static-to-astro/scripts/verify-schedule-g6g1-title-guard.mjs
node --experimental-strip-types tools/static-to-astro/scripts/verify-schedule-optimistic-lock-utils.mjs
npm run build
```

## Next phase: final preflight

`G-6-g1-schedule-title-non-dry-run-slice-final-preflight`

Confirm before execution:

```txt
[ ] beforeSnapshot SQL (SELECT only)
[ ] Supabase host = kmjqppxjdnwwrtaeqjta.supabase.co
[ ] title still <>
[ ] venue / description match G-6-f6
[ ] dev command with arm stack
[ ] UI checklist (Preview → Save gates)
[ ] rollback SQL ready
```

## Gate decision

```txt
scheduleTitleNonDryRunSliceImplementationComplete: true
readyForG6G1ScheduleTitleNonDryRunSliceFinalPreflight: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: false
nonDryRunSaveUiExposed: true
nonDryRunSaveExecuted: false
rollbackNeeded: false
```

## Related docs

- [schedule-title-non-dry-run-slice-preflight.md](./schedule-title-non-dry-run-slice-preflight.md)
- [schedule-general-edit-ui-planning.md](./schedule-general-edit-ui-planning.md)
- [schedule-optimistic-lock-enablement-implementation.md](./schedule-optimistic-lock-enablement-implementation.md)
