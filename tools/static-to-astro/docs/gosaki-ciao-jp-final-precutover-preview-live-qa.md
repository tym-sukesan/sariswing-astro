# Gosaki ciao.jp final pre-cutover preview live QA

**Phase:** `gosaki-ciao-jp-final-precutover-preview-live-qa`
**Status:** **PASS / CLOSED (read-only live GET + operator visual · FTP not executed)**
**Date:** 2026-08-19
**HEAD:** `be2d64d029f251c1a7ab92c767cdf518b56252af` (= `origin/main`)
**Package `sourceCommit` (local regen):** `be2d64d029f251c1a7ab92c767cdf518b56252af`
**Prior:** `gosaki-ciao-jp-final-precutover-preview-regeneration` · operator FileZilla overwrite of `/gosaki-piano/`

| Check | Status |
| --- | --- |
| Cursor FTP / upload / delete | **no** |
| package generate / source change / DB write / SQL | **no** |
| DNS / HubSpot mutation / Secret / Edge / commit / push | **no** |
| Live GET/HEAD (ciao-preview only) | **yes** |
| Operator visual: Home THIS WEEK gone, KV then YouTube | **normal** (operator) |
| Operator visual: legacy `/2026-09/` stub | **normal** (operator) |

This HTML is still **ciao-preview** (`deployBase=/gosaki-piano/`). Do **not** reuse as production (`deployBase=/`).

---

## Gates

```txt
FINAL_PREVIEW_LIVE_QA_RESULT: PASS / CLOSED
phase: gosaki-ciao-jp-final-precutover-preview-live-qa
PREVIEW_URL: https://gotosaki.ciao.jp/gosaki-piano/
REMOTE_TARGET: /gosaki-piano/
sourceCommit: be2d64d029f251c1a7ab92c767cdf518b56252af
HOME_THIS_WEEK_REFS: 0
SEPTEMBER_EVENT_CARDS: 17
LEGACY_2026_09: stub PASS
PUBLIC_WIXSTATIC_REFS: 0
PUBLIC_PARASTORAGE_REFS: 0
MISSING_ASSETS: 0
ADMIN_EXPOSURE: 404
CONTACT_HUBSPOT_EMBED: present
PUBLIC_CUTOVER_BLOCKERS_FROM_PREVIEW: none
READY_FOR_CLIENT_SIGNOFF: true
READY_TO_WAIT_FOR_LOLIPOP_ADMIN: true
READY_FOR_DOCS_COMMIT_PUSH: true
CURSOR_FTP_EXECUTED: false
PACKAGE_GENERATE_EXECUTED: false
DB_WRITE_EXECUTED: false
SQL_REEXECUTE_FORBIDDEN: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-final-precutover-preview-docs-commit-push
```

Client signoff is **not yet recorded**. `READY_FOR_CLIENT_SIGNOFF: true` means this preview is the final pre-cutover package and is ready to show the client. Lolipop mapping / SSL / DNS / EMAIL and HubSpot www allow + thank-you remain operator panel gates.

---

## 1. Operator upload (recorded · not executed by Cursor)

Operator overwrote remote `/gosaki-piano/` with **contents** of:

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/
```

Cursor did **not** FTP. Do **not** treat `output/manual-upload/gosaki-piano/public-dist/` as the uploaded tree.

---

## 2. Live routes

Method: GET `https://gotosaki.ciao.jp/gosaki-piano/…` only. No production www GET. No FTP.

| Route | Status | robots | canonical / og:url |
| --- | --- | --- | --- |
| `/` | **200** | `noindex,nofollow,noarchive` | `https://gotosaki.ciao.jp/gosaki-piano/` |
| `/schedule/` | **200** | same | `…/schedule/` |
| `/schedule/2026-09/` | **200** | same | `…/schedule/2026-09/` |
| `/2026-09/` | **200** | `noindex,follow` (legacy stub) | canonical `…/schedule/2026-09/` |
| `/about/` | **200** | `noindex,nofollow,noarchive` | `…/about/` |
| `/discography/` | **200** | same | `…/discography/` |
| `/contact/` | **200** | same | `…/contact/` |
| `/link/` | **200** | same | `…/link/` |
| `/admin/` | **404** | — | — |
| `/robots.txt` | **200** | body `User-agent: *` / `Disallow: /` | — |

