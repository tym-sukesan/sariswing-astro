Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-8d-gosaki-mobile-visual-parity-fix (complete)
FTP auto-deploy: DISABLED
Wix baseline: scripts/lib/wix-static-export-baseline-overrides.mjs
Gosaki-specific CSS: scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs (G-8c + G-8d mobile parity)
```

---

## 3. Current state summary

G-8d added gosaki-only SP visual parity CSS (header logo/MENU, Discography image-first 1-column, About/Contact stack) on top of G-8c baseline. G-8c baseline unchanged. Manual upload package regenerated; CSS `_astro/index.BeQxkV9Y.css`. verify:url-staging 72 passed.

Docs: `gosaki-mobile-visual-parity-fix.md`, `wix-static-export-responsive-baseline-generalization.md`

---

## 4. G-8d gates

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

---

## 5. Do not

- FTP connect / upload / mirror / delete from automation
- `workflow_dispatch`
- Touch production or production Supabase
- Commit `output/` or secrets

---

## 6. Next Wix pilot checklist

1. Live crawl fixture
2. `convert-static-to-astro.mjs` with deploy-base / base-url
3. Baseline CSS auto-appended when inline Wix head styles present
4. Add `site-specific-overrides/<slug>-overrides.mjs` for brand/comp IDs
5. Register slug in `buildWixSiteSpecificOverridesCss()`
