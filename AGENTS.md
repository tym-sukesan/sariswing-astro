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

The first Schedule non-dry-run write PoC **succeeded** (phase `G-6-e5-schedule-non-dry-run-poc-explicit-retry-result`).

- table: `public.schedules`
- id: `aa440e29-5be8-402e-9190-0d81c48434c0`
- legacy_id: `schedule-2026-07-010`
- current description: `出演： [G-6-e5 non-dry-run PoC]`
- approval ID: `G-6-e5-schedule-non-dry-run-poc`
- rollback needed: **no** (rollback SQL available in result doc if staging restore is desired later)

Do not re-click the hidden PoC Run button without explicit new approval.

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
