Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3f1-row-picker-implementation` — **complete**

**Next:** `G-9g3f2-row-picker-read-only-smoke-test`

**Git:** latest pushed commit `9333e2c`; G-9g3f1 implementation + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-implementation.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-planning.md`

### G-9g3f1 implementation summary

- **Row picker:** read-only UI — list, filters, selected row summary, PoC audit panel
- **site_slug:** fixed `gosaki-piano`; loader `.eq("site_slug", siteSlug)`
- **General edit binding:** deferred to G-9g3f3 (pilot row unchanged)
- **Save / Preview / DB write:** not executed
- **Do not re-run:** G-9g2 / G-9g3b / G-9g3c / G-9g3d Save

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerImplementationComplete: true
readyForG9g3f2RowPickerReadOnlySmokeTest: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. **G-9g3f2-row-picker-read-only-smoke-test** — HTTP GET + row select; no Save
2. **G-9g3f3-row-picker-general-edit-binding-planning**

### Deferred cleanup (G-9g3f2)

- `verify-g9g3d-general-edit-dry-run-smoke.mjs`: align `PILOT_ROW` baseline when refreshing legacy PoC smoke verifiers

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

## 5. Baseline

- Latest commit (pushed): `9333e2c`
- Pilot row (audit only): `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano`
