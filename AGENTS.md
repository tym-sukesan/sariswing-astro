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

## Destructive Operation Safety Rules (G-7f1 — permanent)

The following are **destructive operations** in this project:

- FTP upload / FTP sync / `mirror` / `mirror --delete`
- Remote cleanup / `rm` / delete on remote hosts
- GitHub `workflow_dispatch`
- Production deploy
- DB write / Supabase SQL mutation
- `service_role` usage
- `.ftpaccess` edit or delete

### Basic rules

- Never run destructive operations without **explicit operator approval**.
- Vague approval ("OK", "進めてください", "大丈夫そうです") is **not** sufficient.
- Required approval form (or equivalent):

```txt
承認します。この操作を1回だけ実行してください。
```

### Preflight required before destructive operations

Preflight must include:

- exact command
- local source path
- remote target path
- whether remote path exists (or will be created)
- whether `cd` failure stops execution (must be yes)
- whether `--delete` is enabled (default must be no)
- whether cleanup is enabled
- whether root `/`, `.`, `./`, empty remote path are blocked
- whether production can be touched
- rollback / cleanup plan
- what will change
- what will not be committed

### Failure behavior

If a destructive operation hangs, fails, or outcome is unclear:

```txt
stop immediately
do not retry
do not cleanup
do not run alternative commands
record incident
ask human
```

### FTP deploy suspension (G-7f incident)

- **All FTP `--apply` is suspended** until operator explicitly re-approves after G-7f1 hardening.
- `readyForAnyFutureFtpApply: false` until new preflight + explicit approval.
- See `tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md`.

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
- commit: `499aa37`
- DB write / Preview / Save: none in final-preflight phase

## Schedule time fields non-dry-run slice execution (G-6-g2)

Execution succeeded: `tools/static-to-astro/docs/schedule-time-fields-non-dry-run-slice-execution-result.md`

- open_time / start_time only; changedFields: `["open_time", "start_time"]`
- title / venue / description unchanged; optimistic lock OK
- beforeSnapshot.updated_at: `2026-06-14T15:03:08.762993+00:00`
- afterSnapshot.updated_at: `2026-06-15T01:02:22.949565+00:00`
- rollbackNeeded: false; G-6-g1 Save not re-executed
- Restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; do not re-click G-6-g2 Save
- Next: `G-6-g3-schedule-price-non-dry-run-slice-preflight` (planning) — **deferred** (G-7 priority)

## URL → staging automation sprint planning (G-7)

Planning complete: `tools/static-to-astro/docs/url-to-staging-automation-sprint-planning.md`

- Goal: URL input → crawl → Astro → build → staging on Lolipop (semi-auto, operator-driven)
- First case: gosaki-piano.com (2nd Sariswing-style CMS Kit customer)
- Exists: convert, build, static-public, FTP (gosaki proven at `/cms-kit-staging/gosaki/`)
- Gap: crawl CLI + pipeline orchestrator (G-7a/b)
- MVP: 2–3 days; CMS/Supabase deferred for staging preview
- Next: `G-7a-crawl-static-site-implementation`
- No FTP / crawl / production deploy in planning phase

## Crawl static site implementation (G-7a)

Implementation complete: `tools/static-to-astro/docs/crawl-static-site-implementation.md`

- CLI: `crawl-static-site.mjs`; verify: `verify-crawl-static-site.mjs` (30 passed)
- Dry-run: no network, no writes; live crawl requires operator approval
- Output: fixture-compatible HTML + `manifest.json` (flat `.html` for single-segment paths)
- External / gosaki-piano.com crawl: **not executed in G-7a**

## URL-to-staging pipeline orchestrator (G-7b)

Implementation complete: `tools/static-to-astro/docs/url-to-staging-pipeline-orchestrator-implementation.md`

- CLI: `url-to-staging-pipeline.mjs`; npm: `url:staging`
- Config sample: `config/sites/gosaki-piano.url-to-staging.json` (no secrets)
- Verify: `verify-url-to-staging-pipeline.mjs` (29 passed)
- Default: `--dry-run`; gates `--run-crawl`, `--run-convert`, `--run-build`, `--prepare-public`, `--deploy-ftp` (all default false)
- FTP / workflow_dispatch: **not executed in G-7b** (`--deploy-ftp` is plan-only)
- External / gosaki-piano.com crawl: **not executed in G-7b**
- Next: `G-7c-url-to-staging-dry-run-pilot`

