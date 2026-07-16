# G-20u39b — Gosaki staging P1 admin mobile left-align polish

**Phase:** `G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish`  
**Status:** **complete** — minimal CSS layout fix · local verify only  
**Date:** 2026-07-16  
**Implementation HEAD:** `d2a29da` (at slice start)  
**Prior:** [G-20u39a2 Contact E2E result](./gosaki-staging-p1-contact-hubspot-submit-e2e-result.md) · [G-20u39 P1 review planning](./gosaki-staging-p1-review-planning.md)

| Check | Status |
| --- | --- |
| P1-ADM-MOB1 CSS fix | **yes** |
| STG browser re-check | **not done** (operator after package upload) |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiStagingP1AdminMobileLeftAlignPolishImplemented: true
phase: G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish
P1-ADM-MOB1: locally_resolved
ADMIN_MOBILE_LEFT_ALIGN_POLISH_IMPLEMENTED: true
ADMIN_MOBILE_LOCAL_VERIFY_PASSED: true
STG_BROWSER_RECHECK_REQUIRED: true

CONTACT_E2E_PASSED: true
P1-CON1: resolved

PUBLIC_READY: CONDITIONAL
PRODUCTION_UPLOAD_READY: false
HOSTING_READY: false
GO_LIVE_READY: false

implementationExecuted: true
cssModificationExecuted: true
packageGenerationExecuted: false
ftpUploadExecuted: false
productionChanged: false
wixProductionChanged: false
sqlExecuted: false
dbWriteExecuted: false
saveExecuted: false
edgeDeployExecuted: false
serviceRoleUsed: false

recommendedNextPhase: G-20u39b1-gosaki-staging-p1-admin-mobile-left-align-package-and-manual-upload-prep
```

**STG admin URL (unchanged):** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`  
**Local operator shell (dev):** `/__admin-staging-shell/musician-basic/admin/` — **not** production `/admin/`.

---

## 1. Problem (P1-ADM-MOB1)

G-20u37b operator STG browser QA: on iPhone SE width, Gosaki staging admin cards/blocks appeared **slightly left-aligned** — readable, not a P0 blocker.

---

## 2. Root cause

| Surface | Source | Cause |
| --- | --- | --- |
| **STG `/admin/`** (read-only admin) | `gosaki-staging-read-only-admin.css` | Header badges used `margin-left: auto` without mobile reset → visual right-shift vs symmetric main column; dashboard grid `minmax(15rem, 1fr)` without `minmax(0, 1fr)` fallback on narrow viewports; no `overflow-x: clip` on shell |
| **Local operator shell** | `admin.css` (Gosaki blocks) | `.admin-gosaki-admin-pages` / `.admin-page--wide` had `max-width` only (no `width: 100%` · `margin-inline: auto`); mobile grids retained wide `minmax(14–16rem, 1fr)` tracks |

**Not changed:** Astro markup · Save paths · public site CSS · production package.

---

## 3. Fix (minimal CSS)

### 3.1 STG read-only admin

File: `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css`

- `overflow-x: clip` on `body` + shell
- `width: min(100%, 960px)` + `margin-inline: auto` on main
- `min-width: 0` on banner / section / dashboard cards
- `@media (max-width: 640px)`: symmetric `padding-inline: 1rem`; badges `margin-left: 0` · full width · left-aligned; dashboard single column `minmax(0, 1fr)`

### 3.2 Local operator admin (Gosaki staging shell)

File: `templates/admin-cms/styles/admin.css`

- `.admin-gosaki-admin-pages` · `.admin-page--wide`: `width: 100%` · `margin-inline: auto` · `box-sizing: border-box`
- `@media (max-width: 640px)`: Gosaki grids → `minmax(0, 1fr)`; cards `min-width: 0`
- `overflow-x: clip` on `.admin-body` / `.admin-shell` when `.admin-gosaki-admin-pages` present

---

## 4. Viewports (local verify)

| Width | Target |
| --- | --- |
| 320px | iPhone SE — no horizontal scroll; main + card symmetric inset ≤ 2px |
| 375px | common mobile — same |
| 1280px | desktop — layout unchanged; no regression |

---

## 5. Local verification

- Phase verifier: Playwright fixture HTML + linked CSS (read-only admin + operator home structure)
- `npm run build:gosaki:staging:dry-run` — plan-only · no package output
- `npm run verify:current-active-regression`

**STG browser confirmation:** deferred to operator after **G-20u39b1** package prep + manual upload.

---

## 6. What was NOT done

| Item | Status |
| --- | --- |
| STG browser re-check | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| Production / Wix change | **no** |
| DB write / Save / Edge | **no** |
| Contact submit | **no** |

---

## Summary

Minimal container-side CSS resolves P1-ADM-MOB1 locally. **STG_BROWSER_RECHECK_REQUIRED: true** until G-20u39b1 upload.
