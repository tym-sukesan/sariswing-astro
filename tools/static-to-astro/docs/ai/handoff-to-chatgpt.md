Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3b-execution (not started — awaiting operator approval)
Latest commit: c2a6b0c (G-9g3b venue + description gated Save + preflight)
Git: working tree clean; origin/main in sync
```

## Summary

G-9g3a smoke test passed (host gate, venue+description dry-run). G-9g3b implementation + preflight **committed and pushed** (`c2a6b0c`). Gated Save for venue + description only — **not executed**.

- **Title:** `[CMS Kit staging] G-9g2 title PoC` — keep; no restore
- **G-9g3b payload:** venue + description PoC values only
- **Approval ID:** `G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc`
- **Not executed:** G-9g3b-execution / Save / DB write / SQL mutation

**Docs:**
- `staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight.md`
- `staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md`
- `staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md`

## Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

**Note:** `tools/static-to-astro/.env.local` may contain a `SUPABASE_SERVICE_ROLE_KEY` entry (local only, gitignored). Do not use, reference, or load for G-9g3b execution. Execution uses anon key + authenticated session only.

## Gates

```txt
stagingShellScheduleVenueDescriptionPocImplementationComplete: true
stagingShellScheduleVenueDescriptionPocPreflightComplete: true
stagingShellScheduleVenueDescriptionPocNotExecuted: true
readyForG9g3bExecution: true
readyForAnyDbWrite: false
```

## Next (G-9g3b-execution — operator-driven)

1. Operator approval text (see preflight doc §5)
2. beforeSnapshot confirmation (SELECT only — operator; staging project only)
3. Inline env arm stack (preflight doc §6) — full dev server restart required
4. Host gate: `hostGatePassed=true`; activeHost must be staging
5. Dry-run preview: `actualWrite=false`, `changedFields=venue+description`, `optimisticLock.stale=false`
6. Operator manual Save once — Cursor / AI / Playwright must **not** click Save
