Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-8f-gosaki-mobile-visual-refinement (complete)
FTP auto-deploy: DISABLED
Gosaki-specific CSS: scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs (G-8c–G-8f)
Latest commit: 1eee686 (G-8e) — G-8f pending commit
```

---

## 3. Current state summary

G-8f refined gosaki SP for client preview: large KV cover hero, header/footer vertical alignment, tighter discography spacing, hidden Wix contact success message, flat Link panel, About band card image centering. Manual package regenerated; CSS `_astro/index.Dl5S2qmQ.css`. verify:url-staging 88 passed.

Docs: `gosaki-mobile-visual-refinement.md`, `gosaki-mobile-ui-final-polish.md`

---

## 4. G-8f gates

```txt
gosakiMobileVisualRefinementComplete: true
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

Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/` (include `_astro/index.Dl5S2qmQ.css`).

---

## 7. Future: Contact HubSpot

Wix form is placeholder; `#comp-kei80gar` success message hidden in G-8f. HubSpot embed planned in future phase.
