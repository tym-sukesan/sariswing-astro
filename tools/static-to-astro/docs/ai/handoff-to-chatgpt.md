Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g1-schedule-title-non-dry-run-slice-final-preflight (completed — final-preflight only)
Latest completed phase: G-6-g1-schedule-title-non-dry-run-slice-final-preflight
Latest commit: 9ee5d76 — Implement schedule title edit slice.
Recommended next phase: G-6-g1-schedule-title-non-dry-run-slice-execution
```

---

## 3. Current state summary

G-6-g1 final preflight documents beforeSnapshot / afterVerification / rollback SQL, dev arm command, UI procedure (Preview → Save gates), and execution success criteria. Save UI exposed but not executed. PoCs frozen. Ready for user manual Save once in execution phase.

---

## 4. G-6-g1 execution prep highlights

```txt
Target row: aa440e29-5be8-402e-9190-0d81c48434c0
Payload: { "title": "[CMS Kit staging] G-6-g1 title PoC" }
Approval ID: G-6-g1-schedule-title-non-dry-run-slice
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
Route: /__admin-staging-shell/musician-basic/#schedule
Section: AdminStagingScheduleGeneralEditSection
Before: title <>; venue/description from G-6-f6 unchanged
After: title updated; updated_at advanced (trigger)
Rollback: set title back to <> (staging only, separate approval)
```

---

## 5. Gate state

```txt
scheduleTitleNonDryRunSliceFinalPreflightComplete: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: true
nonDryRunSaveUiExposed: true
nonDryRunSaveExecuted: false
optimisticLockWiredInProductPath: true
rollbackNeeded: false
dbWriteInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-final-preflight.md
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-implementation.md
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts
src/lib/admin/staging-write/schedule-general-edit-config.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
