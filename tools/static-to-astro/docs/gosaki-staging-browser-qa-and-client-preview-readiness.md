# G-7j — gosaki staging browser QA and client preview readiness

Phase: `G-7j-gosaki-staging-browser-qa-and-client-preview-readiness`  
Date: 2026-06-16  
Prior phase: `G-7i2-gosaki-footer-layer-isolation-fix` (commit `e405e43`)  
Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

## Manual upload completed

- Operator manual re-upload of `public-dist/` contents to `/cms-kit-staging/gosaki-piano/` — **done**
- CSS bundle live: `_astro/index.BZ7Sffo0.css` (~419 KB, HTTP 200)
- G-7i2 footer layer isolation CSS confirmed in deployed bundle

## Browser QA summary

Automated checks (curl, 2026-06-16) plus operator visual confirmation after G-7i2 upload.

| Check | Result | Notes |
| --- | --- | --- |
| Top page HTTP 200 | **PASS** | |
| About page HTTP 200 | **PASS** | |
| Discography page HTTP 200 | **PASS** | |
| Contact page HTTP 200 | **PASS** | |
| Link page HTTP 200 | **PASS** | |
| Monthly schedule page HTTP 200 | **PASS** | `/2026-07/` |
| `robots.txt` HTTP 200 | **PASS** | |
| CSS loaded | **PASS** | `<link rel="stylesheet" href="/cms-kit-staging/gosaki-piano/_astro/index.BZ7Sffo0.css">` on all HTML pages |
| `_astro` CSS HTTP 200 | **PASS** | |
| `noindex` confirmed | **PASS** | `meta name="robots" content="noindex,nofollow,noarchive"` on all HTML pages checked |
| `robots.txt` Disallow | **PASS** | `User-agent: *` / `Disallow: /` |
| Canonical staging URL | **PASS** | All pages use `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/...` |
| `og:url` staging URL | **PASS** | Matches canonical per route |
| Navigation markup | **PASS** | Home / About / Discography / Contact / Link links use deploy-base paths |
| Nav target pages HTTP 200 | **PASS** | All five nav destinations return 200 |
| Hero visual acceptable | **PASS** | Operator: staging looks close to original; KV overlay issue largely resolved (G-7i2) |
| Footer layer no longer overlays top | **PASS** | Operator + G-7i2 fix; `#SITE_FOOTER` isolation CSS deployed |
| Discography visual | **PASS** | Operator: display close to production Wix |
| Mobile basic check | **PENDING** | Nav toggle + responsive CSS present in HTML/CSS; operator spot-check at ≤767px recommended before client demo on phone |

## Pages checked

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/           200
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/     200
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/ 200
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/   200
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/link/      200
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-07/   200
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/robots.txt  200
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/_astro/index.BZ7Sffo0.css  200
```

## Visual comparison summary

**Operator assessment (post G-7i2 upload):**

- Overall staging preview is **close to the original Wix site**
- Home KV / hero: acceptable; previous semi-transparent footer/KV overlay largely fixed
- Discography: **strong match** to production layout
- Header nav: horizontal links on desktop; MENU toggle markup + fallback CSS deployed
- Footer: background confined to footer region (G-7i2)

**Automated structural checks:**

- `body.wix-static-export device-desktop responsive` present
- `#SITE_HEADER`, `#comp-lol1i5k0`, `#SITE_FOOTER` present on home
- Override rules in live CSS: hero colorUnderlay hide, footer isolation, nav fallback

## Known remaining differences

- Wix Thunderbolt JS / page animations not replicated
- Font rendering may differ (Wix CDN fonts vs local fallbacks)
- Schedule month pages use flat nav (no Wix flyout columns)
- Contact form is Wix-origin markup — non-functional without Wix backend
- Mobile MENU toggle: not yet operator-verified on a real narrow viewport
- Pixel-perfect match to `gosaki-piano.com` not guaranteed — **staging preview quality** target

## Not executed

- FTP auto deploy
- FTP connect / upload / mirror / delete
- `workflow_dispatch`
- DB write
- Supabase SQL
- Production deploy
- `.ftpaccess` changes

## Client preview readiness

**`readyForGosakiClientPreview: true`**

Rationale:

- All primary routes return HTTP 200 with CSS and staging SEO flags correct
- Operator confirms visual quality sufficient for client preview (desktop)
- Staging is noindex + robots Disallow — safe to share preview URL without search indexing
- Remaining gaps are documented and acceptable for a **preview/demo**, not production cutover

Optional before phone demo: operator mobile spot-check (MENU toggle, hero, footer).

## Next action

1. Share staging URL with gosaki client for preview feedback (desktop-first OK)
2. Optional: operator mobile QA at ≤767px (MENU toggle, layout)
3. Collect client feedback → plan CMS integration phases (Schedule / News / Profile) on staging shell — **not in G-7 scope**
4. Keep FTP auto-deploy disabled until explicit future phase with safety gates

## Gates

```txt
gosakiStagingBrowserQaComplete: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
```
