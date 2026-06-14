Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro
- **Main working area:** `tools/static-to-astro`, `src/pages/__admin-staging-shell`
- **Goal:** Generalize Sariswing Astro + Supabase CMS into a reusable CMS Kit for musicians, music schools, and small businesses migrating from Wix / Studio / Jimdo.

---

## 2. Current phase

```txt
Current phase: G-6-f6-schedule-safe-fields-non-dry-run-execution (completed — SUCCESS)
Latest completed phase: G-6-f6-schedule-safe-fields-non-dry-run-execution
Latest commit: a022f3f — Record G-6-f6 schedule safe-fields non-dry-run execution success
Recommended next: Schedule CMS general UI planning or per-field non-dry-run slices
```

Prior milestone commits:

```txt
3976873 — Update AI handoff commit hash after G-6-f6 final preflight record
6f479a8 — Document G-6-f6 schedule safe-fields non-dry-run final preflight
e0dfb76 — Implement G-6-f6 schedule safe-fields non-dry-run PoC scaffold
```

---

## 3. Current state summary

G-6-f6 execution succeeded. `venue` + `description` updated on `aa440e29-5be8-402e-9190-0d81c48434c0`. changedFields: venue, description. service_role unused. schedule_months untouched. User manual Run once. rollbackNeeded: false. updated_at unchanged.

---

## 4. Safety invariants

- Do not touch production / Sariswing production.
- Do not touch production Supabase project.
- Do not use `service_role`.
- Do not commit secrets or `output/`.
- Do not modify `src/pages/admin` unless explicitly instructed.
- Staging shell only for Kit work.
- `schedule_months` read-only.
- Do not re-click G-6-f6 Run or G-6-e5 hidden PoC without documented phase.

---

## 5. Staging row state (G-6-f6 success)

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
venue: [CMS Kit staging] G-6-f6 venue PoC
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
approvalId: G-6-f6-schedule-safe-fields-non-dry-run-poc
rollbackNeeded: false
```

---

## 6. Current gate state

```txt
scheduleSafeFieldsNonDryRunExecutionSucceeded: true
firstScheduleSafeFieldsNonDryRunWriteSucceeded: true
scheduleSafeFieldsNonDryRunExecutionComplete: true
readyForScheduleGeneralUi: true
rollbackNeeded: false

triggerClickedInLatestPhase: true (user manual once)
cursorClickedRun: false
playwrightAutoClick: false
dbWritesPerformedInLatestPhase: true (venue + description only)
serviceRoleUsed: false
scheduleMonthsTouched: false
```

---

## 7. Recently completed work

```txt
- G-6-f6-schedule-safe-fields-non-dry-run-execution (SUCCESS)
- G-6-f6-schedule-safe-fields-non-dry-run-final-preflight
- G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation
```

---

## 8. Files to read first

```txt
AGENTS.md
tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-execution-result.md
tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-final-preflight.md
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
```
