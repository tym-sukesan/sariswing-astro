Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f8-schedule-updated-at-staging-migration-preflight`

Preflight for `public.schedules` updated_at trigger: SQL templates, pre/post checks, rollback, impact analysis. No SQL execution.

**Doc:** `tools/static-to-astro/docs/schedule-updated-at-staging-migration-preflight.md`

**Recommended next phase:** `G-6-f8-schedule-updated-at-staging-migration-execution`

## 2. Migration management

```txt
supabase/migrations/: does not exist
Pattern: scripts/supabase/*.sql + manual SQL Editor on staging
Execution phase: add scripts/supabase/schedules-updated-at-trigger.sql (optional)
```

## 3. Trigger proposal (not applied yet)

```txt
Function: public.tg_schedules_set_updated_at()
Trigger: schedules_set_updated_at BEFORE UPDATE ON public.schedules
schedule_months: not affected
```

## 4. Dry-run default

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

Do not re-click G-6-e5 / G-6-f6 PoC Run buttons.

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f8 preflight | **DONE** |
| G-6-f8 migration execution | **Next** |
| G-6-f9 optimistic lock enablement | Planned |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
