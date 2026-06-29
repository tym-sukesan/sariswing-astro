# G-18e — Gosaki Discography tracks title-edit Save slice planning

**Phase:** `G-18e-gosaki-discography-tracks-title-edit-save-slice-planning`  
**Status:** **complete** — planning + **G-18e refinement** (textarea UI direction); **no Save or DB write**  
**Date:** 2026-06-29 (refinement: operator UI policy)  
**Base commit:** `d6d5039`  
**Prior:** G-18d-result (`gosaki-discography-g18d-tracks-sql-execution-result.md`)

| Check | Status |
| --- | --- |
| Staging `discography_tracks` SELECT (34 rows) | **yes** |
| Seed / fixture / public title comparison | **yes** |
| Natural title-edit candidate | **none** — album-level textarea UI recommended |
| Save design options documented | **yes** |
| Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG18eTracksTitleEditSaveSlicePlanningComplete: true
gosakiDiscographyG18eTextareaUiDirectionRecorded: true
phase: G-18e-gosaki-discography-tracks-title-edit-save-slice-planning
readyForG18fTracklistTextareaDiffDryRun: true
readyForG18gTracklistTextareaSaveAdapterPlanning: false
readyForG18fTracksTitleEditDryRunImplementation: false
singleRowTitlePocPrimaryUi: false
naturalTitleCorrectionCandidateFound: false
saveImplementedInThisPhase: false
dbWriteExecutedInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
publicReflectionImplemented: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. G-18d context

| Item | Value |
| --- | --- |
| `discography_tracks` rows | **34** |
| Per-album counts | 9 / 8 / 9 / 8 |
| `track_number` = `sort_order` | **yes** (all rows) |
| Seed / fixture / public alignment | **match** |
| Public `/discography/` | Still Wix HTML — **not** DB-generated |
| Scalar Save chains | **closed** — do not re-open |

---

## 2. Tracks inventory (staging SELECT — 2026-06-29)

### Album summary

| legacy_id | album title | tracks | track_number range |
| --- | --- | ---: | --- |
| discography-001 | Continuous | 9 | 1–9 |
| discography-002 | SKYLARK | 8 | 1–8 |
| discography-003 | About Us!! | 9 | 1–9 |
| discography-004 | Ja-Jaaaaan! | 8 | 1–8 |

### Full inventory (34 rows)

