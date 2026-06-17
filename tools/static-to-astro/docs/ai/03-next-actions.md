Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3d-staging-shell-schedule-site-slug-general-edit-consolidation-planning` — **complete**

**Next:** `G-9g3d1-general-edit-consolidation-implementation` (unified form UX + executor + legacy PoC freeze — no Save execution)

**Git:** latest pushed commit `d53d167`; G-9g3d planning doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-consolidation-planning.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-edit-planning.md`
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution-result.md`

### G-9g3d planning summary

- Consolidate G-9g2 / G-9g3b / G-9g3c slice Saves into one **general safe-fields editor**
- Single Save with **changed-fields-only** payload
- Legacy PoC Save buttons: **freeze + hide by default**
- Approval ID: `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc`
- Env arm: `PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED`
- **Save not executed** — planning only

### Gates

```txt
stagingShellScheduleGeneralEditConsolidationPlanningComplete: true
stagingShellScheduleGeneralEditNotImplemented: true
readyForG9g3d1GeneralEditConsolidationImplementation: true
readyForG9g3dExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. Commit G-9g3d planning doc + AI context (when operator approves)
2. **G-9g3d1-implementation** — unified UX + `executeG9G3dGeneralEditNonDryRunSave` (no Save)
3. G-9g3d2 smoke → G-9g3d3 preflight → G-9g3d4 execution (operator manual Save once)

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c Save
- Arm G-9g3d in routine dev without explicit execution phase
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3c)

- Latest commit (pushed): `d53d167`
- Pilot row: `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
- All safe fields hold PoC markers (see execution result docs)
- Lock `updated_at`: `2026-06-17T15:45:35.433566+00:00` (verify live before next write)
