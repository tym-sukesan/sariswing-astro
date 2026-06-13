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
Current phase: AI workflow foundation refinement
Latest completed phase: AI workflow foundation refinement
Latest commit: 118ec84 — Refine AI development workflow handoff
Current recommended next phase: G-6-e5-schedule-non-dry-run-poc-explicit-retry
```

Prior milestone commits:

```txt
2b51bd5 — Add AI development workflow context files
a42a904 — Record schedule PoC fix verification result
```

---

## 3. Current state summary

Schedule CMS first non-dry-run PoC: hidden staging trigger implemented on `/__admin-staging-shell/musician-basic/`. First manual Run click did not update DB. Diagnosis identified mock allowlist hard admin gate as likely cause. Fix implementation and fix verification completed. `readyForExplicitRetry: true`. DB still unchanged (`description: 出演：`). Rollback not needed.

AI workflow foundation setup added `.cursor/rules` and `tools/static-to-astro/docs/ai/*`. This refinement adds `AGENTS.md`, populates this handoff with current values, and documents AI workflow files in README.

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
- Any Schedule write retry: user manual click exactly once only. No Playwright auto-click.

---

## 5. Schedule PoC target row

```txt
table: public.schedules
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
currentDescriptionExpected: 出演：
expectedAfterDescription: 出演： [G-6-e5 non-dry-run PoC]
approvalId: G-6-e5-schedule-non-dry-run-poc
payload: { "description": "出演： [G-6-e5 non-dry-run PoC]" }
staging project: static-to-astro-cms-staging
expected Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
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
readyForExplicitRetry: true
readyForNonDryRunSchedulePoC: false

targetId: aa440e29-5be8-402e-9190-0d81c48434c0
targetLegacyId: schedule-2026-07-010
currentDescriptionExpected: 出演：
expectedAfterDescription: 出演： [G-6-e5 non-dry-run PoC]

fixVerificationResultRecorded: true
fixVerified: true
mockRoleHardGateRemovedOrRelaxed: true
signedInSessionStillRequired: true
rlsAdminUsersSourceOfTruth: true
activeSupabaseHostDisplayed: true
errorPanelImproved: true
unexpectedExceptionCaptured: true
scrollIntoViewAdded: true
doubleClickGuardVerified: true
normalDevHiddenVerified: true
envGatedVisibleVerified: true
manualConfirmVerified: true

triggerClickedInLatestPhase: false
dbWritesPerformedInLatestPhase: false
rollbackNeeded: false
```

---

## 7. Recently completed work

```txt
- G-6-e5-schedule-non-dry-run-poc-execution-attempt-diagnosis (mock gate identified)
- G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-implementation (c5324aa)
- G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification (d99dc75)
- G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification-result (a42a904)
- AI workflow foundation setup (2b51bd5): .cursor/rules, docs/ai/*
- AI workflow foundation refinement: AGENTS.md, handoff populated, README updated
```

---

## 8. What must not be done next

```txt
- Do not click Run button until explicit retry phase begins
- Do not use Playwright / Chromium auto-click
- Do not run updateScheduleWrite from scripts
- Do not UPDATE/INSERT/DELETE schedules outside approved one-click retry
- Do not touch schedule_months
- Do not use /admin route for PoC
- Do not use service_role
- Do not touch production
- Do not commit secrets or output/
```

---

## 9. Next requested help from ChatGPT

Please read this handoff and provide the next Cursor prompt for:
**G-6-e5-schedule-non-dry-run-poc-explicit-retry**.

The retry must begin with a final beforeSnapshot check.
It must use only the staging shell route.
It must not use `/admin`.
It must not use `service_role`.
It must not use Playwright / Chromium auto-click.
The Run button must be clicked manually by the user exactly once.

---

## 10. Files to read first

```txt
AGENTS.md
.cursor/rules
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
tools/static-to-astro/docs/schedule-non-dry-run-poc-execution-attempt-fix-verification-result.md
```
