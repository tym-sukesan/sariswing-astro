Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-8g1-gosaki-mobile-header-and-footer-social-regression-fix` (complete)

**Doc:** `tools/static-to-astro/docs/gosaki-mobile-header-and-footer-social-regression-fix.md`

**FTP auto-deploy:** still disabled.

### Gates

```txt
gosakiMobileHeaderAndFooterSocialRegressionFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
gosakiHeaderFooterMobileRegressionFixComplete: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```

## 2. Wix baseline modules

- **Common:** `scripts/lib/wix-static-export-baseline-overrides.mjs`
- **Composer:** `scripts/lib/wix-staging-visual-overrides.mjs`
- **Gosaki-specific:** `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` (G-8c–G-8g1)
- **Header logo link:** `scripts/lib/header-transform.mjs`

## 3. Next steps

1. **Operator:** re-upload `output/manual-upload/gosaki-piano/public-dist/` including new `_astro/index.*.css`
2. Real-device QA: SP beige header (not yellow), MENU open 2-row nav, footer text SNS + copyright stacked
3. Share staging with gosaki client if QA passes
4. **Future:** Contact HubSpot embed replacement (not G-8g1)

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
