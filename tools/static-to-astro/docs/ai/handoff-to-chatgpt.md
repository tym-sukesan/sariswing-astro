Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g4-operational-non-dry-run-execution (operator pending)
Latest commit (pushed): 43c7aa7 (G-9g3g3 preflight)
G-9g3g4 execution result: uncommitted
```

## Summary

G-9g3g4 operational non-dry-run execution runbook + result doc prepared — **operator pending**.

- **Target row:** `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001` / `gosaki-piano`
- **Planned change:** `description` only — append `[CMS Kit staging] G-9g3g4 operational Save test — temporary marker`
- **Approval ID:** `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run`
- **Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true`
- **Save / Preview / DB write:** not yet executed

Prior complete:

- G-9g3g3 preflight (`43c7aa7`)
- G-9g3g2 smoke (`2fb6d08`)
- G-9g3d PoC Save frozen — do not re-run

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: false (or unset)
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
All G-9 PoC arms: off
```

## Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunPreflightComplete: true
readyForG9g3g4OperationalNonDryRunExecution: true
stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunExecutionComplete: false
readyForAnyDbWrite: false
```

## Operator execution (manual only)

1. Arm non-dry-run env stack (execution result doc §3)
2. Preview: `#site-slug-edit-dry-run-preview-btn`
3. Save once: `#site-slug-edit-g9g3g-operational-save-btn`

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**

## Next after execution

**G-9g3g5-post-execution-hardening-and-restore-decision**
