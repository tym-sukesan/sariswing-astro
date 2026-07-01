# G-19b — Gosaki Discography tracklist Save slice planning

**Phase:** `G-19b-gosaki-discography-tracklist-save-slice-planning`  
**Status:** **complete** — planning only; **no Save, GRANT, or DB write**  
**Date:** 2026-06-29  
**Base commit:** `e798a94`  
**Prior:** [gosaki-discography-g19a-tracklist-generic-textarea-dry-run.md](./gosaki-discography-g19a-tracklist-generic-textarea-dry-run.md)

| Check | Status |
| --- | --- |
| G-19a generic diff Preview (4 albums) | **complete** — commit `8c85f53` |
| G-19a local UI QA | **PASS** (31/31) |
| G-18g2 Save chain | **closed** — track 7 = `Like a Lover（テスト）` |
| G-18h public reflection + upload | **closed** |
| Save slice options compared | **yes** |
| First generic Save slice selected | **yes** — G-19b1 |
| Guard / rollback / reflection separation | **yes** |
| Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG19bTracklistSaveSlicePlanningComplete: true
phase: G-19b-gosaki-discography-tracklist-save-slice-planning
readyForG19b1TracklistGenericSingleTitleSaveImplementation: true
readyForG19b1TracklistGenericSingleTitleSaveExecution: false
readyForG19cTracklistPublicReflectionAfterG19b1: false
firstGenericSaveSlice: G-19b1-discography-004-track-1-title-change
saveScopeFirstSlice: changed-only-single-row-title-update
allAlbumsSaveInOnePhase: false
g18g2SaveChainClosed: true
discography002Track7DoNotReSave: true
dbWriteExecutedInThisPhase: false
saveExecutedInThisPhase: false
grantExecutedInThisPhase: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Closed chains — do not re-Save / re-upload:**
- `discography-002` / track 7 `title` (G-18g2 + G-18h-upload)
- Scalar chains: `discography-001` artist, `discography-002` purchase_url, `discography-003` artist, `discography-004` label

---

## 1. Investigation — current implementation

### 1.1 G-19a generic diff (complete)

| Component | Role |
| --- | --- |
| `executeG19aTracklistTextareaDryRun` | All 4 albums; parse + diff; `actualWrite=false`, `saveAllowed=false` |
| `parseDiscographyTracklistTextarea` | trim; skip empty lines; line → `track_number` / `sort_order` |
| `diffDiscographyTracklists` | `changed` / `added` / `deleted` / `reordered` / `unchanged` |
| `gosaki-staging-discography-admin-ui.ts` | All albums textarea editable; Preview → G-19a only; Save disabled |

### 1.2 G-18g2 single-title Save adapter (closed)

| Item | State |
| --- | --- |
| Scope | `discography-002` track 7 only |
| Operation | 1× `title` UPDATE via anon client |
| Guards | Hardcoded diff + fingerprint + row pin |
| Chain | **closed** — current DB/public = `Like a Lover（テスト）` |
| UI | Preserved in codebase; **not invoked** after G-19a |

**Reuse for G-19b:** write path pattern (`executeG18g2TracklistTitleSave` → `.from("discography_tracks").update(...).eq(...)`), not G-18g2 hardcoded slice constants.

### 1.3 `discography_tracks` write prerequisites (known)

| Item | Status |
| --- | --- |
| Rows | 34 (9 / 8 / 9 / 8) |
| `authenticated` UPDATE grant | **applied** (G-18g1-apply) |
| `service_role` | **not used** |
| `updated_at` column | **none** |
| INSERT / DELETE grant | **not applied** — assume absent until preflight |

### 1.4 G-18h public reflection path (exists — separate gate)

| Item | Detail |
| --- | --- |
| Hook | `patchDiscographyItemTracks()` in `supabase-discography-read.mjs` |
| Build | `loadGosakiDiscographyDataForBuild()` → 34 track rows |
| Upload | Operator manual — `discography/index.html` (G-18h-upload) |
| **G-19b rule** | **Do not** combine Save execution with package regen / upload |

---

## 2. G-19b Save strategy

### 2.1 Design principle

```txt
G-19a UI (all albums) → generic diff Preview (dry-run)
G-19b+ Save slices → one album + one diff category + one approval ID per execution phase
Long-term target → G-18g Option 2 (diff → planned row ops), delivered as thin slices
```

**Not in scope for first slices:** all-4-album Save, unguarded full textarea replace, DELETE+re-INSERT album wipe.

### 2.2 Album scope policy

| Policy | Verdict |
| --- | --- |
| All 4 albums Save at once | **No** — too wide; one failure mode per phase |
| **1 album per Save slice** | **Yes** — recommended |
| `discography-002` as first generic slice | **No** — G-18g2/G-18h closed chain; track 7 test state |
| **`discography-004` as first generic slice** | **Yes** — no tracklist Save history; 8 tracks |

