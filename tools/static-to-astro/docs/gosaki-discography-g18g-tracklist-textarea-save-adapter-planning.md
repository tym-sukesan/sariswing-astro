# G-18g — Gosaki Discography tracklist textarea Save adapter planning

**Phase:** `G-18g-gosaki-discography-tracklist-textarea-save-adapter-planning`  
**Status:** **complete** — planning only; **no Save, GRANT, or DB write**  
**Date:** 2026-06-29  
**Base commit:** `8a23191`  
**Prior:** G-18f-result (`gosaki-discography-g18f-tracklist-textarea-diff-dry-run-local-ui-result.md`)

| Check | Status |
| --- | --- |
| G-18f local UI diff Preview | **PASS** (recorded) |
| Save adapter options compared | **yes** |
| First PoC target selected | **yes** — Option A |
| Guard design | **yes** |
| GRANT / RLS check plan | **yes** (G-18g1) |
| Optimistic lock strategy | **yes** — composite without `updated_at` |
| Rollback template | **yes** (doc-only) |
| Public reflection | **deferred** — G-18h |
| Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG18gTracklistTextareaSaveAdapterPlanningComplete: true
phase: G-18g-gosaki-discography-tracklist-textarea-save-adapter-planning
readyForG18g1DiscographyTracksGrantReadonlyPreflight: true
readyForG18g2TracklistSingleTitleSaveDryRunImplementation: false
readyForG18g2TracklistSingleTitleSaveExecution: false
readyForG18hTracklistPublicReflection: false
firstPocTarget: discography-002-track-7-title-change
saveOptionLongTerm: option-2-diff-per-row-ops
saveOptionFirstPoc: option-1-via-textarea-guards
updatedAtColumnBeforeFirstPoc: false
saveImplementedInThisPhase: false
dbWriteExecutedInThisPhase: false
grantExecutedInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
publicReflectionImplemented: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Closed scalar chains — do not re-Save:**
- `discography-002` / `purchase_url` (G-15c-f)
- `discography-001` / `artist`, `discography-003` / `artist`, `discography-004` / `label`

---

## 1. Completed context

| Phase | Outcome |
| --- | --- |
| G-18d | `discography_tracks` 16 → 34 rows; seed match |
| G-18e | Album-level textarea UI direction |
| G-18f | `discography-002` parse/diff Preview; Save disabled |
| G-18f-result | Local UI Preview PASS; track 7 test edit **not persisted** |

**UI path (retained):** textarea → parse → diff Preview → (future) armed Save.

---

## 2. Save方式の比較

### 2.1 Options summary

| Option | Description | UI fit | Safety | Rollback | CMS化 | 実装コスト | 公開反映 | 途中失敗復旧 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1 — changed title only UPDATE** | 1 row `title` UPDATE | Weak alone; OK as first PoC | **High** | **Easy** | Low (spike) | **Low** | Easy (1 title) | **Easy** |
| **2 — diff → UPDATE/INSERT/DELETE** | G-18f diff engine → planned ops | **Best** | Medium–high (with guards) | Per-op SQL | **Best** | **High** | Natural | Medium |
| **3 — album DELETE + re-INSERT all** | Wipe album tracks; insert parsed lines | Good paste UX | **Low** | Hard | Medium | Medium | Album-scoped regen | **Poor** |
| **4 — guarded full replacement txn** | Option 3 + transaction + fingerprint guards | Good | Medium if guarded | Snapshot restore | Medium | High | Album-scoped | Medium |

### 2.2 Recommendation

| Horizon | Choice | Rationale |
| --- | --- | --- |
| **First Save PoC (G-18g2)** | **Option 1 semantics** delivered **via textarea + diff guards** | Proven G-18f UI; single `rowsAffected === 1`; no INSERT/DELETE |
| **Long-term CMS target** | **Option 2** | Matches operator textarea; reuses G-18f diff categories |
| **Defer** | Options 3–4 | DELETE-all risk; rollback heavy; not needed for title-edit proof |

Option 1 alone is weak UX, but as **first armed Save** it validates: textarea input → diff → write adapter → auth/GRANT/RLS → afterVerification — before expanding to Option 2.

---

## 3. 最初のSave PoC範囲

### 3.1 Candidate comparison

| Candidate | Risk | Verdict |
| --- | --- | --- |
| **A — track 7 title change via textarea** | **Low** — 1× UPDATE | **Recommended first PoC** |
| B — append 1 track | High — INSERT | Defer |
| C — delete 1 track | High — DELETE | Defer |
| D — reorder | High — multi-row | Defer |