| legacy_id | # | sort | title | id (uuid) |
| --- | ---: | ---: | --- | --- |
| discography-001 | 1 | 1 | Nature Boy | 84a3fae9-896e-4c17-8b21-ddf4a1e17df3 |
| discography-001 | 2 | 2 | Waters Of March | 62c08f32-be43-45c7-9444-ee437aab8fa2 |
| discography-001 | 3 | 3 | With a Song In My Heart | b19e59cc-9b5f-4d73-9fbe-31243a747878 |
| discography-001 | 4 | 4 | Here Comes The Sun | 6f9ea84a-0280-4a2f-a42c-95c6938b4363 |
| discography-001 | 5 | 5 | Ain't She Sweet | 36ca2fff-852c-4d7b-aff9-a5a0366787fd |
| discography-001 | 6 | 6 | Boplicity | 8d819320-03f1-4648-80df-8db79e8ac08e |
| discography-001 | 7 | 7 | Double Rainbow | dcccf68b-0126-4c5e-962a-b8dfec0e3d10 |
| discography-001 | 8 | 8 | Verrazano Moon | 1ad3602b-84c4-467c-98f8-b3ce7f9a89db |
| discography-001 | 9 | 9 | Continuous | 232dbc39-9499-417a-8d5e-dcc7fafe821b |
| discography-002 | 1 | 1 | On a Clear Day | e30c5ea9-2857-492b-8a78-58cbfcbe7929 |
| discography-002 | 2 | 2 | My Blue Heaven | 9e569719-0f97-44de-8108-59f43fc066e7 |
| discography-002 | 3 | 3 | How Deep Is The Ocean | 31c255c0-aff7-4a25-9b56-21af87221f9f |
| discography-002 | 4 | 4 | Skylark | 2b92b102-5029-4ec4-a216-339aa0f67dab |
| discography-002 | 5 | 5 | Set Sail | 7046cf12-859c-46b4-8741-9b852102ff84 |
| discography-002 | 6 | 6 | What a Wonderful World | c5c4abd4-9ad1-4403-ad0f-2d1c2c554304 |
| discography-002 | 7 | 7 | Like a Lover | fd58cd6e-2fff-4ff2-96af-3087c469450b |
| discography-002 | 8 | 8 | The Water Is Wide | 826d9e4f-0bf6-4f72-b814-a2b97ffddc1c |
| discography-003 | 1 | 1 | 白玉Bluse | f19cb2e2-8f73-4441-9a4c-463b0e7688d7 |
| discography-003 | 2 | 2 | The Lady Is A Tramp | bbb53529-0a23-499d-9254-f67e24b72527 |
| discography-003 | 3 | 3 | Honeysuckle Rose | 38c4ff25-894c-47c9-9554-293b1529fbe2 |
| discography-003 | 4 | 4 | Darn That Dream | 9720944b-b6a3-4a44-9f30-ac978a7bb94f |
| discography-003 | 5 | 5 | The Old Country | 150ceba3-a81b-4014-b061-22aa79116088 |
| discography-003 | 6 | 6 | The Sweetest Sounds | 5ed7178e-b3ed-477e-bff6-80bf01ccfb23 |
| discography-003 | 7 | 7 | The Look Of Love | 138da109-ae17-4325-be65-8dc037bf310c |
| discography-003 | 8 | 8 | Samba De Cafe Terrasse | 911f7e0f-7925-452d-bd32-f4d03847b46b |
| discography-003 | 9 | 9 | I'd Climb The Highest Mountain | 006443c7-a6eb-4294-abf3-f931ab4c0b20 |
| discography-004 | 1 | 1 | Mary Ann | 04e987a9-e251-4b0b-b860-21a61e711f8e |
| discography-004 | 2 | 2 | Nearer My God To Thee | 86747d7b-0db3-4792-a7a4-216e62157e8b |
| discography-004 | 3 | 3 | Shreveport Stomp | 174486e6-3c04-4350-b184-346d16b881f3 |
| discography-004 | 4 | 4 | A Fool Such As I | fc7b1577-1cf2-438e-9c15-5e133f861f99 |
| discography-004 | 5 | 5 | Si Tu Vois Ma Mere | aeda17f8-83c3-4a5c-b12d-87e59ee515b5 |
| discography-004 | 6 | 6 | St. Phillip Street Break Down | 0b731df0-013c-4be1-991c-0c6e4cc19291 |
| discography-004 | 7 | 7 | Girl Of My Dream | f1e56c54-bc6e-4b61-aea8-01353d014fbc |
| discography-004 | 8 | 8 | Bourbon Street Parade | 8c70d336-a343-480e-a8c6-9fd56b46c2e8 |

**Schema (unchanged from G-18d):** `id` uuid PK; **no `updated_at`**; no UNIQUE on `(discography_legacy_id, track_number)` observed at G-18d Step 1.

---

## 3. Title-edit candidate classification

### 3.1 Natural correction candidates — **none**

| Title | Notes | Verdict |
| --- | --- | --- |
| 白玉Bluse | Identical in DB, seed, admin JSON, fixture, public (Wix spelling) | **defer** — not a proven typo |
| St. Phillip Street Break Down | Same across all sources | **defer** |
| Girl Of My Dream | Same across all sources (singular) | **defer** |
| Other 31 titles | Match seed/fixture/public | **no diff** |

**Rule applied:** No title change proposed without authoritative source contradicting current SoT. Suspected typos that are **consistent on Wix/public** are not Save targets.

### 3.2 Single-row title PoC — **internal adapter reference only (not primary UI)**

| Field | Value |
| --- | --- |
| Album | discography-002 / SKYLARK |
| Track row | `track_number` **7** |
| Row `id` | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| **before** | `Like a Lover` |
| **after (example)** | `[CMS Kit staging] G-18f track title PoC` |

**Status after G-18e refinement:** Retained as a **minimal `discography_tracks` UPDATE adapter spike** reference only. **Not** the recommended operator UI or first Save slice. Final UX is **album-level multiline textarea** (§4).

### 3.3 Options not selected (natural correction path)

| Option | Reason |
| --- | --- |
| **B — public patch first** | Save path unproven; patch without SoT edit is premature |
| **C — defer to price/personnel** | Tracks CMS path now unblocked; textarea diff dry-run is bounded next step |

---

## 4. Operator UI direction — album-level multiline textarea (G-18e refinement)

### 4.1 Recommended UI