## URL-to-staging dry-run pilot (G-7c)

Pilot complete: `tools/static-to-astro/docs/url-to-staging-dry-run-pilot-result.md`

- Pilot config: `config/sites/gosaki-piano.dry-run-pilot.json` → `fixtures/gosaki-static-site`
- Dry-run plan + local convert/build/static-public: **PASS**
- G-7b config `fixtureOut=fixtures/gosaki-piano` is empty (future crawl target)
- External / gosaki-piano.com crawl: **not executed in G-7c**
- Gate: `readyForG7dGosakiLiveCrawlPilot: true`
- Next: `G-7d-gosaki-live-crawl-pilot` (operator approval, max-pages ~20 first)

## Gosaki live crawl pilot (G-7d)

Pilot complete: `tools/static-to-astro/docs/gosaki-live-crawl-pilot-result.md`

- Live crawl: gosaki-piano.com, **once**, max-pages 20, concurrency 1 → **10 pages**
- Fixture: `fixtures/gosaki-piano/` (gitignored)
- Convert + build: **PASS**; prepare-public: **FAIL** (Wix `/2026-XX` vs verifier `schedule-2026-XX`)
- Assets crawled: 0 (Wix CDN cross-origin)
- FTP / workflow_dispatch / DB: **not executed**
- Gate: `readyForG7eGosakiStagingPreviewPreparation: false` (before G-7d1)

## Gosaki live route static-public compatibility fix (G-7d1)

Fix complete: `tools/static-to-astro/docs/gosaki-live-route-static-public-compatibility-fix.md`

- static-public verifier accepts live crawl routes `2026-XX/` and manual fixture `schedule-2026-XX/`
- Staging SEO check: head-only canonical/og:url (Wix body links ignored)
- Deploy-base check: `_astro` prefix optional when no Astro assets in dist
- G-7d output re-verified: prepare-public **PASS**, `safeForStaticFtp: true`
- Re-crawl: **not executed**
- FTP / workflow_dispatch / DB: **not executed**
- Gate: `gosakiLiveRouteStaticPublicCompatibilityFixComplete: true`, `readyForG7eGosakiStagingPreviewPreparation: true`
- Next: `G-7e-gosaki-staging-preview-preparation`

## Gosaki staging preview preparation (G-7e)

Preparation complete: `tools/static-to-astro/docs/gosaki-staging-preview-preparation.md`

- Fixed canonical duplicate deployBase (`buildDeployOrigin`, `resolve-public-seo.ts`)
- Wix production nav URLs → internal routes (`productionAbsoluteUrlToRoute`)
- static-public regenerated: prepare-public **PASS**, `stagingPreviewOk: true`, `safeForStaticFtp: true`
- FTP upload plan created (dry-run only — no `--apply`)
- Re-crawl: **not executed**
- Gate: `readyForG7fGosakiStagingUploadExecution: true`
- Next: `G-7f-gosaki-staging-upload-execution` (operator approval)

## Gosaki manual staging upload (G-7g)

Package: `tools/static-to-astro/docs/gosaki-manual-staging-upload-package.md`

- Manual upload package at `output/manual-upload/gosaki-piano/` (gitignored)
- `npm run manual-upload:package` / `npm run verify:manual-upload`
- Operator uploads `public-dist/` contents to `/cms-kit-staging/gosaki-piano/` — **no FTP auto-deploy**
- Gate: `readyForManualStagingUploadByOperator: true`, `readyForAnyFutureFtpApply: false`

## Gosaki staging FTP upload (G-7f — incident, apply suspended)

Aborted / incident: `tools/static-to-astro/docs/gosaki-staging-upload-execution-result.md`  
Hardening: `tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md`

- G-7f FTP `--apply` attempted once — suspected root `mirror --delete` accident
- **All FTP auto-apply suspended** — use G-7g manual package instead
- Gate: `ftpDeploySafetyHardeningComplete: true`, `readyForAnyFutureFtpApply: false`

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
