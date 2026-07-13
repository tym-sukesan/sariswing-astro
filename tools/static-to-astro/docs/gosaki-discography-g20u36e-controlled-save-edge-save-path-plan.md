# G-20u36e — Gosaki Discography controlled Save Edge save path plan

**Phase:** `G-20u36e-controlled-save-edge-save-path-planning`  
**Status:** **complete** — planning only · **Save not executed** · **operation=save not sent**  
**Date:** 2026-07-14  
**Base commit:** `00ba5c7`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-dryrun-payload-live-verify.md](./gosaki-discography-g20u36e-controlled-save-dryrun-payload-live-verify.md) — **PASS**

| Check | Status |
| --- | --- |
| Edge save path plan | **yes** (this file) |
| Planning only | **yes** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| SQL executed | **no** |
| DB write | **no** |
| operation=save sent | **no** |
| Save executed | **no** |
| dryRun HTTP re-sent | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSaveEdgeSavePathPlanPrepared: true
phase: G-20u36e-controlled-save-edge-save-path-planning
planningOnly: true
edgeImplementationExecuted: false
supabaseFunctionsEdited: false
edgeDeployExecuted: false
sqlExecuted: false
dbWriteExecuted: false
operationSaveSent: false
saveExecuted: false
dryRunHttpResent: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
permissionPreflightRequiredBeforeSaveArm: true
readyForG20u36eEdgeSavePathToolsDraft: false
readyForG20u36ePermissionPreflightPlanning: true
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

**Endpoint (staging):** `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run`

---

## 0. Unlock — dryRun live verify PASS summary

G-20u36e-controlled-save-dryrun-payload-live-verify unlocked Edge save path planning:

| Item | Result |
| --- | --- |
| Step A matching dryRun | **200** · wouldWrite=**false** · tracksAdded=**0** · write flags all **false** |
| Step B controlled slice dryRun | **200** · wouldWrite=**true** · changedLines=**1** (line 1, kind=`changed`) |
| Step B track count | totalBefore=**8** · totalAfter=**8** |
| Step B track 7 | **unchanged** (`Like a Lover`) |
| readBack | enabled · source=`supabase-select` · releaseFound=true · trackCount=**8** |
| operation=save | **not sent** — live Edge still **400 reject** (expected) |
| Snapshot SELECT (prior phase) | release_row_count=**1** · track_count=**8** · track_1=`On a Clear Day` · track_7=`Like a Lover` |

**Current deployed handler behavior (read-only review):** `operation=save` is rejected before any write path exists. `SAVE_APPROVAL_ID` is registered in approval registry but save operation branch returns 400. All write flags hard-coded false on dryRun responses.

---

## 1. Save path — minimal specification

### 1.1 Target slice (fixed)

| Field | Value |
| --- | --- |
| **sliceId** | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| **approvalId** | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| **siteSlug** | `gosaki-piano` (exact match required) |
| **legacyId** | `discography-002` (exact match required) |
| **release title** | **SKYLARK** |
| **track count** | **8 → 8** (must not change) |

### 1.2 Allowed change (only)

| Field | Before | After |
| --- | --- | --- |
| track 1 title | `On a Clear Day` | `On a Clear Day [CMS Kit staging G-20u36e]` |

### 1.3 Must remain unchanged

| Item | Expected value / policy |
| --- | --- |
| track 2–6 titles | unchanged from snapshot |
| **track 7 title** | **`Like a Lover`** — any diff → **reject** |
| track 8 title | `The Water Is Wide` |
| release scalar fields | `title`, `artist`, `release_date`, `label`, `catalog_number`, `published`, `cover_image_url`, `purchase_url`, `streaming_url`, `description` — **no diff** |
| track add/remove/reorder | **forbidden** |
| any other legacyId / siteSlug | **forbidden** |

### 1.4 operation=save acceptance conditions (future implementation)

Save request must satisfy **all** of:

| # | Condition |
| --- | --- |
| 1 | `operation` = **`save`** |
| 2 | `approvalId` = **`G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice`** (exact) |
| 3 | `sliceId` = **`G-20u36e1-discography-002-track-1-title-staging-marker`** (exact — new required field on save path) |
| 4 | `siteSlug` = **`gosaki-piano`** |
| 5 | `legacyId` = **`discography-002`** |
| 6 | `tracksText` = **expectedAfter** (see §1.5) — exact line-normalized match |
| 7 | `release` object matches readBack release scalars (no field diff) |
| 8 | `trackPolicy` matches dryRun contract (`oneLineOneTrack`, `blankLinesIgnored`, etc.) |
| 9 | `clientDryRun.wouldWrite` = **`false`** (browser never writes) |
| 10 | Preceding dryRun-equivalent server guard **PASS** (§2) |
| 11 | Human operator explicit destructive-op approval for **one** Save (separate execution phase) |
| 12 | Staging project ref only — production ref in URL/env → **STOP** |

