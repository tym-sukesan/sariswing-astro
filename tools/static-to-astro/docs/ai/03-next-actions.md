Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3f3-row-picker-general-edit-binding-planning` — **complete**

**Next:** `G-9g3f3a-row-picker-general-edit-binding-implementation`

**Git:** latest pushed commit `94d4e61` (G-9g3f2 smoke); G-9g3f3 planning doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-planning.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md`

### G-9g3f3 planning summary

- **Binding strategy:** client-side `CustomEvent` bridge (picker → edit form); no URL query param
- **SSR:** edit form `targetRow` null until selection; pilot preload removed in G-9g3f3a
- **Safety:** site_slug fixed; PoC audit rows blocked from edit hydrate; null selection → Save/Preview disabled
- **Operational:** approval ID `G-9g3-schedule-site-slug-general-edit`; env `PUBLIC_ADMIN_SCHEDULE_SITE_SLUG_GENERAL_EDIT_ENABLED` — G-9g3g only
- **Save / Preview / DB write / manual SQL:** not executed this phase

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerGeneralEditBindingPlanningComplete: true
readyForG9g3f3aRowPickerGeneralEditBindingImplementation: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. **G-9g3f3a-row-picker-general-edit-binding-implementation** — event bridge + edit hydrate; no Save / DB write
2. **G-9g3f3b-row-picker-general-edit-binding-smoke-test** — dry-run Preview on selected row; no Save
3. Optional: operator manual row select / clear / reload before G-9g3f3b

### Deferred cleanup (G-9g3f3b)

- `verify-g9g3d-general-edit-dry-run-smoke.mjs`: align `PILOT_ROW.price` + `UPDATED_AT_BASELINE` to post-G-9g3d4 values

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

- Latest commit (pushed): `94d4e61`
- Pilot row (audit only): `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
- Row picker: read-only smoke passed (G-9g3f2); general edit binding deferred until G-9g3f3a
