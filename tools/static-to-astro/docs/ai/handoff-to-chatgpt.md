Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-8g-gosaki-header-footer-mobile-regression-fix (complete)
FTP auto-deploy: DISABLED
Gosaki-specific CSS: scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs (G-8c–G-8g)
Latest commit: pending (G-8g local complete, not committed)
```

---

## 3. Current state summary

G-8g fixed G-8f side effects: PC horizontal nav restored, SP opaque sticky header, logo stable on menu open, footer SNS/copyright centered with modern SVG mask icons, tighter SP Discography spacing. Manual package regenerated; CSS `_astro/index.C9wUprmu.css`. verify:url-staging 98 passed.

Docs: `gosaki-header-footer-mobile-regression-fix.md`, `gosaki-mobile-visual-refinement.md`

---

## 4. G-8g gates

```txt
gosakiHeaderFooterMobileRegressionFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
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

## 6. Operator re-upload

Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/` (include `_astro/index.C9wUprmu.css`).

---

## 7. Future: Contact HubSpot

Wix form is placeholder; `#comp-kei80gar` success message hidden in G-8f. HubSpot embed planned in future phase.
