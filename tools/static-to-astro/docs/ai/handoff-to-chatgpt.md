Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-8g1-gosaki-mobile-header-and-footer-social-regression-fix (complete)
FTP auto-deploy: DISABLED
Gosaki-specific CSS: scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs (G-8c–G-8g1)
Latest commit: 8d9b18e (G-8g) — G-8g1 pending commit
```

---

## 3. Current state summary

G-8g1 fixed post-G-8g regressions: SP header `#ead7bd` beige (not `#fffccc` yellow), MENU open absolute dropdown nav (row 2), footer SNS text links (Facebook / X / Instagram), footer/copyright vertical stack without overlap. PC nav retained. verify:url-staging 105 passed.

Docs: `gosaki-mobile-header-and-footer-social-regression-fix.md`, `gosaki-header-footer-mobile-regression-fix.md`

---

## 4. G-8g1 gates

```txt
gosakiMobileHeaderAndFooterSocialRegressionFixComplete: true
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

Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/` (include new `_astro/index.*.css`).

---

## 7. Future: Contact HubSpot

Wix form is placeholder; `#comp-kei80gar` success message hidden in G-8f. HubSpot embed planned in future phase.