**Any other diff** (extra changed lines, release field change, track count change, wrong sliceId) → **400 reject** · no partial write.

### 1.5 expectedAfter tracksText (canonical)

Line-normalized (one title per line, blank lines ignored):

1. `On a Clear Day [CMS Kit staging G-20u36e]`
2. `My Blue Heaven`
3. `How Deep Is The Ocean`
4. `Skylark`
5. `Set Sail`
6. `What a Wonderful World`
7. `Like a Lover`
8. `The Water Is Wide`

### 1.6 expectedBefore tracksText fingerprint (readBack baseline)

Must match snapshot SELECT + Step A matching dryRun:

1. `On a Clear Day`
2. `My Blue Heaven`
3. `How Deep Is The Ocean`
4. `Skylark`
5. `Set Sail`
6. `What a Wonderful World`
7. `Like a Lover`
8. `The Water Is Wide`

**Fingerprint check:** ordered title list from readBack `tracksText` must equal expectedBefore before Save is attempted.

---

## 2. Save前 server-side guard (mandatory in Save path)

All guards run **after** readBack fetch and **before** any network write. Failure → **400 reject** · write flags remain false.

### 2.1 readBack / snapshot guards

| Guard | Requirement |
| --- | --- |
| readBack.enabled | **true** |
| readBack.source | **`supabase-select`** |
| readBack.releaseFound | **true** |
| readBack.trackCount | **exactly 8** |
| readBack.siteSlug | **`gosaki-piano`** |
| readBack.legacyId | **`discography-002`** |

### 2.2 Current DB row guards (from readBack snapshot)

| Guard | Requirement |
| --- | --- |
| Current track 1 title | **exactly** `On a Clear Day` |
| Current track 7 title | **exactly** `Like a Lover` |
| tracksText fingerprint | matches **expectedBefore** (§1.6) |
| Release scalars | match request `release` object (bidirectional equality on RELEASE_FIELDS set) |

### 2.3 Request contract guards

| Guard | Requirement |
| --- | --- |
| siteSlug | **`gosaki-piano`** |
| legacyId | **`discography-002`** |
| approvalId | **`G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice`** |
| sliceId | **`G-20u36e1-discography-002-track-1-title-staging-marker`** |
| tracksText | **exact match** to expectedAfter (§1.5) after line normalization |
| clientDryRun.wouldWrite | **false** |

### 2.4 Computed diff guards (reuse dryRun engine)

Run same diff logic as dryRun path against readBack baseline:

| Guard | Requirement |
| --- | --- |
| wouldWrite | **true** |
| diff.totalBefore | **8** |
| diff.totalAfter | **8** |
| diff.changedLines.length | **exactly 1** |
| changed line | **line 1 only** · kind **`changed`** |
| changed line before | `On a Clear Day` |
| changed line after | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track 7 | **not** in changedLines |
| releaseFieldsChanged | **empty** |
| Net track add/delete | **none** — totalBefore=totalAfter=8; no changedLine with kind `added` or `removed` |
| changedCounts semantic | tracksAdded/tracksRemoved may show 1/1 for title rename decomposition — acceptable only if §2.4 net-track guards pass |

**If dryRun-equivalent diff fails → reject Save** even if request looks correct.

### 2.5 Guard ordering (recommended)

1. HTTP envelope (POST / JSON)
2. Staging URL / project ref check
3. operation=save + approvalId + sliceId registry lookup
4. siteSlug / legacyId fixed constants
5. readBack fetch (anon SELECT — same adapter as dryRun)
6. readBack guards (§2.1–2.2)
7. Request tracksText / release validation
8. Diff computation + diff guards (§2.4)
9. **Only then** — attempt single-row UPDATE (§3) if write authorization permits

---

## 3. Write operation candidates

### A. Direct UPDATE of one row only — **RECOMMENDED**

**Target table:** `public.discography_tracks`

**Scope (conceptual — not executable in this phase):**

- WHERE `site_slug` = `gosaki-piano`
- AND `discography_legacy_id` = `discography-002`
- AND `track_number` = `1`
- AND `title` = `On a Clear Day` (optimistic title lock)
- SET `title` = `On a Clear Day [CMS Kit staging G-20u36e]`

**Why recommended:**

- Minimal blast radius — exactly **one row**
- Matches slice intent (track 1 title marker only)
- Rollback is symmetric one-row revert (§6)
- Verifiable via SELECT-only snapshot + matching dryRun
- No track list rebuild · no orphan rows

**Requirements before use:**

- Write authorization must allow UPDATE on that row (§4 — **currently unresolved**)
- PostgREST must return **exactly 1** updated row; 0 rows → reject (stale / wrong baseline); >1 rows → **STOP** (should be impossible with track_number=1)

