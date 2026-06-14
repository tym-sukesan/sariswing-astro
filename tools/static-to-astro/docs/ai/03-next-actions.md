Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g1-schedule-title-non-dry-run-slice-final-preflight`

G-6-g1 final preflight complete. beforeSnapshot / afterVerification / rollback SQL, dev command, UI procedure, and Save checklist documented. No DB write / Save in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-title-non-dry-run-slice-final-preflight.md`

**Recommended next phase:** `G-6-g1-schedule-title-non-dry-run-slice-execution`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: <> (expected before execution)
  venue: [CMS Kit staging] G-6-f6 venue PoC
  description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
nonDryRunSaveUiExposed: true (gated off by default)
nonDryRunSaveExecuted: false
readyForG6G1ScheduleTitleNonDryRunSliceExecution: true
rollbackNeeded: false
```

## 3. Execution prerequisites

Operator must complete before Save:

```txt
[ ] beforeSnapshot SQL on static-to-astro-cms-staging (SELECT only)
[ ] Record exact updated_at baseline
[ ] Dev server with G-6-g1 arm stack (inline env)
[ ] Staging admin auth session
[ ] Preview → changedFields ["title"] → no stale
[ ] Approval ID confirm → Save enabled
[ ] Manual Save once (execution phase only)
```

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-g1 preflight | **DONE** |
| G-6-g1 implementation | **DONE** |
| G-6-g1 final-preflight | **DONE** |
| G-6-g1 execution | **Next** (user manual Save once) |

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
