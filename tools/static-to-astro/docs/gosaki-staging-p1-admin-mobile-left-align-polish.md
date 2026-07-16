# G-20u39b — Gosaki staging P1 admin mobile left-align polish

**Phase:** `G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish`
**Status:** **complete** — CSS fix · local verify · operator STG browser recheck **PASS**
**Date:** 2026-07-16
**Implementation HEAD:** `d2a29da` (at CSS slice start) · **Uploaded package sourceCommit:** `d3bf6246cf76be00ea619eefcf7d89fb6b6474b1`
**Prior:** [G-20u39a2 Contact E2E result](./gosaki-staging-p1-contact-hubspot-submit-e2e-result.md) · [G-20u39 P1 review planning](./gosaki-staging-p1-review-planning.md)

| Check | Status |
| --- | --- |
| P1-ADM-MOB1 CSS fix | **yes** |
| Local verify | **PASS** |
| Operator manual FTP | **completed** (sourceCommit `d3bf624`) |
| STG browser re-check | **PASS** (375×667) |
| Cursor FTP / browser re-run | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiStagingP1AdminMobileLeftAlignPolishImplemented: true
phase: G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish
P1-ADM-MOB1: resolved
ADMIN_MOBILE_LEFT_ALIGN_POLISH_IMPLEMENTED: true
ADMIN_MOBILE_LOCAL_VERIFY_PASSED: true
ADMIN_MOBILE_STG_BROWSER_RECHECK_PASSED: true
STG_BROWSER_RECHECK_REQUIRED: false

CONTACT_E2E_PASSED: true
P1-CON1: resolved

PUBLIC_READY: CONDITIONAL
PRODUCTION_UPLOAD_READY: false
HOSTING_READY: false
GO_LIVE_READY: false

implementationExecuted: true
cssModificationExecuted: true
packageGenerationExecuted: false
cursorFtpUploadExecuted: false
operatorManualFtpUploadCompleted: true
uploadedPackageSourceCommit: d3bf6246cf76be00ea619eefcf7d89fb6b6474b1
productionChanged: false
wixProductionChanged: false
sqlExecuted: false
dbWriteExecuted: false
saveExecuted: false
edgeDeployExecuted: false
serviceRoleUsed: false

recommendedNextPhase: G-20u39c-gosaki-staging-public-mobile-visual-p1-review
```

**STG admin URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`
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

---

## 6. Operator STG reflection (manual FTP + browser)

| Item | Value |
| --- | --- |
| Manual FTP | **completed** (operator) |
| Uploaded sourceCommit | `d3bf6246cf76be00ea619eefcf7d89fb6b6474b1` |
| STG URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` |
| Viewport | iPhone SE equivalent — **375 × 667** |
| Browser result | **PASS** |

**Observed:**

- 管理画面全体が中央配置
- 左右余白がおおむね均等
- ヘッダーバッジがモバイル幅に収まる
- カードの左寄り感が解消
- 目立つ横方向の崩れなし

```txt
ADMIN_MOBILE_STG_BROWSER_RECHECK_PASSED: true
P1-ADM-MOB1: resolved
STG_BROWSER_RECHECK_REQUIRED: false
```

---

## 7. What Cursor did NOT do (this record slice)

| Item | Status |
| --- | --- |
| CSS re-edit | **no** |
| Package generation | **no** (this record) |
| Cursor FTP | **no** |
| Browser re-run by Cursor | **no** |
| Production / Wix change | **no** |
| DB write / Save / Edge | **no** |

---

## Summary

P1-ADM-MOB1 **resolved** after operator STG upload of `d3bf624` and iPhone SE browser PASS. Confirmed active staging P1 items **P1-CON1** and **P1-ADM-MOB1** are both **resolved**. Recommended next: **G-20u39c** public mobile / visual P1 review.
