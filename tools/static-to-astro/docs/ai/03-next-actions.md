Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

AI workflow foundation refinement is complete. The repository now has `AGENTS.md`, populated handoff, and README notes for AI context files.

**Immediate next phase after this refinement:**

```txt
G-6-e5-schedule-non-dry-run-poc-explicit-retry
```

## 2. Before explicit retry

Confirm all of the following before the user clicks Run once:

```txt
- final beforeSnapshot SQL (description must be exactly 出演：)
- Supabase project is static-to-astro-cms-staging
- route is /__admin-staging-shell/musician-basic/
- active Supabase host matches kmjqppxjdnwwrtaeqjta.supabase.co
- target row id: aa440e29-5be8-402e-9190-0d81c48434c0
- payload: { "description": "出演： [G-6-e5 non-dry-run PoC]" }
- approval ID: G-6-e5-schedule-non-dry-run-poc
- user is signed in via staging Supabase Auth
- dev server started with inline env gates only (not root .env production values)
- user manually clicks Run button exactly once
```

## 3. Explicit retry rules

```txt
- No Playwright / Chromium auto-click
- No service_role
- No /admin route
- No schedule_months writes
- No automatic re-click on failure
- Capture result panel and run after-verification SQL
```

## 4. After retry

If success → `G-6-e5-schedule-non-dry-run-poc-explicit-retry-result`

If failure → do not re-click; save logs and open diagnosis phase.

Rollback SQL (staging only; use only if needed):

```sql
update public.schedules
set description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

## 5. AI workflow maintenance rule

After every meaningful Cursor task, update:

```txt
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
```

Also read `AGENTS.md` and `.cursor/rules` before starting work.
