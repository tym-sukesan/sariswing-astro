Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-e5-schedule-non-dry-run-poc-explicit-retry-result`

Schedule CMS first non-dry-run write PoC **succeeded**. User manually clicked Run once. `description` updated on staging `public.schedules` target row. `description_match: true`. Rollback not needed.

**Result doc:** `tools/static-to-astro/docs/schedule-non-dry-run-poc-explicit-retry-result.md`

## 2. Post-success actions (recommended)

```txt
1. Stop / restart dev server with PUBLIC_ADMIN_WRITE_DRY_RUN=true (default safe mode).
2. Do not re-click the hidden PoC Run button.
3. Do not run additional schedule writes without explicit approval.
4. Optional rollback only if restoring staging row description is desired (SQL in result doc).
5. Plan next Schedule CMS generalization work.
```

## 3. Completed explicit retry record

```txt
Phase: G-6-e5-schedule-non-dry-run-poc-explicit-retry-result
beforeSnapshot: PASS (description = 出演：)
route: /__admin-staging-shell/musician-basic/
Supabase project: static-to-astro-cms-staging
host: kmjqppxjdnwwrtaeqjta.supabase.co
Run button: user manual once only
Cursor/Playwright click: no
result panel: executed, actualWrite true, changedFields ["description"]
after-verification: description_match true
schedule_months touched: false
service_role used: false
rollbackNeeded: false
rollback executed: false
```

## 4. Rollback SQL (staging only; not executed)

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
