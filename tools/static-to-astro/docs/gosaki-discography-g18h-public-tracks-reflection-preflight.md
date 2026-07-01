# G-18h — Gosaki Discography public tracks reflection preflight

**Phase:** `G-18h-gosaki-discography-public-tracks-reflection-preflight`  
**Status:** **complete** — hook + local regen **succeeded**; `Like a Lover（テスト）` verified in generated HTML; **FTP/upload not executed**  
**Date:** 2026-06-29  
**Base commit:** `ab8dee3`  
**Prior:** [gosaki-discography-g18g2-tracklist-single-title-save-execution-result.md](./gosaki-discography-g18g2-tracklist-single-title-save-execution-result.md)  
**Playbook:** [cms-kit-save-reflection-playbook.md](./cms-kit-save-reflection-playbook.md)

| Check | Status |
| --- | --- |
| G-18g2 Save (`discography-002` track 7 title) | **complete** |
| `patchDiscographyItemTracks` in hook | **yes** |
| Supabase `discography_tracks` read (34 rows) | **yes** |
| Local package regen | **yes** — convert + static-public + manual-upload **PASS** |
| SKYLARK track 7 in local HTML | **PASS** — `Like a Lover（テスト）` |
| Old track 7 title only | **absent** in local HTML |
| All 4 album track counts | **preserved** (9 / 8 / 9 / 8) |
| G-15c / G-15e / G-16b / G-17e scalar reflection | **maintained** |
| Live staging `/discography/` | **unchanged** — still `Like a Lover` (no upload) |
| FTP / upload | **not executed** |

---

## Gates

```txt
gosakiDiscographyG18hPublicTracksReflectionPreflightComplete: true
phase: G-18h-gosaki-discography-public-tracks-reflection-preflight
readyForG18hPublicTracksReflectionUploadPreflight: true
readyForG18hPublicTracksReflectionUploadExecution: false
packageRegenExecuted: true
publicReflectionUploaded: false
stagingLiveChanged: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
skylarkPurchaseUrlReflectionMaintained: true
aboutUsArtistReflectionMaintained: true
continuousArtistReflectionMaintained: true
jaJaaaaanLabelReflectionMaintained: true
```

**Output artifacts:** under `tools/static-to-astro/output/` — **gitignored**. Not committed.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. DB after-state (G-18g2 Save — reference)

| Field | Value |
| --- | --- |
| **album** | `discography-002` / SKYLARK |
| **track row** | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| **track_number** | 7 |
| **title (before)** | `Like a Lover` |
| **title (after)** | `Like a Lover（テスト）` |
| **album track count** | 8 (unchanged) |
| **total `discography_tracks` rows** | 34 |

**Expected SKYLARK track list:**

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

## 2. Public reflection path (investigation)

| Step | Module | Role |
| --- | --- | --- |
| Convert input | `fixtures/gosaki-piano/discography.html` | Wix HTML source |
| Supabase read | `loadGosakiDiscographyDataForBuild()` | `discography` + `discography_tracks` (anon) |
| Patch hook | `patchGosakiDiscographySupabaseFields()` | scalars + tracks per repeater item |
| Track patch | `patchDiscographyItemTracks()` | Track List `<p class="font_8">` titles within item bounds |
| Generator | `astro-generator.mjs` | applies patch on `/discography/` when `discographyDataSource=supabase` |
| Package | `build-gosaki-staging-admin-package.mjs` → `manual-upload:package` | local `public-dist/` |

**Tracks source before G-18h:** Wix fixture HTML only (static crawl). Scalar fields (`purchase_url`, `artist`, `label`) already patched from Supabase; track titles were **not** patched.

**Wix Track List markup:** heading paragraph `Track List`, then one `<p class="font_8 …">` per track title (not `<ul><li>`). Block ends at `Personnel` or `Release`.

---

## 3. Hook implementation (G-18h)

**File:** `scripts/lib/supabase-discography-read.mjs`

| Change | Detail |
| --- | --- |
| `DISCOGRAPHY_TRACKS_SELECT` | `id,discography_legacy_id,track_number,title,sort_order` |
| `loadDiscographyTracksFromSupabase` | read-only SELECT all rows, order by legacy_id + sort_order |
| `groupDiscographyTracksByLegacyId` | group + sort per album |
| `patchDiscographyItemTracks` | replace track title text in Track List paragraphs when DB count matches HTML count |
| `loadGosakiDiscographyDataForBuild` | returns `tracks`, `tracksByLegacyId`, `trackRowCount` |
| `patchGosakiDiscographySupabaseFields` | after scalar patches, apply tracks per `row.legacy_id`; records `trackPatches` |

**File:** `scripts/lib/astro-generator.mjs`

| Change | Detail |
| --- | --- |
| Pass `tracksByLegacyId` into patch call | from `gosakiDiscographyBundle` |
| Summary log | `trackPatchCount`, `trackRowCount` |

**Convert log (this regen):** `discographyDataSource=supabase (4 releases, 1 purchase_url + 4 artist + 1 label + 1 track patch(es); 34 track rows)`

Only SKYLARK required a title change; other albums matched DB already → no paragraph edits.

---

## 4. Local package regen

```bash
cd /Users/toyamayusuke/sariswing-astro
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
```

**Pipeline:** convert → astro build → static-public **PASS** → manual-upload package **PASS** (27 files).

---

## 5. Local HTML verification

**File:** `output/manual-upload/gosaki-piano/public-dist/discography/index.html` (73,186 bytes)

| Check | Local |
| --- | --- |
| `discographyDataSource=supabase` | **present** |
| `Like a Lover（テスト）` | **present** |
| `Like a Lover` without `（テスト）` | **absent** |
| SKYLARK track count | **8** |
| Continuous track count | **9** |
| About Us!! track count | **9** |
| Ja-Jaaaaan! track count | **8** |
| Scalar reflection (purchase_url / artist / label) | **maintained** |

---

## 6. Upload candidate files

| File | Notes |
| --- | --- |
| `public-dist/discography/index.html` | **required** — track 7 title change (+10 bytes vs prior local) |
| `public-dist/_astro/index.YcHrHZH4.css` | unchanged hash `YcHrHZH4` (same as live staging ref name) |
| `public-dist/_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | unchanged |

**CSS/JS hash changed:** **no** — upload scope may be `discography/index.html` only if operator confirms live `_astro/` already matches.

**Remote target (next phase only):** `/cms-kit-staging/gosaki-piano/discography/index.html`

---

## 7. Staging live (read-only GET — unchanged)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

| Check | Live (post-G-18h, no upload) |
| --- | --- |
| `Like a Lover（テスト）` | **absent** |
| `Like a Lover` (old track 7) | **present** |
| Upload executed | **no** |

---

## 8. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| DB write / Save | **no** |
| rollback SQL | **no** |
| FTP / upload | **no** |
| deploy / workflow_dispatch | **no** |
| production / Sariswing | **no** |
| `service_role` | **no** |
| commit / push | **no** |

---

## 9. Next phase

`G-18h-upload` — operator manual upload of `discography/index.html` (and `_astro/` only if needed) with explicit FTP approval per G-7f1 safety rules.

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18h-gosaki-discography-public-tracks-reflection-preflight.mjs
```
