# G-18g2 — Gosaki Discography tracklist single-title Save adapter dry-run

**Phase:** `G-18g2-gosaki-discography-tracklist-single-title-save-dry-run`  
**Status:** **complete** — Save adapter dry-run implemented; **Save not executed**  
**Date:** 2026-06-29  
**Base commit:** `cf4d571`  
**Prior:** G-18g1-apply-result (`gosaki-discography-g18g1-apply-update-grant-result.md`)  
**Approval ID:** `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice`

| Check | Status |
| --- | --- |
| G-18g1 authenticated UPDATE grant | **applied** (operator) |
| Textarea UI (G-18f) retained | **yes** |
| Save adapter dry-run | **yes** |
| Guards for single-title PoC | **yes** |
| Gated actual write path | **implemented, disabled** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG18g2TracklistSingleTitleSaveDryRunComplete: true
phase: G-18g2-gosaki-discography-tracklist-single-title-save-dry-run
approvalId: G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice
envArm: PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED
readyForG18g2TracklistSingleTitleSaveFinalPreflight: true
readyForG18g2TracklistSingleTitleSaveExecution: false
saveEnabledDefault: false
dryRunDefault: true
actualWriteInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: cf4d571
origin/main: cf4d571
branch: main...origin/main
```

---

## 2. Target PoC

| Field | Value |
| --- | --- |
| Album | `discography-002` / SKYLARK |
| Track row id | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| track_number | 7 |
| before `title` | `Like a Lover` |
| after `title` | `Like a Lover（テスト）` |
| Input | textarea line 7 edit (G-18f UI) |

---

## 3. Implementation modules

| Module | Role |
| --- | --- |
| `gosaki-discography-g18g2-tracklist-title-save.ts` | dry-run + gated `executeG18g2TracklistTitleSave` |
| `gosaki-discography-g18g2-tracklist-title-guards.ts` | diff + fingerprint guards |
| `gosaki-discography-g18g2-tracklist-title-save-config.ts` | env arm / save gates |
| `gosaki-discography-g18g2-tracklist-title-types.ts` | constants + result types |
| `discography-tracks-write-types.ts` | approval ID registry |
| `gosaki-staging-discography-admin-ui.ts` | Preview UI for `discography-002` |

Reuses G-18f: `parseDiscographyTracklistTextarea`, `diffDiscographyTracklists`, textarea form field.

---

## 4. Guard conditions (all required for Save candidate)

```txt
albumLegacyId === discography-002
beforeCount === 8
afterCount === 8
changed.length === 1
added.length === 0
deleted.length === 0
reordered.length === 0
changed[0].track_number === 7
changed[0].before === Like a Lover
changed[0].after === Like a Lover（テスト）
target row id === fd58cd6e-2fff-4ff2-96af-3087c469450b
orderedTitleFingerprintBefore === expected before fingerprint
```

**Expected before fingerprint:**

```txt
On a Clear Day|My Blue Heaven|How Deep Is The Ocean|Skylark|Set Sail|What a Wonderful World|Like a Lover|The Water Is Wide
```

---

## 5. Dry-run Preview output (PoC textarea edit)

When operator edits line 7 and clicks Preview:

```txt
dryRun: true
actualWrite: false
wouldWrite: true
saveReadiness: ready_but_not_armed (default env)
saveAllowed: false
approvalId: G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice
targetTrackRowId: fd58cd6e-2fff-4ff2-96af-3087c469450b
before: Like a Lover
after: Like a Lover（テスト）
updatePayload: { "title": "Like a Lover（テスト）" }
rowsAffectedRequired: 1
```

---

## 6. WHERE guard (future actual write)

```sql
update public.discography_tracks
set title = 'Like a Lover（テスト）'
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b'
  and discography_legacy_id = 'discography-002'
  and track_number = 7
  and title = 'Like a Lover';
```

**Expected:** `rowsAffected === 1`

**Not executed in this phase.**

---

## 7. Rollback hint

```txt
Like a Lover（テスト） -> Like a Lover
```

---

## 8. Actual write gating

```txt
default: saveEnabled=false, saveAllowed=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true → never writes
PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=true required for Save
executeG18g2TracklistTitleSave implemented but not invoked by Cursor
```

---

## 9. G-18g1 grant prerequisite

G-18g1-apply-result recorded:

```txt
authenticated UPDATE on public.discography_tracks: present
anon write: absent
data unchanged at grant time
```

---

## 10. Next sequence

```txt
G-18g2-dry-run     — done (this doc)
G-18g2-preflight   — final preflight + rollback SQL
G-18g2-execution   — operator Save once (textarea track 7)
G-18h              — public tracks reflection
```

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18g2-gosaki-discography-tracklist-single-title-save-dry-run.mjs
```
