Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g1-schedule-title-non-dry-run-slice-implementation`

G-6-g1 title slice UI, guard, approval ID, env gate, and Save path implemented. Save not executed in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-title-non-dry-run-slice-implementation.md`

**Recommended next phase:** `G-6-g1-schedule-title-non-dry-run-slice-final-preflight`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
  title: <>
  venue: [CMS Kit staging] G-6-f6 venue PoC
  description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
nonDryRunSaveUiExposed: true (gated off by default)
nonDryRunSaveExecuted: false
readyForG6G1ScheduleTitleNonDryRunSliceFinalPreflight: true
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
| G-6-g1 title slice preflight | **DONE** |
| G-6-g1 title slice implementation | **DONE** |
| G-6-g1 title slice final-preflight | **Next** |
| G-6-g1 title slice execution | After final-preflight + user approval |

## 5. Final preflight scope (next phase)

```txt
[ ] beforeSnapshot SQL (SELECT only)
[ ] Supabase host verification
[ ] dev command with G-6-g1 arm stack
[ ] UI checklist (Preview → Save gates)
[ ] rollback SQL ready
No DB write in final-preflight unless user approves execution phase
```

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
