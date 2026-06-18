Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g1-operational-save-path-implementation (complete)
Latest commit (pushed): b10b09a (G-9g3g planning)
G-9g3g1 implementation: uncommitted
```

## Summary

G-9g3g1 operational Save path **implementation completed**.

- **Goal:** picker-selected non-PoC row → G-9 Preview → gated operational Save (separate from frozen G-9g3d PoC)
- **Approval ID:** `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run`
- **Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED`
- **Save button:** `#site-slug-edit-g9g3g-operational-save-btn` (disabled by default in routine dev)
- **Save / DB write:** not executed (implementation only)

Prior complete:

- G-9g3g planning (`b10b09a`)
- G-9g3f3d hardening smoke (`a1cfcba`)
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
stagingShellScheduleSiteSlugOperationalGeneralEditImplementationComplete: true
readyForG9g3g2OperationalSaveUiGateSmokeTest: true
readyForAnyDbWrite: false
```

## Next

**G-9g3g2-operational-save-ui-gate-smoke-test**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**
