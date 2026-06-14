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

## Schedule updated_at migration preflight (G-6-f8)

Preflight complete: `tools/static-to-astro/docs/schedule-updated-at-staging-migration-preflight.md`

- Trigger not applied yet — execution phase next
- SQL via `scripts/supabase/` pattern; no `supabase/migrations/` in repo
- Do not execute SQL until G-6-f8 execution phase

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
