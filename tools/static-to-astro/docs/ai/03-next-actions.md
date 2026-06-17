Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution` — **complete**

**Next recommended:** `G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning` (planning only)

**Git:** latest pushed commit `b12435e`; G-9g3b execution result doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight.md`
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md`

### G-9g3b execution summary

- `actualWrite=true`; operator manual Save once
- Cursor / AI did **not** click Save
- `changedFields`: `venue`, `description` only
- `title` / `open_time` / `start_time` / `price` unchanged
- `updated_at`: `2026-06-17T14:36:04.711395+00:00`
- `rollbackNeeded: false`

### Gates

```txt
stagingShellScheduleVenueDescriptionPocExecutionSucceeded: true
stagingShellScheduleVenueDescriptionPocNotExecuted: false
readyForG9g3bExecution: false
readyForG9g3cPlanning: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. Commit G-9g3b execution result doc + AI context updates (when operator approves)
2. **G-9g3c planning** — `open_time` + `start_time` + `price` slice (no Save / DB write in planning)
3. Routine dev: G-9g3b arm off / write off / dry-run on

## 3. Routine dev safety (restored)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

## 4. Do not

- Re-click G-9g3b Save
- Re-arm G-9g3b env without new approval ID / phase
- Re-click G-9g2 Save
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3b)

- Latest commit (pushed): `b12435e`
- Target row title: `[CMS Kit staging] G-9g2 title PoC` (unchanged)
- Target row venue: `[CMS Kit staging] G-9g3b venue PoC`
- Target row description: `出演： [G-9g3b venue+description PoC]`
- Lock baseline `updated_at` for G-9g3c: `2026-06-17T14:36:04.711395+00:00` (verify live before next Save)
