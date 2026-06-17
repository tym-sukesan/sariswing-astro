# Gosaki manual preview upload execution result (G-9d2)

**Phase:** `G-9d2-gosaki-manual-preview-upload-execution-result`  
**Date:** 2026-06-17  
**Prior planning:** commit `25497a5` (`gosaki-manual-preview-upload-planning.md`)  
**Approval ID:** `G-9d2-gosaki-manual-preview-upload`  
**Type:** operator manual upload — **record only** (Cursor/AI/CI did not perform FTP)

---

## 1. Background

G-9d2 planning defined a safe manual preview upload from the G-9d1 verified package to the scoped staging path `/cms-kit-staging/gosaki-piano/` on `yskcreate.weblike.jp`.

The operator executed the upload manually per the checklist. This document records the outcome.

---

## 2. Executor

| Item | Value |
| --- | --- |
| **Executor** | Operator (manual) |
| **Cursor / AI / CI** | Did **not** connect to FTP, upload, delete, or mirror |
| **Rollback** | Not executed |

---

## 3. Upload details

### Source (local)

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/
```

Uploaded **contents of `public-dist/` only** — not the `public-dist` folder itself.

### Destination (remote)

| Item | Value |
| --- | --- |
| **Host** | `yskcreate.weblike.jp` |
| **FTP path** | `/cms-kit-staging/gosaki-piano/` |
| **Preview base URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

### Upload scope

**Uploaded (within preview path):**

- `index.html`, `about/`, `contact/`, `discography/`, `link/`
- `schedule/` (hub + `2026-03` … `2026-07` canonical month pages)
- `2026-03/` … `2026-07/` (legacy stubs)
- `_astro/`, `robots.txt`, `sitemap-0.xml`, `sitemap-index.xml`

**Not uploaded / out of scope:**

- `public-dist/` folder wrapper on server
- Production root, `gosaki-piano.com` production, Sariswing production
- Paths outside `/cms-kit-staging/gosaki-piano/`
- `/admin`, credentials, Astro source

### Prohibited operations — not performed

```txt
FTP delete                    — no
mirror delete                 — no
sync delete                   — no
upload outside preview path   — no
upload to production root     — no
gosaki-piano.com production   — no
Sariswing production          — no
workflow_dispatch             — no
DB write                      — no
Supabase SQL                  — no
service_role                  — no
```

---

## 4. Verified URLs (operator browser QA)

| URL | Result |
| --- | --- |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` | OK |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/` | OK |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/` | OK |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/` | OK |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-07/` | OK |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/robots.txt` | OK |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/sitemap-index.xml` | OK |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/sitemap-0.xml` | OK |

---

## 5. Display verification

| Check | Result |
| --- | --- |
| `/schedule/` hub | Display OK |
| Hub links 2026-03 … 2026-07 | Present |
| `/schedule/2026-03/` | Display OK |
| `/schedule/2026-07/` | Display OK — canonical month page |
| `/2026-07/` | Legacy stub — "Schedule page moved" |
| Link `/2026-07/` → `/schedule/2026-07/` | Present |
| CSS / layout | No major breakage |
| Preview path scope | All pages under `/cms-kit-staging/gosaki-piano/` |

---

## 6. robots.txt

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/robots.txt`

```txt
User-agent: *
Disallow: /
```

**Result:** OK — staging/preview blocks all crawlers as intended.

---

## 7. sitemap-index.xml

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/sitemap-index.xml`

```xml
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/sitemap-0.xml</loc>
  </sitemap>
</sitemapindex>
```

Browser “no style information” message for raw XML is normal — **not an error**.

---

## 8. sitemap-0.xml

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/sitemap-0.xml`

**URLs included:**

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/link/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-05/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-06/
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/
```

| Check | Result |
| --- | --- |
| `/schedule/` in sitemap | Yes |
| `/schedule/2026-03/` … `/schedule/2026-07/` | Yes |
| Bare `/2026-07/` (legacy) | **Not included** |
| Canonical schedule routes only | Yes |
| Preview-path URLs | Yes |

---

## 9. Legacy stub verification

| Route | Expected | Result |
| --- | --- | --- |
| `/2026-07/` | Thin stub, "Schedule page moved" | OK |
| `/2026-07/` | Link to `/schedule/2026-07/` | OK |
| `/2026-07/` | Excluded from sitemap | OK |

---

## 10. Canonical schedule route verification

| Route | Expected | Result |
| --- | --- | --- |
| `/schedule/2026-07/` | Full month page (canonical) | OK |
| `/schedule/` hub | Links to `/schedule/YYYY-MM/` | OK |
| Sitemap | Canonical schedule URLs only | OK |

---

## 11. Success judgment

```txt
gosakiManualPreviewUploadSucceeded: true
```

Operator manual upload completed within scoped preview path. Live browser QA passed for schedule hub, canonical month pages, legacy stubs, robots, and sitemap policy. No prohibited FTP/DB operations reported.

**Rollback:** not executed (not needed).

---

## 12. Gates

```txt
gosakiManualPreviewUploadExecutionRecorded: true
gosakiManualPreviewUploadSucceeded: true
gosakiPreviewScheduleRoutesLiveVerified: true
gosakiPreviewLegacyStubLiveVerified: true
gosakiPreviewRobotsTxtVerified: true
gosakiPreviewSitemapCanonicalOnlyVerified: true
readyForG9d3PreviewReviewOrNextImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 13. Next

- **G-9d3:** Client / operator preview review, or next CMS implementation (e.g. staging shell schedule binding, Top YouTube embed per G-9a)
- Optional: share staging URL with gosaki client for schedule preview feedback
