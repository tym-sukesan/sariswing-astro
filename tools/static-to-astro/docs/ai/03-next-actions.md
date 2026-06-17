Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9f-staging-shell-schedule-site-slug-read-binding` (implementation complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-read-binding.md` (**new**)

**Awaiting:** operator commit/push approval (`Bind staging shell schedule read by site slug`)

### G-9f summary

- Staging shell `#schedule`: read-only Gosaki `site_slug=gosaki-piano` binding
- `loadSchedulesForSiteSlugRead` + month counts + row table
- No Save/Update/Delete UI; `/admin` untouched

### Gates

```txt
stagingShellScheduleSiteSlugReadBindingComplete: true
stagingShellScheduleReadOnly: true
stagingShellScheduleUsesSiteSlug: true
readyForG9fCommit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit G-9f**
2. Operator dev check: `/__admin-staging-shell/musician-basic/#schedule` with Supabase env

## 3. Do not

- DB writes / FTP / `service_role`
- Modify `/admin` or G-6 write PoC sections without new phase

## 4. Baseline

- Latest commit: `15cf29b` (G-9e)
- G-9f: implementation complete, pending commit
