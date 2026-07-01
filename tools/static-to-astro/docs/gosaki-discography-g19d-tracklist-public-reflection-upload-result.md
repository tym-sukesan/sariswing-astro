# G-19d — Gosaki Discography G-19b1 tracklist public reflection upload result

**Phase:** `G-19d-gosaki-discography-tracklist-public-reflection-upload-result`  
**Status:** **complete** — operator manual upload **succeeded** (1 file); HTTP verification **PASS**  
**Date:** 2026-07-01  
**Operator:** 戸山さん — manual FTP upload once (`discography/index.html` only)  
**Base commit:** `5b9ee8b`  
**Prior:** [gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md](./gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (1 file overwrite) |
| Cursor / AI FTP / upload | **no** |
| HTTP verification (`/discography/`) | **PASS** — **200** |
| HTTP verification (`index.YcHrHZH4.css`) | **PASS** — **200** |
| `Mary Ann（テスト）` on public staging | **PASS** |
| Ja-Jaaaaan! track count | **PASS** — **8** |
| Old `>Mary Ann<` (track 1 only) | **absent** |
| `Like a Lover（テスト）` (G-18g2) | **PASS** — maintained |
| Operator visual layout | **OK** — レイアウト崩れなし |
| `_astro/` upload | **not performed** (as planned) |
| `mirror` / `sync` / `--delete` | **no** |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiDiscographyG19dTracklistPublicReflectionUploadSuccess: true
gosakiDiscographyG19dTracklistPublicReflectionHttpVerifyComplete: true
phase: G-19d-gosaki-discography-tracklist-public-reflection-upload-result
readyForG19eDiscographyG19b1TracklistReflectionClosure: true
readyForG19dDiscographyTracklistReUpload: false
readyForG19b1TracklistSingleTitleSaveReExecution: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
rollbackNeeded: false
discography004Track1DoNotReSave: true
discography004Track1DoNotReUpload: true
g18g2Track7Maintained: true
```

**Do not re-upload** `discography/index.html` for this change without a new approval ID and documented reason.

**Do not re-Save** `discography-004` track 1 (G-19b1-execution chain).

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Upload summary (operator)

| Item | Value |
| --- | --- |
| **Executor** | Operator — manual (戸山さん) |
| **Method** | FileZilla / Lolipop FTP GUI — **overwrite** |
| **Files uploaded** | **1** |
| **Delete / mirror / sync / recursive** | **no** |

### File uploaded — HTML only

| | Path |
| --- | --- |
| **Local** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html` |
| **Remote** | `/cms-kit-staging/gosaki-piano/discography/index.html` |

### Public URL

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/
```

### Operator visual confirmation

- Ja-Jaaaaan! Track List shows `Mary Ann（テスト）` at track 1
- Ja-Jaaaaan! track count: **8** (unchanged)
- Layout: **not broken** (`レイアウト崩れなし`)

### Not uploaded (confirmed)

| Path | Status |
| --- | --- |
| `_astro/**` | **not uploaded** |
| Full `public-dist/` (27 files) | **not uploaded** |
| `schedule/**` | **not uploaded** |
| Other `public-dist/` pages | **not uploaded** |
| Account FTP root `/` | **not touched** |
| Production / Sariswing | **not touched** |

### CSS ref after upload

| Asset | Status |
| --- | --- |
| HTML references `_astro/index.YcHrHZH4.css` | **yes** |
| `index.YcHrHZH4.css` on server | **HTTP 200** (pre-existing; no upload needed) |

---

## 2. Target change (reference)

| Field | Value |
| --- | --- |
| **legacy_id** | `discography-004` |
| **title** | Ja-Jaaaaan! |
| **track row** | `04e987a9-e251-4b0b-b860-21a61e711f8e` |
| **track_number** | 1 |
| **field** | `discography_tracks.title` |
| **before** | `Mary Ann` |
| **after (DB + public)** | `Mary Ann（テスト）` |
| **route** | `/discography/` |
| **Save phase** | G-19b1-execution |
| **Public reflection phase** | G-19c + G-19d |

**Expected Ja-Jaaaaan! track list (live):**

```txt
1 Mary Ann（テスト）
2 Nearer My God To Thee
3 Shreveport Stomp
4 A Fool Such As I
5 Si Tu Vois Ma Mere
6 St. Phillip Street Break Down
7 Girl Of My Dream
8 Bourbon Street Parade
```

---

## 3. HTTP verification (Cursor read-only GET)

**Executed:** 2026-07-01 (this phase)

| URL | HTTP | Notes |
| --- | ---: | --- |
| `…/discography/` | **200** | 72,652 bytes |
| `…/_astro/index.YcHrHZH4.css` | **200** | pre-existing asset |

| Check | Live |
| --- | --- |
| `discographyDataSource=supabase` | **present** |
| `Mary Ann（テスト）` | **present** |
| `>Mary Ann<` (old track 1 only) | **absent** |
| Ja-Jaaaaan! track count | **8** |
| Ja-Jaaaaan! track 1 | `Mary Ann（テスト）` |
| SKYLARK track 7 | `Like a Lover（テスト）` (G-18g2 maintained) |
| Continuous / About Us!! track counts | **9 / 9** |

---

## 4. Chain status (pre-closure)

| Phase | Status |
| --- | --- |
| G-19b1 Save | **complete** |
| G-19c local regen | **complete** |
| G-19d upload + HTTP verify | **complete** |
| G-19e closure doc | **pending** |

---

## 5. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Cursor FTP / upload | **no** |
| mirror / sync / delete | **no** |
| Save / DB write | **no** |
| rollback SQL | **no** |
| package regen | **no** |
| deploy / workflow_dispatch | **no** |
| production / Sariswing | **no** |
| `service_role` | **no** |
| commit / push | **no** |

---

## 6. Next phase

`G-19e` — G-19b1 / G-19c / G-19d closure doc (Save → local regen → upload → HTTP verify chain closed).

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g19d-gosaki-discography-tracklist-public-reflection-upload-result.mjs
```
