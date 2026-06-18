Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3f2-row-picker-read-only-smoke-test` — **complete**

**Next:** `G-9g3f3-row-picker-general-edit-binding-planning`

**Git:** latest pushed commit `c3d49ee`; G-9g3f2 smoke doc + verifier + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-read-only-smoke-test-result.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-implementation.md`

### G-9g3f2 smoke summary

- **SSR:** HTTP GET staging shell — row picker markers, 59 selectable / 1 audit row
- **Pilot exclusion:** `aa440e29-…` not in selectable JSON; in audit JSON
- **PoC marker exclusion:** no `[CMS Kit staging]` in selectable JSON
- **Save / Preview / DB write / manual SQL:** not executed
- **Operator manual row select:** optional — not required for gate

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerReadOnlySmokeTestPassed: true
readyForG9g3f3RowPickerGeneralEditBindingPlanning: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. **G-9g3f3-row-picker-general-edit-binding-planning** — planning only; no Save / DB write
2. Optional: operator manual row select UX check before G-9g3f3

### Deferred cleanup (G-9g3f2+)

- `verify-g9g3d-general-edit-dry-run-smoke.mjs`: align `PILOT_ROW` baseline when refreshing legacy PoC smoke verifiers

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

## 5. Baseline

- Latest commit (pushed): `c3d49ee`
- Pilot row (audit only): `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
