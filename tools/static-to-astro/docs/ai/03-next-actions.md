Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight` (implementation + preflight complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md` (**new**)

**Awaiting:** operator commit approval

### G-9g3b summary

- Fields: `venue` + `description` only
- Approval ID: `G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc`
- Host gate mandatory; Save gated; not executed

### Gates

```txt
stagingShellScheduleVenueDescriptionPocImplementationComplete: true
stagingShellScheduleVenueDescriptionPocPreflightComplete: true
stagingShellScheduleVenueDescriptionPocNotExecuted: true
readyForG9g3bExecution: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. Commit G-9g3b implementation + preflight + G-9g3a smoke test record
2. G-9g3b-execution — operator manual Save once (after approval + env arm)

## 3. Do not

- Click Save in implementation/preflight phase
- Re-click G-9g2 Save
- Modify `/admin` or production
- Skip host gate

## 4. Baseline

- Latest commit: `54380a0` (G-9g3a)
- Target row title: `[CMS Kit staging] G-9g2 title PoC` (keep)
- Lock baseline `updated_at`: `2026-06-17T06:12:13.105898+00:00` (G-9g2 — verify live before Save)
