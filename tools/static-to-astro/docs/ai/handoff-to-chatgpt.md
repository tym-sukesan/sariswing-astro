Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3f-row-picker-planning (complete)
Latest commit (pushed): d43cd32 (G-9g3e2 smoke)
Git: working tree has uncommitted G-9g3f planning doc + AI context updates
```

## Summary

G-9g3f plans read-only schedule row picker for staging shell — move from fixed pilot row to site_slug-scoped operator selection.

- **Row picker:** read-only; multi-tenant safety via fixed `site_slug=gosaki-piano`
- **Pilot row:** audit only — exclude from default selection; do not re-edit
- **All G-9 PoC Saves:** re-run prohibited
- **Save / Preview / DB write:** not executed in planning
- **Next:** G-9g3f1 row picker implementation (read-only UI)

**Docs:**
- `staging-shell-schedule-site-slug-row-picker-planning.md` (**new**)
- `staging-shell-schedule-site-slug-general-edit-post-execution-hardening-smoke-test-result.md`

## Routine dev safety (default)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2/G9G3B/G9G3C/G9G3D arms: off (unset)
PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerPlanningComplete: true
readyForG9g3f1RowPickerImplementation: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

## Next

**G-9g3f1-row-picker-implementation** — read-only picker UI; no Save / DB write.
