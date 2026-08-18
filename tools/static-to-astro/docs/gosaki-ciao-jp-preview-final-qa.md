# Gosaki ciao.jp preview final QA

**Phase:** `gosaki-ciao-jp-preview-final-qa`
**Status:** **COMPLETE (read-only · PASS)**
**Date:** 2026-08-18
**HEAD:** `0f84b2d1bf1e26da57a7ae6676751aa873931fc7` (= `origin/main`)
**Package `sourceCommit`:** `0f84b2d1bf1e26da57a7ae6676751aa873931fc7`
**Prior:** `gosaki-ciao-jp-preview-manual-upload-preflight` (operator then uploaded via FileZilla)

| Check | Status |
| --- | --- |
| Cursor FTP / upload / delete | **no** |
| DNS / SSL / DB / Secret / Edge / package regen | **no** |
| Image download / HTML rewrite | **no** |
| commit / push | **no** |
| Live GET/HEAD | **yes** (preview only) |
| Production `www.gosaki-piano.com` | **not requested** |

---

## Gates

```txt
gosakiCiaoJpPreviewFinalQaComplete: true
phase: gosaki-ciao-jp-preview-final-qa
PREVIEW_URL: https://gotosaki.ciao.jp/gosaki-piano/
REMOTE_TARGET: /gosaki-piano/
sourceCommit: 0f84b2d1bf1e26da57a7ae6676751aa873931fc7
MANUAL_UPLOAD_RECORDED: true
CURSOR_FTP_EXECUTED: false
FAILED_TRANSFERS_ZERO: not_stated_by_operator
PREVIEW_TECHNICAL_QA: PASS
PUBLIC_CUTOVER_READY_FROM_PREVIEW_QA: true
PUBLIC_CUTOVER_BLOCKER_FROM_THIS_QA: none
WIX_CDN_DNS_CUTOVER_BREAKS_IMAGES: false
WIX_ACCOUNT_DELETE_BREAKS_HOTLINKS: true
WIX_DEPENDENCY_CLASS: POST_LAUNCH_CLEANUP
THIS_PACKAGE_IS_NOT_PRODUCTION_HTML: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-production-cutover-final-operator-gates
```

This **ciao-preview** HTML uses `deployBase=/gosaki-piano/`. It must **not** be reused as production (`deployBase=/`). Next phase handles domain mapping / DNS / SSL / MX / rollback / Wix cutover gates and the production package.

---

## 1. Manual upload recorded (operator facts only)

Operator stated (2026-08-18):

| Fact | Recorded |
| --- | --- |
| FileZilla manual upload executed | **yes** |
| Remote target | `/gosaki-piano/` |
| Uploaded | `public-dist/` **contents** (not the folder itself) |
| Preview URL display check | **yes** — `https://gotosaki.ciao.jp/gosaki-piano/` |
| Operator visual | **all pages display normally** |

**Not stated — not treated as PASS:**

- Failed transfers = 0
- exact remote file listing / overwrite dialogs
- remote cwd screenshot
- `.ftpaccess` / `welcome.html` untouched (inferred only from live routes, not from FTP log)

Live HTTP (this phase) is consistent with a successful contents upload: primary routes **200**, CSS **200**, Admin **404**.

---

## 2. Public preview read-only QA

Method: GET live HTML + HEAD of same-origin CSS/images; compare required routes to local package
`tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/`.

### 2.1 Route HTTP

| Route | Live | Title | Local match (canonical / og:url / robots / stylesheet) |
| --- | --- | --- | --- |
| `/` | **200** | Goto Saki Official Web Site | **eq** |
| `/about/` | **200** | About \| saki-goto | **eq** |
| `/schedule/` | **200** | Schedule \| saki-goto | **eq** |
| `/schedule/2026-07/` | **200** | Schedule 2026.07 \| saki-goto | **eq** |
| `/discography/` | **200** | Discography \| saki-goto | **eq** |
| `/contact/` | **200** | Contact \| saki-goto | **eq** |
| `/link/` (extra) | **200** | Link \| saki-goto | n/a (not required) |
| `/2026-07/` legacy stub | **200** | Schedule 2026.07 \| saki-goto | canonical points at `/schedule/2026-07/` |
| `/robots.txt` | **200** | `User-agent: *` / `Disallow: /` | **eq** |
| `/admin/` | **404** | Lolipop 404 | Admin HTML absent |
| `/admin/index.html` | **404** | Lolipop 404 | Admin HTML absent |

### 2.2 CSS / JS / local images

