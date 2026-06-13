Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f-schedule-cms-generalization-planning`

Schedule CMS generalization planning complete. Transition plan from G-6-e5 hidden PoC to visible staging shell Schedule edit UI documented.

**Planning doc:** `tools/static-to-astro/docs/schedule-cms-generalization-planning.md`

**Recommended next phase:** `G-6-f1-schedule-poc-isolation-dry-run-default`

## 2. Post-G-6-e5 maintenance (still valid)

```txt
1. Dev server default: PUBLIC_ADMIN_WRITE_DRY_RUN=true
2. Do not re-click hidden G-6-e5 PoC Run button
3. rollbackNeeded: false (optional description rollback SQL in result doc only)
```

## 3. G-6-f planning outcomes

```txt
- PoC trigger vs general UI separation defined
- phased plan G-6-f1 … G-6-f6 + G-6-g create planning
- INSERT / DELETE / schedule_months writes deferred
- /admin and src/pages/admin remain untouched
- service_role prohibited
- Profile PoC pattern as reference for visible dry-run-first UI
```

## 4. Phased next steps (summary)

| Phase | Focus |
| --- | --- |
| G-6-f1 | PoC isolation + dry-run default policy |
| G-6-f2 | Schedule list read binding audit |
| G-6-f3 | Description edit dry-run prototype |
| G-6-f4 | Safe text fields dry-run |
| G-6-f5 | Safe fields non-dry-run (new approval ID) |
| G-6-f6 | Write UI hardening (updated_at, mobile QA) |
| G-6-g | Create flow planning (INSERT) |

## 5. AI workflow maintenance rule

After every meaningful Cursor task, update:

```txt
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
```

Also read `AGENTS.md` and `.cursor/rules` before starting work.
