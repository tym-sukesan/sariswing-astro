Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g1-schedule-title-non-dry-run-slice-implementation (completed — implementation only)
Latest completed phase: G-6-g1-schedule-title-non-dry-run-slice-implementation
Latest commit: ddfc8cf — Prepare schedule title non-dry-run slice.
Recommended next phase: G-6-g1-schedule-title-non-dry-run-slice-final-preflight
```

---

## 3. Current state summary

G-6-g1 implementation adds `AdminStagingScheduleGeneralEditSection` in `#schedule` staging shell with title-only dry-run preview and gated non-dry-run Save via `executeG6G1TitleNonDryRunSave` → `executeScheduleGeneralUpdateWrite`. Approval ID `G-6-g1-schedule-title-non-dry-run-slice` registered. PoCs frozen. No DB write / Save click in implementation phase.

---

## 4. G-6-g1 implementation highlights

```txt
Section: AdminStagingScheduleGeneralEditSection (#schedule, below ScheduleAdminUi)
Guard: assertG6G1TitlePayloadOnly
Approval ID: G-6-g1-schedule-title-non-dry-run-slice (in SCHEDULE_WRITE_APPROVAL_IDS)
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
Save path: executeG6G1TitleNonDryRunSave → executeScheduleGeneralUpdateWrite
Dry-run first: Preview required; stale blocks Save
nonDryRunSaveUiExposed: true (gated off by default)
nonDryRunSaveExecuted: false
```

---

## 5. Gate state

```txt
scheduleTitleNonDryRunSliceImplementationComplete: true
readyForG6G1ScheduleTitleNonDryRunSliceFinalPreflight: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: false
nonDryRunSaveUiExposed: true
nonDryRunSaveExecuted: false
optimisticLockWiredInProductPath: true
rollbackNeeded: false
dbWriteInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-implementation.md
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-preflight.md
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts
src/lib/admin/staging-write/schedule-g6g1-title-non-dry-run-trigger.ts
src/lib/admin/staging-write/schedule-general-edit-config.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
