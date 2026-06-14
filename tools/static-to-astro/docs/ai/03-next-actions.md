Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-g-schedule-general-edit-ui-planning`

General Schedule edit UI design complete. Dry-run-first UX, approval IDs, env gates, optimistic lock UX documented. No implementation / DB write in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-general-edit-ui-planning.md`

**Recommended next phase:** `G-6-g1-schedule-title-non-dry-run-slice-preflight`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: false
readyForScheduleGeneralEditUiImplementation: true
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
| G-6-g1 title slice preflight | **Next** |
| G-6-g1 title slice implementation | Planned |
| G-6-g1 title slice execution | After preflight + user approval |

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
