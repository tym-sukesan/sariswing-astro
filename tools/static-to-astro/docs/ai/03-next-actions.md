Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f9-schedule-optimistic-lock-enablement-planning`

Optimistic lock enablement design complete. Adapter already supports `expectedBeforeUpdatedAt`; wiring deferred to G-6-f10. No DB write / SQL / Run click in this phase.

**Doc:** `tools/static-to-astro/docs/schedule-optimistic-lock-enablement-planning.md`

**Recommended next phase:** `G-6-f10-schedule-optimistic-lock-enablement-implementation`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
Function: public.tg_schedules_set_updated_at()
Target row updated_at: 2026-06-14 06:49:42.240919+00
optimisticLockWiredInProductPath: false (adapter ready; no caller passes expectedBeforeUpdatedAt)
rollbackNeeded: false
```

## 3. Dry-run default

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

Do not re-click G-6-e5 / G-6-f6 PoC Run buttons.

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f8 migration execution | **DONE** |
| G-6-f9 optimistic lock planning | **DONE** |
| G-6-f10 optimistic lock implementation | **Next** |
| G-6-g general edit UI planning | Planned |
| G-6-g1 title non-dry-run slice | After f10 + g planning |

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
