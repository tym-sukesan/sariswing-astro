# Gosaki Wix → Astro URL compatibility audit

**Phase:** `gosaki-wix-to-astro-url-compatibility-audit`
**Status:** **COMPLETE (read-only · no implementation)**
**Date:** 2026-08-19
**HEAD:** `14ab858e46252a91503f9bfb12f58498481304bf` (= `origin/main`)
**Live origin audited:** `https://www.gosaki-piano.com/` (still Wix)
**Astro live evidence:** ciao-preview `https://gotosaki.ciao.jp/gosaki-piano/` (deployBase `/gosaki-piano/`) — **no-slash GET of Wix canonicals**
**Also:** production profile dry-run (`deployBase=/`, no convert) + local `public-dist` routes
**Next Primary:** `gosaki-pre-cutover-dns-full-record-snapshot`

| Check | Status |
| --- | --- |
| Source / convert / `.htaccess` / package generate | **no** |
| FTP / DNS / SSL / DB / Secret / Edge | **no** |
| commit / push | **no** |
| Live Wix GET/HEAD | **yes** (read-only) |
| ciao-preview no-slash GET of 111 Wix canonicals | **yes** (read-only) |
| production dry-run | **yes** (plan only) |

---

## Gates

```txt
gosakiWixToAstroUrlCompatibilityAuditComplete: true
phase: gosaki-wix-to-astro-url-compatibility-audit
URL_COMPATIBILITY_AUDIT_RESULT: PASS
OLD_WIX_URL_COUNT: 111
COMPAT_PASS: 12
KEEP: 6
LEGACY_ROUTE_ALREADY_SUPPORTED: 6
REDIRECT_REQUIRED: 90
404_ACCEPTABLE: 9
REVIEW_REQUIRED: 0
HTML_EXTENSION_IN_LEGACY_SCOPE: false
JP_SLUG_FIRST_PASS_ERR: artifact (unencoded HEAD); encoded Wix status 200
NEW_PUBLIC_CUTOVER_BLOCKER: none
REDIRECT_IMPLEMENTATION_NEEDED: true
READY_FOR_REDIRECT_IMPLEMENTATION: true
READY_TO_MOVE_TO_NEXT_AUDIT: true
RECOMMENDED_NEXT_PRIMARY: gosaki-pre-cutover-dns-full-record-snapshot
INDEX_STATUS: UNKNOWN
CURSOR_FTP_EXECUTED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

Compat **PASS** means the Wix canonical **no-slash** URL on ciao-preview returned **301 → 200** (Apache DirectorySlash to the Astro trailing-slash page). Only **404** URLs are `REDIRECT_REQUIRED` candidates (leftover dummy pages stay `404_ACCEPTABLE`).

---

## 1. Method

| Source | Result |
| --- | --- |
| Wix `robots.txt` | `Sitemap: https://www.gosaki-piano.com/sitemap.xml` |
| Wix sitemap index | `event-pages` 4 · `dynamic-aitemu` 3 · `pages-sitemap` 101 |
| Wix HTML internals (Home/About/Discography/Contact/Link/months) | `/`, `/about`, `/discography`, `/contact`, `/link`, `/2026-03` … `/2026-09` |
| Extra live Wix (not in sitemap) | `/schedule`, `/home`, `/blank` all **200** |
| Japanese slugs | First unencoded HEAD **ERR** = **audit artifact**. Percent-encoded HEAD **200** (20/20). Treat as 200. |
| `.html` | Wix **400**. No inbound/external evidence. **Out of legacy scope.** |
| ciao-preview no-slash GET | **111** Wix canonical paths under `/gosaki-piano` · **12** 301→200 · **99** 404 |
| Fixture crawl | 10 HTML files; incomplete vs live 111 |
| production dry-run | `deployBase=/` · Admin off · no convert |

Search index: **UNKNOWN**.

---

## 2. Japanese slug first-pass ERR (artifact)

Unencoded HEAD to paths such as `/2020年8月` failed (20 URLs) because the probe did not percent-encode. Retry with encoding:

| Path class | Encoded Wix HEAD |
| --- | --- |
| `/2020年7月` … `/2022年1月` and other `YYYY年N月` | **200** |
| `/複製-2020年12月` … `/複製-2021年3月` | **200** |
| `/2022-5-練習` | **200** |

**SoT:** these 20 are Wix **200**. The ERR line is not a missing page.

On ciao-preview the same encoded no-slash URLs are **404** (no such routes) → `REDIRECT_REQUIRED` or `404_ACCEPTABLE` (`複製-*`).

---

## 3. Trailing slash — live ciao GET of Wix canonicals

