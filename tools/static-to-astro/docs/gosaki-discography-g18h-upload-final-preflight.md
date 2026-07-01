# G-18h-upload — Gosaki Discography public tracklist reflection manual upload final preflight

**Phase:** `G-18h-upload-gosaki-discography-public-tracklist-reflection-manual-upload-final-preflight`  
**Status:** **complete** — runbook + pre-upload verification ready; **FTP/upload not executed by Cursor**  
**Date:** 2026-06-29  
**Base commit:** `7cad34c`  
**Prior:** [gosaki-discography-g18h-public-tracks-reflection-preflight.md](./gosaki-discography-g18h-public-tracks-reflection-preflight.md)  
**Safety:** [ftp-deploy-root-delete-incident-and-safety-hardening.md](./ftp-deploy-root-delete-incident-and-safety-hardening.md)

| Check | Status |
| --- | --- |
| Local package HTML ready | **yes** — `Like a Lover（テスト）` verified |
| Upload scope | **1 file** — `discography/index.html` only |
| CSS/JS upload required | **no** — target CSS ref already HTTP 200 on server |
| Live pre-upload state | old `Like a Lover` present; test title **absent** |
| Cursor FTP / upload | **not executed** |
| Package regen (this phase) | **not executed** |

---

## Gates

```txt
gosakiDiscographyG18hUploadFinalPreflightComplete: true
phase: G-18h-upload-gosaki-discography-public-tracklist-reflection-manual-upload-final-preflight
readyForG18hUploadExecutionByOperator: true
readyForG18hUploadResultDoc: false
uploadScopeConfirmed: true
uploadFileCount: 1
cssJsHashChanged: false
cssJsUploadRequired: false
cssJsUploadRequiredReason: target ref index.YcHrHZH4.css already HTTP 200 on staging
ftpUploadExecutedByCursor: false
mirrorSyncDeleteForbidden: true
packageRegenExecutedInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not re-Save** `discography-002` track 7 (G-18g2-execution chain).

---

## 1. Target change (reference)

| Field | Value |
| --- | --- |
| **album** | `discography-002` / SKYLARK |
| **track_number** | 7 |
| **before (live today)** | `Like a Lover` |
| **after (local + DB)** | `Like a Lover（テスト）` |
| **route** | `/discography/` |

---

## 2. Local file verification

**Path:** `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html`

| Check | Result |
| --- | --- |
| File exists | **yes** |
| Size | **73,186 bytes** (mtime 2026-07-01T01:19:42Z) |
| `Like a Lover（テスト）` | **present** |
| `>Like a Lover<` (old track 7 only) | **absent** |
| `discographyDataSource=supabase` | **present** |
| discography-001 (Continuous) | **9 tracks** |
| discography-002 (SKYLARK) | **8 tracks** — track 7 = `Like a Lover（テスト）` |
| discography-003 (About Us!!) | **9 tracks** |
| discography-004 (Ja-Jaaaaan!) | **8 tracks** |
| CSS ref in HTML | `_astro/index.YcHrHZH4.css` |
| JS ref in HTML | *(none in head — shared layout CSS only)* |

**SKYLARK expected track list (local):**

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

---

## 3. Upload scope (operator)

### Upload — 1 file only

| | Path |
| --- | --- |
| **Local source** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html` |
| **Remote target** | `/cms-kit-staging/gosaki-piano/discography/index.html` |

### Do NOT upload (this phase)

| Path | Reason |
| --- | --- |
| Full `public-dist/` (27 files) | out of scope |
| `_astro/**` | not required — see §4 |
| `schedule/**`, other pages | out of scope |
| FTP account root `/` | **forbidden** |
| Production / Sariswing | **forbidden** |

---

## 4. CSS / JS hash

| Asset | Local HTML ref | Live HTML ref (pre-upload) | Server HTTP | Upload? |
| --- | --- | --- | --- | --- |
| CSS | `index.YcHrHZH4.css` | `BaseLayout.YcHrHZH4.css` | both **200** | **no** |
| JS | — | — | `index.astro_…CTyGy8yS.js` **200** | **no** |

```txt
cssJsHashChanged: false
cssJsUploadRequired: false
```

