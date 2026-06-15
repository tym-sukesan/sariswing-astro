Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-8f-gosaki-mobile-visual-refinement` (complete)

**Doc:** `tools/static-to-astro/docs/gosaki-mobile-visual-refinement.md`

**FTP auto-deploy:** still disabled.

### Gates

```txt
gosakiMobileVisualRefinementComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
gosakiMobileUiFinalPolishComplete: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```

## 2. Wix baseline modules

- **Common:** `scripts/lib/wix-static-export-baseline-overrides.mjs`
- **Composer:** `scripts/lib/wix-staging-visual-overrides.mjs`
- **Gosaki-specific:** `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` (G-8c–G-8f)
- **Header logo link:** `scripts/lib/header-transform.mjs`

## 3. Next steps

1. **Operator:** re-upload `output/manual-upload/gosaki-piano/public-dist/` including `_astro/index.Dl5S2qmQ.css`
2. Real-device QA: KV cover hero, footer center, contact no success msg, Link flat panel
3. Share staging with gosaki client if QA passes
4. **Future:** Contact HubSpot embed replacement (not G-8f)

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
