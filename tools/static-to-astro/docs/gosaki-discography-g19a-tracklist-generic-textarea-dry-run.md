# G-19a — Gosaki Discography tracklist generic textarea dry-run expansion

**Phase:** `G-19a-gosaki-discography-tracklist-generic-textarea-dry-run`  
**Status:** **complete** — all 4 albums editable + generic diff Preview; **no DB write / Save / upload**  
**Date:** 2026-06-29  
**Base commit:** `8a64b12`  
**Prior:** [gosaki-discography-g18h-upload-result.md](./gosaki-discography-g18h-upload-result.md)

| Check | Status |
| --- | --- |
| G-18h upload chain | **closed** |
| All 4 albums textarea editable | **yes** |
| Generic tracklist diff Preview | **yes** — G-19a |
| G-18g2 Save adapter in codebase | **preserved** — chain **closed**, UI not invoked |
| DB write / Save | **no** |
| Package regen / FTP | **no** |

---

## Gates

```txt
gosakiDiscographyG19aTracklistGenericTextareaDryRunComplete: true
phase: G-19a-gosaki-discography-tracklist-generic-textarea-dry-run
readyForG19bTracklistSaveSlicePlanning: false
allAlbumsTextareaEditable: true
genericDryRunPreviewEnabled: true
actualWrite: false
saveAllowed: false
saveEnabled: false
g18g2SaveChainClosed: true
g18g2SaveUiInvoked: false
dbWriteExecuted: false
saveExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only.

**Current DB/public state (do not cleanup):** `discography-002` track 7 = `Like a Lover（テスト）`.

**Do not re-Save** G-18g2 track 7 without new approval.

---

## 1. Investigation — before G-19a

| Area | Before | Issue |
| --- | --- | --- |
| Textarea | `discography-002` only editable (`G18F_TARGET_LEGACY_ID`) | Other albums read-only |
| Preview (`discography-002`) | `executeG18g2TracklistTitleDryRun` | Single-title Save adapter, not generic diff |
| Preview (other albums) | Scalar field dry-run only | No tracklist diff |
| Parser / diff | `parseDiscographyTracklistTextarea` + `diffDiscographyTracklists` (G-18f) | Reusable for all albums |
| G-18g2 Save | Wired to Preview + Save on `discography-002` | Mixed with generic preview need |

---

## 2. Implementation — G-19a generic dry-run

### New modules

| Module | Role |
| --- | --- |
| `gosaki-discography-g19a-tracklist-generic-types.ts` | Album allowlist, counts, types, `G18G2_TRACKLIST_SAVE_CHAIN_CLOSED` |
| `gosaki-discography-g19a-tracklist-generic-dry-run-config.ts` | Config — Save always disabled |
| `gosaki-discography-g19a-tracklist-generic-dry-run.ts` | `executeG19aTracklistTextareaDryRun` |

### UI (`gosaki-staging-discography-admin-ui.ts`)

| Change | Detail |
| --- | --- |
| Textarea | **All 4 albums** `readOnly = false`; rows = `max(trackCount, 6)` |
| Preview | `isG19aTracklistAlbumLegacyId` → `executeG19aTracklistTextareaDryRun` |
| Preview (`discography-002`) | **No longer** routes to G-18g2 dry-run |
| Save button | Disabled for all tracklist albums — `G-19a dry-run only` |
| Save (`discography-002`) | **No longer** calls `runG18g2TracklistTitleSave` |
| G-18g2 adapter | `runG18g2TracklistTitleSave` **preserved** in file (not invoked) |

### Parser rules (unchanged from G-18f)

```txt
1 album = 1 textarea
1 line = 1 track
trim each line
skip empty lines
track_number / sort_order regenerated from line order (1..N)
```

### Diff categories

```txt
unchanged | changed | added | deleted | reordered
```

### Preview output fields

```txt
albumLegacyId, albumTitle, beforeCount, afterCount
changed, added, deleted, reordered
dryRun=true, actualWrite=false, saveAllowed=false
```

---

## 3. Album inventory (current DB)

| legacy_id | title | track count |
| --- | --- | --- |
| discography-001 | Continuous | **9** |
| discography-002 | SKYLARK | **8** (track 7 = `Like a Lover（テスト）`) |
| discography-003 | About Us!! | **9** |
| discography-004 | Ja-Jaaaaan! | **8** |
| **total** | | **34** |

---

## 4. G-18g2 special Save path separation

| Item | G-19a behavior |
| --- | --- |
| `executeG18g2TracklistTitleDryRun` | **Not called** from Preview |
| `runG18g2TracklistTitleSave` | **Not called** from Save button |
| `G18G2_TRACKLIST_SAVE_CHAIN_CLOSED` | `true` — execution complete (G-18g2 + G-18h) |
| Generic preview | **No DB write path** — `actualWrite: false`, `saveAllowed: false` |
| Re-Save track 7 | **Blocked** without new approval ID |

---

## 5. Known limitation (G-19a scope)

`discography-004` previously used scalar label dry-run on Preview. G-19a Preview is **tracklist-only** for all 4 albums. Label scalar Save path remains in codebase but is **not** reachable via Preview on tracklist albums until a future dual-preview phase (G-19b+).

---

## 6. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| DB write / Save | **no** |
| G-18g2 re-Save | **no** |
| Package regen / FTP | **no** |
| commit / push | **no** |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g19a-gosaki-discography-tracklist-generic-textarea-dry-run.mjs
```
