Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3e2-post-execution-hardening-smoke-test` — **complete**

**Next:** `G-9g3f-row-picker-planning`

**Git:** latest pushed commit `0685a34`; G-9g3e2 smoke doc + verifier + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-smoke-test-result.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-implementation.md`
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-planning.md`

### G-9g3e2 smoke summary

- **SSR:** HTTP GET staging shell — G-9g3e1 markers, save gate, frozen Save, legacy PoC hidden
- **Static:** `G9G3D_GENERAL_EDIT_POC_EXECUTED`, `poc_executed`, slice freeze, changed-fields-only payload
- **Save / Preview / DB write:** not executed in smoke
- **Do not re-run:** G-9g2 / G-9g3b / G-9g3c / G-9g3d Save

### Gates

```txt
stagingShellScheduleGeneralEditPostExecutionHardeningSmokeTestPassed: true
readyForG9g3fRowPickerPlanning: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. **G-9g3f-row-picker-planning** — planning only; no Save / DB write

### Deferred cleanup (G-9g3f+)

- `verify-g9g3d-general-edit-dry-run-smoke.mjs`: `PILOT_ROW.price` baseline still references G-9g3c price PoC string (pre-G-9g3d4). Not a G-9g3e2 blocker; align baseline with post-G-9g3d4 row state when refreshing legacy PoC smoke verifiers.

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D arms: off (unset)
PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline (post G-9g3d4)

- Latest commit (pushed): `0685a34`
- Pilot row: `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
- Lock `updated_at`: `2026-06-18T01:04:51.312817+00:00`
