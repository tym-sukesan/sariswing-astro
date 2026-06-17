Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9e-site-slug-schedule-read-generalization` (implementation complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/site-slug-schedule-read-generalization.md` (**new**)

**Awaiting:** operator commit/push approval (`Generalize schedule read by site slug`)

### G-9e summary

- `loadScheduleRowsFromSupabase` + `loadScheduleDataForBuild` (generic `site_slug`)
- `loadGosakiScheduleDataForBuild` → thin wrapper + `GOSAKI_SCHEDULE_SITE_CONFIG`
- Gosaki static-fallback unchanged (60 rows, 13/10/12/11/14)

### Gates

```txt
siteSlugScheduleReadGeneralizationComplete: true
genericScheduleReadHelperReady: true
gosakiScheduleReadUsesGenericSiteSlugLoader: true
gosakiScheduleStaticFallbackStillWorks: true
readyForG9eCommit: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit G-9e**
2. Staging shell schedule read binding (gosaki-piano) or client visual review

## 3. Do not

- DB writes / FTP auto-apply / `service_role`

## 4. Baseline

- Latest commit: `e5aa2ab` (G-9d3)
- G-9e: implementation complete, pending commit
