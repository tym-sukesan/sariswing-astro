Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-f8-schedule-updated-at-staging-migration-execution (completed — SUCCESS)
Latest completed phase: G-6-f8-schedule-updated-at-staging-migration-execution
Latest commit: (pending) — Record G-6-f8 schedule updated_at staging migration execution result
Recommended next phase: G-6-f9-schedule-optimistic-lock-enablement-planning
```

---

## 3. Current state summary

G-6-f8 execution succeeded on static-to-astro-cms-staging. Trigger `schedules_set_updated_at` + function `tg_schedules_set_updated_at` active. No-op UPDATE advanced updated_at; semantic fields unchanged. rollbackNeeded: false.

---

## 4. Staging trigger state

```txt
project: static-to-astro-cms-staging
function: public.tg_schedules_set_updated_at()
trigger: schedules_set_updated_at (BEFORE UPDATE on public.schedules)
schedule_months: no trigger added
script: scripts/supabase/schedules-updated-at-trigger.sql
```

---

## 5. Gate state

```txt
scheduleUpdatedAtStagingMigrationSucceeded: true
scheduleUpdatedAtTriggerActiveOnStaging: true
readyForOptimisticLockEnablement: true
rollbackNeeded: false
cursorExecutedSqlInLatestPhase: false
operatorExecutedSqlInLatestPhase: true
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-updated-at-staging-migration-execution-result.md
tools/static-to-astro/docs/schedule-write-hardening-and-updated-at-planning.md
tools/static-to-astro/docs/ai/00-current-state.md
```
