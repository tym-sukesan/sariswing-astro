# G-20d / G-20e — Gosaki production test text cleanup public reflection upload result

**Phase:** `G-20d-gosaki-production-test-text-cleanup-public-reflection-upload-result` + `G-20e-gosaki-production-test-text-cleanup-public-reflection-http-verify`  
**Status:** **complete** — operator manual upload **succeeded** (1 file); live HTTP verification **PASS**  
**Date:** 2026-07-01  
**Operator:** 戸山さん — manual FTP upload once (`discography/index.html` only)  
**Base commit:** `0550da4`  
**Prior:** [gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.md](./gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.md) (G-20c)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (1 file overwrite) |
| Cursor / AI FTP / upload | **no** |
| Upload scope | **1 file** — `discography/index.html` only |
| `_astro/` upload | **not performed** |
| `mirror` / `sync` / `delete` / folder upload | **no** |
| HTTP verification (`/discography/`) | **PASS** — **200** |
| HTTP verification (`index.YcHrHZH4.css`) | **PASS** — **200** |
| HTTP verification (JS asset on server) | **PASS** — **200** |
| `Like a Lover（テスト）` on live | **absent** |
| `Mary Ann（テスト）` on live | **absent** |
| `Like a Lover` (SKYLARK track 7) | **present** |
| `Mary Ann` (Ja-Jaaaaan! track 1) | **present** |
| Ja-Jaaaaan! track count | **8** |
| SKYLARK track count | **8** |
| Operator visual layout | **OK** — レイアウト崩れなし |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiProductionTestTextCleanupPublicReflectionUploadSuccess: true
gosakiProductionTestTextCleanupPublicReflectionHttpVerifyComplete: true
phase: G-20d-gosaki-production-test-text-cleanup-public-reflection-upload-result
httpVerifyPhase: G-20e-gosaki-production-test-text-cleanup-public-reflection-http-verify
readyForG20fProductionReleaseConfigCutoverPreflight: true
readyForG20eClosureCleanupChainClosure: true
readyForG20dDiscographyCleanupReUpload: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
rollbackNeeded: false
rollbackSqlExecuted: false
discography002Track7DoNotReSave: true
discography004Track1DoNotReSave: true
discographyCleanupDoNotReUpload: true
```

**Do not re-upload** `discography/index.html` for this cleanup without new preflight and documented reason.

**Do not re-run** G-20b cleanup SQL or re-Save closed tracklist chains.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Upload summary (operator — G-20d)

| Item | Value |
| --- | --- |
| **Executor** | Operator — manual (戸山さん) |
| **Method** | FileZilla / Lolipop FTP GUI — **overwrite** |
| **Files uploaded** | **1** |
| **Delete / mirror / sync / recursive / folder** | **no** |

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

- SKYLARK track 7: `Like a Lover`
- Ja-Jaaaaan! track 1: `Mary Ann`
- `Like a Lover（テスト）`: **absent**
- `Mary Ann（テスト）`: **absent**
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
| `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` on server | **HTTP 200** (pre-existing; not referenced in discography HTML) |

---

## 2. Target change (reference — G-20b cleanup)

| Row | legacy_id | track | before (live G-19d) | after (live G-20d) |
| --- | --- | ---: | --- | --- |
| A | `discography-002` | 7 | `Like a Lover（テスト）` | `Like a Lover` |
| B | `discography-004` | 1 | `Mary Ann（テスト）` | `Mary Ann` |

**Expected Ja-Jaaaaan! track list (live):**

```txt
1 Mary Ann
2 Nearer My God To Thee
3 Shreveport Stomp
4 A Fool Such As I
5 Si Tu Vois Ma Mere
6 St. Phillip Street Break Down
7 Girl Of My Dream
8 Bourbon Street Parade
```

**Expected SKYLARK track 7:** `Like a Lover`

---

## 3. HTTP verification (Cursor read-only GET — G-20e)

**Executed:** 2026-07-01 (this phase)

| URL | HTTP | Notes |
| --- | ---: | --- |
| `…/discography/` | **200** | 72,642 bytes |
| `…/_astro/index.YcHrHZH4.css` | **200** | pre-existing asset |
| `…/_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | **200** | pre-existing asset |

| Check | Live |
| --- | --- |
| `discographyDataSource=supabase` | **present** |
| `Like a Lover（テスト）` | **absent** |
| `Mary Ann（テスト）` | **absent** |
| `Like a Lover` (SKYLARK track 7) | **present** |
| `Mary Ann` (Ja-Jaaaaan! track 1) | **present** |
| Ja-Jaaaaan! track count | **8** |
| SKYLARK track count | **8** |
| Continuous / About Us!! track counts | **9 / 9** |

---

## 4. Chain status

| Phase | Status |
| --- | --- |
| G-20a release readiness inventory | **complete** |
| G-20b DB cleanup (operator SQL) | **complete** |
| G-20c local regen + upload preflight | **complete** |
| G-20d operator upload | **complete** |
| G-20e HTTP verify + result doc | **complete** |
| G-20e-closure / G-20f cutover preflight | **pending** |

---

## 5. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Cursor FTP / upload re-execution | **no** |
| mirror / sync / delete | **no** |
| Save / DB write | **no** |
| rollback SQL | **no** |
| package regen | **no** |
| deploy / workflow_dispatch | **no** |
| production / Sariswing | **no** |
| `service_role` | **no** |
| commit / push | **no** |

---

## 6. Next phases

| Phase | Scope |
| --- | --- |
| **G-20e-closure** | G-20b → G-20c → G-20d → G-20e cleanup chain closure doc |
| **G-20f** | Production release config / cutover preflight |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20de-gosaki-production-test-text-cleanup-public-reflection-upload-result.mjs
```
