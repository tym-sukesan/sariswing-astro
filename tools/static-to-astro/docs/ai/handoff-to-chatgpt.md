Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3d3-general-edit-non-dry-run-preflight (complete)
Latest commit (pushed): a647f36 (G-9g3d2 dry-run smoke)
Git: working tree has uncommitted G-9g3d3 preflight doc + AI context updates
```

## Summary

G-9g3d3 preflight documents first general edit non-dry-run execution (**price-only** candidate). **Save not executed** — preflight only.

- **Pilot row:** `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` / `gosaki-piano`
- **Execution candidate:** `price` only — `[CMS Kit staging] G-9g3c price PoC` → `[CMS Kit staging] G-9g3d general edit price PoC`
- **Lock baseline:** `updated_at` = `2026-06-17T15:45:35.433566+00:00` (confirm live SELECT before G-9g3d4)
- **Approval ID:** `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc`
- **G-9g3d Save:** not yet executed
- **Do not re-run:** G-9g2 / G-9g3b / G-9g3c Save

**Docs:**
- `staging-shell-schedule-site-slug-general-edit-non-dry-run-preflight.md` (**new**)
- `staging-shell-schedule-site-slug-general-edit-dry-run-smoke-test-result.md`
- `staging-shell-schedule-site-slug-general-edit-consolidation-implementation.md`

## Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

## Gates

```txt
stagingShellScheduleGeneralEditPreflightComplete: true
stagingShellScheduleGeneralEditPocNotExecuted: true
readyForG9g3d4GeneralEditNonDryRunExecution: true
readyForG9g3dExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

## Next

**G-9g3d4-general-edit-non-dry-run-execution** — operator manual Save once after live SELECT, dev arm, dry-run preview, approval text.
