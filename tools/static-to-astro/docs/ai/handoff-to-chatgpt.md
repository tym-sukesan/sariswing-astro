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
Current phase: G-6-f5-schedule-safe-fields-non-dry-run-preflight (completed)
Latest completed phase: G-6-f5-schedule-safe-fields-non-dry-run-preflight
Latest commit: 3cdcc2a — Document schedule safe-fields non-dry-run preflight (G-6-f5)
Recommended next phase: G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation
```

Prior milestone commits:

```txt
638b60a — Isolate G-6-e5 schedule PoC trigger and document dry-run default
e9e3861 — Record schedule PoC explicit retry success
```

---

## 3. Current state summary

G-6-f5 preflight documented safe-fields non-dry-run plan: reuse G-6-e5 row, first payload venue+description, approval ID G-6-f6-schedule-safe-fields-non-dry-run-poc. No writes in preflight.

---

## 4. Safety invariants

- Do not touch production / Sariswing production.
- Do not touch production Supabase project.
- Do not use `service_role`.
- Do not commit secrets or `output/`.
- Do not modify `src/pages/admin` unless explicitly instructed.
- Staging shell only for Kit work.
- `schedule_months` read-only.
- No INSERT / DELETE / UPSERT without approval.
- No Storage / Publish / FTP / GitHub dispatch.
- Do not re-click hidden PoC Run without explicit rerun phase + EXPLICIT_RERUN gate.

---

## 5. Hidden PoC trigger state (G-6-f1)

```txt
g6e5PocCompleted: true
hiddenPocTriggerDisarmedByDefault: true
explicitRerunEnv: PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true (required to arm)
g6e5ApprovalId: G-6-e5-schedule-non-dry-run-poc (one-off — do not reuse in general UI)
dryRunDefault: PUBLIC_ADMIN_WRITE_DRY_RUN=true (unset defaults to dry-run in PoC config)
rollbackNeeded: false
```

---

## 6. Current gate state

```txt
scheduleNonDryRunPocCompleted: true
explicitRetrySucceeded: true
scheduleCmsGeneralizationPlanningComplete: true
hiddenPocTriggerDisarmedByDefault: true
explicitRerunGateRequired: true
dryRunDefaultDocumented: true
g6e5ApprovalIdReuseProhibited: true
scheduleReadUiBindingComplete: true
scheduleDescriptionDryRunPrototypeComplete: true
scheduleSafeFieldsDryRunPrototypeComplete: true
scheduleSafeFieldsNonDryRunPreflightComplete: true
readyForScheduleSafeFieldsNonDryRunImplementation: true
readyForScheduleGeneralUi: false
rollbackNeeded: false

triggerClickedInLatestPhase: false
dbWritesPerformedInLatestPhase: false
nonDryRunUsedInLatestPhase: false
g6e5ApprovalIdUsedInLatestPhase: false
supabaseSelectInLatestPhase: false (SQL templates only; not executed by Cursor)
```

---

## 7. Recently completed work

```txt
- G-6-f5-schedule-safe-fields-non-dry-run-preflight
- G-6-f4-schedule-safe-fields-dry-run-prototype
- G-6-f3-schedule-description-edit-dry-run-prototype
- G-6-f2-schedule-read-ui-binding-audit
- G-6-f1-schedule-poc-isolation-dry-run-default
- G-6-f-schedule-cms-generalization-planning (e656083)
- G-6-e5-schedule-non-dry-run-poc-explicit-retry-result (e9e3861)
```

---

## 8. What must not be done next

```txt
- Do not re-click hidden PoC Run without EXPLICIT_RERUN + documented rerun phase
- Do not reuse G-6-e5 approval ID in general Schedule UI
- Do not set DRY_RUN=false for routine dev
- Do not use Playwright auto-click
- Do not touch /admin
- Do not use service_role
```

---

## 9. Next requested help from ChatGPT

Suggest Cursor prompt for **G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation**: new approval ID, wire updateScheduleWrite to safe-fields UI; no execution.

---

## 10. Files to read first

```txt
AGENTS.md
tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-preflight.md
tools/static-to-astro/docs/schedule-safe-fields-dry-run-prototype.md
tools/static-to-astro/docs/schedule-safe-fields-dry-run-prototype.md
tools/static-to-astro/docs/schedule-description-edit-dry-run-prototype.md
tools/static-to-astro/docs/schedule-read-ui-binding-audit.md
tools/static-to-astro/docs/schedule-poc-isolation-dry-run-default.md
tools/static-to-astro/docs/schedule-cms-generalization-planning.md
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
```
