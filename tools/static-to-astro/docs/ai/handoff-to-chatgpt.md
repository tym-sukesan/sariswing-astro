Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g-staging-shell-schedule-site-slug-edit-planning (planning complete — uncommitted)
Latest commit: 8be88e7 (G-9f)
```

## Summary

G-9g: Planning for staging shell Gosaki schedule **edit** path.

- **Route:** `/__admin-staging-shell/musician-basic/#schedule`
- **Read (G-9f):** done — 60 rows read-only
- **Edit (G-9g):** planning only — dry-run first, site_slug UPDATE guard, optimistic lock
- **Next impl:** G-9g1 dry-run Preview only (no Save)
- **`/admin`:** not modified

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-edit-planning.md`

## Gates

```txt
stagingShellScheduleSiteSlugEditPlanningComplete: true
stagingShellScheduleEditDryRunFirst: true
readyForG9g1DryRunImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Next

- G-9g1 dry-run implementation
- Optional commit: `Plan staging shell schedule site slug edits`