### B. delete/insert/rebuild tracks — **NOT RECOMMENDED (NG)**

| Risk | Detail |
| --- | --- |
| Blast radius | Entire track list |
| track_number / sort_order drift | High |
| Rollback complexity | Multi-row |
| Violates slice | First Save is title-only marker |

**Verdict:** **reject as primary path** · use only if one-row UPDATE proven impossible — triggers **STOP** and human review.

### C. manual SQL one-shot update — **NOT PRIMARY**

Operator SQL in Supabase Editor bypasses Edge Save gate validation.

**Verdict:** **last-resort emergency rollback/recovery only** · does **not** validate CMS Save path · **not** the First controlled Save execution path.

### D. RPC / SECURITY DEFINER — **NOT RECOMMENDED (high risk)**

| Risk | Detail |
| --- | --- |
| Privilege escalation | SECURITY DEFINER bypasses normal RLS |
| Audit | Harder to reason about who wrote |
| Kit generalization | Per-site RPC proliferation |

**Verdict:** **defer** · consider only after permission model review · not First Save path.

### E. service_role — **FORBIDDEN**

| Policy | Detail |
| --- | --- |
| Edge runtime service_role | **STOP** if required |
| Browser / response / logs | **never** expose |
| Silent fallback from anon failure | **forbidden** |

**Verdict:** if Save path requires service_role → **STOP** entire Save arm until separate approved phase.

### Summary table

| Candidate | Verdict |
| --- | --- |
| **A. one-row UPDATE** | **Recommended minimal write** |
| B. delete/insert/rebuild | **NG** |
| C. manual SQL one-shot | **Not primary** (emergency only) |
| D. RPC / SECURITY DEFINER | **Not recommended** |
| E. service_role | **Forbidden — STOP** |

---

## 4. Write authorization / RLS / grants — unresolved risk

### 4.1 Current baseline (G-20u36a / G-20u36b deploy preflight — staging)

| Item | Observed / recorded |
| --- | --- |
| anon SELECT on `discography` + `discography_tracks` | **present** (readBack works live) |
| authenticated UPDATE grants | **0** (revoked — direct PostgREST UPDATE blocked at grant layer) |
| anon INSERT/UPDATE/DELETE grants | **0** |
| RLS enabled | **true** on both tables |
| Admin ALL policies | exist but grant layer blocks direct browser UPDATE |

### 4.2 Planning conclusion

**As-is, operation=save on Edge cannot assume DB write succeeds.**

Even with perfect server-side guards, the Edge Function today uses **anon key only** for readBack SELECT. No write client is connected. Deployed handler rejects `operation=save` at validation layer.

If Save implementation uses **anon key PATCH/UPDATE** → likely **403/401** (no UPDATE grant).

If Save uses **authenticated user JWT** forwarded from operator session → requires:

- authenticated UPDATE grant restoration (staging-only) **or**
- restrictive RLS policy allowing UPDATE only under narrow conditions **or**
- alternative approved write channel

**service_role is not an acceptable shortcut** for this project phase.

### 4.3 Future options (separate phases — not decided here)

| Option | Notes |
| --- | --- |
| Staging-only authenticated UPDATE grant + restrictive RLS | Narrow to `site_slug` + `discography_legacy_id` + `track_number` · operator JWT only · separate permission preflight + explicit approval |
| Edge accepts operator JWT (not anon) for write client | Aligns with CMS Kit “authenticated operator” model · requires grant/RLS alignment |
| one-shot SQL UPDATE by operator | Emergency / rollback only · not Save path validation |
| RPC SECURITY DEFINER | High risk · last resort |

### 4.4 This phase boundaries

| Item | Status |
| --- | --- |
| Grant / RLS / REVOKE change | **not executed** |
| Executable SQL blocks | **not created** |
| Permission model proof | **not obtained** |

### 4.5 permission preflight necessity — **YES, required before Save arm**

**Judgment:** `permissionPreflightRequiredBeforeSaveArm: **true**`

Before Edge Save implementation deploy or First controlled Save execution:

1. SELECT-only permission inventory re-run on staging (grants + RLS effective policy)
2. Confirm which role (authenticated vs anon) can UPDATE **one** `discography_tracks` row
3. Document chosen write auth path without service_role
4. If no path without grant change → plan staging-only grant/RLS phase with explicit operator approval

**Tools draft without permission clarity is premature** — guards can be coded but live Save will fail or require forbidden shortcuts.

---

## 5. Save後 verification plan

Execution phase only — **not performed in planning**.

### 5.1 SELECT-only snapshot re-fetch

Repeat G-20u36e snapshot SELECT shape (operator manual · staging only):

| Check | Expected after Save |
| --- | --- |
| release_row_count | **1** |
| track_count | **8** |
| track_1_title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_7_title | **`Like a Lover`** |
| wrong_legacy_id_rows | **0** |
| wrong_site_slug_rows | **0** |
| release scalars | unchanged from pre-Save snapshot |