Wix canonical is **no slash** (`/about` not `/about/`; slash form **301** → no-slash).

Astro `trailingSlash: always` + Lolipop DirectorySlash (ciao.jp): **no-slash → 301 → slash 200** when the directory exists.

| Wix canonical (no slash) | ciao-preview no-slash | Follow | ASTRO_REACH |
| --- | --- | --- | --- |
| `/` `/about` `/contact` `/discography` `/link` `/schedule` | **301** | **200** (`…/`) | **PASS** |
| `/2026-03` … `/2026-08` | **301** | **200** (`…/2026-0N/`) | **PASS** (legacy stub) |
| All other 99 inventory paths | **404** | 404 | **404** |

Production www is still Wix, so ciao.jp is the Astro/Apache evidence. Same DirectorySlash is expected after cutover with `deployBase=/`.

`.html` (`/about.html`, `/2026-08.html`, `/index.html`): Wix **400**. Not inventoried. Not a legacy requirement.

---

## 4. Counts (after ciao no-slash GET)

| ACTION | Count | Rule |
| --- | --- | --- |
| **KEEP** | 6 | 301→200 on same public page |
| **LEGACY_ROUTE_ALREADY_SUPPORTED** | 6 | 301→200 on `/YYYY-MM/` stub (canonical `/schedule/YYYY-MM/`) |
| **REDIRECT_REQUIRED** | 90 | ciao **404** and page is worth preserving (archives, `/2026-09`, Events, Band, `/home`, `/live-photo`) |
| **404_ACCEPTABLE** | 9 | ciao **404** leftover (`複製-*`, `/aitemu*`, `/blank`) |
| **REVIEW_REQUIRED** | 0 | `/live-photo` is 404 → redirect **candidate**; **target** still operator (`/` vs drop) |
| **Total old Wix URLs** | **111** | `.html` excluded |

**COMPAT_PASS = 12** (KEEP + LEGACY). **ciao 404 = 99** (90 redirect candidates + 9 acceptable).

---

## 5. Special pages

### Compat PASS (no extra redirect needed to avoid 404)

| Old Wix (canonical no-slash) | ciao | New |
| --- | --- | --- |
| `/` `/about` `/contact` `/discography` `/link` `/schedule` | 301→200 | same path with slash |
| `/2026-03` … `/2026-08` | 301→200 | stub `/2026-0N/` + link/canonical `/schedule/2026-0N/` |

Legacy stubs are **200 “moved” pages**, not 301 to `/schedule/YYYY-MM/`. That still **prevents 404**. Optional later 301 to canonical is SEO polish.

### `/2026-09` (HIGH, 404)

Wix **200**, in every primary-nav HTML. ciao **404**. **REDIRECT_REQUIRED** (or generate month + stub before cutover).

### Historical months / JP slugs / variants

ciao **404**. **REDIRECT_REQUIRED** → `/schedule/YYYY-MM/` if that month is published, else `/schedule/`. Unpadded / JP / `練習` / `-2` need **Apache**, not static `YYYY-MM/` folders.

### Events / Band / `/home` / `/live-photo`

All ciao **404** → **REDIRECT_REQUIRED** candidates (`/live-photo` target operator-decided).

### 404_ACCEPTABLE

`複製-*` (4), `/aitemu`, `/aitemu/this-is-a-title-01`…`03`, `/blank`.

### Not in scope

- `.html` — Wix 400; no external-link evidence
- Wix `/schedule/*` catch-all (`/schedule/foo` same body as `/schedule`) — not distinct URLs
- External SNS / `gosakirikakotrio.wixsite.com` — outbound only

---

## 6. SEO (INDEX = UNKNOWN)

| Priority | Rule |
| --- | --- |
| HIGH | current primary nav: `/`, about, discography, contact, link, `/2026-03`…`/2026-09` |
| MEDIUM | sitemap, not nav (archives, events, band, live-photo, `/schedule`) |
| LOW | leftover dummy / `/home` (canonical already `/`) |

---

## 7. Redirect implementation (not this phase)

**Needed:** yes, for the **90** ciao-404 preserve URLs.

| Class | Source | Static HTML | Apache `.htaccess` |
| --- | --- | --- | --- |
| KEEP / LEGACY (12 PASS) | no | already present | DirectorySlash only (proven on ciao.jp) |
| `/2026-09` | preferred: generate month | stub possible | 301 fallback |
| Padded `/YYYY-MM` archives | optional stubs | possible | bulk 301 |
| Unpadded / JP / variants | no | no | **required** |
| `/home` Events Band live-photo | no | thin stubs possible | **simplest** |
| `.html` | no | no | **do not add** |
| External SNS / wixsite | no | no | **do not redirect** |

