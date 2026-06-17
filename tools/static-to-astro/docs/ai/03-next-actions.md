Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3b-execution` (**not started** — awaiting operator approval)

**Prior (complete):** `G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation` + preflight — committed and pushed (`c2a6b0c`)

**Git:** working tree clean; `origin/main` in sync

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md`
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight.md`
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md`

### G-9g3b summary

- Fields: `venue` + `description` only
- Approval ID: `G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc`
- Host gate mandatory; Save gated
- **Not executed:** Save / DB write / SQL mutation

### Gates

```txt
stagingShellScheduleVenueDescriptionPocImplementationComplete: true
stagingShellScheduleVenueDescriptionPocPreflightComplete: true
stagingShellScheduleVenueDescriptionPocNotExecuted: true
readyForG9g3bExecution: true
readyForAnyDbWrite: false
```

## 2. Next steps (G-9g3b-execution)

1. Operator approval text (preflight doc §5)
2. beforeSnapshot confirmation — operator SELECT on staging only; verify title / venue / description / `updated_at` baseline
3. Inline env arm stack (preflight doc §6) — includes `PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=true`
4. Dev server **full restart** with inline env (do not commit `.env` / `.env.local`)
5. Host gate: `activeHost=kmjqppxjdnwwrtaeqjta.supabase.co`, `hostGatePassed=true`
6. Dry-run preview: `actualWrite=false`, `changedFields=venue+description`, stale=false
7. Operator manual Save once — Cursor / AI / Playwright must **not** click Save

## 3. Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

**Note:** `tools/static-to-astro/.env.local` may contain `SUPABASE_SERVICE_ROLE_KEY` (local only, gitignored). Forbidden for G-9g3b execution — do not use or reference.

## 4. Do not

- Click Save (Cursor / AI / Playwright)
- Run DB write / SQL mutation in this phase without operator approval
- Re-click G-9g2 Save
- Modify `/admin` or production
- Skip host gate
- Use `service_role` key

## 5. Baseline

- Latest commit: `c2a6b0c` (G-9g3b implementation + preflight)
- Target row title: `[CMS Kit staging] G-9g2 title PoC` (keep)
- Lock baseline `updated_at`: `2026-06-17T06:12:13.105898+00:00` (G-9g2 — verify live before Save)
