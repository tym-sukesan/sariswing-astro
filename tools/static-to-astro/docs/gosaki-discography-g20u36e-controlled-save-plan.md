# G-20u36e — Gosaki Discography First controlled Save planning

**Phase:** `G-20u36e-controlled-save-planning`  
**Status:** **complete** — planning only · **Save not executed** · **operation=save not sent**  
**Date:** 2026-07-13  
**Base commit:** `58a57b8`  
**Prior:** [gosaki-discography-g20u36d-readback-live-verify-retry-3.md](./gosaki-discography-g20u36d-readback-live-verify-retry-3.md) — **PASS**

| Check | Status |
| --- | --- |
| retry-3 readBack live verify | **PASS** — trackCount=8 · matching 200 · wouldWrite=false |
| Controlled Save plan | **yes** (this file) |
| Save enabled | **no** |
| operation=save sent | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Edge deploy | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSavePlanPrepared: true
phase: G-20u36e-controlled-save-planning
planningOnly: true
saveEnabled: false
executableSaveAllowed: false
operationSaveSent: false
sqlExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
retry3PassUnlocksPlanning: true
readyForG20u36eControlledSavePreflight: true
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 0. Unlock — retry-3 PASS summary

G-20u36d-readback-live-verify-retry-3 unlocked First controlled Save planning:

| Item | Result |
| --- | --- |
| readBack.enabled | **true** |
| readBack.source | **supabase-select** |
| readBack.releaseFound | **true** |
| readBack.trackCount | **8** |
| matching dryRun | **200** · wouldWrite=**false** · tracksAdded=**0** |
| +1 track dryRun | **200** · wouldWrite=**true** · tracksAdded=**1** |
| operation=save | **400 reject** (expected — Save still disabled) |
| write flags | all **false** |
| service_role | **not used** |

Edge readBack fixes verified on live staging: release-id fix · tracks-select-fields fix · tracks-relation-filter fix (`site_slug` + `discography_legacy_id`).

---

## 1. First controlled Save — target selection

### 1.1 Principle candidate

| Item | Value |
| --- | --- |
| siteSlug | `gosaki-piano` (fixed) |
| legacyId | `discography-002` (fixed for first slice) |
| release title | **SKYLARK** |
| track count | **8** (must remain 8 after Save) |
| approvalId (registered) | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |

### 1.2 Recommended first slice — G-20u36e1

**Slice ID:** `G-20u36e1-discography-002-track-1-title-staging-marker`

| Policy | Verdict |
| --- | --- |
| Album scope | **discography-002 only** — not all 4 albums |
| Diff category | **`changed` only** · exactly **1 row** · **`title` field only** |
| Track pin | **track_number = 1** (`On a Clear Day`) |
| Proposed after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| Track count | **unchanged (8)** — no INSERT / DELETE |
| Environment | **staging only** · operator-controlled |

**Why track 1 (not track 7):** track 7 is **Save off-limits** on `discography-002` — canonical title `Like a Lover` (snapshot G-20u36e); preflight once cited G-18g2 test string `Like a Lover（テスト）` as expectation artifact — **do not re-Save track 7** in first or early slices.

**Why not +1 track then revert:** adds DELETE risk on rollback · wider diff surface · tracksAdded=1 path is for dryRun verification only, not first Save.

**Why not no-op Save:** Save must require `wouldWrite=true` with a documented minimal diff; no-op would hide guard failures and provides no rollback learning signal.

### 1.3 Alternatives compared (not selected for first slice)

| Option | Verdict | Reason |
| --- | --- | --- |
| discography-004 track 1 title (G-19b1 pattern) | **Fallback** | Safer history-wise but breaks “002/SKYLARK first” principle; use only if 002 preflight snapshot diverges |
| discography-002 track 8 title change | **Acceptable alternate pin** | No closed chain; same 1-row title UPDATE pattern |
| Release scalar field (`label`, `purchase_url`, …) | **Defer** | Edge Save slice is tracklist-oriented; scalar Save is a separate approval slice |
| Full tracklist replace (8 lines pasted) | **No** | accidental overwrite risk |
| Multi-album Save | **No** | scope too wide |
| operation=save without prior matching dryRun | **No** | STOP |

### 1.4 Closed chains — do not touch

From G-19b / G-18g2 (still binding):

- `discography-002` track 7 `title` = `Like a Lover` (canonical) — **do not change in G-20u36e**
- Scalar closed chains: `discography-001` artist · `discography-002` purchase_url · `discography-003` artist · `discography-004` label

---

## 2. Save前 snapshot 方針 (SELECT-only)

Preflight phase (`G-20u36e-controlled-save-preflight`) will capture **before** state — **Cursor does not execute SQL in planning phase**.

### 2.1 Release row snapshot

SELECT-only on `public.discography` (or project table name confirmed in preflight):

