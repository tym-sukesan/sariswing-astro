Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-8g-gosaki-header-footer-mobile-regression-fix` (complete)

**Doc:** `tools/static-to-astro/docs/gosaki-header-footer-mobile-regression-fix.md`

**FTP auto-deploy:** still disabled.

### Gates

```txt
gosakiHeaderFooterMobileRegressionFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
gosakiMobileVisualRefinementComplete: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```

## 2. Wix baseline modules

- **Common:** `scripts/lib/wix-static-export-baseline-overrides.mjs`
- **Composer:** `scripts/lib/wix-staging-visual-overrides.mjs`
- **Gosaki-specific:** `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` (G-8c–G-8g)
- **Header logo link:** `scripts/lib/header-transform.mjs`

## 3. Next steps

1. **Operator:** re-upload `output/manual-upload/gosaki-piano/public-dist/` including `_astro/index.C9wUprmu.css`
2. Real-device QA: PC horizontal nav, SP opaque header + stable logo on menu open, centered footer SNS, tighter Discography
3. Share staging with gosaki client if QA passes
4. **Future:** Contact HubSpot embed replacement (not G-8g)

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
