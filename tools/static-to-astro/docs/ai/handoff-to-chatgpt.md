Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro
- **Goal:** Generalize Sariswing Astro + Supabase CMS into a reusable CMS Kit.

---

## 2. Current phase

```txt
Current phase: G-6-f8-schedule-updated-at-staging-migration-preflight (completed)
Latest completed phase: G-6-f8-schedule-updated-at-staging-migration-preflight
Latest commit: (pending) — Document schedule updated_at staging migration preflight (G-6-f8)
Recommended next phase: G-6-f8-schedule-updated-at-staging-migration-execution
```

---

## 3. Current state summary

G-6-f8 preflight doc prepared for schedules updated_at trigger on staging only. Function `tg_schedules_set_updated_at`, trigger `schedules_set_updated_at`. Pre/post SQL templates and rollback documented. No SQL executed in preflight.

---

## 4. Migration pattern

```txt
Repo: scripts/supabase/*.sql (manual SQL Editor)
No supabase/migrations/ folder
Staging project: static-to-astro-cms-staging only
```

---

## 5. Gate state

```txt
scheduleUpdatedAtStagingMigrationPreflightComplete: true
readyForScheduleUpdatedAtStagingMigrationExecution: true
sqlExecutedInLatestPhase: false
dbWritesInLatestPhase: false
runButtonClickedInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-updated-at-staging-migration-preflight.md
tools/static-to-astro/docs/schedule-write-hardening-and-updated-at-planning.md
tools/static-to-astro/docs/ai/00-current-state.md
```
