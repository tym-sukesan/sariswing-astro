# G-18h-upload-result — Gosaki Discography public tracklist reflection upload result

**Phase:** `G-18h-upload-result-gosaki-discography-public-tracklist-reflection-upload-result`  
**Status:** **complete** — operator manual upload **succeeded** (1 file); HTTP verification **PASS**  
**Date:** 2026-06-29  
**Operator:** manual upload once (`discography/index.html` only)  
**Base commit:** `17926f5`  
**Prior:** [gosaki-discography-g18h-upload-final-preflight.md](./gosaki-discography-g18h-upload-final-preflight.md)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (1 file overwrite) |
| Cursor / AI FTP / upload | **no** |
| HTTP verification (`/discography/`) | **PASS** — **200** |
| HTTP verification (`index.YcHrHZH4.css`) | **PASS** — **200** |
| `Like a Lover（テスト）` on public staging | **PASS** |
| SKYLARK track count | **PASS** — **8** |
| Old `>Like a Lover<` (track 7 only) | **absent** |
| Operator visual layout | **OK** |
| `_astro/` upload | **not performed** (as planned) |
| `mirror` / `sync` / `--delete` | **no** |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiDiscographyG18hPublicTracklistReflectionUploadSuccess: true
gosakiDiscographyG18hPublicTracklistReflectionHttpVerifyComplete: true
phase: G-18h-upload-result-gosaki-discography-public-tracklist-reflection-upload-result
readyForG18hDiscographyTracklistReflectionClosure: true
readyForG18hDiscographyTracklistReUpload: false
readyForG18hDiscographyTracklistReflectionReExecution: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
rollbackNeeded: false
```

**Do not re-upload** `discography/index.html` without a new approval ID and documented reason.

**Do not re-Save** `discography-002` track 7 (G-18g2-execution chain).

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Upload summary (operator)

| Item | Value |
| --- | --- |
| **Executor** | Operator — manual |
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

- SKYLARK Track List shows `Like a Lover（テスト）` at track 7
- Layout: **not broken** (`見た目は崩れていない`)

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
| `BaseLayout.YcHrHZH4.css` on server | **still present** — not deleted (legacy coexistence OK) |

---

## 2. Target change (reference)

| Field | Value |
| --- | --- |
| **legacy_id** | `discography-002` |
| **title** | SKYLARK |
| **track_number** | 7 |
| **field** | `discography_tracks.title` |
| **before** | `Like a Lover` |
| **after (DB + public)** | `Like a Lover（テスト）` |
| **route** | `/discography/` |
| **Save phase** | G-18g2-execution |
| **Public reflection phase** | G-18h + G-18h-upload |

---

## 3. HTTP verification (Cursor read-only GET)

**Executed:** 2026-06-29 (this phase)

| URL | HTTP | Notes |
| --- | ---: | --- |
| `…/discography/` | **200** | 72,647 bytes |
| `…/_astro/index.YcHrHZH4.css` | **200** | 50,106 bytes (HEAD) |

### HTML content checks (live body)

| Check | Result |
| --- | --- |
| `Like a Lover（テスト）` | **present** |
| `>Like a Lover<` (old track 7 only) | **absent** |
| `discographyDataSource=supabase` | **present** |
| HTML CSS ref | `_astro/index.YcHrHZH4.css` |
| SKYLARK track count | **8** |
| SKYLARK track 7 | `Like a Lover（テスト）` |
| Continuous track count | **9** |
| About Us!! track count | **9** |
| Ja-Jaaaaan! track count | **8** |

**SKYLARK live track list (verified):**

```txt
1 On a Clear Day
2 My Blue Heaven
3 How Deep Is The Ocean
4 Skylark
5 Set Sail
6 What a Wonderful World
7 Like a Lover（テスト）
8 The Water Is Wide
```

### Audit markers — must be absent

| Marker | Result |
| --- | --- |
| `[CMS Kit staging]` | **absent** |
| `PoC` | **absent** |
| `dry-run` | **absent** |

---

## 4. Chain status

| Chain | Status |
| --- | --- |
| G-18g2 Save (`discography-002` track 7 title) | **closed** |
| G-18h local public reflection | **closed** |
| G-18h-upload operator upload | **closed** |
| Full tracklist reflection (DB → staging HTML) | **complete** |

**Next recommended:** `G-18h-f` closure doc (optional) or next Gosaki CMS slice per backlog.

---

## 5. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Cursor FTP / upload | **no** |
| mirror / sync / delete | **no** |
| DB write / Save / rollback SQL | **no** |
| Package regen | **no** |
| deploy / workflow_dispatch | **no** |
| commit / push | **no** |

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18h-gosaki-discography-upload-result.mjs
```
