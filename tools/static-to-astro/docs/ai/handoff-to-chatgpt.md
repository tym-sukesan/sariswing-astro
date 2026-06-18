Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3d2-general-edit-dry-run-smoke-test (complete)
Latest commit (pushed): 6d3c104 (G-9g3d1 implementation)
Git: working tree has uncommitted G-9g3d2 smoke result + AI context updates
```

## Summary

G-9g3d2 dry-run smoke: **SSR UI (HTTP GET) + programmatic price-only dry-run**. **Save not executed** — smoke only.

- **Operator manual Preview:** not performed
- **Cursor / AI / Playwright clicks:** not performed
- **UI:** HTTP GET / SSR smoke
- **Dry-run preview equivalent:** programmatic smoke (`actualWrite=false`, no DB write)

- **Pilot row:** `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` / `gosaki-piano`
- **All slice PoCs:** succeeded — do not re-run G-9g2 / G-9g3b / G-9g3c Save
- **Smoke:** SSR 18/18 PASS; programmatic price-only dry-run PASS; `updated_at` live = `2026-06-17T15:45:35.433566+00:00`
- **Approval ID:** `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc`
- **G-9g3d Save:** not executed

**Docs:**
- `staging-shell-schedule-site-slug-general-edit-dry-run-smoke-test-result.md` (**new**)
- `staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md`
- `staging-shell-schedule-site-slug-general-edit-consolidation-planning.md`

## Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

**STOP immediately** if active host is Sariswing production: `vsbvndwuajjhnzpohghh.supabase.co`

Do **not** re-run G-9g2 / G-9g3b / G-9g3c Save. Do **not** click G-9g3d Save until G-9g3d4 execution phase.

## Gates

```txt
stagingShellScheduleGeneralEditDryRunSmokeTestPassed: true
stagingShellScheduleGeneralEditPocNotExecuted: true
readyForG9g3d3GeneralEditNonDryRunPreflight: true
readyForG9g3dExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

## Next

**G-9g3d3-general-edit-non-dry-run-preflight** — beforeSnapshot / rollback / dev arm stack (no Save).

Then: G-9g3d4 execution (operator manual Save once).
