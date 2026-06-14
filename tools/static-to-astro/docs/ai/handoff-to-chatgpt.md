Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-6-g1-schedule-title-non-dry-run-slice-execution (completed — user manual Save once)
Latest completed phase: G-6-g1-schedule-title-non-dry-run-slice-execution
Latest commit: cf24c09 — Fix schedule general edit client data read gates.
Recommended next phase: G-6-g2-schedule-general-edit-next-slice-planning
```

---

## 3. Current state summary

G-6-g1 product-path title non-dry-run **succeeded** on staging row `aa440e29-5be8-402e-9190-0d81c48434c0`. Title `<>` → `[CMS Kit staging] G-6-g1 title PoC`. Optimistic lock matched baseline `2026-06-14T06:49:42.240919+00:00`. User manual Save once; Cursor did not click Save/Run/SQL. Client data read fix (cf24c09) required before execution. Rollback not needed.

---

## 4. G-6-g1 execution highlights

```txt
Approval ID: G-6-g1-schedule-title-non-dry-run-slice
changedFields: ["title"]
rowsAffected: 1
beforeSnapshot.updated_at: 2026-06-14T06:49:42.240919+00:00
afterSnapshot.updated_at: 2026-06-14T15:03:08.762993+00:00
venue / description / date / published / show_on_home / sort_order: unchanged
created_at: unchanged
serviceRoleUsed: false
schedule_months: untouched
rollbackNeeded: false
```

---

## 5. Gate state

```txt
scheduleTitleNonDryRunSliceExecutionSucceeded: true
nonDryRunSaveExecuted: true
rollbackNeeded: false
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: true
readyForG6G1ScheduleTitleNonDryRunSliceExecution: false
dbWriteInLatestPhase: true (user manual Save once only)
cursorClickedSave: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/schedule-title-non-dry-run-slice-execution-result.md
tools/static-to-astro/docs/schedule-general-edit-ui-planning.md
src/lib/admin/staging-write/staging-schedule-general-edit-ui.ts
tools/static-to-astro/docs/ai/00-current-state.md
```