### 2.3 Diff category rollout (recommended sequence)

| Slice | Album | Allowed diff | SQL ops | Risk |
| --- | --- | --- | --- | --- |
| **G-19b1** | `discography-004` | `changed` only; `length === 1`; title field | 1× UPDATE | **Low** |
| G-19b2 | TBD (e.g. `discography-001`) | `changed` only; `length <= N` | N× UPDATE | Medium |
| G-19b3 | TBD | `added` only | INSERT (+ grant preflight) | **High** |
| G-19b4 | TBD | `deleted` only | DELETE (+ grant preflight) | **High** |
| G-19b5 | TBD | `reordered` | multi-row UPDATE `track_number`/`sort_order` | **High** |
| G-19b6 | per album | combined categories | mixed | **High** — after singles proven |

**G-19b planning fixes G-19b1 only.** Later slices are named for sequence; not designed in detail here.

---

## 3. Recommended first Save slice — G-19b1

### 3.1 Target

| Field | Value |
| --- | --- |
| Album | `discography-004` / Ja-Jaaaaan! |
| Track | `track_number` **1** |
| Row `id` | `04e987a9-e251-4b0b-b860-21a61e711f8e` |
| **before `title`** | `Mary Ann` |
| **after `title`** | `Mary Ann（テスト）` |
| Input path | G-19a textarea (line 1 edit) |
| **approvalId (proposed)** | `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice` |
| **env arm (proposed)** | `PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED=true` |

### 3.2 Why G-19b1 / discography-004 / track 1

| Reason | Detail |
| --- | --- |
| Proves G-19a → Save path | Generic diff guards, not G-18g2 hardcoded slice |
| Avoids closed chain | Does not touch `discography-002` track 7 |
| Reversible | Single-row title suffix; rollback SQL trivial |
| Grant ready | UPDATE grant already on staging |
| Low blast radius | 1 row / 1 album / 34 total unchanged |

### 3.3 Why not other albums first

| Album | Blocker / note |
| --- | --- |
| `discography-002` | G-18g2 + G-18h closed; track 7 must stay `Like a Lover（テスト）` |
| `discography-001` | Valid for **G-19b2**; 9 tracks — slightly wider fingerprint |
| `discography-003` | Valid for later slice; artist scalar chain closed (unrelated to tracks) |

---

## 4. Allowed change range — G-19b1

```txt
diff.changed.length === 1
diff.added.length === 0
diff.deleted.length === 0
diff.reordered.length === 0
beforeCount === 8
afterCount === 8
changed[0].track_number === 1
changed[0].before === 'Mary Ann'
changed[0].after === 'Mary Ann（テスト）'
changedFields: ['title'] only
operation: UPDATE only
rowsAffectedRequired: 1
no track_number / sort_order / discography_legacy_id mutation
```

**Explicitly forbidden in G-19b1:**
- INSERT / DELETE / UPSERT
- Multi-row title changes
- Any edit on albums other than `discography-004`
- Re-Save `discography-002` track 7
- `service_role`

---

## 5. Guard design — G-19b1

### 5.1 Album fingerprint / count guards

```txt
discography_legacy_id === 'discography-004'
expectedBeforeTrackCount === 8
expectedAfterTrackCount === 8
orderedTitleFingerprintBefore === pipe-separated titles from DB snapshot at Preview load
```

**Fingerprint (baseline at planning time):**

```txt
Mary Ann|Nearer My God To Thee|Shreveport Stomp|A Fool Such As I|Si Tu Vois Ma Mere|St. Phillip Street Break Down|Girl Of My Dream|Bourbon Street Parade
```

Implementation: `tracks.sort(by track_number).map(t => t.title).join("|")` — same as G-18g2 `buildOrderedTitleFingerprint`.

**Stale check:** re-SELECT album tracks immediately before Save; fingerprint must match Preview baseline → else block Save.

### 5.2 Row pin (optimistic lock equivalent)

`discography_tracks` has **no `updated_at`**. G-19b1 uses composite pin (same as G-18g2):

```txt
WHERE id = '04e987a9-e251-4b0b-b860-21a61e711f8e'
  AND discography_legacy_id = 'discography-004'
  AND track_number = 1
  AND title = 'Mary Ann'   -- before title
```

**Defer** `updated_at` trigger migration until multi-row / reorder slices (G-19x).

### 5.3 UI / env guards

```txt
ENABLE_ADMIN_STAGING_WRITE=true (operator dev only)
PUBLIC_ADMIN_WRITE_DRY_RUN=false (execution phase only)
PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED=true
staging auth signed-in
hostGatePassed + projectAllowlistPassed
G-19a Preview ok immediately before Save
single-arm: G-19b1 arm must not coexist with any other tracklist Save arm
G18G2_TRACKLIST_SAVE_CHAIN_CLOSED remains true — G-18g2 UI not re-armed
```

