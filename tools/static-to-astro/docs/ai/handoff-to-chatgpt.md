Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning (recommended next)
Latest commit: b12435e (AI context sync; G-9g3b execution result doc pending commit)
Git: working tree has uncommitted G-9g3b execution result + AI context updates
```

## Summary

G-9g3b execution **succeeded** — operator manual Save once; `actualWrite=true`; `changedFields=venue,description` only.

- **Title:** `[CMS Kit staging] G-9g2 title PoC` — unchanged
- **Venue:** `[CMS Kit staging] G-9g3b venue PoC`
- **Description:** `出演： [G-9g3b venue+description PoC]`
- **updated_at:** `2026-06-17T14:36:04.711395+00:00`
- **Approval ID:** `G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc`
- **rollbackNeeded:** false
- Cursor / AI did **not** click Save

**Docs:**
- `staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md` (**new**)
- `staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight.md`
- `staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md`

## Routine dev safety (default — restored)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

Do **not** re-arm G-9g3b or re-click G-9g3b Save.

## Gates

```txt
stagingShellScheduleVenueDescriptionPocExecutionSucceeded: true
stagingShellScheduleVenueDescriptionPocNotExecuted: false
readyForG9g3bExecution: false
readyForG9g3cPlanning: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## Next

**G-9g3c planning** — `open_time` + `start_time` + `price` non-dry-run slice (planning only; no Save / DB write).

G-9g3c lock baseline: `updated_at` = `2026-06-17T14:36:04.711395+00:00` (verify live before next Save).
