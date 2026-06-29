# G-15c-upload — Gosaki Discography public reflection upload result and HTTP verify

**Phase:** `G-15c-upload-gosaki-discography-public-reflection-upload-result`  
**Status:** **complete** — operator manual overwrite upload **succeeded**; HTTP verification **PASS**  
**Date:** 2026-06-28  
**Operator:** 戸山（manual upload once）  
**Base commit:** `14e3696`  
**Prior:** [gosaki-discography-public-reflection-local-regen-and-upload-preflight.md](./gosaki-discography-public-reflection-local-regen-and-upload-preflight.md)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (1 file overwrite) |
| Cursor / AI FTP / upload | **no** |
| HTTP verification (`/discography/`) | **PASS** |
| SKYLARK `purchase_url` on public staging | **PASS** |
| Old `gosaakiii.base.shop` absent (page) | **PASS** |
| `discographyDataSource=supabase` | **PASS** |
| PoC / audit markers absent | **PASS** |
| Continuous / About Us!! / Ja-Jaaaaan! | **present** (unchanged) |
| `_astro/` re-upload | **no** |
| `mirror` / `sync` / `--delete` | **no** |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiDiscographyPublicReflectionUploadSuccess: true
gosakiDiscographyPublicReflectionHttpVerifyComplete: true
phase: G-15c-upload-gosaki-discography-public-reflection-upload-result
readyForG15cDiscographyReflectionClosure: true
readyForG15cDiscographyReUpload: false
readyForG15cDiscographyReflectionReExecution: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
continuousReleaseTouched: false
aboutUsReleaseTouched: false
jaJaaaaanReleaseTouched: false
rollbackNeeded: false
```

**Do not re-upload** `discography/index.html` without a new approval ID and documented reason.

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

SKYLARK section displays `https://gosakirikako.base.shop/` on live staging.

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
| **id** | `ed59d236-881a-45ce-ab9f-de5427e39dad` |
| **legacy_id** | `discography-002` |
| **title** | `SKYLARK` |
| **route** | `/discography/` |
| **purchase_url (public after)** | `https://gosakirikako.base.shop/` |
| **purchase_url (public before)** | `https://gosaakiii.base.shop/` |

---

## 3. HTTP verify (read-only GET — Cursor)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`  
**Method:** `curl` / `urllib` GET (read-only)  
**Date:** 2026-06-28

| Check | Result |
| --- | --- |
| HTTP status | **200** |
| Response body size | **72,155 bytes** |
| `SKYLARK` | **present** |
| `discographyDataSource=supabase` | **present** |
| Page `gosakirikako.base.shop` count | **4** (href + text × Continuous + SKYLARK) |
| Page `gosaakiii.base.shop` count | **0** |
| SKYLARK item new URL | **present** |
| SKYLARK item old URL | **absent** |
| `Continuous` | **present** |
| `About Us!!` | **present** |
| `Ja-Jaaaaan!` | **present** |

### SKYLARK purchase link excerpt (live staging)

```html
<a href="https://gosakirikako.base.shop/" target="_self" rel="noreferrer noopener" class="wixui-rich-text__text">https://gosakirikako.base.shop/</a>
```

### Pre-upload vs post-upload (reference)

| Metric | G-15c preflight (pre-upload) | G-15c-upload (post-upload) |
| --- | --- | --- |
| HTTP | 200 | **200** |
| `gosaakiii.base.shop` (page) | 2 | **0** |
| `gosakirikako.base.shop` (page) | 2 (Continuous only) | **4** |
| SKYLARK item old URL | present | **absent** |
| SKYLARK item new URL | absent | **present** |
| `discographyDataSource=supabase` | absent | **present** |

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
node tools/static-to-astro/scripts/verify-g15c-gosaki-discography-public-reflection-upload-result.mjs
```

---

## 6. Next phase

**G-15c-f (optional)** — Discography public reflection closure doc (G-14b1f pattern): confirm G-15b→G-15c-upload chain closed; **do not re-upload** `discography/index.html`.