| Approach | Verdict |
| --- | --- |
| **Album-level multiline textarea** (1 textarea per selected album) | **Recommended** |
| 34 fixed single-line inputs | **Not recommended** |
| Per-track fixed form as primary UI | **Not recommended** |

**Existing admin binding:** `gosaki-staging-discography-admin-ui.ts` already loads `snapshot.tracks` into a `tracks` textarea (`join("\n")`) — **read-only for Save today**. G-18f extends this toward diff Preview.

### 4.2 Input model

```txt
1 line = 1 track title (after parse)
Copy/paste friendly (plain newline-separated list)
Example (discography-001):

Nature Boy
Waters Of March
With a Song In My Heart
...
```

### 4.3 Parse rules (planning — implement in G-18f)

| Rule | Behavior |
| --- | --- |
| Line split | `\n` (normalize `\r\n` → `\n`) |
| Trim | `trim()` each line; leading/trailing whitespace on line discarded |
| Empty lines | **Skip** — do not create blank track titles |
| `track_number` / `sort_order` | **Regenerate** from line index: line 1 → 1, line 2 → 2, … |
| Album scope | Parse applies to **one** `discography_legacy_id` at a time |

### 4.4 Diff Preview (dry-run — before any Save)

Compare **DB ordered titles** vs **parsed textarea titles** for selected album:

| Diff type | Meaning |
| --- | --- |
| **unchanged** | Same title at same position (optional display) |
| **changed** | Title edit at position N |
| **reordered** | Same titles, different positions |
| **added** | New line vs DB count |
| **removed** | DB row with no matching line |

Preview output must show **added / deleted / changed / reordered** before Save is enabled. **DB write disabled** in G-18f.

### 4.5 G-18f target album candidate

| Item | Value |
| --- | --- |
| `discography_legacy_id` | `discography-002` |
| Album | SKYLARK |
| DB track count | **8** |
| Flow | DB 8 lines → textarea display → operator edit → parse → diff Preview |

---

## 5. Save design — single-row vs album-level tracklist

### 5.1 Album-level Save options (primary planning)

| Option | Summary | UI fit | Complexity | G-18e recommendation |
| --- | --- | --- | --- | --- |
| **1 — Single track title UPDATE** | One `id` + `title` change | **Weak** for operators | Low | Adapter spike only — **not primary** |
| **2 — Album textarea diff + per-row UPDATE/INSERT/DELETE plan** | Diff engine → planned SQL ops | **Natural** | High | **Target for G-18g Save**; dry-run preview **required** |
| **3 — Album full replacement transaction** | DELETE album tracks + INSERT all lines | Matches textarea paste | Medium–high | **Dry-run first**; rollback plan required; consider after Option 2 proof |

**G-18f scope:** Option 2 **read/parse/diff only** — no UPDATE/INSERT/DELETE.

### 5.2 Differences from scalar `discography` Save

| Aspect | Scalar (`discography`) | Tracks title slice |
| --- | --- | --- |
| Table | `public.discography` | `public.discography_tracks` |
| PK | `id` uuid | `id` uuid |
| `updated_at` | **yes** (trigger G-15b-f8) | **no** |
| Optimistic lock | `expectedBeforeUpdatedAt` | **not available** — composite fingerprint |
| Adapter | `discography-write-adapter.ts` | **new** `discography-tracks-write-adapter.ts` (G-18f) |
| Registry | `discography-scalar-field-slice-registry.ts` | **new** tracks slice registry entry |
| Admin UI | Per-album scalar fields + Save | **Album `tracks` textarea** — display today; G-18f adds diff Preview |
| GRANT | `discography` UPDATE granted (G-15b-grant) | **`discography_tracks` UPDATE/INSERT/DELETE — verify in G-18f-grant preflight** |

### 5.3 Single-row WHERE / guard options (adapter spike reference)

| Option | Assessment | Recommendation |
| --- | --- | --- |
| **1 — `id` + `discography_legacy_id` + `track_number` + `title` before** | Strongest SQL pin; `rowsAffected === 1` | **Recommended** |
| **2 — `id` only + app guard** | Weaker if client bug | Reject as sole guard |
| **3 — `legacy_id` + `track_number` + `title` before** | Works without uuid in WHERE | Acceptable fallback; prefer Option 1 |
| **4 — add `updated_at` then Save** | Schedule parity; DDL + trigger | **Defer** |

### 5.4 G-18g Save guards (album-level — planning sketch)