### 5.2 readBack + dryRun re-run (HTTP — separate verify phase)

| Case | Expected |
| --- | --- |
| Matching dryRun with **after** tracksText | **200** · wouldWrite=**false** · tracksAdded=**0** |
| dryRun with **before** tracksText (revert payload) | **200** · wouldWrite=**true** · 1 changed line track 1 |

Use dry-run approval ID `G-20u31-gosaki-discography-save-dry-run-endpoint` · `clientDryRun.wouldWrite=false`.

### 5.3 Deferred verification

| Area | Phase |
| --- | --- |
| Admin UI textarea display | separate visual QA phase |
| Public site `/discography/` reflection | separate package regen / FTP phase (G-19c pattern) |

### 5.4 Save failure / mismatch

If post-Save snapshot ≠ expected → **STOP** · assess rollback (§6) · do not retry Save automatically.

---

## 6. Rollback plan

| Item | Policy |
| --- | --- |
| Rollback expected? | **no** if only track 1 title changed as planned |
| Mechanism | **one-row title UPDATE** (symmetric to Save) |
| Target row scope | `site_slug=gosaki-piano` · `discography_legacy_id=discography-002` · `track_number=1` · current title=`On a Clear Day [CMS Kit staging G-20u36e]` |
| Restore title | `On a Clear Day` |
| Rollback SQL in this phase | **not created** |
| Rollback execution | **not executed** — separate phase · operator explicit approval |
| Rollback triggers | track 7 changed · track count ≠ 8 · release scalar changed · readBack mismatch · wrong row updated |

If rollback would require INSERT/DELETE or multi-row rebuild → **STOP** and escalate.

---

## 7. STOP conditions

Stop and ask operator if any of:

| # | Condition |
| --- | --- |
| 1 | **service_role** becomes necessary |
| 2 | production ref `vsbvndwuajjhnzpohghh` in URL / env / payload |
| 3 | write target cannot be limited to **one row** |
| 4 | track count would change (≠ 8) |
| 5 | track 7 title would change |
| 6 | release scalar field would change |
| 7 | delete/insert/rebuild track list required |
| 8 | request diff has **multiple** changed lines or add/remove line kinds |
| 9 | readBack mismatch (trackCount ≠ 8 · wrong titles · release not found) |
| 10 | DB permission model unknown or unverified |
| 11 | RLS/grant change required but not approved |
| 12 | Save cannot proceed without grant change **and** no approved permission phase exists |
| 13 | rollback target ambiguous (0 or >1 row match) |
| 14 | planning phase requires sending **operation=save** (forbidden) |
| 15 | no-op Save (`wouldWrite=false`) attempted |
| 16 | sliceId / approvalId / siteSlug / legacyId mismatch |
| 17 | supabase/functions edit attempted without scoped approval phase |

---

## 8. Implementation sequence (forward — not this phase)

| Phase | Scope |
| --- | --- |
| **G-20u36e-controlled-save-edge-save-path-planning** | **this doc — complete** |
| **G-20u36e-controlled-save-permission-preflight-planning** | SELECT-only grant/RLS inventory · choose write auth path · **recommended next** |
| G-20u36e-controlled-save-edge-save-path-tools-draft | Save branch + guards in tools draft only |
| G-20u36e-controlled-save-edge-save-path-root-placement | Copy to supabase/functions (scoped approval) |
| G-20u36e-controlled-save-edge-save-path-deploy-preflight | Deploy preflight doc |
| G-20u36e-controlled-save-execution | Operator one-shot Save + post-verify |

---

## 9. Next phase recommendation

| Candidate | Recommendation |
| --- | --- |
| **G-20u36e-controlled-save-permission-preflight-planning** | **Recommended first** — write authorization unresolved; Save arm blocked without grant/RLS clarity |
| G-20u36e-controlled-save-edge-save-path-tools-draft | **After permission preflight** — can draft guards in parallel but must not deploy/arm Save until permission path approved |

**Reason:** dryRun path proves diff logic · snapshot proves data · but **authenticated UPDATE grant = 0** means live Save will fail at DB layer unless permission model is resolved first. Coding Save guards without permission proof risks wasted deploy cycles or pressure to use forbidden service_role.

---

## 10. Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| SQL executed | **no** |
| Executable SQL blocks created | **no** |
| DB write | **no** |
| GRANT / REVOKE / RLS change | **no** |
| operation=save sent | **no** |
| Save executed | **no** |
| dryRun HTTP re-sent | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| service_role used | **no** |
| Save enabled on live Edge | **no** — still 400 reject |

---

## Verifier

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-edge-save-path-plan
```

Script: `scripts/verify-g20u36e-controlled-save-edge-save-path-plan.mjs`