### 3.2 PoC A — target (G-18g2)

| Field | Value |
| --- | --- |
| Album | `discography-002` / SKYLARK |
| Track row | `track_number` **7** |
| Row `id` | `fd58cd6e-2fff-4ff2-96af-3087c469450b` |
| **before `title`** | `Like a Lover` |
| **after `title`** | `Like a Lover（テスト）` |
| Input path | **textarea** (line 7 edit) — not per-track form |
| **approvalId (proposed)** | `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice` |
| **env arm (proposed)** | `PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=true` |

**Why A:** Matches G-18f-result operator Preview exactly; `changed.length === 1`; no added/deleted/reordered; trivial rollback; does not touch closed `purchase_url` scalar chain.

**Why not B/C/D first:** INSERT/DELETE/reorder need extra GRANTs, multi-row failure modes, and harder rollback — save for post–Option-2 slices.

---

## 4. Guard設計（G-18g2 first PoC）

### 4.1 Album-level guards

```txt
discography_legacy_id === 'discography-002'
album title === 'SKYLARK' (informational)
expectedBeforeTrackCount === 8
expectedAfterTrackCount === 8
orderedTitleFingerprintBefore matches DB snapshot at dry-run load
```

### 4.2 Ordered title fingerprint (before Save)

Pipe-separated titles in `sort_order` (staging baseline):

```txt
On a Clear Day|My Blue Heaven|How Deep Is The Ocean|Skylark|Set Sail|What a Wonderful World|Like a Lover|The Water Is Wide
```

Implementation: `tracks.map(t => t.title).join("|")` or JSON.stringify(title[]) — document both; pick one in G-18g2 implementation.

**Stale check:** re-SELECT album tracks before Save; if fingerprint ≠ dry-run baseline → block Save.

### 4.3 Diff guards (textarea → parse → diff)

```txt
allowed diff types: changed only
changed.length === 1
added.length === 0
deleted.length === 0
reordered.length === 0
changed[0].track_number === 7
changed[0].before === 'Like a Lover'
changed[0].after === 'Like a Lover（テスト）'
```

### 4.4 SQL / adapter guards

```txt
table: public.discography_tracks
operation: UPDATE only
changedFields: ['title'] only
WHERE: id + discography_legacy_id + track_number + title (before)
rowsAffectedRequired: 1
no track_number / sort_order / discography_legacy_id mutation
PUBLIC_ADMIN_WRITE_DRY_RUN=false only when env arm + operator Save
actualWrite only on explicit operator Save once (G-18g2-execution)
```

### 4.5 Safety block (mirror scalar slices)

```txt
supabaseWriteCalled: true only on Save execution
writeAdapterUsed: discography-tracks-write-adapter
discographyTracksTouched: true (1 row title only)
serviceRoleUsed: false
discography scalar table: not touched
```

---

## 5. DB権限確認方針（G-18g1 — next phase, read-only)

**Not executed in G-18g.** Document for operator/Cursor preflight.

### 5.1 Known baseline (historical docs)

| Item | `discography` | `discography_tracks` |
| --- | --- | --- |
| G-15b-grant | `authenticated UPDATE` **applied** | — |
| Staging cleanup (`staging-rls-grant-cleanup-result`) | `anon/authenticated SELECT` | `anon/authenticated SELECT` **only** |
| Broad INSERT/DELETE | not granted (cleanup preserved) | not granted |

**Working assumption:** `discography_tracks` **UPDATE grant likely missing** — G-18g1 must confirm before Save.

### 5.2 G-18g1 read-only checks

```sql
-- information_schema / pg_catalog — SELECT only
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'discography_tracks'
order by grantee, privilege_type;

select polname, polcmd, polroles::regrole[]
from pg_policy p
join pg_class c on c.oid = p.polrelid
where c.relname = 'discography_tracks';
```

**Expectations to record:**

| Check | Expected for Save |
| --- | --- |
| `anon` UPDATE | **no** |
| `authenticated` UPDATE | **required** for client Save |
| RLS enabled | verify |
| Policy allowing `authenticated` UPDATE for admin | verify (`discography_tracks_admin_all` draft exists in `rls-draft-generator.mjs` — live status unknown) |
| Separate from `discography` G-15b grant | **yes** — distinct table |

**If UPDATE missing:** operator manual `GRANT UPDATE ON public.discography_tracks TO authenticated` in **G-18g1-apply** phase (separate approval; mirror G-15b-grant playbook). **No GRANT in G-18g.**

