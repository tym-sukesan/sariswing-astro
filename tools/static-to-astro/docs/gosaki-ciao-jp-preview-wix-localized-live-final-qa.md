# Gosaki ciao.jp preview Wix-localized live final QA

**Phase:** `gosaki-ciao-jp-preview-wix-localized-live-final-qa`
**Status:** **CLOSED / PASS (read-only)**
**Date:** 2026-08-18
**HEAD:** `7de25b3550b882dbfaf40fd7b413779bb07c112d` (= `origin/main`)
**Package `sourceCommit`:** `7de25b3550b882dbfaf40fd7b413779bb07c112d`
**Prior:** `gosaki-ciao-jp-preview-wix-localized-regeneration` (operator then FileZilla)

| Check | Status |
| --- | --- |
| Cursor FTP / upload / delete | **no** |
| package regen / DNS / DB / Secret / Edge | **no** |
| commit / push | **no** |
| Live GET/HEAD | **yes** (preview only) |
| Operator visual (Home / About / Discography / Contact images) | **normal** (operator) |
| Operator: remote `images/wix-local/` 14 files | **yes** |
| Operator: remote `admin/` absent | **yes** |

---

## Gates

```txt
gosakiCiaoJpPreviewWixLocalizedLiveFinalQaComplete: true
phase: gosaki-ciao-jp-preview-wix-localized-live-final-qa
LIVE_FINAL_QA_RESULT: PASS
PREVIEW_URL: https://gotosaki.ciao.jp/gosaki-piano/
REMOTE_TARGET: /gosaki-piano/
sourceCommit: 7de25b3550b882dbfaf40fd7b413779bb07c112d
PUBLIC_WIXSTATIC_REFS: 0
PUBLIC_PARASTORAGE_REFS: 0
MISSING_ASSETS: 0
ADMIN_EXPOSURE: 404
NEAR_MISS_RECORDED: true
PREVENTION_GATES_ADDED: true
WIX_LOCALIZATION_CIAO_PREVIEW_CORRECTION_PHASE: CLOSED / PASS
READY_FOR_COMMIT_PUSH: true
CURSOR_FTP_EXECUTED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-wix-localized-docs-commit-push
```

This HTML is still **ciao-preview** (`deployBase=/gosaki-piano/`). Do **not** reuse as production (`deployBase=/`).

---

## 1. Near-miss (operator FileZilla)

| Step | What happened |
| --- | --- |
| 1 | Operator opened FileZilla local source `output/manual-upload/gosaki-piano/public-dist/` (**staging** package) |
| 2 | That tree has **no** `images/wix-local/` and **includes Admin** |
| 3 | First upload to remote `/gosaki-piano/` → localized image paths 404 / broken |
| 4 | Operator re-uploaded **contents** of `output/manual-upload/gosaki-piano-ciao-preview/public-dist/` |
| 5 | Remote `/gosaki-piano/images/wix-local/` 14 files present; `admin/` absent; images display |

Cause: **package folder mix-up** (`gosaki-piano` vs `gosaki-piano-ciao-preview`), not a convert/localization bug.

This phase did **not** FTP. Cursor did not retry or cleanup.

---

## 2. Prevention gates (permanent)

Added to `gosaki-ciao-jp-preview-manual-upload-preflight.md` §4 as **upload-before visual gates**:

1. Local folder name is **`gosaki-piano-ciao-preview`** (not `gosaki-piano`)
2. Local `images/wix-local/` exists
3. Local `admin/` does **not** exist

Package verifier (`verifyGosakiCiaoPreviewContentExtensions`): folder basename must be `gosaki-piano-ciao-preview`; `public-dist/images/wix-local/` must exist; `admin/` still forbidden.

---

## 3. Live read-only QA

Method: GET `https://gotosaki.ciao.jp/gosaki-piano/…` only. No production www GET. No FTP.

### 3.1 Routes

| Route | Status | robots | canonical / og:url |
| --- | --- | --- | --- |
| `/` | **200** | `noindex,nofollow,noarchive` | `https://gotosaki.ciao.jp/gosaki-piano/` |
| `/about/` | **200** | same | `…/about/` |
| `/discography/` | **200** | same | `…/discography/` |
| `/contact/` | **200** | same | `…/contact/` |
| `/schedule/` | **200** | same | `…/schedule/` |
| `/schedule/2026-08/` | **200** | same | `…/schedule/2026-08/` |
| `/link/` | **200** | same | `…/link/` |
| `/admin/` | **404** | — | — |
| `/robots.txt` | **200** | body `Disallow: /` | — |

CSS `/gosaki-piano/_astro/index.euRWbFgS.css` **200**. Host-root `/_astro/` **0**. weblike **0**. `www.gosaki-piano.com` in `<head>` **0**.

### 3.2 Localized assets (all HTTP 200)

| File | Type |
| --- | --- |
| `home-kv-250428-0179re.jpg` | jpeg |
| `home-flyer-20260327.png` | png |
| `home-flyer-20260327-shop.png` | png |
| `home-flyer-no-photo.png` | png |
| `about-portrait-250428-1002.jpg` | jpeg |
| `contact-photo-250428-0280.jpg` | jpeg |
| `discography-continuous.png` | png |
| `discography-skylark.jpg` | jpeg |
| `discography-about-us.jpg` | jpeg |
| `discography-ja-jaaaaan.jpg` | jpeg |
| `footer-sns-facebook.png` | png |
| `footer-sns-x.png` | png |
| `footer-sns-instagram.png` | png |
| `favicon.ico` | ico |

Prefix: `/gosaki-piano/images/wix-local/…`. missing **0**.

### 3.3 Wix CDN vs intentional link

| Check | Live |
| --- | --- |
| `static.wixstatic.com` in public HTML | **0** |
| `static.parastorage.com` in public HTML + CSS | **0** |
| `https://gosakirikakotrio.wixsite.com/gosakirikakotrio` | **kept** (Link + 2026-08) |

---

## 4. Functionality (no regression observed)

Nav CSS prefix `/gosaki-piano/` · Schedule hub present · footer SNS local icons · operator visual: Home / About / Discography / Contact images OK.

---

## 5. Forbidden (held)

FTP · remote mutate · DNS/SSL · DB · Secret · Edge · package regen · commit/push.

---

## 6. Next

`gosaki-ciao-jp-preview-wix-localized-docs-commit-push` — commit/push this QA + prevention-gate docs. Wix localization / ciao-preview correction phase is **CLOSED / PASS**.
