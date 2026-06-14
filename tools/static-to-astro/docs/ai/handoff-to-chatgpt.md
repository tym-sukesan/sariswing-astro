Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-f10-schedule-optimistic-lock-enablement-implementation (completed)
Latest completed phase: G-6-f10-schedule-optimistic-lock-enablement-implementation
Recommended next phase: G-6-g-schedule-general-edit-ui-planning
```

---

## 3. Current state summary

G-6-f10 wired optimistic lock into general write path via `buildScheduleLockedWriteRequest` / `executeScheduleGeneralUpdateWrite`. Dry-run sections (G-6-f3/f4) perform SELECT-only stale checks on preview. PoC triggers unchanged. No DB write in G-6-f10.

---

## 4. Optimistic lock state

```txt
adapter expectedBeforeUpdatedAt: implemented + normalized compare
product path wiring: buildScheduleLockedWriteRequest (G-6-f10)
dry-run stale check: SELECT only on preview
G-6-e5 / G-6-f6 PoC: frozen (no lock)
nonDryRunSaveUiExposed: false
optimisticLockWiredInProductPath: true
```

---

## 5. Gate state

```txt
scheduleOptimisticLockImplementationComplete: true
scheduleOptimisticLockPlanningComplete: true
rollbackNeeded: false
dbWriteInLatestPhase: false
runButtonClickedInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-optimistic-lock-enablement-implementation.md
tools/static-to-astro/docs/schedule-optimistic-lock-enablement-planning.md
src/lib/admin/staging-write/schedule-general-update-trigger.ts
src/lib/admin/staging-write/schedule-write-utils.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
