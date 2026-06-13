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
Current phase: G-6-e5-schedule-non-dry-run-poc-explicit-retry-result (completed)
Latest completed phase: G-6-e5-schedule-non-dry-run-poc-explicit-retry-result
Latest commit: e9e3861 — Record schedule PoC explicit retry success
Current recommended next phase: restore dry-run default; plan Schedule CMS generalization
```

Prior milestone commits:

```txt
e9e3861 — Record schedule PoC explicit retry success
a42a904 — Record schedule PoC fix verification result
2b51bd5 — Add AI development workflow context files
```

---

## 3. Current state summary

Schedule CMS first non-dry-run write PoC **succeeded** on `static-to-astro-cms-staging` via hidden staging trigger at `/__admin-staging-shell/musician-basic/`. User manually clicked Run once after beforeSnapshot PASS. Result panel: executed / actualWrite true. After-verification SQL: `description_match: true`. Only `description` changed. `schedule_months` not touched. `service_role` not used. Rollback not needed.

First attempt failed (mock allowlist hard gate). Fix implementation and verification completed before explicit retry.

---

## 4. Safety invariants

- Do not touch production / Sariswing production.
- Do not touch production Supabase project.
- Do not use `service_role`.
- Do not commit `.env`, `.env.local`, secrets, tokens, passwords, keys, or `output/`.
- Do not modify `src/pages/admin` unless explicitly instructed.
- Use `/__admin-staging-shell/musician-basic/` only for staging shell testing.
- Treat `public.schedule_months` as read-only / derived.
- No INSERT / DELETE / UPSERT unless explicitly approved.
- No Storage / Publish / FTP / GitHub dispatch.
- Do not re-click hidden PoC Run button without explicit new approval.

---

## 5. Schedule PoC target row (after success)

```txt
table: public.schedules
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
currentDescription: 出演： [G-6-e5 non-dry-run PoC]
description_match: true
approvalId: G-6-e5-schedule-non-dry-run-poc
staging project: static-to-astro-cms-staging
expected Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
changedFields: ["description"]
published: true (unchanged)
show_on_home: false (unchanged)
sort_order: 10 (unchanged)
updated_at: 2026-06-05 17:39:44.140168+00
```

Rollback SQL (staging only; not executed):

```sql
update public.schedules
set description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

---

## 6. Current gate state

```txt
aiWorkflowFoundationSetup: true
aiWorkflowFoundationRefinement: true
scheduleNonDryRunPocCompleted: true
explicitRetrySucceeded: true
readyForExplicitRetry: false
readyForNonDryRunSchedulePoC: false
rollbackNeeded: false

targetId: aa440e29-5be8-402e-9190-0d81c48434c0
targetLegacyId: schedule-2026-07-010
beforeDescription: 出演：
afterDescription: 出演： [G-6-e5 non-dry-run PoC]

fixVerificationResultRecorded: true
fixVerified: true
mockRoleHardGateRemovedOrRelaxed: true
beforeSnapshotConfirmed: true
explicitRetryPhaseStarted: true
triggerClickedInLatestPhase: true (user manual once)
dbWritesPerformedInLatestPhase: true
scheduleMonthsTouched: false
serviceRoleUsed: false
cursorClickedRun: false
playwrightAutoClick: false
automaticReclick: false
rollbackExecuted: false
```

---

## 7. Recently completed work

```txt
- G-6-e5-schedule-non-dry-run-poc-explicit-retry (user manual Run once)
- G-6-e5-schedule-non-dry-run-poc-explicit-retry-result (success recorded)
- G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification-result (a42a904)
- AI workflow foundation setup (2b51bd5): .cursor/rules, docs/ai/*
- AI workflow foundation refinement: AGENTS.md, handoff populated, README updated
```

---

## 8. What must not be done next

```txt
- Do not re-click hidden PoC Run button without new explicit approval
- Do not use Playwright / Chromium auto-click
- Do not run updateScheduleWrite from scripts
- Do not perform additional schedule writes without approval
- Do not touch schedule_months
- Do not use /admin route for PoC
- Do not use service_role
- Do not touch production
- Do not commit secrets or output/
- Do not execute rollback SQL unless explicitly approved
```

---

## 9. Next requested help from ChatGPT

Schedule non-dry-run PoC succeeded. Suggest next Cursor prompt for post-PoC work:

1. Restore dev server to `PUBLIC_ADMIN_WRITE_DRY_RUN=true` safe default.
2. Plan Schedule CMS generalization (write UI, documentation, optional rollback decision).
3. Do not trigger additional writes without explicit approval.

---

## 10. Files to read first

```txt
AGENTS.md
.cursor/rules
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
tools/static-to-astro/docs/schedule-non-dry-run-poc-explicit-retry-result.md
```
