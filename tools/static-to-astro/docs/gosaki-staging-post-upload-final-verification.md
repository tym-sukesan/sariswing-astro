# G-20u27 — Gosaki staging post-upload final verification

**Phase:** `G-20u27-staging-post-upload-final-verification`  
**Status:** **complete** — STG read-only HTTP verification + production readiness gap recorded  
**Date:** 2026-07-10  
**Doc HEAD:** `27e98da`  
**Deployed STG package:** `32872197659ebe359f106a5b2db298dbc8ee1cde` (`3287219`)  
**Prior:** G-20u24–u26b (discography migration · filtered read · package regen · manual FTP)

| Check | Status |
| --- | --- |
| `verify:current-active-regression` | **23/23 PASS** (at doc HEAD `27e98da`) |
| STG HTTP verification | **PASS** (Cursor read-only fetch 2026-07-10) |
| August schedule cards | **14** |
| Discography releases | **4** |
| Sitemap `/admin/` exclusion | **PASS** |
| `/admin/` page accessible on STG | **yes** (expected for staging package) |
| Production upload | **not executed** · **STOP** (G-20j) |
| FTP / deploy / DB write (Cursor) | **not executed** |

---

## Gates

```txt
gosakiStagingPostUploadFinalVerificationComplete: true
phase: G-20u27-staging-post-upload-final-verification
deployedPackageSourceCommit: 3287219
currentActiveRegression: 23/23 PASS
productionUploadStop: true
cursorFtpUploadExecuted: false
cursorDbWriteExecuted: false
```

---

## 1. Regression (pre-verification)

```bash
cd tools/static-to-astro
npm run verify:current-active-regression   # 23/23 PASS at 27e98da
```

---

## 2. Deployed staging context

| Item | Value |
| --- | --- |
| Live STG base | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Package `sourceCommit` on STG | `32872197659ebe359f106a5b2db298dbc8ee1cde` |
| Upload method | Manual FTP (operator · G-20u26b) |
| Discography | Filtered read (`site_slug=gosaki-piano`) · 4 releases / 34 tracks at build |

---

## 3. STG HTTP read-only verification (2026-07-10)

Automated fetch (read-only · no upload).

### Primary routes

| URL | HTTP | Content check |
| --- | --- | --- |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/ | **200** | OK |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/ | **200** | OK |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/ | **200** | OK |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-08/ | **200** | **14** `gosaki-schedule-event-card` |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/ | **200** | **4** repeater albums · Track List + Personnel structure |
| https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/ | **200** | Page renders · contact/form markup present |

### Admin / sitemap safety

| Check | Result |
| --- | --- |
| `/admin/` HTTP 200 | **yes** (staging package includes read-only admin — expected) |
| `sitemap-0.xml` HTTP 200 | **yes** |
| `sitemap-index.xml` HTTP 200 | **yes** |
| `sitemap-0.xml` includes `/schedule/2026-08/` | **yes** |
| `sitemap-0.xml` includes `/admin/` | **no** |
| `sitemap-index.xml` includes `/admin/` | **no** |
| `sitemap-0.xml` loc count | **12** |

---

## 4. Production readiness gap

Production upload remains **STOP** until G-20j explicit operator approval.

| Gap | Status | Required before production upload |
| --- | --- | --- |
| Production package regen | **pending** | `npm run build:gosaki:production` at approved HEAD |
| Production preflight | **pending** | `npm run preflight:gosaki:production` PASS |
| Admin exclusion | **required** | `includesAdmin: false` · no `admin/index.html` in production package |
| Sitemap admin exclusion | **verified on STG** | Re-verify on production package (G-20t1) |
| `intendedRemotePath` | **TBD** | Replace `TBD_G-20i` with confirmed Lolipop path |
| DNS / SSL / MX | **pending** | Operator checklist (see `gosaki-production-upload-preflight-refresh.md`) |
| Client sign-off | **pending** | Staging preview approval |
| G-20j written approval | **required** | Per G-7f1 destructive-operation form |
| FTP method | **manual only** | FileZilla — no CLI mirror/sync/delete |

Reference docs: `gosaki-production-upload-preflight-refresh.md` · `gosaki-production-profile-full-regen-dry-run.md`

---

## 5. Next phase candidates

| Priority | Candidate | Rationale |
| --- | --- | --- |
| **A (recommended)** | Gosaki admin UI improvement | STG CMS path verified; improve operator UX before wider rollout |
| B | Production readiness planning | Close G-20j gaps when client sign-off ready |
| C | Non-schedule CMS UI expansion | Discography / YouTube / bands edit slices after admin UX baseline |

---

## 6. Not executed

- FTP / deploy / mirror / sync / delete
- DB write / SQL mutation / Save
- Production changes
- Package upload by Cursor

---

## 7. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u27-staging-post-upload-final-verification
```
