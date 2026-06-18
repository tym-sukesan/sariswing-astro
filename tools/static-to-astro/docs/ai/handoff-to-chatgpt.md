Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g-operational-general-edit-planning (complete)
Latest commit (pushed): a1cfcba (G-9g3f3d hardening smoke)
G-9g3g planning: uncommitted
```

## Summary

G-9g3g operational general edit **planning completed**.

- **Goal:** row picker → non-PoC row → safe-fields changed-fields-only operational Save (new path, not G-9g3d PoC)
- **Approval ID:** `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run`
- **Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED`
- **Save / DB write:** not executed (planning only)

Prior complete:

- G-9g3f3d hardening smoke passed (`a1cfcba`)
- G-9g3f3c hardening (`f0fd3af`)
- G-9g3d PoC Save frozen — do not re-run

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
All G-9 PoC + operational arms: off
```

## Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditPlanningComplete: true
readyForG9g3g1OperationalSavePathImplementation: true
readyForAnyDbWrite: false
```

## Next

**G-9g3g1-operational-save-path-implementation**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**
