Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9b3-gosaki-avenir-next-typography-regression-fix (complete)
Latest commit: c8d0df5 (G-9b3 uncommitted — await operator commit)
Prior: G-9b2 inline font safety, G-9b1 font audit
```

## Summary

G-9b3: Fixed PC page-title wrap after Avenir Next swap (Wix fixed-width boxes e.g. `#comp-jqy0szge` 199px). Font safety unchanged. Wix class cleanup deferred.

**Doc:** `tools/static-to-astro/docs/gosaki-avenir-next-typography-regression-fix.md`

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
