Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3e-general-edit-post-execution-hardening-planning` — **complete**

**Next:** `G-9g3e1-post-execution-hardening-implementation`

**Git:** latest pushed commit `e80b707`; G-9g3e planning doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-planning.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md`

### G-9g3d4 execution (complete)

- **actualWrite:** true (operator manual Save once)
- **changedFields:** `price` only
- **updated_at:** `2026-06-18T01:04:51.312817+00:00`
- **Do not re-run:** G-9g2 / G-9g3b / G-9g3c / G-9g3d Save

### G-9g3e planning summary

- Freeze G-9g3d PoC re-run (G-9g3e1)
- Legacy PoC UI: developer-only, retain
- Operational approval ID: `G-9g3-schedule-site-slug-general-edit` (proposed, G-9g3g+)
- Row picker before real-data edit (G-9g3f)
- **Save / DB write not executed** in planning

### Gates

```txt
stagingShellScheduleGeneralEditPostExecutionHardeningPlanningComplete: true
stagingShellScheduleGeneralEditPocExecutionSucceeded: true
readyForG9g3e1PostExecutionHardeningImplementation: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. Commit G-9g3e planning doc + AI context (when operator approves)
2. **G-9g3e1-implementation** — freeze G-9g3d PoC re-run, UI hardening
3. **G-9g3e2-smoke** — dry-run smoke; no Save

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

- Latest commit (pushed): `e80b707`
- Pilot row: `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
- Lock `updated_at`: `2026-06-18T01:04:51.312817+00:00`
