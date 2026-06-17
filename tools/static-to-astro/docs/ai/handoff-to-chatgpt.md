Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g1-staging-shell-schedule-site-slug-edit-dry-run-preview (implementation complete — uncommitted)
Latest commit: d4e8f98 (G-9g planning)
```

## Summary

G-9g1: Staging shell Gosaki schedule edit **dry-run Preview only**.

- **Route:** `/__admin-staging-shell/musician-basic/#schedule`
- **Section:** `AdminStagingScheduleSiteSlugEditSection` (after G-9f read)
- **Target:** `schedule-2026-07-010` / `site_slug=gosaki-piano`
- **UI:** title input + `Preview dry-run` — no Save
- **`actualWrite`:** always false

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-edit-dry-run-preview.md`

## Gates

```txt
stagingShellScheduleSiteSlugEditDryRunPreviewComplete: true
stagingShellScheduleEditDryRunOnly: true
readyForG9g1Commit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Next

- Commit G-9g1
- G-9g2 title non-dry-run slice
