Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3e1-post-execution-hardening-implementation` — **complete**

**Next:** `G-9g3e2-post-execution-hardening-smoke-test`

**Git:** latest pushed commit `8b5f78c`; G-9g3e1 implementation + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-implementation.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-planning.md`

### G-9g3e1 implementation summary

- **G-9g3d PoC freeze:** `G9G3D_GENERAL_EDIT_POC_EXECUTED` — config + executor + UI
- **Legacy PoC UI:** audit-only; all Save buttons disabled
- **UI/UX:** staging banner, STOP alerts, save gate panel, auth badges, payload preview
- **Save / Preview / DB write:** not executed in implementation
- **Do not re-run:** G-9g2 / G-9g3b / G-9g3c / G-9g3d Save

### Gates

```txt
stagingShellScheduleGeneralEditPostExecutionHardeningImplementationComplete: true
readyForG9g3e2PostExecutionHardeningSmokeTest: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. Commit G-9g3e1 implementation (when operator approves)
2. **G-9g3e2-smoke** — SSR / programmatic smoke; no Save
3. **G-9g3f-row-picker-planning** (after G-9g3e2)

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D arms: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3d)

- Latest commit (pushed): `8b5f78c`
- Pilot row: `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
- Lock `updated_at`: `2026-06-18T01:04:51.312817+00:00`
