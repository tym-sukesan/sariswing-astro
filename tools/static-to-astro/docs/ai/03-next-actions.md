Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight` — **complete**

**Next:** `G-9g3c-execution` (operator manual Save once — after live SELECT / dev arm / dry-run preview / approval)

**Git:** latest pushed commit `37ba023`; G-9g3c preflight doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md`
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md`
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md`

### G-9g3c preflight summary

- Fields: `open_time`, `start_time`, `price` only
- Approval ID: `G-9g3c-schedule-site-slug-time-price-non-dry-run-poc`
- Env arm: `PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED`
- Lock baseline: `updated_at` = `2026-06-17T14:36:04.711395+00:00` (verify live via SELECT)
- Unchanged: `title`, `venue`, `description`
- **Save not executed** — preflight docs only

### Gates

```txt
stagingShellScheduleTimePricePocPreflightComplete: true
stagingShellScheduleTimePricePocNotExecuted: true
readyForG9g3cExecution: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps (execution phase — operator only)

1. Commit G-9g3c preflight doc + AI context (when operator approves)
2. Operator: live beforeSnapshot SELECT on `static-to-astro-cms-staging`
3. Operator: arm dev stack (inline env — §6 of preflight doc)
4. Operator: dry-run preview → confirm gates
5. Operator: provide approval text → manual Save once
6. Record result in `G-9g3c-execution-result` doc

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g3b or G-9g2 Save
- Click G-9g3c Save without execution-phase approval + env arm + preview gates
- Let Cursor / AI / Playwright click Save
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3b — verify live before Save)

- Latest commit (pushed): `37ba023`
- `title`: `[CMS Kit staging] G-9g2 title PoC`
- `venue`: `[CMS Kit staging] G-9g3b venue PoC`
- `description`: `出演： [G-9g3b venue+description PoC]`
- `open_time` / `start_time` / `price`: `NULL`
- Lock `updated_at`: `2026-06-17T14:36:04.711395+00:00` (verify live)
