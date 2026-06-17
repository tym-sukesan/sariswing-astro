Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight (preflight complete — uncommitted)
Latest commit: 969822e (G-9g2 implementation)
```

## Summary

G-9g2 preflight: operator checklist before first manual title Save.

- **Target:** `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` / `gosaki-piano`
- **Payload:** `[CMS Kit staging] G-9g2 title PoC`
- **Approval:** `G-9g2-schedule-site-slug-title-non-dry-run-poc`
- **Env:** `PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true`
- **Cursor did not click Save**

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight.md`

## Gates

```txt
stagingShellScheduleTitlePocPreflightComplete: true
readyForOperatorG9g2TitlePocSave: true
readyForAnyDbWrite: false
```

## Next

- Commit G-9g2 preflight
- G-9g2-execution — operator manual Save once with approval text
