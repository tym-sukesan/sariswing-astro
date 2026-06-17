Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9f-staging-shell-schedule-site-slug-read-binding (implementation complete — uncommitted)
Latest commit: 15cf29b (G-9e)
```

## Summary

G-9f: Staging shell read-only Gosaki schedule binding.

- **Route:** `/__admin-staging-shell/musician-basic/#schedule`
- **site_slug:** `gosaki-piano` (60 rows when env enabled)
- **Read-only** — no write UI added
- **`/admin`:** not modified

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-read-binding.md`

## Gates

```txt
stagingShellScheduleSiteSlugReadBindingComplete: true
stagingShellScheduleReadOnly: true
readyForG9fCommit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Next

- Commit G-9f
- Operator visual check with staging Supabase env
