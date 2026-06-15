Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-8e-gosaki-mobile-ui-final-polish` (complete)

**Doc:** `tools/static-to-astro/docs/gosaki-mobile-ui-final-polish.md`

**FTP auto-deploy:** still disabled.

### Gates

```txt
gosakiMobileUiFinalPolishComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
gosakiMobileVisualParityFixComplete: true
wixStaticExportResponsiveBaselineGeneralized: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```

## 2. Wix baseline modules

- **Common:** `scripts/lib/wix-static-export-baseline-overrides.mjs`
- **Composer:** `scripts/lib/wix-staging-visual-overrides.mjs`
- **Gosaki-specific:** `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` (G-8c–G-8e)
- **Header logo link:** `scripts/lib/header-transform.mjs`

## 3. Next steps

1. **Operator:** re-upload `output/manual-upload/gosaki-piano/public-dist/` including `_astro/index.DRpT1Pny.css`
2. Real-device QA: sticky header, schedule width, contact form center, logo → home link
3. Share staging with gosaki client if QA passes

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
