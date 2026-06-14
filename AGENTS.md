# AGENTS.md

This repository uses AI-assisted development for the Static-to-Astro CMS / Musician CMS Kit project.

Before starting any task, read the following files:

- `.cursor/rules`
- `tools/static-to-astro/docs/ai/00-current-state.md`
- `tools/static-to-astro/docs/ai/03-next-actions.md`
- `tools/static-to-astro/docs/ai/handoff-to-chatgpt.md`

Treat the repository files as the source of truth. Do not rely on chat history alone.

## Project goal

Generalize the Sariswing Astro + Supabase CMS into a reusable CMS Kit for musicians, music schools, and small businesses migrating from Wix / Studio / Jimdo.

## Required workflow

For every meaningful task:

1. Read the AI context files.
2. Confirm the current phase and safety gates.
3. Implement only the requested scope.
4. Verify the result.
5. Update the AI context files:
   - `tools/static-to-astro/docs/ai/00-current-state.md`
   - `tools/static-to-astro/docs/ai/03-next-actions.md`
   - `tools/static-to-astro/docs/ai/handoff-to-chatgpt.md`
6. Commit and push when instructed.

## Absolute safety rules

- Do not touch production / Sariswing production.
- Do not touch production Supabase project.
- Do not use `service_role`.
- Do not commit `.env`, `.env.local`, secrets, tokens, passwords, anon keys, service keys, FTP credentials, or GitHub tokens.
- Do not commit `output/`.
- Do not modify `src/pages/admin` unless explicitly instructed.
- Do not connect new work to `/admin`.
- Use `/__admin-staging-shell/musician-basic/` only for staging shell testing.
- Treat `public.schedule_months` as read-only / derived.
- Do not run INSERT / DELETE / UPSERT / RPC writes unless explicitly approved.
- Do not write to Supabase Storage.
- Do not trigger Publish.
- Do not trigger GitHub `workflow_dispatch`.
- Do not trigger FTP deploy.
- Do not change RLS policies, GRANT, or REVOKE.
- Do not use Playwright / Chromium to auto-click write buttons.

## Schedule non-dry-run PoC status

### G-6-e5 (description-only — one-off hidden PoC)

The first Schedule non-dry-run write PoC **succeeded** (phase `G-6-e5-schedule-non-dry-run-poc-explicit-retry-result`).

- approval ID: `G-6-e5-schedule-non-dry-run-poc` (one-off — do not reuse)
- Do not re-click the hidden PoC Run button without `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true`

### G-6-f6 (safe-fields venue + description)

The G-6-f6 safe-fields non-dry-run PoC **succeeded** (phase `G-6-f6-schedule-safe-fields-non-dry-run-execution`).

- table: `public.schedules`
- id: `aa440e29-5be8-402e-9190-0d81c48434c0`
- legacy_id: `schedule-2026-07-010`
- current venue: `[CMS Kit staging] G-6-f6 venue PoC`
- current description: `出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]`
- approval ID: `G-6-f6-schedule-safe-fields-non-dry-run-poc`
- changedFields: `venue`, `description` only
- rollback needed: **no** (rollback SQL in `schedule-safe-fields-non-dry-run-execution-result.md`)

