# Gosaki discography album images planning (G-10f)

**Phase:** `G-10f-gosaki-discography-album-images-planning`  
**Status:** **complete** — read-only investigation + implementation strategy; no asset or JSON changes  
**Date:** 2026-06-23  
**Prior:** G-10e1 YouTube layout arc closed (commit `d83ae32`)

| Check | Status |
| --- | --- |
| Read-only investigation | **yes** |
| Image file add/delete/move/overwrite | **no** |
| JSON write / Save | **no** |
| FTP / deploy | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-youtube-and-discography-practicalization.md](./gosaki-youtube-and-discography-practicalization.md) (G-9j)
- [gosaki-completion-inventory-and-next-module-selection.md](./gosaki-completion-inventory-and-next-module-selection.md) (G-10a)
- [gosaki-live-crawl-pilot-result.md](./gosaki-live-crawl-pilot-result.md) (G-7d — 0 same-origin assets)

---

## Gates

```txt
gosakiDiscographyAlbumImagesPlanningComplete: true
phase: G-10f
readyForG10f1DiscographyAlbumImagesAcquisitionPreflight: true
readyForAnyFutureFtpApply: false
cursorImageFileMutationExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
workflowDispatchExecuted: false
```

---

## 1. Discography source-of-truth map

| Layer | Path | Role |
| --- | --- | --- |
| **Public page (staging)** | `fixtures/gosaki-piano/discography.html` → convert → `output/.../src/pages/discography/index.astro` | Wix HTML passthrough inside `<BaseLayout>` — **current public SoT** |
| **CMS-ready metadata** | `config/sites/gosaki-piano-discography.json` | 4 releases; text fields populated; **`coverImage` empty on all** |
| **Admin UI** | `templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro` | Reads JSON via `gosaki-discography-admin-binding.ts`; Save **disabled** |
| **Sariswing Kit extractor** | `scripts/lib/discography-seed-extractor.mjs` | Full JSON-driven `/discography/` rebuild — **not wired for gosaki convert** |
| **Visual CSS** | `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` (G-8g5, G-8g8) | Spacing / subheading only — no image src logic |

**Fixture → Astro → package flow:**

```txt
fixtures/gosaki-piano/discography.html
  → convert-static-to-astro.mjs (generic page transform)
  → output/gosaki-piano-astro/src/pages/discography/index.astro
  → astro build → dist/discography/index.html
  → static-public → manual-upload/gosaki-piano/public-dist/discography/index.html
```

`gosaki-piano-discography.json` is **admin-only today** — public HTML does **not** read it.

---

## 2. NO PHOTO / placeholder — where it appears

### 2.1 Public `/discography/` — **not** `NO PHOTO.png`

Investigation of `fixtures/gosaki-piano/discography.html` and generated `public-dist/discography/index.html`:

- **4 / 4** repeater items (`comp-llexymga__item*`) have real Wix CDN jacket `<img>` tags.
- **0** occurrences of `NO PHOTO` / `NO%20PHOTO` on the discography page.
- All cover `src` / `srcset` point to `https://static.wixstatic.com/media/...` (external CDN).

**Gap:** staging package includes **no local discography images** (`public-dist/images/` absent). G-7d crawl saved **0 same-origin assets**; jackets load only if `wixstatic.com` is reachable from the visitor's browser.

### 2.2 Admin staging — **「準備中」 placeholder**

`gosaki-piano-discography.json`: every release has `coverImage: ""` and `missingFields` includes `"coverImage"`.

`AdminGosakiStagingDiscographyOperatorPage.astro` renders:

```txt
release.coverImage ? <img> : placeholder div「ジャケット画像 / 準備中」
```

→ **4 / 4** admin cards show placeholder (not Wix CDN).

### 2.3 Home schedule — `NO PHOTO.png` (out of G-10f scope but noted)

`fixtures/gosaki-piano/index.html` — `#comp-m8y5ctyk__item-*` schedule repeater uses Wix asset `NO%20PHOTO.png`. This is **Schedule home**, not Discography. Do not conflate in G-10f implementation.

