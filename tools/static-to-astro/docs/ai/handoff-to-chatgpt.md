Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g4a2-framework-single-text-field-operational-commonization-implementation (not started)
branch: main
HEAD = origin/main = e267da3
Latest commit (pushed): e267da3 (G-9g4a2 single-text-field operational commonization planning)
working tree: clean
G-9g4a2-framework-single-text-field-operational-commonization-planning: complete, committed, pushed
Planning verifier: 39 passed, 0 failed
readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationImplementation: true
```

## Summary

**G-9g4a2 single-text-field operational commonization planning — complete** (commit `e267da3` — committed and pushed):

- **Doc:** `staging-shell-schedule-single-text-field-operational-commonization-planning.md`
- **Target fields:** `open_time`, `start_time`, `price` (config-driven registry)
- **Excluded:** `description` (G-9g3g operational), `title` (SEO sensitivity), date/route/publication/image
- **Venue:** proven G-9g4a1 — separate path (not in registry v1)
- **Planning verifier:** 39 passed, 0 failed
- **G-9g4a2a open_time round-trip:** complete — commit `105c6b1`
- **markerRemainsInStagingDb:** false
- **activeRestoreExceptionsCount:** 0
- **no further Save / restore needed:** yes (proven row)

## Policy (manual round-trip reduction)

- Do **not** repeat per-field manual round-trips for `start_time` / `price`
- Manual non-dry-run round-trip only when **new common logic** is introduced
- Config-only fields: static verifiers, guards, dry-run Preview, type checks
- Do **not** over-abstract — minimal commonization for gosaki schedule CMS practical use
- **Not** next: `start_time`-only manual execution slice

## Gates

```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationPlanningComplete: true
readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationImplementation: true
stagingShellScheduleOpenTimeOnlyOperationalRoundTripComplete: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

## Next

**G-9g4a2-framework-single-text-field-operational-commonization-implementation** — registry, parameterized guards/config/Save/UI, G-9g4a2a delegate, static verifiers. **Not** `start_time`-only manual execution.
