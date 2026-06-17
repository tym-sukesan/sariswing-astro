Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g-staging-shell-schedule-site-slug-edit-planning` (planning complete — uncommitted)

**Doc:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-edit-planning.md` (**new**)

### G-9g summary

- Edit planning for Gosaki `site_slug=gosaki-piano` staging shell schedule CMS
- Safe fields: title, venue, open_time, start_time, price, description
- Dry-run first; non-dry-run deferred to G-9g2+
- site_slug mandatory on UPDATE; optimistic lock reuse
- No implementation / Save UI / DB write in G-9g

### Gates

```txt
stagingShellScheduleSiteSlugEditPlanningComplete: true
stagingShellScheduleEditDryRunFirst: true
readyForG9g1DryRunImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9g1** — dry-run Preview only (`AdminStagingScheduleSiteSlugEditSection`)
2. Optional: commit G-9g planning doc

## 3. Do not

- DB writes / FTP / `service_role`
- Modify `/admin` or G-9f read-only section
- Add Save button until G-9g2+

## 4. Baseline

- Latest commit: `8be88e7` (G-9f)
- G-9g: planning complete, pending commit (optional)
