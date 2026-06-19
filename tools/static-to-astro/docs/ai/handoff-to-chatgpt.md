Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3g5d-post-restore-hardening (complete)
Latest commit (pushed): ca1f721 (G-9g3g5c restore execution success)
G-9g3g5d hardening doc: uncommitted
```

## Summary

G-9g3g4 → G-9g3g5c **restore round-trip complete** on staging.

- **Target:** `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001` / `gosaki-piano`
- **G-9g3g4:** marker appended (`a58f5f9`) — actualWrite true, description only
- **G-9g3g5c:** marker removed (`ca1f721`) — actualWrite true, description only
- **markerRemainsInStagingDb:** false
- **service_role:** not used / **production:** untouched
- **rollback SQL:** not executed
- **Row picker:** target row selectable again (no `[CMS Kit staging]` in description)

**Do not re-click G-9g3g4 operational Save.** **Do not re-click G-9g3g5 restore Save.**

## Routine dev safety (default)

```txt
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: false (or unset)
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co (staging)
```

## Gates

```txt
stagingShellScheduleSiteSlugOperationalPostRestoreHardeningComplete: true
restoreRoundTripComplete: true
markerRemainsInStagingDb: false
markerRemoved: true
readyForG9g3h1SaveSuccessReclickPrevention: true
readyForAnyDbWrite: false
```

## Next

**G-9g3h1-save-success-reclick-prevention** (then G-9g3h2 usability, G-9g3h3 generalization notes)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g4 / G-9g3g5c restore Save.**
