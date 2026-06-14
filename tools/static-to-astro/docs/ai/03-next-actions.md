Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f10-schedule-optimistic-lock-enablement-implementation`

Optimistic lock wired in product path (`buildScheduleLockedWriteRequest`). Dry-run stale check on G-6-f3/f4 sections. No DB write / Run click.

**Doc:** `tools/static-to-astro/docs/schedule-optimistic-lock-enablement-implementation.md`

**Recommended next phase:** `G-6-g-schedule-general-edit-ui-planning`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: false
rollbackNeeded: false
```

## 3. Dry-run default

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true   # default; set false to disable lock token
```

Do not re-click G-6-e5 / G-6-f6 PoC Run buttons.

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f10 optimistic lock implementation | **DONE** |
| G-6-g general edit UI planning | **Next** |
| G-6-g1 title non-dry-run slice | After g planning |

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