---

## 6. Optimistic lock / stale検出

| Option | Assessment | G-18g recommendation |
| --- | --- | --- |
| **1 — add `updated_at` + trigger** | Schedule parity; DDL migration | **Defer** — not prerequisite for first PoC |
| **2 — id + before title + track_number + legacy_id + album fingerprint** | Strong pin; no schema change | **Recommended for G-18g2** |
| **3 — album checksum only** | Detects album drift; weak per-row pin | Use **with** Option 2, not alone |

### 6.1 First PoC without `updated_at` — rationale

- `discography_tracks` has **no `updated_at`** (G-18d confirmed).
- First PoC is **one title UPDATE** with strict WHERE + fingerprint stale check.
- Adding DDL before proof adds migration/rollback scope without benefit for single-row slice.
- **Limitation:** concurrent edits to same row between Preview and Save are caught by `title` before + fingerprint, not timestamp lock. Acceptable for staging PoC.

### 6.2 Future

Optional **G-18x** `discography_tracks.updated_at` trigger after Option 2 multi-op Save is proven.

---

## 7. Rollback方針（doc-only — not executed）

**Rollback needed after successful G-18g2-execution:** optional restore staging test title.

```sql
-- staging only; operator approval; G-18g2-execution rollback template
update public.discography_tracks
set title = 'Like a Lover'
where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b'
  and discography_legacy_id = 'discography-002'
  and track_number = 7
  and title = 'Like a Lover（テスト）';
-- expect rows affected: 1
```

**G-18g planning:** rollback SQL **not executed**.

---

## 8. Public reflection方針（G-18h — deferred）

| Item | Plan |
| --- | --- |
| Phase | **G-18h** — after G-18g2 Save success |
| Hook | `patchDiscographyItemTracks()` in `supabase-discography-read.mjs` (not implemented) |
| Scope | DB `discography_tracks` → Wix repeater Track List HTML per album |
| Trigger | **After** Save proof only |
| Upload | Manual package regen + operator upload — separate gate (playbook G-16/G-17 pattern) |
| CSS/JS | `_astro/` hash may change — full `discography/index.html` upload if needed |

**G-18g:** no public reflection, no package regen, no FTP.

---

## 9. Proposed implementation modules (G-18g2 — not this phase)

| Module | Role |
| --- | --- |
| `discography-tracks-write-adapter.ts` | UPDATE-only; anon client; `rowsAffected === 1` |
| `discography-tracklist-save-guards.ts` | Diff + fingerprint + PoC slice asserts |
| `gosaki-discography-g18g2-tracklist-title-save.ts` | Save executor |
| `gosaki-discography-g18g2-tracklist-title-save-config.ts` | env arm / Save gate |
| Extend `gosaki-staging-discography-admin-ui.ts` | armed Save on `discography-002` when G-18g2 gates pass |

Reuse: `parseDiscographyTracklistTextarea`, `diffDiscographyTracklists` (G-18f).

---

## 10. Planning judgments (A–E)

### A. G-18g1で UPDATE grant / RLS read-only check に進むべきか

**Yes** — prerequisite before any Save implementation. Read-only SELECT on `information_schema` / `pg_policy` only.

### B. G-18g2で textarea Save dry-run / armed Save preflight に進むべきか

**Yes, after G-18g1 PASS** — sequence: G-18g1 preflight → (grant apply if missing) → G-18g2 implementation → G-18g2-preflight → G-18g2-execution (operator Save once).

### C. 最初のSave PoC target

**PoC A** — `discography-002` track 7 / `Like a Lover` → `Like a Lover（テスト）` via textarea; approvalId `G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice`.

### D. Save実装前に updated_at列を追加すべきか

**No** for first PoC — use composite fingerprint + row pin (§6). Revisit after Option 2 expansion.

### E. rollback方針

Single-row UPDATE rollback SQL documented (§7). **Not executed** in planning phase. `rollbackNeeded: false` until G-18g2-execution.

---

## 11. Proposed sequence

```txt
G-18g     Save adapter planning — done
G-18g1    discography_tracks GRANT + RLS read-only preflight
G-18g1-apply  GRANT UPDATE if missing (operator only, separate approval)
G-18g2    single-title Save adapter + dry-run Save path implementation
G-18g2-preflight  final preflight + rollback doc
G-18g2-execution  operator Save once
G-18h     patchDiscographyItemTracks planning / implementation
```

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18g-gosaki-discography-tracklist-textarea-save-adapter-planning.mjs
```
