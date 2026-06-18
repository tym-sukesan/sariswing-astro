Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3d2-general-edit-dry-run-smoke-test` — **complete**

**Next:** `G-9g3d3-general-edit-non-dry-run-preflight` (beforeSnapshot / rollback — no Save execution)

**Git:** latest pushed commit `6d3c104`; G-9g3d2 smoke doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-dry-run-smoke-test-result.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md`

### G-9g3d2 smoke summary

- **UI:** HTTP GET / SSR smoke — 18/18 PASS (no browser clicks)
- **Dry-run preview equivalent:** programmatic price-only smoke — PASS (`verify-g9g3d-general-edit-dry-run-smoke.mjs`)
- **Operator manual Preview:** not performed (optional before G-9g3d3 preflight)
- **Cursor / AI / Playwright clicks:** not performed
- Legacy PoC UI default hidden; Save general edit disabled (arm off)
- **Save / DB write not executed**; `actualWrite=false`; `cursorClickedSave: false`; `cursorClickedPreview: false`

### Gates

```txt
stagingShellScheduleGeneralEditDryRunSmokeTestPassed: true
stagingShellScheduleGeneralEditPocNotExecuted: true
readyForG9g3d3GeneralEditNonDryRunPreflight: true
readyForG9g3dExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. Commit G-9g3d2 smoke result + AI context (when operator approves)
2. **G-9g3d3-preflight** — beforeSnapshot / rollback SQL / dev arm stack (no Save)
3. G-9g3d4 execution (operator manual Save once)

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c Save
- Click G-9g3d Save until G-9g3d4 execution phase
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3c)

- Latest commit (pushed): `6d3c104`
- Pilot row: `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
- Lock `updated_at`: `2026-06-17T15:45:35.433566+00:00` (verified live in G-9g3d2 smoke)
