Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9b1-gosaki-font-and-wix-asset-license-safety-audit` (complete)

**Doc:** `tools/static-to-astro/docs/gosaki-font-and-wix-asset-license-safety-audit.md`

### Gates

```txt
gosakiFontAndWixAssetLicenseSafetyAuditComplete: true
futuraLtW01BookRemovedOrRewritten: true
wixFontFaceOutputBlocked: true
gosakiScheduleSeedExtractorDryRunComplete: true
readyForG9cGosakiScheduleSeedSqlPlanning: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9c:** `gosaki-schedule-seed-sql-planning` — INSERT SQL from extractor JSON; operator manual staging seed
2. **Operator:** Regenerate manual-upload package after G-9b1 merge (font-safe `global.css`)
3. **G-9d:** Astro Supabase read + static fallback for schedule pages
4. **Do not:** DB write, FTP, `/admin` changes, workflow_dispatch

## 3. Gosaki staging preview (baseline)

- Latest commit: `e97a047` (G-9b1 uncommitted)
- Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- Deploy: manual upload package only
- Verifiers: font-safety 21, url-staging 156, crawl 30, schedule-seed 36 — all passed