**Rationale:** Content hash suffix `YcHrHZH4` is unchanged. Local HTML references `index.YcHrHZH4.css`, which **already exists** on staging (`HEAD` 200). Uploading `index.html` alone will switch the HTML ref from `BaseLayout.*` to `index.*` without 404 risk. **Do not delete** `BaseLayout.YcHrHZH4.css` on server (legacy coexistence OK, same as G-17e).

---

## 5. Live pre-upload verification (read-only GET)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

| Check | Live (pre-upload) |
| --- | --- |
| HTTP status | **200** (72,647 bytes) |
| `Like a Lover（テスト）` | **absent** |
| `Like a Lover` (old track 7) | **present** (`>Like a Lover<` in SKYLARK item) |
| `discographyDataSource=supabase` | **present** |
| CSS ref | `_astro/BaseLayout.YcHrHZH4.css` |

---

## 6. Manual upload runbook (operator — 戸山さん)

### Before upload

1. Confirm local file path and content (§2) — especially `Like a Lover（テスト）` in SKYLARK track 7.
2. Confirm upload scope is **1 file only** (`discography/index.html`).
3. Read [ftp-deploy-root-delete-incident-and-safety-hardening.md](./ftp-deploy-root-delete-incident-and-safety-hardening.md) — **no mirror / sync / delete**.

### FTP steps

1. Open **FileZilla** (or Lolipop FTP file manager).
2. Connect to Lolipop FTP (credentials from operator vault — **not** in repo).
3. Navigate **only** to remote directory:
   ```txt
   /cms-kit-staging/gosaki-piano/discography/
   ```
4. **STOP** if you are at FTP root `/`, `./`, or any path outside `cms-kit-staging/gosaki-piano/discography/`.
5. Upload **one file** from local:
   ```txt
   tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html
   ```
6. Mode: **overwrite** `index.html` only.
7. **Forbidden:**
   - `mirror`, `sync`, recursive upload of `public-dist/`
   - `--delete` or remote file cleanup
   - Upload to `/`, production, or other customer sites
   - Touch `schedule/`, `about/`, `_astro/` (not required this phase)

### After upload — immediate browser check

Open: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

Hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) if cached.

---

## 7. Post-upload verification (operator)

Run after manual upload. Record results in `G-18h-upload-result` doc (next phase).

### HTTP checks

| # | Check | Expected |
| ---: | --- | --- |
| 1 | `GET /discography/` | **200** |
| 2 | `GET /_astro/index.YcHrHZH4.css` | **200** (HTML ref after upload) |
| 3 | `GET /_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | **200** (if referenced elsewhere; discography page uses CSS only) |

### Content checks (`/discography/` body)

| # | Check | Expected |
| ---: | --- | --- |
| 1 | `Like a Lover（テスト）` | **present** |
| 2 | `>Like a Lover<` (old track 7 only) | **absent** |
| 3 | SKYLARK track count | **8** |
| 4 | SKYLARK track 7 text | `Like a Lover（テスト）` |
| 5 | Continuous / About Us!! / Ja-Jaaaaan! counts | **9 / 9 / 8** |
| 6 | `discographyDataSource=supabase` | **present** |
| 7 | G-15c / G-15e / G-16b / G-17e scalar fields | unchanged |
| 8 | Layout / CSS | not broken (visual spot-check) |

### Quick curl (optional)

```bash
curl -sS -o /dev/null -w "%{http_code}" \
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/"

curl -sS "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/" \
  | grep -o "Like a Lover（テスト）" | head -1
```

---

## 8. Rollback (if upload wrong)

**No DB rollback needed** — DB already correct from G-18g2 Save.

If wrong HTML uploaded:

1. Re-upload prior `discography/index.html` from backup **or** re-run local package regen + upload correct file.
2. **Do not** run `mirror --delete` to “fix” remote.
3. Document incident; ask before retry.

---

## 9. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Cursor FTP / upload | **no** |
| mirror / sync / delete | **no** |
| deploy / workflow_dispatch | **no** |
| DB write / Save | **no** |
| Package regen | **no** |
| commit / push | **no** |

---

## 10. Next phase

`G-18h-upload-result` — operator executes manual upload once + HTTP verify; Cursor records result doc only.

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18h-gosaki-discography-upload-final-preflight.mjs
```
