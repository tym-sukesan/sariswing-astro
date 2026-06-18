Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3f3a-row-picker-general-edit-binding-implementation` — **complete**

**Next:** `G-9g3f3b-row-picker-general-edit-binding-smoke-test`

**Git:** latest pushed commit `bf27151` (G-9g3f3 planning); G-9g3f3a implementation **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-implementation.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md`

### G-9g3f3a implementation summary

- **CustomEvent bridge:** picker → edit form hydrate
- **Pilot SSR preload:** removed (`targetRow: null`)
- **PoC audit rows:** edit hydrate blocked
- **Preview:** deferred to G-9g3f3b
- **Save / operational arm / DB write:** not implemented

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingImplementationComplete: true
readyForG9g3f3bRowPickerGeneralEditBindingSmokeTest: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. **G-9g3f3b-row-picker-general-edit-binding-smoke-test** — Preview dry-run on selected row; no Save
2. Optional: operator manual row select / clear / reload UX check
3. **G-9g3f3b:** align `verify-g9g3d-general-edit-dry-run-smoke.mjs` PILOT_ROW baseline

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D arms: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

## 4. Do not

- Re-click G-9g2 / G-9g3b / G-9g3c / G-9g3d Save
- Implement operational Save until G-9g3g
- Modify `/admin` or production
- Use `service_role` key

## 5. Baseline

- Latest commit (pushed): `bf27151`
- Pilot row (audit only): `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
- General edit: picker-driven hydrate (G-9g3f3a)
