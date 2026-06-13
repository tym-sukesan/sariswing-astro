Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f2-schedule-read-ui-binding-audit`

ScheduleAdminUi connected to staging SSR read binding (`loadSchedulesForDryRunUi`, SELECT only). Read source badge, description column, audit doc.

**Doc:** `tools/static-to-astro/docs/schedule-read-ui-binding-audit.md`

**Recommended next phase:** `G-6-f3-schedule-description-edit-dry-run-prototype`

## 2. Dry-run default (day-to-day dev)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

Open schedule module: `http://localhost:4321/__admin-staging-shell/musician-basic/#schedule`

Do **not** set `PUBLIC_ADMIN_WRITE_DRY_RUN=false` unless in an approved explicit non-dry-run phase.

Do **not** re-arm hidden PoC without `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true` and a documented rerun phase.

## 3. G-6-e5 maintenance

```txt
- Do not re-click hidden PoC Run button
- G-6-e5 approval ID not for general Schedule UI
- rollbackNeeded: false
- staging description may retain PoC marker until optional rollback phase
```

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f1 PoC isolation | **DONE** |
| G-6-f2 Read UI binding audit | **DONE** |
| G-6-f3 Description edit dry-run | **Next** |
| G-6-f4 Safe fields dry-run | Planned |
| G-6-f5 Safe fields non-dry-run | Planned |

## 5. AI workflow maintenance rule

After every meaningful Cursor task, update:

```txt
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
```

Also read `AGENTS.md` and `.cursor/rules` before starting work.