```txt
guard: discography_legacy_id matches selected album
guard: expected current track count (e.g. 8 for SKYLARK)
guard: ordered title fingerprint before Save (concat hash or title[] equality)
diff plan: only rows in approved diff Preview
dry-run Preview required before Save
approvalId: register per album-level slice (G-18g phase)
```

### 5.5 Single-row payload sketch (deferred — not G-18f primary)

```txt
changedFields: ["title"] only
payload: { title: "<after>" }
assert: approvalId registered
assert: legacy_id + track_number + id match beforeSnapshot
assert: title before matches beforeSnapshot.title
assert: rowsAffected === 1
no track_number / sort_order / discography_legacy_id mutation
```

### 5.6 Dry-run (G-18f — textarea diff only)

- SELECT album tracks ordered by `sort_order`
- Parse textarea per §4.3
- Build diff: added / deleted / changed / reordered
- **No UPDATE/INSERT/DELETE** when `PUBLIC_ADMIN_WRITE_DRY_RUN=true` (routine default)
- Stale check: re-SELECT album track list — if fingerprint changed since load, block Preview

### 5.7 afterVerification (G-18g Save — future)

```sql
select discography_legacy_id, track_number, title
from public.discography_tracks
where discography_legacy_id = 'discography-002'
order by sort_order;
-- expect parsed textarea titles in order
```

### 5.8 Rollback (G-18g — album-level)

- Option 2: reverse planned UPDATE/INSERT/DELETE per diff plan (document SQL)
- Option 3: restore prior ordered title list via transaction rollback or re-INSERT from snapshot

---

## 6. Optimistic lock / `updated_at`

| Issue | Planning decision |
| --- | --- |
| No `updated_at` on `discography_tracks` | **Do not** reuse `expectedBeforeUpdatedAt` from discography scalar slices |
| Stale detection | **Album ordered title fingerprint** at dry-run and Save; single-row `id`+`title` for adapter spike only |
| `created_at` | Immutable — optional equality check; weak substitute for lock |
| Future | Optional G-18x `discography_tracks.updated_at` trigger — **not** prerequisite for G-18f textarea diff |

---

## 7. Public reflection (planning only — not G-18e scope)

| Item | Assessment |
| --- | --- |
| Current hook | `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` — scalars only; **no** `patchDiscographyItemTracks` |
| Requirement | Load tracks from Supabase at convert; patch Track List inside Wix repeater per album |
| HTML structure | `findDiscographyRepeaterItemBounds()` + Track List `<ul>` / `<li>` or Wix `<p>` lines per track |
| Difficulty | **Medium–high** — 4 repeaters × variable track counts; title-only change = single `<li>` text replace |
| CSS risk | Same as scalars — `_astro` hash may change on regen; likely `discography/index.html` upload |
| Order | **After** G-18g Save proof, not before |

---

## 8. Planning judgments (A–D) — post-refinement

### A. G-18fに進んでよいか

**Yes** — **album-level textarea diff dry-run** on `discography-002` / SKYLARK. **Not** single-row title Save as primary path.

### B. G-18f target

| Item | Value |
| --- | --- |
| Phase | `G-18f-gosaki-discography-tracklist-textarea-diff-dry-run` |
| Album | `discography-002` / SKYLARK (8 tracks) |
| Scope | read → textarea → parse → diff Preview; **DB write disabled** |

### C. Single-row PoC

**Deferred as primary UI.** May reuse adapter patterns internally; operator-facing Save uses textarea diff (G-18g).

### D. Prerequisites before G-18g Save

| Item | Required? |
| --- | --- |
| G-18f diff dry-run PASS | **yes** |
| `discography_tracks` GRANT (UPDATE/INSERT/DELETE) | **yes** — preflight |
| `updated_at` column | **no** (defer) |
| Public `patchDiscographyItemTracks` | **no** (after Save) |

---

## 9. Proposed sequence (post-refinement)

```txt
G-18f     album-level textarea read/parse/diff dry-run (discography-002; no DB write)
G-18f-grant  discography_tracks GRANT preflight (parallel if needed)
G-18g     textarea Save adapter planning (one album; diff plan + guards)
G-18g-preflight → operator Save once
G-18h     public tracks patch planning (after Save success)
```

Single-row title UPDATE spike — **optional internal**; not scheduled as operator-facing G-18f.

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18e-gosaki-discography-tracks-title-edit-save-slice-planning.mjs
```