- `legacy_id` = `discography-002`
- `site_slug` = `gosaki-piano`
- `title`, `artist`, `label`, `release_date`, `purchase_url`, `published`, `sort_order`
- `updated_at` if column exists (for optimistic lock decision)
- internal `id` (operator SQL only — not logged in docs / readBack summary)

### 2.2 Tracks snapshot (8 rows)

SELECT-only on `public.discography_tracks`:

- filter: `site_slug=eq.gosaki-piano` AND `discography_legacy_id=eq.discography-002`
- order: `sort_order` asc
- fields: `track_number`, `title`, `sort_order`, `site_slug`, `discography_legacy_id`
- **expected count: 8**

Expected track 1 before title: `On a Clear Day`  
Expected track 7 (must remain unchanged): `Like a Lover`

### 2.3 Rollback snapshot fields (record in preflight)

| Field | Rollback use |
| --- | --- |
| release scalar fields | restore if accidentally touched |
| all 8 `(track_number, title, sort_order)` tuples | single-row title revert |
| track count | must stay 8 |
| `published` | confirm no publish side-effect |
| readBack fingerprint | hash of joined titles for post-save compare |

### 2.4 readBack cross-check before Save

Re-run live dryRun (matching payload = current DB titles):

- status **200**
- readBack.trackCount = **8**
- wouldWrite = **false**
- tracksAdded = **0**

Then dryRun with **G-20u36e1 payload** (track 1 title marker):

- status **200**
- wouldWrite = **true**
- changed count = **1** (title only on track 1)
- tracksAdded = **0** · tracksDeleted = **0**

**STOP** if readBack titles ≠ snapshot SELECT.

---

## 3. Save実行条件

### 3.1 Fixed guards

| Guard | Value |
| --- | --- |
| siteSlug | `gosaki-piano` — mismatch → **400 reject** |
| legacyId | `discography-002` — mismatch → **400 reject** |
| approvalId | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| sliceId | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| environment | staging `kmjqppxjdnwwrtaeqjta` only |
| track count | **8 → 8** (no add/delete) |
| changed fields | **track 1 title only** |

### 3.2 expectedBefore / expectedAfter

**expectedBefore (release):**

- title = `SKYLARK`
- site_slug = `gosaki-piano`
- legacy_id = `discography-002`
- published = (value from snapshot — record in preflight)

**expectedBefore (tracks — titles only, track_number order):**

1. `On a Clear Day`
2. `My Blue Heaven`
3. `How Deep Is The Ocean`
4. `Skylark`
5. `Set Sail`
6. `What a Wonderful World`
7. `Like a Lover` ← **must not change**
8. `The Water Is Wide`

**expectedAfter (tracks):**

- track 1 title → `On a Clear Day [CMS Kit staging G-20u36e]`
- tracks 2–8 titles → **identical to expectedBefore**
- track count → **8**

**expectedAfter (release scalars):** **unchanged** from expectedBefore.

### 3.3 Optimistic lock / updated_at

| Item | Planning decision |
| --- | --- |
| `discography_tracks.updated_at` | **column absent** — no row-level updated_at lock |
| Release `updated_at` | verify in preflight; if absent, use **tracksText fingerprint** + **readBack match** |
| Stale detection | pre-Save readBack must match snapshot; post-Save readBack must match expectedAfter |
| Schedule-style `expectedBeforeUpdatedAt` | **not applicable** until column confirmed on release row |

### 3.4 Auth / permission (no service_role)

| Path | Policy |
| --- | --- |
| service_role | **Forbidden** — STOP if required |
| Edge Function Save | authenticated user JWT forwarded to Supabase client (RLS) — confirm in preflight after G-20u36a remediation |
| anon direct UPDATE | **not planned** — Save goes through Edge gate |
| Browser anon key | dryRun only (retry-3 pattern) |

Permissions baseline (G-20u36a): `authenticated` UPDATE on `discography_tracks` applied on staging — re-verify SELECT-only before Save arm.

### 3.5 Pre-Save procedure (execution phase — not now)

1. Operator runs preflight snapshot SQL (SELECT-only) → records in preflight doc.
2. Operator runs matching dryRun → PASS.
3. Operator runs G-20u36e1 dryRun → wouldWrite=true · 1 title change.
4. Operator explicit approval (destructive-op form) for **one** Save.
5. Save path enabled in Edge (separate implementation/deploy phase — not G-20u36e).
6. **One** `operation=save` request with exact dryRun payload.

**STOP** if dryRun wouldWrite/content ≠ expectedAfter plan.

---

## 4. Save後 verification 方針

### 4.1 DB snapshot (SELECT-only)

Repeat §2.1–2.2 queries:

- track 1 title = expectedAfter
- track 7 still `Like a Lover`
- track count = 8
- release scalars unchanged

### 4.2 readBack re-run

Live dryRun matching **post-save** DB state:

- readBack.trackCount = **8**
- wouldWrite = **false** (stable state)

Optional: dryRun reverting track 1 to original → wouldWrite=true (rollback dryRun rehearsal — preflight doc only).

### 4.3 Admin UI