### 2.4 Fallback logic

| Surface | Fallback |
| --- | --- |
| Public discography Wix HTML | None — hard-coded Wix CDN URLs in crawled HTML |
| Admin discography | Empty `coverImage` → CSS placeholder block |
| `discography-seed-extractor.mjs` (unused for gosaki) | Would use `cover_image` from extracted JSON |

---

## 3. Album / item inventory

| # | JSON `id` | Title | Artist | `coverImage` (JSON) | Wix repeater id | `alt` (fixture) | Wix `mediaId` | Image status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `continuous` | Continuous | ごさきりかこTrio Feat.石川周之介 | `""` | `comp-llexymga__item1` | `jacket-l.png` | `26e086_3b3d02790d654bebb1ddca8f52af7926` | Wix CDN in public HTML only |
| 2 | `skylark` | SKYLARK | 後藤沙紀 | `""` | `comp-llexymga__item-j9r9uz7e` | `0301_skylark_126_page-0001.jpg` | `26e086_48d2ee5d238c41e5b6fa3560e74cec16` | Wix CDN in public HTML only |
| 3 | `about-us` | About Us!! | ごさきりかこtrio | `""` | `comp-llexymga__item-j9r9uxns` | `IMG-1979.JPG` | `26e086_87f0b67145d24fe9861771e27844f601` | Wix CDN in public HTML only |
| 4 | `ja-jaaaaan` | Ja-Jaaaaan! | 新谷健介オノマトペ | `""` | `comp-llexymga__item-lley1skn` | `オノマトペ　CDジャケ.jpg` | `26e086_646cc6a5c8534055932f9c2931681f35` | Wix CDN in public HTML only |

**Counts:**

```txt
releases total: 4
coverImage set in JSON: 0
coverImage missing in JSON: 4
Wix CDN in public HTML: 4
local self-hosted in package: 0
slug / per-album routes: none (single /discography/ hub page)
```

**Public route:** `/discography/` only (no `/discography/{id}/` pages for gosaki).

---

## 4. Image asset candidates (read-only search)

### 4.1 Fixture / output / repo

| Location | Result |
| --- | --- |
| `fixtures/gosaki-piano/` | **No** `.jpg` / `.png` / `.webp` files (HTML only) |
| `output/manual-upload/gosaki-piano/public-dist/images/` | **Absent** |
| `output/gosaki-piano-astro/public/images/discography/` | **Not created** by convert |
| `public/images/discography/` (repo root) | Sariswing assets only — **not gosaki** |
| `config/sites/gosaki-piano-discography.json` | Metadata only — no binary paths |

### 4.2 Wix CDN URLs in fixture (implementation download candidates)

Operator or approved one-time fetch may source from these (display size in HTML: 260×260; Wix also offers 520×520 in `srcset`):

| `id` | Representative `src` (truncated) |
| --- | --- |
| `continuous` | `https://static.wixstatic.com/media/26e086_3b3d02790d654bebb1ddca8f52af7926~mv2.png/v1/fill/w_520,h_520,.../jacket-l.png` |
| `skylark` | `https://static.wixstatic.com/media/26e086_48d2ee5d238c41e5b6fa3560e74cec16~mv2.jpg/v1/fill/w_520,h_520,.../0301_skylark_126_page-0001.jpg` |
| `about-us` | `https://static.wixstatic.com/media/26e086_87f0b67145d24fe9861771e27844f601~mv2.jpg/v1/fill/w_520,h_520,.../IMG-1979_JPG.jpg` |
| `ja-jaaaaan` | `https://static.wixstatic.com/media/26e086_646cc6a5c8534055932f9c2931681f35~mv2.jpg/v1/fill/w_315,h_315,.../オノマトペ　CDジャケ.jpg` |

**Preferred for implementation:** operator-supplied master scans if client has higher quality; Wix CDN as fallback with explicit one-time download approval.

### 4.3 Reference pattern — G-8a bands

`gosaki-piano-band-profiles.json` uses `/images/bands/{id}.jpg`; convert creates `public/images/bands/` directory but **does not copy binaries** — operator must supply files before upload. Same pattern applies to discography.

