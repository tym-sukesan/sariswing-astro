Last updated: 2026-06-18
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g3f-row-picker-planning` — **complete**

**Next:** `G-9g3f1-row-picker-implementation`

**Git:** latest pushed commit `d43cd32`; G-9g3f planning doc + AI context updates **uncommitted**

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-row-picker-planning.md` (**new**)
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-general-edit-post-execution-hardening-smoke-test-result.md`

### G-9g3f planning summary

- **Row picker:** read-only; `site_slug = gosaki-piano` fixed scope
- **UI:** list + filters + selected row summary; no Save in picker
- **Edit binding:** deferred to G-9g3f3 planning; operational write to G-9g3g
- **Pilot row:** audit only — exclude from default selection
- **Save / Preview / DB write:** not executed in planning
- **Do not re-run:** G-9g2 / G-9g3b / G-9g3c / G-9g3d Save

### Gates

```txt
stagingShellScheduleSiteSlugRowPickerPlanningComplete: true
readyForG9g3f1RowPickerImplementation: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## 2. Next steps

1. **G-9g3f1-row-picker-implementation** — read-only picker UI; no Save / no edit binding
2. **G-9g3f2-row-picker-read-only-smoke-test**
3. **G-9g3f3-row-picker-general-edit-binding-planning**

### Deferred cleanup (G-9g3f1 / G-9g3f2)

- `verify-g9g3d-general-edit-dry-run-smoke.mjs`: align `PILOT_ROW` baseline with post-G-9g3d4 state or mark legacy PoC-only when refreshing smoke verifiers

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

- Latest commit (pushed): `d43cd32`
- Pilot row (audit only): `aa440e29-5be8-402e-9190-0d81c48434c0` / `gosaki-piano` / `schedule-2026-07-010`
- Lock `updated_at`: `2026-06-18T01:04:51.312817+00:00`
