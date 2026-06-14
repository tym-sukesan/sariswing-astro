Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f8-schedule-updated-at-staging-migration-execution`

Staging `public.schedules` updated_at trigger applied and verified. Operator manual SQL. Cursor did not execute SQL.

**Doc:** `tools/static-to-astro/docs/schedule-updated-at-staging-migration-execution-result.md`  
**Script:** `scripts/supabase/schedules-updated-at-trigger.sql`

**Recommended next phase:** `G-6-f9-schedule-optimistic-lock-enablement-planning`

## 2. Staging DB state

```txt
Trigger: schedules_set_updated_at on public.schedules (active)
Function: public.tg_schedules_set_updated_at()
Target row updated_at: 2026-06-14 06:49:42.240919+00 (after no-op verification UPDATE)
rollbackNeeded: false
```

## 3. Dry-run default

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

Do not re-click G-6-e5 / G-6-f6 PoC Run buttons.

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f8 migration execution | **DONE** |
| G-6-f9 optimistic lock enablement | **Next** |
| G-6-g general edit UI planning | Planned |

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