---

## 5. Implementation option comparison

| Option | Description | Pros | Cons | Risk |
| --- | --- | --- | --- | --- |
| **A** | Use existing local fixture assets only | Zero network | **No local assets exist** | **Blocked** |
| **B** | JSON `coverImage` mapping + local `public/images/discography/` | Aligns admin + public; mirrors bands/YouTube JSON pattern | Needs convert hook to rewrite Wix `<img>` OR public page rebuild | Low |
| **C** | CSS override only | Tiny diff | Cannot replace `src`; useless for real images | **Rejected** |
| **D** | Full Discography CMS static JSON write now | Future-proof admin | Scope too large; Save guards / approval IDs not ready for images | High |
| **E** | Minimal fixed swap first, CMS later | Fast staging win; proven manual-upload loop | Two phases (assets now, Save later) | **Lowest** |

---

## 6. Recommended approach

**Primary: E + B (minimal self-hosted swap, JSON as mapping SoT)**

### Phase sequence (after G-10f planning)

| Step | Phase (proposed) | Work |
| --- | --- | --- |
| 1 | `G-10f1-discography-album-images-acquisition-preflight` | Operator provides 4 files **or** approves one-time Wix CDN download; file naming convention |
| 2 | `G-10f2-discography-album-images-implementation` | Add `public/images/discography/{id}.jpg`; set `coverImage` in JSON; new convert hook `gosaki-discography-cover-images.mjs` rewrites `#comp-jshobkm1__*` img `src`/`srcset` on discography page to deployBase-local paths |
| 3 | `G-10f3-discography-album-images-package-verification` | convert / build / `manual-upload:package`; verify 4 local images in package |
| 4 | `G-10f4-discography-album-images-operator-reupload` | Operator manual upload (no Cursor FTP) |

### Proposed paths

```txt
public/images/discography/continuous.jpg
public/images/discography/skylark.jpg
public/images/discography/about-us.jpg
public/images/discography/ja-jaaaaan.jpg
```

JSON `coverImage`: `/images/discography/{id}.jpg` (with deployBase prefix at HTML emit time via existing `withBase()` / convert).

### Why not full `discography-seed-extractor` now

Sariswing extractor replaces entire `/discography/` with Astro list component — larger diff, loses Wix visual parity already tuned in G-8g5/G-8g8. **Img src rewrite** preserves layout CSS investment.

### Image sizing note

Wix displays 260×260 (520 retina). Recommend store **520–800px** square JPEG/WebP; no server-side resize in v1 (operator prepares files).

---

## 7. Future CMS Kit outlook (not implemented in G-10f)

| Topic | Recommendation |
| --- | --- |
| **Upload destination (v1)** | Static files under `public/images/discography/` in astro output + manual-upload package |
| **Upload destination (v2)** | Supabase Storage `{siteSlug}/discography/{legacyId}/cover.webp` — Sariswing `storage-upload-executor.mjs` pattern exists but **gosaki uses static JSON, not DB** |
| **Metadata** | Keep `gosaki-piano-discography.json` as SoT short-term |
| **Admin Save** | Reuse **YouTube G-10c static JSON write** pattern: gated Save for `coverImage` field only; approval ID per slice; dry-run default |
| **Resize** | Defer — operator-prepared assets; optional sharp script later |
| **Order of work** | **Fixed self-hosted swap first (G-10f2)** → admin preview matches public → JSON write slice (G-10f5+) → Supabase only if multi-site DB discography is prioritized |

**Do not** jump to Supabase Storage / `service_role` for gosaki without explicit migration phase.

---

## 8. Not executed (G-10f planning)

- Image file add / delete / move / overwrite
- JSON write / Save click / DB write
- FTP / deploy / `workflow_dispatch`
- Convert hook implementation
- `src/pages/admin` changes

---

## 9. Next phase

**G-10f1-gosaki-discography-album-images-acquisition-preflight** — operator asset list, naming, optional Wix CDN download approval, rollback plan.

Parallel deferred: `G-10g-gosaki-contact-hubspot-form-planning`.
