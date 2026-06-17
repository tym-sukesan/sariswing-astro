Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning` — **complete**

**Next:** `G-9g3c-implementation` (gated Save UI + adapter — no Save execution)

**Git:** latest pushed commit `125d5d5`; G-9g3c planning + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md`

### G-9g3c planning summary

- Fields: `open_time`, `start_time`, `price` only
- Approval ID: `G-9g3c-schedule-site-slug-time-price-non-dry-run-poc`
- Env arm: `PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED`
- Payload: PoC markers for open / start / price
- Unchanged: `title`, `venue`, `description`
- Lock baseline: `updated_at` = `2026-06-17T14:36:04.711395+00:00` (verify live)

### Gates

```txt
stagingShellScheduleTimePricePocPlanningComplete: true
stagingShellScheduleTimePricePocNotExecuted: true
readyForG9g3cImplementation: true
readyForG9g3cExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. Commit G-9g3c planning doc + AI context (when operator approves)
2. **G-9g3c-implementation** — Save UI + `executeG9G3cTimePriceNonDryRunSave` + guards (no Save)
3. G-9g3c-preflight → G-9g3c-execution (operator manual Save once)

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
- Arm G-9g3c in routine dev without explicit execution phase
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3b)

- Latest commit (pushed): `125d5d5`
- `title`: `[CMS Kit staging] G-9g2 title PoC`
- `venue`: `[CMS Kit staging] G-9g3b venue PoC`
- `description`: `出演： [G-9g3b venue+description PoC]`
- `open_time` / `start_time` / `price`: `NULL`
- Lock `updated_at`: `2026-06-17T14:36:04.711395+00:00` (verify live)