| Asset | Live HEAD | Notes |
| --- | --- | --- |
| `/gosaki-piano/_astro/index.euRWbFgS.css` | **200** | linked from all checked HTML |
| `/gosaki-piano/assets/about/bands/*.jpg` (5) | **200** | About Band/Projects; **local**, not Wix |
| Contact HubSpot `js.hsforms.net/.../21392032.js` | **200** | third-party form, not Wix |
| `_astro/index.B17c7c3y.css` | not linked | leftover in package |
| `_astro/GosakiStagingReadOnlyAdminPage.*.js` (2) | not linked | leftover after Admin strip; **no** `/admin/` HTML |

Missing same-origin assets on required routes: **0**.

### 2.3 Internal navigation / deployBase

Live `<a href>` on required pages use `/gosaki-piano/...` only for site chrome (Home / About / Schedule / Discography / Contact / Link). Schedule hub months: `/gosaki-piano/schedule/2026-03/` … `/2026-08/`.

| Check | Result |
| --- | --- |
| Host-root `/about/` `/_astro/` `/schedule/` links | **none** |
| `www.gosaki-piano.com` in package or live **head** | **none** |
| `weblike.jp` / `cms-kit-staging` | **none** |
| Nav chrome → Wix production | **none** |
| Broken internal chrome links | **none** (required routes 200) |

Intentional **external** links (not chrome): SNS, venue sites, YouTube watch URL, HubSpot, Link-page shops, `gosakirikakotrio.wixsite.com` (Link + one August event note).

### 2.4 SEO / robots

Required routes (live = local):

```txt
canonical: https://gotosaki.ciao.jp/gosaki-piano/...
og:url:    https://gotosaki.ciao.jp/gosaki-piano/...
meta robots: noindex,nofollow,noarchive
robots.txt: User-agent: * / Disallow: /
```

`og:image` is **absent** on these preview pages (preview is noindex). **NON_BLOCKING** for this QA.

Legacy `/2026-07/` has `noindex,follow` (weaker than other pages). **NON_BLOCKING** (canonical already points at `/schedule/2026-07/`).

### 2.5 Admin exposure

| Check | Result |
| --- | --- |
| `admin/` in package | **absent** |
| Live `/gosaki-piano/admin/` | **404** (host default, not Kit Admin) |
| HTML `href` to `/admin` | **none** |

---

## 3. Wix external dependency inventory

Scan: all 30 files in local `public-dist/` plus live HTML of required routes. No asset migration.

| Metric | Local package | Live required routes |
| --- | --- | --- |
| String matches (src/srcset/href) | **205** | matches local per-route unique counts |
| Unique URLs | **28** | same set on live HTML |
| Unique media / hosts | **15** | 13 `wixstatic` media IDs + 1 parastorage favicon + 1 wixsite link |
| CSS / JS / font `woff` on Wix CDN | **0** in `_astro/*.css` | fonts already stripped |

**Referenced vs leftover**

| Class | Count | In public HTML? | Local copy in package? |
| --- | --- | --- | --- |
| `static.wixstatic.com/media/…` images (src/srcset) | 26 unique URLs / 13 media IDs | **yes — live-referenced** | **no** (hotlink) |
| `static.parastorage.com/client/pfavico.ico` | 1 | **yes** (favicon) | **no** |
| `gosakirikakotrio.wixsite.com/...` | 1 | **yes** (Link + Aug schedule text) | n/a (site link, not an asset) |
| Wix `@font-face` / parastorage fonts | 0 | — | — |
| Unreferenced `_astro` Admin JS / extra CSS | 3 files | **no** | local leftover only |

### 3.1 Use by page (media)

| Media / URL | Kind | Pages |
| --- | --- | --- |
| `26e086_0cea05e5141a49b99220e7383f218a99` (`250428_0179re.jpg`) | Home KV / hero | Home |
| `26e086_88579f851b0349159d305bf067c7e2c7` (`20260327.png`) | Home flyer | Home |
| `26e086_4175ba4f8d7d48f1ab73aa37cfef092b` | Home flyer | Home |
| `26e086_d05d239c448a4a1faddf07338bdeea11` (`NO PHOTO.png`) | Home placeholder flyer | Home |
| `26e086_5ceeb19a61c746a2a1f034fe1ef2bb64` (`250428_1002.jpg`) | About portrait | About |
| `26e086_4b20b9f6cf5147e6921c8b5faa9e3bc7` (`250428_0280.jpg`) | Contact photo | Contact |
| `26e086_3b3d02790d654bebb1ddca8f52af7926` (`jacket-l.png`) | Discography jacket | Discography |
| `26e086_48d2ee5d238c41e5b6fa3560e74cec16` (SKYLARK) | Discography jacket | Discography |
| `26e086_87f0b67145d24fe9861771e27844f601` | Discography jacket | Discography |
| `26e086_646cc6a5c8534055932f9c2931681f35` | Discography jacket | Discography |
| `11062b_0bec1cadb27b4d4a9898a740648fc5a9` (and 2 siblings) | Wix stock SNS icons | **all HTML pages** (footer) |
| `pfavico.ico` | Wix default favicon | Home, About, Discography, Contact, Link |
| `gosakirikakotrio.wixsite.com` | External site link | Link; Schedule 2026-08 body |

