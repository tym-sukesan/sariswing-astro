Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9b2-gosaki-inline-font-family-safety-fix` (complete)

**Doc:** `tools/static-to-astro/docs/gosaki-inline-font-family-safety-fix.md`

### Gates

```txt
gosakiInlineFontFamilySafetyFixComplete: true
futuraLtW01BookRemovedFromGeneratedHtml: true
manualUploadPublicDistFontSafe: true
readyToCommitInlineFontSafetyFix: true
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit** G-9b2 inline font safety fix (operator approval)
2. **G-9c:** `gosaki-schedule-seed-sql-planning` — INSERT SQL from extractor JSON; operator manual staging seed
3. **Operator:** Manual re-upload `output/manual-upload/gosaki-piano/public-dist/` after commit
4. **G-9d:** Astro Supabase read + static fallback for schedule pages
5. **Do not:** DB write, FTP auto-apply, `/admin` changes, workflow_dispatch

## 3. Gosaki staging preview (baseline)

- Latest commit: `e97a047` (G-9b1 uncommitted)
- Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- Deploy: manual upload package only
- Verifiers: font-safety 21, url-staging 156, crawl 30, schedule-seed 36 — all passed
