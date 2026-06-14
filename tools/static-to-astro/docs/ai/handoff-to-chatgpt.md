Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g1-schedule-title-non-dry-run-slice-preflight (completed — preflight only)
Latest completed phase: G-6-g1-schedule-title-non-dry-run-slice-preflight
Latest commit: 801bb8b — Plan schedule general edit UI.
Recommended next phase: G-6-g1-schedule-title-non-dry-run-slice-implementation
```

---

## 3. Current state summary

G-6-g1 preflight defines first product-path non-dry-run slice: `title` only on proven staging row `aa440e29-5be8-402e-9190-0d81c48434c0`. New approval ID `G-6-g1-schedule-title-non-dry-run-slice`, env arm `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED`, optimistic lock via `executeScheduleGeneralUpdateWrite`. PoCs (G-6-e5/f6) frozen. No DB write in G-6-g1 preflight.

---

## 4. G-6-g1 preflight highlights

```txt
Target row: aa440e29-5be8-402e-9190-0d81c48434c0 (title: <>, show_on_home: false)
Payload: { "title": "[CMS Kit staging] G-6-g1 title PoC" } — title only
Approval ID: G-6-g1-schedule-title-non-dry-run-slice (not yet in SCHEDULE_WRITE_APPROVAL_IDS)
Env arm: PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
Guard: assertG6G1TitlePayloadOnly (planned — mirror G-6-f6 pattern)
Dry-run preview: required before Save
Rollback: set title back to <> (staging only, not executed)
```

---

## 5. Gate state

```txt
scheduleTitleNonDryRunSlicePreflightComplete: true
readyForG6G1ScheduleTitleNonDryRunSliceImplementation: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: false
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: false
rollbackNeeded: false
dbWriteInLatestPhase: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-preflight.md
tools/static-to-astro/docs/schedule-general-edit-ui-planning.md
tools/static-to-astro/docs/schedule-optimistic-lock-enablement-implementation.md
src/lib/admin/staging-write/schedule-general-update-trigger.ts
src/lib/admin/staging-write/schedule-write-guards.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
