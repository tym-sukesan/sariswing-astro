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
Current phase: G-6-f-schedule-cms-generalization-planning (completed)
Latest completed phase: G-6-f-schedule-cms-generalization-planning
Latest commit: db07f8a — Update AI handoff commit hash after explicit retry result record
Recommended next phase: G-6-f1-schedule-poc-isolation-dry-run-default
```

Prior milestone commits:

```txt
e9e3861 — Record schedule PoC explicit retry success
a42a904 — Record schedule PoC fix verification result
2b51bd5 — Add AI development workflow context files
```

---

## 3. Current state summary

G-6-e5 Schedule non-dry-run PoC **succeeded** (description-only UPDATE on staging). G-6-f planning documents path from hidden PoC trigger to visible Schedule edit UI on staging shell. Dry-run first, new approval IDs per milestone, INSERT/DELETE deferred, schedule_months read-only, no /admin changes, no service_role.

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
- Do not re-click hidden G-6-e5 PoC Run button.

---

## 5. Schedule PoC target row (after G-6-e5 success)

```txt
table: public.schedules
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
currentDescription: 出演： [G-6-e5 non-dry-run PoC]
approvalId: G-6-e5-schedule-non-dry-run-poc (PoC only — do not reuse for general UI)
staging project: static-to-astro-cms-staging
rollbackNeeded: false
```

---

## 6. Current gate state

```txt
scheduleNonDryRunPocCompleted: true
explicitRetrySucceeded: true
scheduleCmsGeneralizationPlanningComplete: true
readyForScheduleGeneralUi: false
readyForScheduleCreate: false
readyForExplicitRetry: false
rollbackNeeded: false

triggerClickedInLatestPhase: false (G-6-f planning only)
dbWritesPerformedInLatestPhase: false
cursorClickedRun: false
```

---

## 7. Recently completed work

```txt
- G-6-f-schedule-cms-generalization-planning (planning doc)
- G-6-e5-schedule-non-dry-run-poc-explicit-retry-result (e9e3861)
- AI workflow foundation (AGENTS.md, docs/ai/*)
```

---

## 8. What must not be done next

```txt
- Do not re-click hidden G-6-e5 PoC Run button
- Do not implement general write UI without phased approval
- Do not use Playwright / Chromium auto-click
- Do not run updateScheduleWrite from scripts without approval
- Do not touch schedule_months
- Do not use /admin route for Kit work
- Do not use service_role
- Do not touch production
- Do not commit secrets or output/
```

---

## 9. Next requested help from ChatGPT

Suggest Cursor prompt for **G-6-f1-schedule-poc-isolation-dry-run-default**:
hide G-6-e5 PoC trigger by default, document dry-run default env, PoC retirement policy. No DB writes.

---

## 10. Files to read first

```txt
AGENTS.md
.cursor/rules
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
tools/static-to-astro/docs/schedule-cms-generalization-planning.md
tools/static-to-astro/docs/schedule-non-dry-run-poc-explicit-retry-result.md
```
