# G-18f — Gosaki Discography tracklist textarea diff dry-run

**Phase:** `G-18f-gosaki-discography-tracklist-textarea-diff-dry-run`  
**Status:** **complete** — read / parse / diff / Preview only; **no Save or DB write**  
**Date:** 2026-06-29  
**Base commit:** `52b22c0`  
**Prior:** G-18e (`gosaki-discography-g18e-tracks-title-edit-save-slice-planning.md`)

| Check | Status |
| --- | --- |
| Album-level textarea UI | **yes** (`discography-002` editable) |
| Parser (newline / trim / skip empty) | **yes** |
| Diff Preview (unchanged / changed / added / deleted / reordered) | **yes** |
| DB write / Save | **no** |
| Public reflection | **no** |

---

## Gates

```txt
gosakiDiscographyG18fTracklistTextareaDiffDryRunComplete: true
phase: G-18f-gosaki-discography-tracklist-textarea-diff-dry-run
readyForG18gTracklistTextareaSaveAdapterPlanning: true
targetAlbumLegacyId: discography-002
targetAlbumTitle: SKYLARK
targetTrackCount: 8
textareaUiDirectionRecorded: true
dryRun: true
actualWrite: false
saveEnabled: false
dbWriteEnabled: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
publicReflectionImplemented: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only.

---

## 1. UI direction (from G-18e refinement)

| Approach | Verdict |
| --- | --- |
| Album-level multiline textarea (1 line = 1 track) | **Implemented** for `discography-002` |
| 34 fixed inputs | **Not used** |
| Per-track fixed form as primary UI | **Not used** |
| Single-row title edit as primary route | **Not used** |

**Admin URL:** `http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/`

- Default selected album: `discography-002` / SKYLARK
- Track List textarea: **8 lines** from DB `discography_tracks`
- `discography-002` only: textarea **editable**; other albums read-only
- Save button: **disabled** (G-18f tracklist Save 無効)
- Preview: existing「変更を確認」button → G-18f diff dry-run

---

## 2. Target album

| Field | Value |
| --- | --- |
| `discography_legacy_id` | `discography-002` |
| Album title | SKYLARK |
| DB track count | **8** |

### Current DB tracks (staging)

| # | title |
| ---: | --- |
| 1 | On a Clear Day |
| 2 | My Blue Heaven |
| 3 | How Deep Is The Ocean |
| 4 | Skylark |
| 5 | Set Sail |
| 6 | What a Wonderful World |
| 7 | Like a Lover |
| 8 | The Water Is Wide |

---

## 3. Parser rules

| Rule | Behavior |
| --- | --- |
| Split | `\n` (normalize `\r\n` → `\n`) |
| Trim | `trim()` each line |
| Empty lines | **Skip** |
| `track_number` / `sort_order` | Regenerate 1..N from line order |

**Module:** `src/lib/admin/staging-write/discography-tracklist-textarea-parse.ts`

---

## 4. Diff categories

| Category | Meaning |
| --- | --- |
| `unchanged` | Same title at same position |
| `changed` | Title edit at position N |
| `added` | New line vs DB count |
| `deleted` | DB row with no matching line at tail |
| `reordered` | Same title, different position |

**Module:** `src/lib/admin/staging-write/discography-tracklist-diff.ts`

---

## 5. Dry-run result shape

### No changes (initial load → Preview)

```json
{
  "ok": true,
  "dryRun": true,
  "actualWrite": false,
  "albumLegacyId": "discography-002",
  "beforeCount": 8,
  "afterCount": 8,
  "changed": [],
  "added": [],
  "deleted": [],
  "reordered": [],
  "wouldWrite": false
}
```

### One title change (example — not persisted)

```json
{
  "dryRun": true,
  "actualWrite": false,
  "wouldWrite": true,
  "changed": [
    {
      "track_number": 7,
      "before": "Like a Lover",
      "after": "Like a Lover [textarea dry-run]"
    }
  ]
}
```

**approvalId:** `G-18f-gosaki-discography-tracklist-textarea-diff-dry-run`

---

## 6. Guards

| Guard | Value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | must be `true` (routine default) |
| `actualWrite` | always `false` |
| `saveEnabled` | `false` |
| DB write path | **none** |
| UPDATE / INSERT / DELETE | **none** |
| Target scope | `discography-002` only for G-18f tracklist diff |

---

## 7. Implementation files

| File | Role |
| --- | --- |
| `discography-tracklist-textarea-parse.ts` | Parse textarea → track lines |
| `discography-tracklist-diff.ts` | DB vs parsed diff |
| `gosaki-discography-g18f-tracklist-types.ts` | Types / constants |
| `gosaki-discography-g18f-tracklist-dry-run-config.ts` | Config (Save off) |
| `gosaki-discography-g18f-tracklist-page-config.ts` | SSR page config bridge |
| `gosaki-discography-g18f-tracklist-textarea-dry-run.ts` | Dry-run executor |
| `gosaki-staging-discography-admin-ui.ts` | UI wiring + Preview render |
| `AdminGosakiStagingDiscographyOperatorPage.astro` | Textarea + G-18f config DOM |

---

## 8. Next phase

```txt
G-18g  textarea Save adapter planning (one album; diff plan + guards)
G-18f-grant  discography_tracks GRANT preflight (parallel)
```

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18f-gosaki-discography-tracklist-textarea-diff-dry-run.mjs
```