Do not re-click the G-6-f6 Run button. Restart dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true` for routine work.

## Schedule write hardening (G-6-f7)

Planning complete: `tools/static-to-astro/docs/schedule-write-hardening-and-updated-at-planning.md`

- `updated_at`: recommend DB trigger on staging first (G-6-f8)
- Optimistic lock: after trigger migration
- Next: general edit UI planning + per-field slices with new approval IDs
- PoC triggers (G-6-e5, G-6-f6): keep code, disarmed, do not re-click

## Schedule updated_at migration (G-6-f8)

Preflight: `tools/static-to-astro/docs/schedule-updated-at-staging-migration-preflight.md`

Execution **succeeded** on staging: `tools/static-to-astro/docs/schedule-updated-at-staging-migration-execution-result.md`

- Trigger `schedules_set_updated_at` active on `public.schedules` (staging only)
- Script: `scripts/supabase/schedules-updated-at-trigger.sql`
- Do not re-apply trigger without documented rollback + re-apply phase

## Schedule optimistic lock enablement (G-6-f9 / G-6-f10)

Planning: `tools/static-to-astro/docs/schedule-optimistic-lock-enablement-planning.md`

Implementation **complete** (G-6-f10): `tools/static-to-astro/docs/schedule-optimistic-lock-enablement-implementation.md`

- `buildScheduleLockedWriteRequest` / `executeScheduleGeneralUpdateWrite` pass `expectedBeforeUpdatedAt`
- Dry-run UI: SELECT-only stale check on preview
- PoC triggers (G-6-e5, G-6-f6): frozen — do not modify or re-click
- Non-dry-run Save UI: not exposed until G-6-g1 slice

## Schedule general edit UI (G-6-g)

Planning complete: `tools/static-to-astro/docs/schedule-general-edit-ui-planning.md`

- New section: `AdminStagingScheduleGeneralEditSection` in `#schedule` (implementation phase)
- G-6-g1 first slice: `title` with approval ID `G-6-g1-schedule-title-non-dry-run-slice`
- Dry-run preview required before Save; stale blocks non-dry-run

## Schedule title non-dry-run slice preflight (G-6-g1)

Preflight complete: `tools/static-to-astro/docs/schedule-title-non-dry-run-slice-preflight.md`

- Target row: `aa440e29-5be8-402e-9190-0d81c48434c0` (`title: <>`, venue/description from G-6-f6 unchanged)
- Payload: title only — `[CMS Kit staging] G-6-g1 title PoC`
- Approval ID: `G-6-g1-schedule-title-non-dry-run-slice` (register in implementation phase)
- Env arm: `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true`
- Do not reuse G-6-e5 / G-6-f6 approval IDs or PoC env gates
- Rollback SQL documented (staging only — not executed)
- Next: `G-6-g1-schedule-title-non-dry-run-slice-implementation` (no Save execution)

## Schedule title non-dry-run slice implementation (G-6-g1)

Implementation complete: `tools/static-to-astro/docs/schedule-title-non-dry-run-slice-implementation.md`

- Section: `AdminStagingScheduleGeneralEditSection` in `#schedule` (below `ScheduleAdminUi`)
- Guard: `assertG6G1TitlePayloadOnly`; approval ID registered in `SCHEDULE_WRITE_APPROVAL_IDS`
- Save path: `executeG6G1TitleNonDryRunSave` → `executeScheduleGeneralUpdateWrite` (optimistic lock)
- Save UI exposed but gated off by default; **not executed** in implementation phase
- Next: `G-6-g1-schedule-title-non-dry-run-slice-final-preflight` → execution (user manual Save once)

## Schedule title non-dry-run slice final preflight (G-6-g1)

Final preflight complete: `tools/static-to-astro/docs/schedule-title-non-dry-run-slice-final-preflight.md`

- beforeSnapshot / afterVerification / rollback SQL documented (staging only — not executed by Cursor)
- Dev arm command with G-6-g1 env stack (inline env; no PoC env)
- UI procedure: Preview → gates → Save once in execution phase only
- Do not click Save in final-preflight; do not re-arm G-6-e5 / G-6-f6 PoCs

## Schedule title non-dry-run slice execution (G-6-g1)

Execution **succeeded**: `tools/static-to-astro/docs/schedule-title-non-dry-run-slice-execution-result.md`

- User manual Save once; Cursor did not click Save / Run / SQL
- title: `<>` → `[CMS Kit staging] G-6-g1 title PoC`; changedFields: title only
- optimistic lock: `expectedBeforeUpdatedAt` matched `2026-06-14T06:49:42.240919+00:00`
- `updated_at`: `2026-06-14T15:03:08.762993+00:00` after Save
- venue / description unchanged; `rollbackNeeded: false`
- Client fix `cf24c09` required for `readSource: supabase` before execution
- Restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; do not re-click G-6-g1 Save

