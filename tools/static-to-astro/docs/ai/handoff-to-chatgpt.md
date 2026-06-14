Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-f9-schedule-optimistic-lock-enablement-planning (completed — planning only)
Latest completed phase: G-6-f9-schedule-optimistic-lock-enablement-planning
Recommended next phase: G-6-f10-schedule-optimistic-lock-enablement-implementation
```

---

## 3. Current state summary

G-6-f8 trigger active on staging. G-6-f9 planning documents how to wire `expectedBeforeUpdatedAt` into general write path and new field slices. Adapter lock logic exists in `schedule-write-adapter.ts`; PoC triggers do not use it (frozen). No DB write in G-6-f9.

---

## 4. Optimistic lock state

```txt
adapter expectedBeforeUpdatedAt: implemented (schedule-write-adapter.ts)
types expectedBeforeUpdatedAt: implemented (schedule-write-types.ts)
guards: no lock (adapter-only by design)
G-6-e5 / G-6-f6 PoC: lock disabled (frozen)
general UI / new slices: not wired
readyForOptimisticLockEnablement: true
optimisticLockWiredInProductPath: false
```

---

## 5. Gate state

```txt
scheduleUpdatedAtStagingMigrationSucceeded: true
scheduleUpdatedAtTriggerActiveOnStaging: true
scheduleOptimisticLockPlanningComplete: true
rollbackNeeded: false
cursorExecutedSqlInLatestPhase: false
dbWriteInLatestPhase: false
runButtonClickedInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-optimistic-lock-enablement-planning.md
tools/static-to-astro/docs/schedule-updated-at-staging-migration-execution-result.md
tools/static-to-astro/docs/schedule-write-hardening-and-updated-at-planning.md
tools/static-to-astro/docs/ai/00-current-state.md
src/lib/admin/staging-write/schedule-write-adapter.ts
```
