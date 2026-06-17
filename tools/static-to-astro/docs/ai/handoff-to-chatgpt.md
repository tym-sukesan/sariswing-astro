Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight (complete)
Latest commit (pushed): 37ba023 (G-9g3c implementation)
Git: working tree has uncommitted G-9g3c preflight doc + AI context updates
```

## Summary

G-9g3c preflight documents execution checks for `open_time` + `start_time` + `price` non-dry-run Save on the Gosaki pilot row. **Save not executed** — preflight phase only.

- **Target row:** `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` / `gosaki-piano`
- **Lock baseline:** `updated_at` = `2026-06-17T14:36:04.711395+00:00` (verify live via SELECT before Save)
- **Approval ID:** `G-9g3c-schedule-site-slug-time-price-non-dry-run-poc`
- **Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED`
- **G-9g3b execution:** succeeded (`125d5d5`) — do not re-run G-9g2 / G-9g3b Save
- **G-9g3c Save:** not clicked yet

**Docs:**
- `staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning.md`
- `staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md`
- `staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight.md` (**new**)
- `staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md`

## Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

Do **not** re-run G-9g2 or G-9g3b Save. Do **not** click G-9g3c Save without execution-phase gates.

## Gates

```txt
stagingShellScheduleTimePricePocPreflightComplete: true
stagingShellScheduleTimePricePocNotExecuted: true
readyForG9g3cExecution: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## Next

**G-9g3c-execution** — operator must first:

1. Live beforeSnapshot SELECT (staging only)
2. Arm dev stack (inline env)
3. Dry-run preview with all gates pass
4. Provide approval text
5. Manual Save once

Cursor / AI / Playwright must **not** click Save.