CSS `/gosaki-piano/_astro/index.DCKaMHwm.css` **200**. Host-root `/_astro/` **404**. weblike **0**. `www.gosaki-piano.com` in `<head>` **0**.

---

## 3. Home

| Check | Live |
| --- | --- |
| HTTP | **200** |
| `THIS WEEK` / `This Week` / `this week` | **0** |
| `#comp-m8y5bex0` / `#comp-m8y5l5fs` / `#comp-m8y53dj5` | **0** |
| 3/25, 3/27, 3/31 card strings | **0** |
| `home-flyer-20260327` refs in Home HTML | **0** |
| YouTube | `youtube-nocookie.com/embed/I-eY9YMq9GI` · `.gosaki-youtube-embed` |
| Localized KV | `/gosaki-piano/images/wix-local/home-kv-250428-0179re.jpg` · asset **200** |
| leftover hide class | `gosaki-home-this-week-hidden` + CSS collapse rule live |
| Header / footer | `SITE_HEADER` / `SITE_FOOTER` present |
| Operator visual | stale THIS WEEK gone · KV then YouTube normal |

---

## 4. September hub / month

| Check | Live |
| --- | --- |
| `/schedule/` | **200** · month links `2026.09` … `2026.03` · href `/gosaki-piano/schedule/2026-09/` |
| `/schedule/2026-09/` | **200** · **17** `gosaki-schedule-event-card` |
| Dates | 09.01, 04, 05, 06, 07, 08, 11, 12, 16, 19, 23, 24, 25, 26, 27, 28, 30 |
| `schedule-2026-09-001` / G-22e / CMS Kit staging | **0** |

---

## 5. Legacy `/2026-09/`

| Check | Live |
| --- | --- |
| HTTP | **200** |
| Heading | `Schedule page moved` |
| Link text | `Go to 2026.09 schedule` |
| href | `/gosaki-piano/schedule/2026-09/` |
| Follow | **200** · 17 event cards |
| Operator visual | stub normal |

---

## 6. Wix / localized assets

| Check | Live |
| --- | --- |
| `static.wixstatic.com` in fetched HTML | **0** |
| `static.parastorage.com` in fetched HTML | **0** |
| `images/wix-local/` 14 files | all HTTP **200** |
| missing | **0** |
| Intentional `gosakirikakotrio.wixsite.com` | **kept** (Link) |

Assets (all 200): `home-kv-250428-0179re.jpg`, `home-flyer-20260327.png`, `home-flyer-20260327-shop.png`, `home-flyer-no-photo.png`, `about-portrait-250428-1002.jpg`, `contact-photo-250428-0280.jpg`, `discography-continuous.png`, `discography-skylark.jpg`, `discography-about-us.jpg`, `discography-ja-jaaaaan.jpg`, `footer-sns-facebook.png`, `footer-sns-x.png`, `footer-sns-instagram.png`, `favicon.ico`.

---

## 7. Admin / SEO / Contact

| Check | Live |
| --- | --- |
| `/admin/` | **404** |
| Primary-page robots | `noindex,nofollow,noarchive` |
| `robots.txt` | `Disallow: /` |
| canonical / og:url | ciao preview host + `/gosaki-piano/` |
| Contact HubSpot | `js.hsforms.net/forms/embed/21392032.js` · `.hs-form-frame` · formId `57909d0c-9b9f-470a-8a18-e176d1d1a459` |
| PoC / test markers | **0** on Home / September / About / Contact |

---

## 8. Cutover reading

`PUBLIC_CUTOVER_BLOCKERS_FROM_PREVIEW: none`.

September missing and Home stale THIS WEEK are **CLOSED on live preview**, not only in source.

Remaining **not** preview HTML blockers (known operator / client):

- Lolipop www → `/gosaki-piano/` mapping, SSL, DNS, EMAIL_USAGE
- HubSpot production-domain allow + thank-you
- Client signoff (preview is ready to show)
- Archive URL 301s (`READY_FOR_REDIRECT_IMPLEMENTATION: false`)
- Production package generate (still later; this HTML is preview `deployBase`)

---

## 9. Not executed

FTP · package generate · source change · DB write · SQL · DNS/SSL · HubSpot mutation · Secret/Edge · commit/push.

---

## 10. Next

**Primary:** `gosaki-ciao-jp-final-precutover-preview-docs-commit-push`

Commit regen + live QA docs + AI SoT. **Do not** FTP. **Do not** generate production package in that commit phase.
