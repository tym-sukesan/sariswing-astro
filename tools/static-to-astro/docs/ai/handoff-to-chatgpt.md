Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3d-staging-shell-schedule-site-slug-general-edit-consolidation-planning (complete)
Latest commit (pushed): d53d167 (G-9g3c execution result)
Git: working tree has uncommitted G-9g3d planning doc + AI context updates
```

## Summary

G-9g3d planning defines consolidation of G-9g2 / G-9g3b / G-9g3c slice Saves into one general safe-fields editor. **Save not executed** — planning only.

- **Pilot row:** `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` / `gosaki-piano`
- **All slice PoCs:** succeeded — do not re-run G-9g2 / G-9g3b / G-9g3c Save
- **Strategy:** single Save, changed-fields-only payload, legacy PoC UI frozen/hidden
- **Approval ID (proposed):** `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc`
- **Env arm (proposed):** `PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED`
- **Lock baseline:** `updated_at` = `2026-06-17T15:45:35.433566+00:00` (verify live)

**Docs:**
- `staging-shell-schedule-site-slug-general-edit-consolidation-planning.md` (**new**)
- `staging-shell-schedule-site-slug-safe-fields-edit-planning.md`
- G-9g2 / G-9g3b / G-9g3c execution result docs

## Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

Do **not** re-run G-9g2 / G-9g3b / G-9g3c Save.

## Gates

```txt
stagingShellScheduleGeneralEditConsolidationPlanningComplete: true
stagingShellScheduleGeneralEditNotImplemented: true
readyForG9g3d1GeneralEditConsolidationImplementation: true
readyForG9g3dExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

## Next

**G-9g3d1-general-edit-consolidation-implementation** — unified form UX, executor, legacy PoC freeze; no Save / DB write.

Then: G-9g3d2 smoke → G-9g3d3 preflight → G-9g3d4 execution (operator manual Save once).
