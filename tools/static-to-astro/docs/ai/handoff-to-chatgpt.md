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
Current phase: G-6-f6-schedule-safe-fields-non-dry-run-final-preflight (completed)
Latest completed phase: G-6-f6-schedule-safe-fields-non-dry-run-final-preflight
Latest commit: (pending) — Document G-6-f6 schedule safe-fields non-dry-run final preflight
Recommended next phase: G-6-f6-schedule-safe-fields-non-dry-run-execution
```

Prior milestone commits:

```txt
fd57937 — Update AI handoff commit hash after G-6-f6 implementation record
e0dfb76 — Implement G-6-f6 schedule safe-fields non-dry-run PoC scaffold
3cdcc2a — Document schedule safe-fields non-dry-run preflight (G-6-f5)
```

---

## 3. Current state summary

G-6-f6 final preflight doc prepared: beforeSnapshot SQL, dev command with G-6-f6 arm gates, UI checklist, abort conditions, afterVerification / rollback SQL. Operator must run beforeSnapshot manually before execution. No writes, no Run click in final-preflight phase.

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
- Do not re-click hidden G-6-e5 PoC Run without explicit rerun phase + EXPLICIT_RERUN gate.

---

## 5. G-6-f6 execution parameters

```txt
approvalId: G-6-f6-schedule-safe-fields-non-dry-run-poc
armEnv: PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED=true
targetId: aa440e29-5be8-402e-9190-0d81c48434c0
targetFields: venue, description
payloadVenue: [CMS Kit staging] G-6-f6 venue PoC
payloadDescription: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
beforeDescription: 出演： [G-6-e5 non-dry-run PoC]
route: /__admin-staging-shell/musician-basic/
```

---

## 6. Current gate state

```txt
scheduleSafeFieldsNonDryRunFinalPreflightComplete: true
readyForScheduleSafeFieldsNonDryRunExecution: true
rollbackNeeded: false
g6e5TriggerReArmed: false

triggerClickedInLatestPhase: false
dbWritesPerformedInLatestPhase: false
nonDryRunUsedInLatestPhase: false
supabaseSelectInLatestPhase: false (SQL presented to operator; Cursor did not run)
```

---

## 7. Recently completed work

```txt
- G-6-f6-schedule-safe-fields-non-dry-run-final-preflight
- G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation
- G-6-f5-schedule-safe-fields-non-dry-run-preflight
```

---

## 8. What must not be done until execution phase

```txt
- Do not click G-6-f6 Run until execution phase (after beforeSnapshot PASS + UI checklist)
- Do not re-click hidden G-6-e5 PoC Run
- Do not use PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN for G-6-f6
- Do not use Playwright auto-click
- Do not touch /admin
```

---

## 9. Next requested help from ChatGPT

Suggest Cursor prompt for **G-6-f6-schedule-safe-fields-non-dry-run-execution**: user manual Run click once, result doc, afterVerification SQL.

---

## 10. Files to read first

```txt
AGENTS.md
tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-final-preflight.md
tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-poc-implementation.md
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
```
