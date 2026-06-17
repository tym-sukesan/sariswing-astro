Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation (implementation complete — uncommitted)
Latest commit: 91f8b50 (G-9g2 planning)
```

## Summary

G-9g2: Gated title non-dry-run Save for Gosaki site_slug path.

- **Save button:** `Save title PoC` (default disabled)
- **Adapter:** `site_slug` + `legacy_id` + `updated_at` on UPDATE
- **Approval:** `G-9g2-schedule-site-slug-title-non-dry-run-poc`
- **Env:** `PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true`
- **Cursor did not click Save**

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation.md`

## Gates

```txt
stagingShellScheduleTitleNonDryRunPocImplementationComplete: true
readyForG9g2Preflight: true
readyForAnyDbWrite: false
```

## Next

- Commit G-9g2 implementation
- G-9g2-preflight → operator manual Save once
