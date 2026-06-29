# G-17e-upload — Gosaki Discography label public reflection upload result and HTTP verify

**Phase:** `G-17e-upload-gosaki-discography-label-public-reflection-upload-result`  
**Status:** **complete** — operator manual upload **succeeded** (2 files); HTTP verification **PASS**  
**Date:** 2026-06-29  
**Operator:** manual upload once (HTML + CSS)  
**Base commit:** `08e63a8`  
**Prior:** [gosaki-discography-g17e-label-public-reflection-local-regen-and-upload-preflight.md](./gosaki-discography-g17e-label-public-reflection-local-regen-and-upload-preflight.md)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (2 files overwrite) |
| Cursor / AI FTP / upload | **no** |
| HTTP verification (`/discography/`) | **PASS** — **200** |
| HTTP verification (`BaseLayout.YcHrHZH4.css`) | **PASS** — **200** |
| HTML references `BaseLayout.YcHrHZH4.css` | **PASS** |
| Ja-Jaaaaan! `label` on public staging | **PASS** — `Mardi Gras JAPAN Records` |
| G-15c SKYLARK `purchase_url` maintained | **PASS** |
| G-15e About Us!! `artist` maintained | **PASS** |
| G-16b Continuous `artist` maintained | **PASS** |
| `discographyDataSource=supabase` | **PASS** |
| PoC / audit markers absent | **PASS** |
| Operator visual layout | **not broken** |
| Old `index.YcHrHZH4.css` on server | **not deleted** (OK — coexistence) |
| `mirror` / `sync` / `--delete` | **no** |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiDiscographyG17eLabelPublicReflectionUploadSuccess: true
gosakiDiscographyG17eLabelPublicReflectionHttpVerifyComplete: true
phase: G-17e-upload-gosaki-discography-label-public-reflection-upload-result
readyForG17eDiscographyLabelReflectionClosure: true
readyForG17eDiscographyLabelReUpload: false
readyForG17eDiscographyLabelReflectionReExecution: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
skylarkPurchaseUrlReflectionMaintained: true
aboutUsArtistReflectionMaintained: true
continuousArtistReflectionMaintained: true
rollbackNeeded: false
```

**Do not re-upload** `discography/index.html` or `_astro/BaseLayout.YcHrHZH4.css` without a new approval ID and documented reason.

**Do not re-Save** `discography-004` / `label` (G-17c / G-17d chain).

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Upload summary (operator)

| Item | Value |
| --- | --- |
| **Executor** | Operator — manual |
| **Method** | FileZilla / Lolipop FTP GUI — **overwrite** |
| **Files uploaded** | **2** |
| **Delete / mirror / sync** | **no** |

### File 1 — HTML

| | Path |
| --- | --- |
| **Local** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html` |
| **Remote** | `/cms-kit-staging/gosaki-piano/discography/index.html` |

### File 2 — CSS (required — HTML ref changed)

| | Path |
| --- | --- |
| **Local** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/BaseLayout.YcHrHZH4.css` |
| **Remote** | `/cms-kit-staging/gosaki-piano/_astro/BaseLayout.YcHrHZH4.css` |

### Public URL

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/
```

### Operator visual confirmation

- Layout: **not broken** (`見た目は崩れていない`)

### Not uploaded (confirmed)

| Path | Status |
| --- | --- |
| Full `public-dist/` (27 files) | **not uploaded** |
| Full `_astro/` directory | **not uploaded** |
| `schedule/**` | **not uploaded** |
| Other `public-dist/` pages | **not uploaded** |
| Account FTP root `/` | **not touched** |
| Production / Sariswing | **not touched** |

### Legacy CSS coexistence (OK)

| Asset | Remote status |
| --- | --- |
| `_astro/index.YcHrHZH4.css` (pre-upload ref) | **still present** — **not deleted** (OK) |
| `_astro/BaseLayout.YcHrHZH4.css` (new ref) | **uploaded** — HTML now references this |

---

## 2. Target row (reference)

| Field | Value |
| --- | --- |
| **legacy_id** | `discography-004` |
| **title** | `Ja-Jaaaaan!` |
| **route** | `/discography/` |
| **field** | `label` only |
| **label (DB + public)** | `Mardi Gras JAPAN Records` |
| **updated_at (DB after G-17d Save)** | `2026-06-29T07:36:49.044397+00:00` |

---

## 3. HTTP verification (Cursor read-only GET)

**Executed:** 2026-06-29 (this phase)

| URL | HTTP | Size (bytes) |
| --- | ---: | ---: |
| `…/discography/` | **200** | 72,647 |
| `…/_astro/BaseLayout.YcHrHZH4.css` | **200** | 320,360 |
| `…/_astro/index.YcHrHZH4.css` (legacy, not deleted) | **200** | (still served) |

### HTML content checks (live body)

| Check | Result |
| --- | --- |
| `BaseLayout.YcHrHZH4.css` in HTML | **present** |
| `index.YcHrHZH4.css` in HTML | **absent** (expected after upload) |
| `discographyDataSource=supabase` | **present** |
| Ja-Jaaaaan! item + `Mardi Gras JAPAN Records` | **PASS** |
| About Us!! / `ごさきりかこTrio` | **PASS** |
| Continuous / `ごさきりかこTrio feat.石川周之介` | **PASS** |
| Continuous old `Feat.石川` | **absent** |
| `https://gosakirikako.base.shop/` | **present** (count **4**) |
| `https://gosaakiii.base.shop/` | **absent** |
| 4 titles (Continuous, SKYLARK, About Us!!, Ja-Jaaaaan!) | **PASS** |

### Audit markers — must be absent

| Marker | Result |
| --- | --- |
| `[CMS Kit staging]` | **absent** |
| `PoC` | **absent** |
| `dry-run` | **absent** |

---

## 4. Chain status

| Phase | Status |
| --- | --- |
| G-17c preflight / registry | **complete** |
| G-17d Save (`label`) | **complete** |
| G-17e local regen + upload preflight | **complete** (`08e63a8`) |
| G-17e-upload (this doc) | **complete** |
| **Next** | `G-17e-f` — label public reflection **closure** |

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g17e-gosaki-discography-label-public-reflection-upload-result.mjs
```
