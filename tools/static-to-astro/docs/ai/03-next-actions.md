Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-planning` (planning complete — uncommitted)

**Doc:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-planning.md` (**new**)

### G-9g2 summary

- Title-only non-dry-run PoC planning for `site_slug=gosaki-piano`
- Target: `schedule-2026-07-010` / approval `G-9g2-schedule-site-slug-title-non-dry-run-poc`
- UPDATE: id + site_slug + optimistic lock; dry-run prerequisite
- No implementation / Save UI / DB write in G-9g2 planning

### Gates

```txt
stagingShellScheduleSiteSlugTitleNonDryRunPocPlanningComplete: true
readyForG9g2Implementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. Optional: commit G-9g2 planning doc
2. **G-9g2-implementation** — adapter + gated Save (default off)

## 3. Do not

- DB writes until G-9g2-execution with operator approval
- Modify `/admin` or G-9g1 dry-run path
- Reuse G-6-g1 approval ID

## 4. Baseline

- Latest commit: `5ba2305` (G-9g1)
- G-9g2: planning complete, pending commit
