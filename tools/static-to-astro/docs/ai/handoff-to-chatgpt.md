Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g-schedule-general-edit-ui-planning (completed — planning only)
Latest completed phase: G-6-g-schedule-general-edit-ui-planning
Latest commit: af0dd8b — Enable schedule optimistic lock product path.
Recommended next phase: G-6-g1-schedule-title-non-dry-run-slice-preflight
```

---

## 3. Current state summary

G-6-g planning defines general edit UI in `#schedule` staging shell, dry-run-first UX, G-6-g* approval IDs, env gates, and G-6-g1 title as first non-dry-run slice. Product write path (`executeScheduleGeneralUpdateWrite`) ready from G-6-f10. PoCs frozen. No DB write in G-6-g.

---

## 4. General edit UI planning highlights

```txt
New section (impl): AdminStagingScheduleGeneralEditSection below ScheduleAdminUi
PoC boundary: G-6-e5 / G-6-f6 unchanged; separate approval IDs
G-6-g1 approval: G-6-g1-schedule-title-non-dry-run-slice
G-6-g1 target row: aa440e29-5be8-402e-9190-0d81c48434c0 (recommended first)
Dry-run preview: required before Save
Stale: blocks non-dry-run; reload required
```

---

## 5. Gate state

```txt
scheduleGeneralEditUiPlanningComplete: true
readyForScheduleGeneralEditUiImplementation: true
readyForG6G1ScheduleTitleNonDryRunSlicePreflight: true
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: false
rollbackNeeded: false
dbWriteInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-general-edit-ui-planning.md
tools/static-to-astro/docs/schedule-optimistic-lock-enablement-implementation.md
src/lib/admin/staging-write/schedule-general-update-trigger.ts
tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro
tools/static-to-astro/docs/ai/00-current-state.md
```
