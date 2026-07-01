# G-19c — Gosaki Discography G-19b1 tracklist public reflection local regen and upload preflight

**Phase:** `G-19c-gosaki-discography-tracklist-public-reflection-local-regen-and-upload-preflight`  
**Status:** **complete** — local package regen **succeeded**; `Mary Ann（テスト）` verified in generated HTML; minimal 1-file upload plan ready; **FTP/upload not executed**  
**Date:** 2026-07-01  
**Base commit:** `d311e65`  
**Prior:** [gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md](./gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md) (G-19b1-execution)  
**Playbook:** [cms-kit-save-reflection-playbook.md](./cms-kit-save-reflection-playbook.md)  
**Reflection hook (reuse):** [gosaki-discography-g18h-public-tracks-reflection-preflight.md](./gosaki-discography-g18h-public-tracks-reflection-preflight.md)

| Check | Status |
| --- | --- |
| G-19b1 Save (`discography-004` track 1 title) | **complete** |
| DB read-only verification | **PASS** |
| `patchDiscographyItemTracks` hook (G-18h) | **reused** — no code change |
| Local package regen | **yes** — `build-gosaki-staging-admin-package.mjs` **PASS** |
| Ja-Jaaaaan! track 1 in local HTML | **PASS** — `Mary Ann（テスト）` |
| Old `Mary Ann` only (track 1) | **absent** in local HTML |
| Ja-Jaaaaan! track count | **8** (unchanged) |
| G-18g2 SKYLARK track 7 | **maintained** — `Like a Lover（テスト）` |
| All 4 album track counts | **preserved** (9 / 8 / 9 / 8) |
| G-15c / G-15e / G-16b / G-17e scalar reflection | **maintained** |
| Live staging `/discography/` | **stale** — still `Mary Ann` (no upload) |
| CSS / JS hash vs prior package | **unchanged** |
| FTP / upload | **not executed** |

---

## Gates

```txt
gosakiDiscographyG19cTracklistPublicReflectionLocalRegenComplete: true
gosakiDiscographyG19cTracklistPublicReflectionUploadPreflightComplete: true
phase: G-19c-gosaki-discography-tracklist-public-reflection-local-regen-and-upload-preflight
readyForG19dTracklistPublicReflectionUploadExecution: true
readyForG19dTracklistPublicReflectionUploadResultDoc: false
packageRegenExecuted: true
minimalUploadScopeConfirmed: true
uploadFileCount: 1
cssJsHashChanged: false
cssJsUploadRequired: false
ftpUploadExecuted: false
mirrorSyncDeleteForbidden: true
deployExecuted: false
workflowDispatchExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
g18g2Track7Maintained: true
discography004Track1DoNotReSave: true
```

**Output artifacts:** under `tools/static-to-astro/output/` — **gitignored**. Not committed.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not re-Save** `discography-004` track 1 (G-19b1-execution chain).

---

## 1. DB after-state (read-only — G-19b1 Save reference)

| Field | Value |
| --- | --- |
| **album** | `discography-004` / Ja-Jaaaaan! |
| **track row** | `04e987a9-e251-4b0b-b860-21a61e711f8e` |
| **track_number** | 1 |
| **title (before)** | `Mary Ann` |
| **title (after)** | `Mary Ann（テスト）` |
| **album track count** | 8 (unchanged) |
| **G-18g2 track 7** | `Like a Lover（テスト）` on `discography-002` (unchanged) |

**Expected Ja-Jaaaaan! track list (DB + local HTML):**

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

## 2. Public reflection path (G-18h reuse)

| Step | Module | Role |
| --- | --- | --- |
| Convert input | `fixtures/gosaki-piano/discography.html` | Wix HTML source |
| Supabase read | `loadDiscographyTracksFromSupabase()` | read-only SELECT 34 rows |
| Group | `groupDiscographyTracksByLegacyId()` | per-album track arrays |
| Patch hook | `patchDiscographyItemTracks()` | Track List `<p>` titles per repeater item |
| Generator | `astro-generator.mjs` | applies patch on `/discography/` when `discographyDataSource=supabase` |
| Package | `build-gosaki-staging-admin-package.mjs` → `manual-upload:package` | local `public-dist/` |

**No hook code changes in G-19c** — G-19b1 Save updated DB; regen reads current `discography_tracks`.

---

## 3. Local package regen

```bash
cd /Users/toyamayusuke/sariswing-astro
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
```

**Pipeline:** convert → astro build → static-public **PASS** → manual-upload package **PASS** (27 files).

**Pre-regen local HTML (stale):** track 1 still `Mary Ann` (package from G-18h era).  
**Post-regen local HTML:** track 1 `Mary Ann（テスト）` — confirms reflection path.

---

## 4. Local HTML verification

**File:** `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html`

| Check | Pre-regen | Post-regen |
| --- | --- | --- |
| File size | 73,186 bytes | **73,201 bytes** (+15) |
| `Mary Ann（テスト）` | absent | **present** |
| `Mary Ann` (old track 1 only) | present | **absent** |
| `Like a Lover（テスト）` | present | **present** |
| Ja-Jaaaaan! track count | 8 | **8** |
| SKYLARK track 7 | `Like a Lover（テスト）` | **maintained** |
| `discographyDataSource=supabase` | present | **present** |

**CSS ref in HTML:** `_astro/index.YcHrHZH4.css` — **unchanged**  
**JS in `_astro/`:** `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` — **unchanged**

---

## 5. Upload preflight (G-19d — not executed)

| Item | Conclusion |
| --- | --- |
| **Minimal upload scope** | **1 file** — `public-dist/discography/index.html` only |
| **CSS re-upload** | **not required** — hash `YcHrHZH4` unchanged vs prior live package |
| **JS re-upload** | **not required** — hash `CTyGy8yS` unchanged |
| **Local source path** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html` |
| **Remote target path** | `/cms-kit-staging/gosaki-piano/discography/index.html` |
| **Staging URL (post-upload verify)** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/` |
| **mirror / sync / delete** | **FORBIDDEN** — single-file manual upload only (G-7f1 safety) |
| **FTP auto-apply** | **suspended** — operator manual upload per G-7g |

**Live pre-upload (read-only GET):**

| Check | Live (no G-19d upload yet) |
| --- | --- |
| `Mary Ann（テスト）` | **absent** |
| `Mary Ann` (old track 1) | **present** |
| `Like a Lover（テスト）` | **present** (G-18h-upload already live) |

---

## 6. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Save / DB write | **no** |
| rollback SQL | **no** |
| FTP / upload / mirror / sync / delete | **no** |
| deploy / workflow_dispatch | **no** |
| production / Sariswing | **no** |
| `service_role` | **no** |
| commit / push | **no** |

---

## 7. Next phase

`G-19d` — operator manual upload of `discography/index.html` (1 file) with explicit approval per G-7f1; HTTP verify `Mary Ann（テスト）` on staging; upload result doc.

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g19c-gosaki-discography-tracklist-public-reflection-local-regen-and-upload-preflight.mjs
```
