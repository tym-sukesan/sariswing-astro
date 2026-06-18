Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3d1-general-edit-consolidation-implementation (complete)
Latest commit (pushed): be26fd1 (G-9g3d planning)
Git: working tree has uncommitted G-9g3d1 implementation + AI context updates
```

## Summary

G-9g3d1 implements unified general safe-fields edit UX for Gosaki `site_slug` schedule editing. **Save not executed** — implementation only.

- **Pilot row:** `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` / `gosaki-piano`
- **All slice PoCs:** succeeded — do not re-run G-9g2 / G-9g3b / G-9g3c Save
- **Strategy:** single Save (`executeG9G3dGeneralEditNonDryRunSave`), changed-fields-only payload, legacy PoC UI frozen/hidden
- **Approval ID:** `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc`
- **Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED`
- **Legacy UI env:** `PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE` (default off)
- **Lock baseline:** `updated_at` = `2026-06-17T15:45:35.433566+00:00` (verify live)

**Docs:**
- `staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md` (**new**)
- `staging-shell-schedule-site-slug-general-edit-consolidation-planning.md`
- G-9g2 / G-9g3b / G-9g3c execution result docs

## Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

Do **not** re-run G-9g2 / G-9g3b / G-9g3c Save. Do **not** click G-9g3d Save until G-9g3d4 execution phase.

## Gates

```txt
stagingShellScheduleGeneralEditPocNotExecuted: true
readyForG9g3d2GeneralEditDryRunSmokeTest: true
readyForG9g3dExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

## Next

**G-9g3d2-general-edit-dry-run-smoke-test** — Preview / gate smoke in dev; no Save / DB write.

Then: G-9g3d3 preflight → G-9g3d4 execution (operator manual Save once).
