Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9b2-gosaki-inline-font-family-safety-fix (complete)
Latest commit: (G-9b2 uncommitted — await operator commit)
Prior: G-9b1 font safety, G-9b schedule seed extractor
```

## Summary

G-9b2: Removed Wix font **names** from generated HTML inline styles (especially `Header.astro` logo/nav). `sanitizeWixFontHtml()` + header-transform wiring. `public-dist` grep: 0 blocked patterns.

G-9b1: `@font-face` / woff URL stripping in `global.css`.

**Doc:** `tools/static-to-astro/docs/gosaki-inline-font-family-safety-fix.md`

## Font safety (G-9b2)

```txt
Module: scripts/lib/wix-font-safety.mjs (sanitizeWixFontHtml, rewriteFntAndFontShorthand)
Header: scripts/lib/header-transform.mjs (sanitize before Astro withBase injection)
Verify: npm run verify:gosaki-font-safety (37 passed)
Stacks: Avenir Next / Helvetica Neue / Arial (display); Helvetica + Hiragino/Meiryo (body)
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
