Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-8d-gosaki-mobile-visual-parity-fix` (complete)

**Doc:** `tools/static-to-astro/docs/gosaki-mobile-visual-parity-fix.md`

**FTP auto-deploy:** still disabled.

### Gates

```txt
gosakiMobileVisualParityFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
wixStaticExportResponsiveBaselineGeneralized: true
gosakiSpecificExtensionsSeparated: true
readyForNextWixPilot: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```

## 2. Wix baseline modules

- **Common:** `scripts/lib/wix-static-export-baseline-overrides.mjs`
- **Composer:** `scripts/lib/wix-staging-visual-overrides.mjs`
- **Gosaki-specific:** `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` (G-8c hero/nav + G-8d mobile parity)

## 3. Next steps

1. **Operator:** re-upload `output/manual-upload/gosaki-piano/public-dist/` including `_astro/index.BeQxkV9Y.css`
2. Real-device QA: Discography SP, Header MENU, About/Contact on 375px width
3. Next Wix pilot: crawl → convert; baseline applies automatically; add site-specific override file if needed
4. Do not copy gosaki band profiles to other sites without explicit request

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
