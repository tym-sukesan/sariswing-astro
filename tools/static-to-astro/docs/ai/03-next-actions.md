Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3d3-general-edit-non-dry-run-preflight` — **complete**

**Next:** `G-9g3d4-general-edit-non-dry-run-execution` (operator manual Save once — price only)

**Git:** latest pushed commit `a647f36`; G-9g3d3 preflight doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-non-dry-run-preflight.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-dry-run-smoke-test-result.md`

### G-9g3d3 preflight summary

- First G-9g3d non-dry-run candidate: **`price` only**
- changed-fields-only payload: `{ "price": "[CMS Kit staging] G-9g3d general edit price PoC" }`
- Live SELECT only SQL documented (operator manual — Cursor does not execute)
- Operator approval text documented for G-9g3d4
- **Save / DB write not executed** in preflight

### Gates

```txt
stagingShellScheduleGeneralEditPreflightComplete: true
stagingShellScheduleGeneralEditPocNotExecuted: true
readyForG9g3d4GeneralEditNonDryRunExecution: true
readyForG9g3dExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. Commit G-9g3d3 preflight doc + AI context (when operator approves)
2. **G-9g3d4-execution** — live SELECT → dev arm → Preview → approval → operator Save once (price only)
3. G-9g3d4 execution result doc

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c Save
- Click G-9g3d Save until G-9g3d4 execution phase with approval
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3c)

- Latest commit (pushed): `a647f36`
- Pilot row: `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
- Lock `updated_at`: `2026-06-17T15:45:35.433566+00:00` (confirm live before G-9g3d4)