**Local (not Wix):** 5 About band photos under `/gosaki-piano/assets/about/bands/`.

Live HEAD sample of Wix CDN URLs (8, including favicon + home images): **200**. Not a full CDN SLA proof.

### 3.2 Risk split (required)

**A. DNS `gosaki-piano.com` Wix → Lolipop only**

Images/favicon are loaded from **`static.wixstatic.com` / `static.parastorage.com`**, not from `www.gosaki-piano.com`. Switching the production domain’s DNS does **not** by itself stop those CDN URLs.

```txt
WIX_CDN_DNS_CUTOVER_BREAKS_IMAGES: false
```

**B. Later delete Wix site / contract / Media Manager**

Hotlinks then 404. Hero, flyers, About portrait, Contact photo, 4 jackets, footer SNS icons, favicon would break. Band photos would remain (local).

```txt
WIX_ACCOUNT_DELETE_BREAKS_HOTLINKS: true
```

**Class**

| Bucket | Applies? | Why |
| --- | --- | --- |
| `PUBLIC_CUTOVER_BLOCKER` | **no** | Cutover DNS does not host these bytes; operator visual + live GET show images loading now |
| `POST_LAUNCH_CLEANUP` | **yes** | Self-host / Storage before closing Wix |
| `CLIENT_CMS_HANDOFF_BLOCKER` | **no** | Static launch does not need owner image CMS |
| `NON_BLOCKING` | for go-live while Wix media stays | acceptable residual |

Do **not** auto-block PUBLIC_CUTOVER on Wix images alone.

---

## 4. Content sanity

Scanned local + live HTML for development markers (`CMS Kit staging`, `PoC`, `G-6-e5/f6/g1`, `Slice B`, `G-22`, `temporary marker`). **0 hits.**

`テスト` substring in About is **`コンテスト`** (real bio), not a test marker.

| Surface | Result |
| --- | --- |
| Schedule | Real events; July includes `出演：` (known restored G-13c2 text). No new PoC copy |
| Discography | Continuous / SKYLARK / About Us / Ja-Jaaaaan; tracks include On a Clear Day / Like a Lover |
| About | Band photos local; portrait still Wix CDN |
| YouTube | `youtube-nocookie.com/embed/I-eY9YMq9GI` (plus watch URL). No extra test embed |

No **new** publication-content problems vs `gosaki-production-publication-data-live-readonly-check`.

---

## 5. Verdict

```txt
PREVIEW_TECHNICAL_QA: PASS
PUBLIC_CUTOVER_READY_FROM_PREVIEW_QA: true
```

Preview technical quality is sufficient to enter **production cutover operator gates**. Remaining work is hosting/DNS/SSL/MX/production package (`deployBase=/`) — not re-fixing this preview HTML.

### BLOCKER (this QA)

**none**

### NON_BLOCKING

- Wix CDN hotlinks (images + favicon) — `POST_LAUNCH_CLEANUP` before Wix teardown
- Intentional Link / event URL to another Wix site (`gosakirikakotrio.wixsite.com`)
- Unreferenced `_astro` Admin JS + extra CSS in the 30-file package
- Preview `og:image` absent (noindex preview)
- Legacy `/2026-07/` robots `noindex,follow`
- Home `NO PHOTO.png` flyer (Wix original placeholder)
- Wix Thunderbolt motion / font parity (fonts already stripped)
- Operator did not document Failed transfers = 0 (live routes still 200)

---

## 6. Forbidden (this phase) — none executed

FTP · remote mutation · image download · source change · package regen · DNS/SSL · DB · Secret · Edge · production deploy · commit/push.

---

## 7. Next

`gosaki-production-cutover-final-operator-gates`

Do **not** upload this ciao-preview tree onto `www.gosaki-piano.com` document root.
