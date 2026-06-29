# G-15e-upload — Gosaki Discography artist public reflection upload result and HTTP verify

**Phase:** `G-15e-upload-gosaki-discography-artist-public-reflection-upload-result`  
**Status:** **complete** — operator manual overwrite upload **succeeded**; HTTP verification **PASS**  
**Date:** 2026-06-29  
**Operator:** 戸山（manual upload once）  
**Base commit:** `566d714`  
**Prior:** [gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md](./gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (1 file overwrite) |
| Cursor / AI FTP / upload | **no** |
| HTTP verification (`/discography/`) | **PASS** |
| About Us!! `artist` on public staging | **PASS** — `ごさきりかこTrio` |
| Old `ごさきりかこtrio` absent (page) | **PASS** |
| G-15c SKYLARK `purchase_url` maintained | **PASS** |
| Old `gosaakiii.base.shop` absent (page) | **PASS** |
| `discographyDataSource=supabase` | **PASS** |
| PoC / audit markers absent | **PASS** |
| Continuous / SKYLARK / Ja-Jaaaaan! | **present** (unchanged) |
| `_astro/` re-upload | **no** |
| `mirror` / `sync` / `--delete` | **no** |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiDiscographyArtistPublicReflectionUploadSuccess: true
gosakiDiscographyArtistPublicReflectionHttpVerifyComplete: true
phase: G-15e-upload-gosaki-discography-artist-public-reflection-upload-result
readyForG15eDiscographyArtistReflectionClosure: true
readyForG15eDiscographyArtistReUpload: false
readyForG15eDiscographyArtistReflectionReExecution: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
skylarkPurchaseUrlReflectionMaintained: true
continuousReleaseTouched: false
jaJaaaaanReleaseTouched: false
rollbackNeeded: false
```

**Do not re-upload** `discography/index.html` without a new approval ID and documented reason.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Upload summary (operator)

| Item | Value |
| --- | --- |
| **Executor** | Operator (戸山) — manual |
| **Method** | FileZilla / Lolipop FTP GUI — **overwrite** |
| **Files uploaded** | **1** |
| **Delete / mirror / sync** | **no** |

### Local source

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html
```

### Remote destination

```txt
/cms-kit-staging/gosaki-piano/discography/index.html
```

### Public URL

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/
```

### Operator visual confirmation

- About Us!! section: `「About Us!!」/ごさきりかこTrio`
- SKYLARK section: `https://gosakirikako.base.shop/` maintained

### Not uploaded (confirmed)

| Path | Status |
| --- | --- |
| `_astro/*` | **not uploaded** |
| `schedule/**` | **not uploaded** |
| Other `public-dist/` pages | **not uploaded** |
| Full `public-dist/` (27 files) | **not uploaded** |
| Account FTP root `/` | **not touched** |
| Production / Sariswing | **not touched** |

---

## 2. Target row (reference)

| Field | Value |
| --- | --- |
| **id** | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| **legacy_id** | `discography-003` |
| **title** | `About Us!!` |
| **route** | `/discography/` |
| **field** | `artist` only |
| **artist (public after)** | `ごさきりかこTrio` |
| **artist (public before)** | `ごさきりかこtrio` |
| **updated_at (DB after G-15d Save)** | `2026-06-29T02:40:57.83085+00:00` |

**SKYLARK / Continuous / Ja-Jaaaaan! — DB rows not modified in G-15d.**

---

## 3. HTTP verify (read-only GET — Cursor)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`  
**Method:** `curl` GET (read-only)  
**Date:** 2026-06-29

| Check | Result |
| --- | --- |
| HTTP status | **200** |
| Response body size | **72,153 bytes** |
| `About Us!!` | **present** |
| About Us item `ごさきりかこTrio` | **present** |
| About Us item `ごさきりかこtrio` | **absent** |
| Page `ごさきりかこtrio` count | **0** |
| Page `ごさきりかこTrio` count | **2** |
| `discographyDataSource=supabase` | **present** |
| Page `gosakirikako.base.shop` count | **4** |
| Page `gosaakiii.base.shop` count | **0** |
| SKYLARK item new URL | **present** |
| SKYLARK item old URL | **absent** |
| `Continuous` | **present** |
| `SKYLARK` | **present** |
| `Ja-Jaaaaan!` | **present** |

### About Us!! artist excerpt (live staging)

```html
「About Us!!」/ごさきりかこTrio
```

### Pre-upload vs post-upload (reference)

| Metric | G-15e preflight (pre-upload) | G-15e-upload (post-upload) |
| --- | --- | --- |
| HTTP | 200 | **200** |
| About Us item `ごさきりかこtrio` | present | **absent** |
| About Us item `ごさきりかこTrio` | absent | **present** |
| Page `ごさきりかこtrio` | present | **0** |
| `discographyDataSource=supabase` | present | **present** |
| SKYLARK `gosakirikako.base.shop` | present | **present** |
| SKYLARK `gosaakiii.base.shop` | absent | **absent** |

### PoC / audit markers — must be absent (live)

| Marker | Result |
| --- | --- |
| `[CMS Kit staging]` | **absent** |
| `PoC` | **absent** |
| `dry-run` | **absent** |

---

## 4. Forbidden operations (this phase)

| Operation | Executed? |
| --- | --- |
| Cursor FTP / upload | **no** |
| Package regen | **no** |
| DB write / Save | **no** |
| `workflow_dispatch` / deploy | **no** |
| Production / Sariswing | **no** |

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15e-gosaki-discography-artist-public-reflection-upload-result.mjs
```

---

## 6. Next phase

**G-15e-f (optional)** — Discography artist public reflection closure doc (G-15c-f pattern): confirm G-15d→G-15e-upload chain closed; **do not re-upload** `discography/index.html`; **do not re-Save** `discography-003`.
