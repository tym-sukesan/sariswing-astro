Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9b1-gosaki-font-and-wix-asset-license-safety-audit (complete)
Latest commit: e97a047 (G-9b1 changes uncommitted)
Prior: G-9b gosaki schedule seed extractor
```

## Summary

G-9b1: Wix proprietary font audit + `wix-font-safety.mjs` sanitizer. `@font-face` / `futura-lt-w01-book` / `avenir-lt-w01_*` stripped or rewritten to system stacks in convert pipeline. Images still on wixstatic CDN (separate phase).

**Doc:** `tools/static-to-astro/docs/gosaki-font-and-wix-asset-license-safety-audit.md`

## Font safety (G-9b1)

```txt
Module: scripts/lib/wix-font-safety.mjs
Verify: npm run verify:gosaki-font-safety (21 passed)
Stacks: Avenir Next / Helvetica Neue / Arial (display); Helvetica + Hiragino/Meiryo (body)
No Google Fonts added
```

## CMS MVP priority

```txt
1. Schedule CMS — seed SQL next (G-9c)
2. Top YouTube embed — site_embeds (G-9f+)
3. Bands/Projects — static JSON (defer)
```

## Gates

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

## Recommended next phase

```txt
G-9c-gosaki-schedule-seed-sql-planning
```

Operator: regenerate manual-upload package after G-9b1 merge for font-safe staging CSS.

## Safety (always)

```txt
No production touch
No Supabase production project
No service_role in Kit staging write
No FTP / workflow_dispatch
No /admin changes
PUBLIC_ADMIN_WRITE_DRY_RUN=true default for routine dev
```
