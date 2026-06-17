Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g1-staging-shell-schedule-site-slug-edit-dry-run-preview` (implementation complete — uncommitted)

**Doc:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-edit-dry-run-preview.md` (**new**)

**Awaiting:** operator commit/push approval (`Add staging shell schedule site slug edit dry run`)

### G-9g1 summary

- Dry-run Preview only for Gosaki `site_slug=gosaki-piano`
- `AdminStagingScheduleSiteSlugEditSection` — title input + Preview dry-run
- `actualWrite=false`; no Save UI
- G-9f read section unchanged

### Gates

```txt
stagingShellScheduleSiteSlugEditDryRunPreviewComplete: true
stagingShellScheduleEditDryRunOnly: true
readyForG9g1Commit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit G-9g1**
2. **G-9g2** — title non-dry-run PoC with site_slug UPDATE filter

## 3. Do not

- DB writes / FTP / `service_role`
- Add Save until G-9g2+
- Modify `/admin` or G-9f read section

## 4. Baseline

- Latest commit: `d4e8f98` (G-9g planning)
- G-9g1: implementation complete, pending commit