---

## 8. Cutover lists

```txt
NEW_PUBLIC_CUTOVER_BLOCKER: none
```

**DO_BEFORE_CUTOVER** (URL):

1. `/2026-09`: bake month+stub **or** 301 → `/schedule/`.
2. Apache 301 map for the 90 `REDIRECT_REQUIRED` 404s (or accept archive 404s).
3. Operator target for `/live-photo`.
4. Keep DirectorySlash (ciao already 301 no-slash → slash).
5. Do not add `.html` rules. Do not redirect SNS / wixsite.

---

## 9. This phase did not

Source change · FTP · remote mutation · `.htaccess` · package generate · DNS/SSL · DB · Secret/Edge · commit/push.

---

## 10. URL mapping (111)

Wix `CURRENT_WIX_STATUS` = **200** (JP paths: percent-encoded). `CIAO_NO_SLASH` = HEAD of the same canonical path on `https://gotosaki.ciao.jp/gosaki-piano` + first hop. `ASTRO_REACH` = PASS only for 301→200.
| OLD_WIX_URL | CURRENT_WIX_STATUS | CIAO_NO_SLASH | ASTRO_REACH | NEW_ASTRO_URL | ASTRO_STATUS | ACTION | REASON | SOURCE | NAV | SEO_PRIORITY | INDEX |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `https://www.gosaki-piano.com/2020年8月` | 200 | 404 | 404 | `/schedule/2020-08/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/複製-2021年1月` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | pages-sitemap | no | LOW | UNKNOWN |
| `https://www.gosaki-piano.com/2022-3` | 200 | 404 | 404 | `/schedule/2022-03/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-2` | 200 | 404 | 404 | `/schedule/2025-02/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-5` | 200 | 404 | 404 | `/schedule/2019-05/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-9` | 200 | 404 | 404 | `/schedule/2022-09/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2026-04` | 200 | 301→200 | PASS | `/schedule/2026-04/` | legacy_stub 301→200 | LEGACY_ROUTE_ALREADY_SUPPORTED | ciao-preview `/2026-04` 301 → `/2026-04/` stub 200 (canonical `/schedule/2026-04/`, noindex). Compat PASS. Not HTTP 301 to canonical. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2021年7月` | 200 | 404 | 404 | `/schedule/2021-07/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2020年9月` | 200 | 404 | 404 | `/schedule/2020-09/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-3` | 200 | 404 | 404 | `/schedule/2024-03/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2026-02` | 200 | 404 | 404 | `/schedule/2026-02/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-10` | 200 | 404 | 404 | `/schedule/2023-10/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-4` | 200 | 404 | 404 | `/schedule/2019-04/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-7` | 200 | 404 | 404 | `/schedule/2022-07/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-6` | 200 | 404 | 404 | `/schedule/2022-06/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-3` | 200 | 404 | 404 | `/schedule/2023-03/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-06` | 200 | 404 | 404 | `/schedule/2025-06/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2026-06` | 200 | 301→200 | PASS | `/schedule/2026-06/` | legacy_stub 301→200 | LEGACY_ROUTE_ALREADY_SUPPORTED | ciao-preview `/2026-06` 301 → `/2026-06/` stub 200 (canonical `/schedule/2026-06/`, noindex). Compat PASS. Not HTTP 301 to canonical. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2022-2` | 200 | 404 | 404 | `/schedule/2022-02/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-1` | 200 | 404 | 404 | `/schedule/2024-01/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/contact` | 200 | 301→200 | PASS | `/contact/` | present (301→200) | KEEP | ciao-preview no-slash GET 301 → slash 200. Compat PASS. Same page exists. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2021年12月` | 200 | 404 | 404 | `/schedule/2021-12/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2026-08` | 200 | 301→200 | PASS | `/schedule/2026-08/` | legacy_stub 301→200 | LEGACY_ROUTE_ALREADY_SUPPORTED | ciao-preview `/2026-08` 301 → `/2026-08/` stub 200 (canonical `/schedule/2026-08/`, noindex). Compat PASS. Not HTTP 301 to canonical. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2026-01` | 200 | 404 | 404 | `/schedule/2026-01/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-05` | 200 | 404 | 404 | `/schedule/2025-05/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-7-2` | 200 | 404 | 404 | `/schedule/2023-07/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. Variant suffix `-2`. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-10` | 200 | 404 | 404 | `/schedule/2024-10/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-10` | 200 | 404 | 404 | `/schedule/2025-10/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2020-1` | 200 | 404 | 404 | `/schedule/2020-01/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-8` | 200 | 404 | 404 | `/schedule/2019-08/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2026-03` | 200 | 301→200 | PASS | `/schedule/2026-03/` | legacy_stub 301→200 | LEGACY_ROUTE_ALREADY_SUPPORTED | ciao-preview `/2026-03` 301 → `/2026-03/` stub 200 (canonical `/schedule/2026-03/`, noindex). Compat PASS. Not HTTP 301 to canonical. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2025-11` | 200 | 404 | 404 | `/schedule/2025-11/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/複製-2021年2月` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | pages-sitemap | no | LOW | UNKNOWN |
| `https://www.gosaki-piano.com/2026-09` | 200 | 404 | 404 | `/schedule/2026-09/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview no-slash GET 404. In current Wix nav. REDIRECT_REQUIRED. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2024-7` | 200 | 404 | 404 | `/schedule/2024-07/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/link` | 200 | 301→200 | PASS | `/link/` | present (301→200) | KEEP | ciao-preview no-slash GET 301 → slash 200. Compat PASS. Same page exists. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2020-3` | 200 | 404 | 404 | `/schedule/2020-03/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/band-1` | 200 | 404 | 404 | `/about/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Sitemap; Astro About has Bands/Projects. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-5` | 200 | 404 | 404 | `/schedule/2023-05/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-11` | 200 | 404 | 404 | `/schedule/2023-11/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-3` | 200 | 404 | 404 | `/schedule/2019-03/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/about` | 200 | 301→200 | PASS | `/about/` | present (301→200) | KEEP | ciao-preview no-slash GET 301 → slash 200. Compat PASS. Same page exists. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2026-05` | 200 | 301→200 | PASS | `/schedule/2026-05/` | legacy_stub 301→200 | LEGACY_ROUTE_ALREADY_SUPPORTED | ciao-preview `/2026-05` 301 → `/2026-05/` stub 200 (canonical `/schedule/2026-05/`, noindex). Compat PASS. Not HTTP 301 to canonical. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2023-1` | 200 | 404 | 404 | `/schedule/2023-01/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-8` | 200 | 404 | 404 | `/schedule/2022-08/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/discography` | 200 | 301→200 | PASS | `/discography/` | present (301→200) | KEEP | ciao-preview no-slash GET 301 → slash 200. Compat PASS. Same page exists. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2020年10月` | 200 | 404 | 404 | `/schedule/2020-10/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2020年7月` | 200 | 404 | 404 | `/schedule/2020-07/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-2-1` | 200 | 404 | 404 | `/schedule/2019-02/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. Variant suffix `-1`. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/event-list` | 200 | 404 | 404 | `/schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Wix Events list; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-2` | 200 | 404 | 404 | `/schedule/2024-02/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-9` | 200 | 404 | 404 | `/schedule/2025-09/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/複製-2020年12月` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | pages-sitemap | no | LOW | UNKNOWN |
| `https://www.gosaki-piano.com/2022-5-練習` | 200 | 404 | 404 | `/schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Odd Wix slug 練習; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-11` | 200 | 404 | 404 | `/schedule/2024-11/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-4` | 200 | 404 | 404 | `/schedule/2023-04/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/band` | 200 | 404 | 404 | `/about/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Sitemap; Astro About has Bands/Projects. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-7` | 200 | 404 | 404 | `/schedule/2019-07/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-03` | 200 | 404 | 404 | `/schedule/2025-03/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-4` | 200 | 404 | 404 | `/schedule/2022-04/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-12` | 200 | 404 | 404 | `/schedule/2019-12/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2021年11月` | 200 | 404 | 404 | `/schedule/2021-11/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2021年9月` | 200 | 404 | 404 | `/schedule/2021-09/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2026-07` | 200 | 301→200 | PASS | `/schedule/2026-07/` | legacy_stub 301→200 | LEGACY_ROUTE_ALREADY_SUPPORTED | ciao-preview `/2026-07` 301 → `/2026-07/` stub 200 (canonical `/schedule/2026-07/`, noindex). Compat PASS. Not HTTP 301 to canonical. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2021年8月` | 200 | 404 | 404 | `/schedule/2021-08/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-10` | 200 | 404 | 404 | `/schedule/2022-10/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-11` | 200 | 404 | 404 | `/schedule/2022-11/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2021年6月` | 200 | 404 | 404 | `/schedule/2021-06/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-6` | 200 | 404 | 404 | `/schedule/2024-06/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-8` | 200 | 404 | 404 | `/schedule/2023-08/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2020年11月` | 200 | 404 | 404 | `/schedule/2020-11/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-11` | 200 | 404 | 404 | `/schedule/2019-11/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-5` | 200 | 404 | 404 | `/schedule/2024-05/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2021年5月` | 200 | 404 | 404 | `/schedule/2021-05/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-4` | 200 | 404 | 404 | `/schedule/2024-04/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-12` | 200 | 404 | 404 | `/schedule/2022-12/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2020-2` | 200 | 404 | 404 | `/schedule/2020-02/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-9` | 200 | 404 | 404 | `/schedule/2024-09/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-6-2` | 200 | 404 | 404 | `/schedule/2023-06/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. Variant suffix `-2`. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022-5` | 200 | 404 | 404 | `/schedule/2022-05/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com` | 200 | 301→200 | PASS | `/` | present (301→200) | KEEP | ciao-preview no-slash GET 301 → slash 200. Compat PASS. Same page exists. | pages-sitemap | yes | HIGH | UNKNOWN |
| `https://www.gosaki-piano.com/2023-12` | 200 | 404 | 404 | `/schedule/2023-12/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-4` | 200 | 404 | 404 | `/schedule/2025-04/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-12` | 200 | 404 | 404 | `/schedule/2024-12/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-10` | 200 | 404 | 404 | `/schedule/2019-10/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-7` | 200 | 404 | 404 | `/schedule/2025-07/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/live-photo` | 200 | 404 | 404 | `/ (operator chooses target)` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Unique sitemap page; no Astro gallery. Redirect candidate; target still operator-decided. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-1-1` | 200 | 404 | 404 | `/schedule/2019-01/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. Variant suffix `-1`. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-12` | 200 | 404 | 404 | `/schedule/2025-12/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-08` | 200 | 404 | 404 | `/schedule/2025-08/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2022年1月` | 200 | 404 | 404 | `/schedule/2022-01/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2024-8` | 200 | 404 | 404 | `/schedule/2024-08/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2020-4` | 200 | 404 | 404 | `/schedule/2020-04/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2025-1` | 200 | 404 | 404 | `/schedule/2025-01/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-2` | 200 | 404 | 404 | `/schedule/2023-02/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/aitemu` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | pages-sitemap | no | LOW | UNKNOWN |
| `https://www.gosaki-piano.com/2020年12月` | 200 | 404 | 404 | `/schedule/2020-12/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2019-6` | 200 | 404 | 404 | `/schedule/2019-06/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/複製-2021年3月` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | pages-sitemap | no | LOW | UNKNOWN |
| `https://www.gosaki-piano.com/2021年10月` | 200 | 404 | 404 | `/schedule/2021-10/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical JP-slug month; Wix 200 (percent-encoded). Sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/2023-9` | 200 | 404 | 404 | `/schedule/2023-09/ if generated, else /schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Historical Wix month; sitemap. | pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/event-details/gotosakiburajirutorio-1` | 200 | 404 | 404 | `/schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Wix Events detail; sitemap; linked from /event-list. | event-pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/event-details/gotosakiburajirutorio` | 200 | 404 | 404 | `/schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Wix Events detail; sitemap; linked from /event-list. | event-pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/event-details/gaokiyukeiduo` | 200 | 404 | 404 | `/schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Wix Events detail; sitemap; linked from /event-list. | event-pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/event-details/matsukiriswing-three` | 200 | 404 | 404 | `/schedule/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Wix Events detail; sitemap; linked from /event-list. | event-pages-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/aitemu/this-is-a-title-01` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | dynamic-aitemu-sitemap | no | LOW | UNKNOWN |
| `https://www.gosaki-piano.com/aitemu/this-is-a-title-02` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | dynamic-aitemu-sitemap | no | LOW | UNKNOWN |
| `https://www.gosaki-piano.com/aitemu/this-is-a-title-03` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | dynamic-aitemu-sitemap | no | LOW | UNKNOWN |
| `https://www.gosaki-piano.com/schedule` | 200 | 301→200 | PASS | `/schedule/` | present (301→200) | KEEP | ciao-preview no-slash GET 301 → slash 200. Compat PASS. Same page exists. | live-not-in-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/home` | 200 | 404 | 404 | `/` | 404 | REDIRECT_REQUIRED | ciao-preview 404. Wix Home duplicate (canonical already origin). | live-not-in-sitemap | no | MEDIUM | UNKNOWN |
| `https://www.gosaki-piano.com/blank` | 200 | 404 | 404 | `—` | 404 | 404_ACCEPTABLE | ciao-preview 404. Leftover/dummy; not a preserve requirement. | live-not-in-sitemap | no | LOW | UNKNOWN |

Wix slash-with-trailing-slash URLs 301 to these no-slash canonicals; they are not extra rows.
