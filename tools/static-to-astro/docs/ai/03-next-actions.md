Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g1-schedule-title-non-dry-run-slice-preflight`

G-6-g1 title slice preflight complete. Target row, payload, approval ID, env gate, rollback, and after-verification documented. No implementation / DB write in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-title-non-dry-run-slice-preflight.md`

**Recommended next phase:** `G-6-g1-schedule-title-non-dry-run-slice-implementation`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: <>
  venue: [CMS Kit staging] G-6-f6 venue PoC
  description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: false
readyForG6G1ScheduleTitleNonDryRunSliceImplementation: true
rollbackNeeded: false
```

## 3. Dry-run default

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
```

Do not re-click G-6-e5 / G-6-f6 PoC Run buttons.

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-g general edit UI planning | **DONE** |
| G-6-g1 title slice preflight | **DONE** |
| G-6-g1 title slice implementation | **Next** |
| G-6-g1 title slice final-preflight | Planned |
| G-6-g1 title slice execution | After implementation + user approval |

## 5. G-6-g1 implementation scope (next phase)

```txt
[ ] schedule-write-types.ts — G6G1 approval ID + union
[ ] schedule-write-guards.ts — assertG6G1TitlePayloadOnly
[ ] schedule-general-edit-config.ts — env gates
[ ] AdminStagingScheduleGeneralEditSection — title field + preview + gated Save
[ ] staging-schedule-general-edit-ui.ts — dry-run + save via executeScheduleGeneralUpdateWrite
[ ] npm run build
No DB write / Save execution in implementation phase
```

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
