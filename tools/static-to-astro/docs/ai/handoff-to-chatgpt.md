Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro
- **Main working area:** `tools/static-to-astro`, `src/pages/__admin-staging-shell`
- **Goal:** Generalize Sariswing Astro + Supabase CMS into a reusable CMS Kit.

---

## 2. Current phase

```txt
Current phase: G-6-f7-schedule-write-hardening-and-updated-at-planning (completed)
Latest completed phase: G-6-f7-schedule-write-hardening-and-updated-at-planning
Latest commit: (pending) — Document schedule write hardening and updated_at planning (G-6-f7)
Recommended next phase: G-6-f8-schedule-updated-at-staging-migration-preflight
```

Prior milestone commits:

```txt
88613ed — Update AI handoff commit hash after G-6-f6 execution record
a022f3f — Record G-6-f6 schedule safe-fields non-dry-run execution success
```

---

## 3. Current state summary

G-6-e5/f6 write path proven. G-6-f7 planning: recommend DB trigger for `updated_at` on staging first; then optimistic lock; field slices with new approval IDs; retire PoC triggers from ops. No writes in planning phase.

---

## 4. Planning decisions (G-6-f7)

```txt
updated_at: Option A (DB trigger, staging first) — recommended
optimistic lock: after trigger; use expectedBeforeUpdatedAt in adapter
rollback: beforeSnapshot + documented SQL; optional audit table later
next fields: title → times → price → visibility → date → create/delete
PoC: G-6-e5/f6 keep code, disarmed, no re-click
general UI: new G-6-g-* approval IDs; staging shell only
```

---

## 5. Staging row state (post G-6-f6)

```txt
venue: [CMS Kit staging] G-6-f6 venue PoC
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
updated_at: 2026-06-05 17:39:44.140168+00 (static until trigger migration)
rollbackNeeded: false
```

---

## 6. Current gate state

```txt
scheduleWriteHardeningPlanningComplete: true
readyForScheduleUpdatedAtStagingMigrationPreflight: true
readyForScheduleGeneralEditUiPlanning: true
scheduleSafeFieldsNonDryRunExecutionSucceeded: true

dbWritesPerformedInLatestPhase: false
runButtonClickedInLatestPhase: false
supabaseSqlExecutedInLatestPhase: false
```

---

## 7. Files to read first

```txt
AGENTS.md
tools/static-to-astro/docs/schedule-write-hardening-and-updated-at-planning.md
tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-execution-result.md
tools/static-to-astro/docs/schedule-cms-generalization-planning.md
tools/static-to-astro/docs/ai/00-current-state.md
```