- Staging admin Discography section shows updated track 1 title in textarea (read-only verify OK).
- **No Save button click** by Cursor; operator visual check only.
- Save UI remains **disabled** until controlled endpoint Save succeeds (see §5).

### 4.4 Public site reflection

**Separate phase** (G-19c / G-18h pattern):

- No package regen / FTP in First Save execution phase.
- Public `/discography/` update deferred until explicit reflection approval.

---

## 5. Save有効化の範囲

### 5.1 Scope limits

| Dimension | First slice limit |
| --- | --- |
| Albums | **discography-002 only** |
| Environment | **staging** only |
| Operator | **human-controlled** · one Save per approval ID |
| operation=save | requires approvalId + slice guards + wouldWrite=true dryRun |
| All-discography Save | **forbidden** |

### 5.2 Enablement path comparison

| Approach | Verdict | Notes |
| --- | --- | --- |
| **A. Direct endpoint controlled Save (operator script/curl)** | **Recommended first** | Minimal surface · exact payload control · no admin UI arm · matches retry-3 HTTP pattern |
| B. Admin UI Save button enable | **Defer** | Requires G-20u34 arm env stack + browser QA · wider blast radius · after A succeeds |

Planning decision: **implement Save gate on Edge first** · prove with **operator direct HTTP** · only then consider UI Save arm (G-20u34 prerequisites + G-20u36c dry-run wiring already exist).

### 5.3 Save still disabled in this phase

Current live Edge (retry-3): `operation=save` → **400 reject**.  
Enabling Save requires **future phases** (not G-20u36e):

1. `G-20u36e-controlled-save-preflight` — snapshot + rollback SQL documented
2. Edge Save implementation + guards (tools draft → root placement → deploy)
3. `G-20u36e-controlled-save-execution` — operator one-shot Save

---

## 6. Rollback方針

| Item | Policy |
| --- | --- |
| Rollback needed? | **Expected no** if only track 1 title changed as planned |
| Rollback mechanism | Single UPDATE restoring track 1 title to `On a Clear Day` |
| Rollback SQL | Document in preflight · **operator executes manually** if needed |
| Rollback trigger | track 7 changed · track count ≠ 8 · release scalar changed · readBack mismatch |
| INSERT/DELETE rollback | **not expected** — if track count changes, **STOP** and ask human |

Rollback SQL template (preflight phase — **not executed in planning**):

```sql
-- staging only · discography-002 track 1 title revert · operator manual
-- UPDATE public.discography_tracks
-- SET title = 'On a Clear Day'
-- WHERE site_slug = 'gosaki-piano'
--   AND discography_legacy_id = 'discography-002'
--   AND track_number = 1;
```

---

## 7. STOP conditions

Stop and ask operator if:

- **service_role** becomes necessary
- production ref `vsbvndwuajjhnzpohghh` appears in target/config
- rollback would require INSERT/DELETE or multi-row overwrite
- target legacyId/siteSlug ambiguous or multi-album
- dryRun wouldWrite/content ≠ expectedAfter plan
- readBack unstable (trackCount ≠ 8 on matching payload)
- Save scope expands beyond discography-002
- SQL/DB write required during **planning** phase
- broad admin UI changes required to proceed
- track 7 title would change
- no-op Save (`wouldWrite=false`) is attempted

---

## 8. Generalization — CMS Kit standard write gate

This slice is Gosaki-specific (legacyId, SKYLARK fixture, Edge function name) but establishes reusable Kit patterns:

| Pattern | Kit standardization target |
| --- | --- |
| Relation mapping | `site_slug` + `discography_legacy_id` (not orphan UUID in client) |
| readBack | PostgREST SELECT mirror of DB before/after dryRun |
| dryRun | `wouldWrite` + diff counts before any Save |
| expected diff | `expectedBefore` / `expectedAfter` documented per slice |
| rollback snapshot | SELECT-only tuples stored in preflight doc |
| controlled write gate | approvalId registry + single-album + single-field slice + operator one-shot |

Future Kit sites: same phase sequence — plan → preflight snapshot → dryRun verify → arm Save → execute → readBack verify → optional public reflection.

---

## 9. Phase sequence (forward)

| Phase | Scope |
| --- | --- |
| **G-20u36e-controlled-save-planning** | **this doc — complete** |
| **G-20u36e-controlled-save-preflight** | SELECT-only snapshot SQL · rollback doc · dryRun payload lock |
| G-20u36f (TBD) | Edge Save path implementation + guards (tools draft) |
| G-20u36g (TBD) | Root placement + Edge deploy preflight |
| G-20u36h (TBD) | Operator controlled Save execution (one shot) |
| Later | Admin UI Save arm · public reflection |

**Next recommended phase:** `G-20u36e-controlled-save-preflight`

---

## 10. Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| Save enabled | **no** |
| operation=save sent | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Edge deploy | **no** |
| Admin UI changed | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| `supabase/functions/**` edited | **no** (planning phase) |
| Production | **not touched** |