### 5.4 G-19a vs G-19b1 UI separation

| Album | Preview | Save |
| --- | --- | --- |
| `discography-001`–`003`, `004` (default) | G-19a generic dry-run | **disabled** until that album's slice |
| `discography-004` (G-19b1 armed) | G-19b1 dry-run Save preview (extends G-19a diff + write plan) | **enabled** when gates pass |
| `discography-002` | G-19a generic dry-run | **always disabled** (G-18g2 closed) |

---

## 6. Rollback方針（doc-only — not executed）

```sql
-- staging only; operator approval; G-19b1-execution rollback template
update public.discography_tracks
set title = 'Mary Ann'
where id = '04e987a9-e251-4b0b-b860-21a61e711f8e'
  and discography_legacy_id = 'discography-004'
  and track_number = 1
  and title = 'Mary Ann（テスト）';
-- expect rows affected: 1
```

**G-19b planning:** rollback SQL **not executed**.

---

## 7. Public reflection separation

| Phase | Scope | Trigger |
| --- | --- | --- |
| **G-19b1-execution** | DB `discography_tracks` UPDATE only | Operator Save once |
| **G-19c** | Local `patchDiscographyItemTracks` regen | **After** G-19b1 Save success |
| **G-19d** | Operator upload `discography/index.html` | **After** G-19c local verify |

**Rule:** Save success does **not** auto-trigger package regen, FTP, or `workflow_dispatch`.

**G-18h playbook reuse:** `npm run manual-upload:package` → operator upload — separate approval per upload.

---

## 8. Risk classification

### 8.1 Low-risk (this phase)

| Item |
| --- |
| G-19b planning doc + verifier |
| Codebase investigation (read-only) |
| AI context update |
| Rollback SQL template (doc-only) |

### 8.2 High-risk — DB write / Save (future G-19b1 phases)

| Item | Gate |
| --- | --- |
| G-19b1 implementation | No execution in planning |
| G-19b1-preflight | beforeSnapshot / rollback doc |
| G-19b1-execution | Operator Save **once**; explicit approval ID |
| GRANT changes | **Not expected** — UPDATE exists; INSERT/DELETE need separate phases |

### 8.3 High-risk — public reflection / upload (future G-19c+)

| Item | Gate |
| --- | --- |
| Package regen | G-19c only |
| FTP / manual upload | G-19d only; operator approval |
| Live staging change | HTTP verify after upload |

---

## 9. Proposed implementation modules (G-19b1 — not this phase)

| Module | Role |
| --- | --- |
| `gosaki-discography-g19b1-tracklist-generic-single-title-types.ts` | Slice constants + approval ID |
| `gosaki-discography-g19b1-tracklist-generic-title-guards.ts` | Parameterized diff + fingerprint guards |
| `gosaki-discography-g19b1-tracklist-generic-single-title-save.ts` | Dry-run Save preview + `executeG19b1...Save` |
| `gosaki-discography-g19b1-tracklist-generic-single-title-save-config.ts` | env arm / Save gate |
| Extend `discography-tracks-write-types.ts` | Register G-19b1 approval ID |
| `gosaki-staging-discography-admin-ui.ts` | G-19b1 armed Save on `discography-004` only; G-19a elsewhere |

**Reuse:** `parseDiscographyTracklistTextarea`, `diffDiscographyTracklists`, `buildOrderedTitleFingerprint`, G-18g2 UPDATE client pattern.

---

## 10. Proposed sequence

```txt
G-19a   generic textarea dry-run (4 albums) — done
G-19b   Save slice planning — done (this doc)
G-19b1  generic single-title Save implementation (discography-004 track 1)
G-19b1-preflight  beforeSnapshot / rollback / dev arm doc
G-19b1-execution  operator Save once
G-19c   public tracks reflection after G-19b1 Save
G-19d   operator upload preflight + execution
G-19b2+ further slices (multi-change / other albums / add / delete / reorder)
```

---

## 11. Planning judgments

| # | Question | Answer |
| --- | --- | --- |
| A | Proceed to G-19b1 implementation? | **Yes** — after this planning commit |
| B | First slice album? | **`discography-004`** only |
| C | Allow add/delete/reorder in first slice? | **No** — changed-only single title |
| D | Add `updated_at` before first generic Save? | **No** — composite fingerprint + row pin |
| E | Combine Save with public reflection? | **No** — G-19c+ separate |
| F | Re-open G-18g2 on `discography-002`? | **No** — chain closed |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g19b-gosaki-discography-tracklist-save-slice-planning.mjs
```
