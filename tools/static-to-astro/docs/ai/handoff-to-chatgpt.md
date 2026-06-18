Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g2-operational-save-ui-gate-smoke-test (passed)
Latest commit (pushed): 025156f (G-9g3g1 implementation)
G-9g3g2 smoke result: uncommitted
```

## Summary

G-9g3g2 operational Save UI gate smoke **passed** (operator manual).

- **Confirmed:** operational Save disabled in routine dev through all gate states (A–F)
- **G-9 Preview:** `changedFields=description` only; `actualWrite=false`; host gate + optimistic lock OK
- **Stale / PoC filter:** stale message blocks Save; `CMS Kit staging` filter → 0 selectable
- **Save / DB write:** not executed; operator restored candidate — no DB impact

Prior complete:

- G-9g3g1 implementation (`025156f`)
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
stagingShellScheduleSiteSlugOperationalGeneralEditUiGateSmokeTestPassed: true
readyForG9g3g3OperationalNonDryRunPreflight: true
readyForAnyDbWrite: false
```

## Next

**G-9g3g3-operational-non-dry-run-preflight**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save.**
