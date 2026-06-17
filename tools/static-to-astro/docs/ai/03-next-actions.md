Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution` — **complete**

**Next:** `G-9g3d-staging-shell-schedule-site-slug-general-edit-consolidation-planning` (consolidate PoC slices into general edit UX)

**Git:** latest pushed commit `1cf5817`; G-9g3c execution result doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight.md`
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-edit-planning.md`

### G-9g3c execution summary

- Fields written: `open_time`, `start_time`, `price` only
- `actualWrite=true`, `rowsAffected=1`
- Operator manual Save once; Cursor/AI did not click Save
- `updated_at`: `2026-06-17T14:36:04.711395+00:00` → `2026-06-17T15:45:35.433566+00:00`
- title / venue / description unchanged
- `rollbackNeeded: false`
- **Do not re-run G-9g3c Save**

### Gates

```txt
stagingShellScheduleTimePricePocExecutionSucceeded: true
stagingShellScheduleTimePricePocNotExecuted: false
readyForG9g3cExecution: false
readyForG9g3dGeneralEditConsolidationPlanning: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. Commit G-9g3c execution result doc + AI context (when operator approves)
2. **G-9g3d planning** — general edit consolidation inside `AdminStagingScheduleSiteSlugEditSection`
3. Alternative deferred: G-9a YouTube embed CMS slice planning

## 3. Routine dev safety (restored)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c Save
- Arm G-9g3c in routine dev
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3c)

- Latest commit (pushed): `1cf5817`
- `title`: `[CMS Kit staging] G-9g2 title PoC`
- `venue`: `[CMS Kit staging] G-9g3b venue PoC`
- `description`: `出演： [G-9g3b venue+description PoC]`
- `open_time`: `[CMS Kit staging] G-9g3c open PoC`
- `start_time`: `[CMS Kit staging] G-9g3c start PoC`
- `price`: `[CMS Kit staging] G-9g3c price PoC`
- Lock `updated_at`: `2026-06-17T15:45:35.433566+00:00` (verify live before next write)
