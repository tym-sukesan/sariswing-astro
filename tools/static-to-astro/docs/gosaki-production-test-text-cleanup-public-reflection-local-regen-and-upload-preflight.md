# G-20c — Gosaki production test text cleanup public reflection local regen and upload preflight

**Phase:** `G-20c-gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight`  
**Status:** **complete** — local package regen **succeeded**; production titles verified in generated HTML; minimal 1-file upload plan ready; **FTP/upload not executed**  
**Date:** 2026-07-01  
**Base commit:** `041f16c`  
**Prior:** [gosaki-production-test-text-cleanup-execution-result.md](./gosaki-production-test-text-cleanup-execution-result.md) (G-20b-execution)  
**Playbook:** [cms-kit-save-reflection-playbook.md](./cms-kit-save-reflection-playbook.md)  
**Reflection hook (reuse):** [gosaki-discography-g18h-public-tracks-reflection-preflight.md](./gosaki-discography-g18h-public-tracks-reflection-preflight.md)

| Check | Status |
| --- | --- |
| G-20b DB cleanup | **complete** |
| DB read-only afterSnapshot | **PASS** |
| `patchDiscographyItemTracks` hook (G-18h) | **reused** — no code change |
| Local package regen | **yes** — `build-gosaki-staging-admin-package.mjs` **PASS** |
| `Like a Lover` in local HTML (SKYLARK track 7) | **PASS** |
| `Mary Ann` in local HTML (Ja-Jaaaaan! track 1) | **PASS** |
| `Like a Lover（テスト）` in local HTML | **absent** |
| `Mary Ann（テスト）` in local HTML | **absent** |
| Ja-Jaaaaan! track count | **8** (unchanged) |
| SKYLARK track count | **8** (unchanged) |
| All 4 album track counts | **preserved** (9 / 8 / 9 / 8) |
| G-15c / G-15e / G-16b / G-17e scalar reflection | **maintained** |
| Live staging `/discography/` | **stale** — still test titles (G-19d upload; no G-20d yet) |
| CSS / JS hash vs prior package | **unchanged** |
| FTP / upload | **not executed** |

---

## Gates

```txt
gosakiProductionTestTextCleanupPublicReflectionLocalRegenComplete: true
gosakiProductionTestTextCleanupPublicReflectionUploadPreflightComplete: true
phase: G-20c-gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight
readyForG20dCleanupPublicReflectionUploadExecution: true
readyForG20eCleanupPublicReflectionUploadResultDoc: false
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
liveDiscographyReflectionPending: true
```

**Output artifacts:** under `tools/static-to-astro/output/` — **gitignored**. Not committed.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not re-run** G-20b cleanup SQL or re-Save closed tracklist chains.

---

## 1. DB afterSnapshot (read-only — verified)

| Check | Result |
| --- | --- |
| Staging host `kmjqppxjdnwwrtaeqjta` | **yes** |
| Production host `vsbvndwuajjhnzpohghh` | **not used** |
| `Like a Lover（テスト）` rows | **0** |
| `Mary Ann（テスト）` rows | **0** |
| Row A (`discography-002` / track 7) | `Like a Lover` |
| Row B (`discography-004` / track 1) | `Mary Ann` |
| `discography-002` track count | **8** |
| `discography-004` track count | **8** |
| Total `discography_tracks` | **34** |

**Expected Ja-Jaaaaan! track list (DB + local HTML):**

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

**Expected SKYLARK track 7:** `Like a Lover` (not `Like a Lover（テスト）`)

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

**No hook code changes in G-20c** — G-20b cleanup updated DB; regen reads current `discography_tracks`.

---

## 3. Local package regen

```bash
cd /Users/toyamayusuke/sariswing-astro
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
```

**Pipeline:** convert → astro build → static-public **PASS** → manual-upload package **PASS** (27 files).

**Convert summary:** `discographyDataSource=supabase` (4 releases, 34 track rows).  
**Pre-regen local HTML (stale):** G-19d era — still `Mary Ann（テスト）` / `Like a Lover（テスト）`.  
**Post-regen local HTML:** production titles — confirms G-20b DB cleanup reflection.

---

## 4. Local HTML verification

**File:** `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html`

| Check | Pre-regen (G-19d live era) | Post-regen (G-20c) |
| --- | --- | --- |
| File size | 73,201 bytes (G-19c reference) | **73,171 bytes** (−30) |
| `Mary Ann（テスト）` | present (live + prior package) | **absent** |
| `Like a Lover（テスト）` | present (live + prior package) | **absent** |
| `Mary Ann` (track 1) | absent in stale package | **present** |
| `Like a Lover` (track 7) | absent in stale package | **present** |
| Ja-Jaaaaan! track count | 8 | **8** |
| SKYLARK track count | 8 | **8** |
| `discographyDataSource=supabase` | present | **present** |

**CSS ref in HTML:** `_astro/index.YcHrHZH4.css` — **unchanged**  
**JS in `_astro/`:** `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` — **unchanged**

**Asset integrity:** CSS/JS files exist under `public-dist/_astro/`; HTML references resolve to packaged hashes above.

---

## 5. Upload preflight (G-20d — not executed)

| Item | Conclusion |
| --- | --- |
| **Minimal upload scope** | **1 file** — `public-dist/discography/index.html` only |
| **CSS re-upload** | **not required** — hash `YcHrHZH4` unchanged vs G-19c/G-19d live package |
| **JS re-upload** | **not required** — hash `CTyGy8yS` unchanged |
| **Local source path** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html` |
| **Remote target path** | `/cms-kit-staging/gosaki-piano/discography/index.html` |
| **Staging URL (post-upload verify)** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/` |
| **mirror / sync / delete** | **FORBIDDEN** — single-file manual upload only (G-7f1 safety) |
| **FTP auto-apply** | **suspended** — operator manual upload per G-7g |

**Live pre-upload (read-only GET):**

| Check | Live (no G-20d upload yet) |
| --- | --- |
| `Mary Ann（テスト）` | **present** (stale) |
| `Like a Lover（テスト）` | **present** (stale) |
| `Mary Ann` (plain track 1) | **absent** |
| `Like a Lover` (plain track 7) | **absent** |

---

## 6. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| SQL UPDATE / Save / DB write | **no** |
| rollback SQL | **no** |
| FTP / upload / mirror / sync / delete | **no** |
| deploy / workflow_dispatch | **no** |
| production / Sariswing | **no** |
| `service_role` | **no** |
| commit / push | **no** |

---

## 7. Next phases

| Phase | Scope |
| --- | --- |
| **G-20d** | Operator manual upload of `discography/index.html` (1 file) with explicit approval per G-7f1 |
| **G-20e** | Live HTTP verify + upload result recording (`Like a Lover` / `Mary Ann`; test titles absent) |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20c-gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.mjs
```