## Schedule general edit next slice planning (G-6-g2)

Planning complete: `tools/static-to-astro/docs/schedule-general-edit-next-slice-planning.md`

- Recommended next slice: `open_time` + `start_time` (`G-6-g2-schedule-time-fields-non-dry-run-slice`)
- Approval ID: `G-6-g2-schedule-time-fields-non-dry-run-slice`; env: `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED`
- Target row reuse: `aa440e29-5be8-402e-9190-0d81c48434c0`; lock baseline `updated_at` from G-6-g1
- Guard: `assertG6G2TimeFieldsPayloadOnly` (implementation phase)
- price → G-6-g3; venue/description general UI → G-6-g4
- Next: `G-6-g2-schedule-time-fields-non-dry-run-slice-preflight`
- DB write / Save / Run: none in planning phase

## Schedule time fields non-dry-run slice preflight (G-6-g2)

Preflight complete: `tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-preflight.md`

- Fields: `open_time` + `start_time` only on row `aa440e29-5be8-402e-9190-0d81c48434c0`
- Payload (Option A): `[CMS Kit staging] G-6-g2 open PoC` / `start PoC`
- Approval ID: `G-6-g2-schedule-time-fields-non-dry-run-slice`; env: `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED`
- Guard: `assertG6G2TimeFieldsPayloadOnly`; trigger: `executeG6G2TimeFieldsNonDryRunSave` (implementation)
- Lock baseline: G-6-g1 `updated_at` `2026-06-14T15:03:08.762993+00`
- Next: `G-6-g2-schedule-time-fields-non-dry-run-slice-implementation`
- DB write / Save / Run: none in preflight phase

## Schedule time fields non-dry-run slice implementation (G-6-g2)

Implementation complete: `tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-implementation.md`

- Guard: `assertG6G2TimeFieldsPayloadOnly`; trigger: `executeG6G2TimeFieldsNonDryRunSave`
- UI: G-6-g2 time field group in `AdminStagingScheduleGeneralEditSection`
- Single-arm: G-6-g1 / G-6-g2 cannot both be armed
- Next: `G-6-g2-schedule-time-fields-non-dry-run-slice-final-preflight`
- DB write / Save / Preview: none in implementation phase

## Schedule time fields non-dry-run slice final preflight (G-6-g2)

Final preflight complete: `tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-final-preflight.md`

- beforeSnapshot / afterVerification / rollback SQL; G-6-g2 dev arm (G-6-g1 arm off)
- UI procedure: Preview → gates → Save once in execution only
- single-arm: G-6-g1 disabled when G-6-g2 armed
- Next: `G-6-g2-schedule-time-fields-non-dry-run-slice-execution`
- DB write / Preview / Save: none in final-preflight phase

## Schedule CMS generalization

Planning phase `G-6-f-schedule-cms-generalization-planning` is complete.

PoC isolation phase `G-6-f1-schedule-poc-isolation-dry-run-default` is complete.

- See `tools/static-to-astro/docs/schedule-cms-generalization-planning.md`
- See `tools/static-to-astro/docs/schedule-poc-isolation-dry-run-default.md`
- Recommended next: `G-6-f2-schedule-read-ui-binding-audit`
- General Schedule edit UI: staging shell only; do not modify `/admin` until an explicit future phase
- Default dev: `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; hidden PoC requires `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true` to arm

## STOP conditions

Stop and ask the user if:

- production might be involved
- `service_role` seems necessary
- write scope expands
- `/admin` changes seem necessary
- `schedule_months` write seems necessary
- INSERT / DELETE / UPSERT seems necessary
- env or secrets are unclear
- automatic clicking is required
- rollback may be required
- result state is ambiguous
