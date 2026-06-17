Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-planning (planning complete — uncommitted)
Latest commit: 5ba2305 (G-9g1)
```

## Summary

G-9g2: Planning for title-only non-dry-run PoC on Gosaki site_slug path.

- **Target:** `aa440e29-…` / `schedule-2026-07-010` / `gosaki-piano`
- **Payload:** `[CMS Kit staging] G-9g2 title PoC`
- **Approval:** `G-9g2-schedule-site-slug-title-non-dry-run-poc`
- **UPDATE:** id + site_slug + optimistic lock
- **Restore:** `title = <>` (separate approval)
- **No** implementation / Save / DB write in planning

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-planning.md`

## Gates

```txt
stagingShellScheduleSiteSlugTitleNonDryRunPocPlanningComplete: true
readyForG9g2Implementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Next

- G-9g2-implementation (gated Save UI, default off)
- Optional commit: `Plan staging shell schedule title non-dry-run PoC`
