# G-16b-upload — Gosaki Discography G-16a artist public reflection upload result and HTTP verify

**Phase:** `G-16b-upload-gosaki-discography-artist-public-reflection-upload-result`  
**Status:** **complete** — operator manual overwrite upload **succeeded**; HTTP verification **PASS**  
**Date:** 2026-06-29  
**Operator:** manual upload once  
**Base commit:** `d16aeca`  
**Prior:** [gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md](./gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (1 file overwrite) |
| Cursor / AI FTP / upload | **no** |
| HTTP verification (`/discography/`) | **PASS** |
| Continuous `artist` on public staging | **PASS** — `ごさきりかこTrio feat.石川周之介` |
| Old `Feat.` absent (Continuous item) | **PASS** |
| G-15c SKYLARK `purchase_url` maintained | **PASS** |
| G-15e About Us!! `artist` maintained | **PASS** — `ごさきりかこTrio` |
| Old `gosaakiii.base.shop` absent (page) | **PASS** |
| `discographyDataSource=supabase` | **PASS** |
| PoC / audit markers absent | **PASS** |
| Continuous / SKYLARK / About Us!! / Ja-Jaaaaan! | **present** |
| `_astro/` re-upload | **no** |
| `mirror` / `sync` / `--delete` | **no** |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiDiscographyG16bArtistPublicReflectionUploadSuccess: true
gosakiDiscographyG16bArtistPublicReflectionHttpVerifyComplete: true
phase: G-16b-upload-gosaki-discography-artist-public-reflection-upload-result
readyForG16bDiscographyArtistReflectionClosure: true
readyForG16bDiscographyArtistReUpload: false
readyForG16bDiscographyArtistReflectionReExecution: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
skylarkPurchaseUrlReflectionMaintained: true
aboutUsArtistReflectionMaintained: true
continuousPurchaseUrlBaselineMaintained: true
rollbackNeeded: false
```

**Do not re-upload** `discography/index.html` without a new approval ID and documented reason.

**Do not re-Save** `discography-001` / `artist` (G-16a chain).

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Upload summary (operator)

| Item | Value |
| --- | --- |
| **Executor** | Operator — manual |
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

- Continuous section: `「Continuous」/ごさきりかこTrio feat.石川周之介`
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
| **id** | `00f4cd00-cfb6-43b3-991a-211b2d7c92ef` |
| **legacy_id** | `discography-001` |
| **title** | `Continuous` |
| **route** | `/discography/` |
| **field** | `artist` only |
| **artist (public after)** | `ごさきりかこTrio feat.石川周之介` |
| **artist (public before)** | `ごさきりかこTrio Feat.石川周之介` |
| **updated_at (DB after G-16a Save)** | `2026-06-29T05:05:20.905888+00:00` |

### purchase_url baseline (maintained)

| legacy_id | title | `purchase_url` |
| --- | --- | --- |
| discography-001 | Continuous | `https://gosakirikako.base.shop/` |
| discography-002 | SKYLARK | `https://gosakirikako.base.shop/` |

**About Us!! / SKYLARK / Ja-Jaaaaan! — DB rows not modified in G-16a.**

---

## 3. HTTP verify (read-only GET — Cursor)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`  
**Method:** `curl` GET (read-only)  
**Date:** 2026-06-29

| Check | Result |
| --- | --- |
| HTTP status | **200** |
| Response body size | **72,682 bytes** |
| `Continuous` | **present** |
| Continuous item `ごさきりかこTrio feat.石川周之介` | **present** |
| Continuous item `ごさきりかこTrio Feat.石川周之介` | **absent** |
| Page `Feat.石川` count | **0** |
| Page `feat.石川` count | **1** |
| `About Us!!` | **present** |
| About Us item `ごさきりかこTrio` | **present** (G-15e) |
| `discographyDataSource=supabase` | **present** |
| Page `gosakirikako.base.shop` count | **4** |
| Page `gosaakiii.base.shop` count | **0** |
| SKYLARK item new URL | **present** |
| SKYLARK item old URL | **absent** |
| `SKYLARK` | **present** |
| `Ja-Jaaaaan!` | **present** |
| CSS hash (page ref) | `index.YcHrHZH4.css` |

### Continuous artist excerpt (live staging)

```html
「Continuous」/ごさきりかこTrio feat.石川周之介
```

### Pre-upload vs post-upload (reference)

| Metric | G-16b preflight (pre-upload) | G-16b-upload (post-upload) |
| --- | --- | --- |
| HTTP | 200 | **200** |
| Continuous item `Feat.` | present | **absent** |
| Continuous item `feat.` | absent | **present** |
| Page `Feat.石川` | 1 | **0** |
| About Us `ごさきりかこTrio` | present | **present** |
| `discographyDataSource=supabase` | present | **present** |
| SKYLARK `gosakirikako.base.shop` | present | **present** |
| SKYLARK `gosaakiii.base.shop` | absent | **absent** |

### CSS / JS (1-file HTML upload — hash unchanged)

| Asset | Hash | Re-uploaded? |
| --- | --- | --- |
| CSS | `index.YcHrHZH4.css` | **no** |
| JS | `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | **no** |

Only `discography/index.html` was uploaded; `_astro/` unchanged per G-16b preflight plan.

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
node tools/static-to-astro/scripts/verify-g16b-gosaki-discography-artist-public-reflection-upload-result.mjs
```

---

## 6. Next phase

**G-16b-f** — Discography G-16a artist public reflection closure doc (G-15e-f pattern): confirm G-16a→G-16b-upload chain closed; **do not re-upload** `discography/index.html`; **do not re-Save** `discography-001`.
