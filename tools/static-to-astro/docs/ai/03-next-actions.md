Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9b3-gosaki-avenir-next-typography-regression-fix` (complete)

**Doc:** `tools/static-to-astro/docs/gosaki-avenir-next-typography-regression-fix.md`

### Gates

```txt
gosakiAvenirNextTypographyRegressionFixComplete: true
discographyHeadingWrapFixed: true
wixFontSafetyStillPassed: true
wixClassCleanupDeferred: true
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit** G-9b3 typography fix (operator approval)
2. **G-9c:** `gosaki-schedule-seed-sql-planning`
3. **Operator:** Manual re-upload after G-9b3 commit
4. **Deferred:** `/` home PC horizontal scroll — pre-existing; future gosaki responsive cleanup (see `gosaki-avenir-next-typography-regression-fix.md`)
5. **Do not:** DB write, FTP auto-apply, `/admin` changes

## 3. Gosaki staging preview (baseline)

- Latest commit: `e97a047` (G-9b1 uncommitted)
- Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- Deploy: manual upload package only
- Verifiers: font-safety 21, url-staging 156, crawl 30, schedule-seed 36 — all passed
