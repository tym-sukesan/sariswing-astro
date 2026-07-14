# G-20u36e — Gosaki Discography controlled Save handler permission-aware plan

**Phase:** `G-20u36e-controlled-save-handler-permission-aware-planning`  
**Status:** **complete** — planning only · **no Edge implementation / Save / Rollback / SQL**  
**Date:** 2026-07-14  
**Base commit:** `6124cb5`  
**Prior:** [rollback-name-adjustment-prep](./gosaki-discography-g20u36e-controlled-save-rollback-name-adjustment-prep.md) · [post-apply-result](./gosaki-discography-g20u36e-controlled-save-permission-change-post-apply-result.md)

| Check | Status |
| --- | --- |
| Planning only | **yes** |
| Edge implementation | **no** · なし |
| supabase/functions edited | **no** |
| operation=save | **not sent** · 未送信 |
| Save executed | **no** · 未実行 |
| Rollback executed | **no** · 未実行 |
| SQL executed | **no** · 未実行 |
| DB write | **no** |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |
| First controlled Save | **still not executed** |

---

## Gates

```txt
gosakiDiscographyControlledSaveHandlerPermissionAwarePlanPrepared: true
phase: G-20u36e-controlled-save-handler-permission-aware-planning
planningOnly: true
edgeImplementationExecuted: false
operationSaveSent: false
saveExecuted: false
rollbackExecuted: false
sqlExecuted: false
dbWriteExecuted: false
serviceRoleUsed: false
productionChanged: false
firstControlledSaveStillNotExecuted: true
recommendedNextPhase: G-20u36e-controlled-save-handler-permission-aware-implementation-prep
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta`  
**Production STOP:** `vsbvndwuajjhnzpohghh`  
**Observed restrictive policy:** `discography_tracks_g20u36e_controlled_save_title_update_restric` (length 63)

---

## 1. Existing handler read-only survey

**Sources (read-only · not edited):**

- `supabase/functions/gosaki-discography-save-dry-run/index.ts`
- `supabase/functions/gosaki-discography-save-dry-run/handler.ts`

### 1.1 operation / dryRun / readBack

| Topic | Current behavior |
| --- | --- |
| Allowed operation | **`dryRun` only** (`DRY_RUN_OPERATION`) |
| `operation=save` | **Hard rejected** in `validateDryRunRequest`, `handleDiscographyEdgeDryRunHttp`, and `handleDiscographyEdgeDryRunHttpAsync` with message: use dryRun only |
| Save approval ID | `SAVE_APPROVAL_ID = G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` is registered in `SAVE_APPROVAL_REGISTRY` for `operation: "save"` but **explicitly not accepted** on this dry-run endpoint |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` all **false** (`WRITE_FLAGS`) |
| dryRun semantics | Diff + `wouldWrite` prediction only · **no DB mutation** |
| readBack | Optional when `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED=true` · anon SELECT adapter |

### 1.2 Authorization / user JWT

| Topic | Current behavior |
| --- | --- |
| CORS | Allows `authorization` header |
| Request → handler | `index.ts` passes **method / contentType / body only** — **does not forward** `Authorization` |
| User JWT | **Not used** for dry-run or readBack |
| Authn / admin | **No** `is_admin()` / JWT probe in this Edge handler (admin probe lives in admin UI client path instead) |

### 1.3 Supabase client creation

| Path | How built | Auth |
| --- | --- | --- |
| readBack adapter | `createDefaultAnonSelectReadBackAdapter` with `SUPABASE_URL` + `SUPABASE_ANON_KEY` | `Authorization: Bearer ${anonKey}` + `apikey` |
| service_role | `SUPABASE_SERVICE_ROLE_CONNECTED = false` · **not connected** · payload scans reject `service_role` string |
| Write client | **None** | — |

### 1.4 Tracklist diff / changedLines

`validateDiscographyTrackListDryRun` computes:

- `added` / `removed` (multiset title rematch)
- `changedLines` (per-index before/after · kinds: changed / added / removed)
- `reordered` (same multiset, different order)
- `totalBefore` / `totalAfter`

`changedCounts` exposes `tracksAdded` / `tracksRemoved` / `tracksReordered` + `releaseFields`.

### 1.5 What must change for controlled Save (future · **not this phase**)

| Area | Required change direction |
| --- | --- |
| Gate | Controlled path accepting `operation=save` **only** with exact approvalId + sliceId + slice guards |
| Auth | Forward `Authorization: Bearer <operator JWT>`; build user-JWT client (`SUPABASE_URL` + `SUPABASE_ANON_KEY` + user JWT) |
| Admin | Call `rpc('is_admin')` · reject unless `true` |
| Write | Single-row `UPDATE` on `public.discography_tracks` **title only** under RLS + column grant |
| Diff gate | Require exactly one title change · no add/remove/reorder · release scalars unchanged |
| dryRun | Keep read-only path unchanged in spirit |
| readBack | Reuse SELECT-style verification **after** Save (prefer user JWT or known-safe SELECT) |
| index.ts | Must pass Authorization into handler · still no service_role |

---

## 2. Recommended implementation model

| Rule | Detail |
| --- | --- |
| No service_role | Never create service_role client · never bypass RLS |
| User JWT | Require incoming `Authorization: Bearer <operator JWT>` |
| Client | `SUPABASE_URL` + `SUPABASE_ANON_KEY` + **incoming Authorization** → authenticated user client |
| Save path | `operation=save` must succeed only via user JWT + RLS + `UPDATE(title)` grant + restrictive policy |
| Admin gate | Handler calls `public.is_admin()` · reject unless `true` |
| Anon / unauth | Reject missing/invalid JWT |
| Production / wrong site | Reject production ref · `siteSlug` must be `gosaki-piano` |
| Approvals | Require exact `approvalId` + exact `sliceId` |
| Slice lock | Any other album / track / title → reject |
| Column scope | Update **title only** on `public.discography_tracks` |
| Forbidden fields | No client `updated_at` · no `sort_order` · no release scalar · no track_number · no discography parent row |
| Structure | No track add / delete / reorder · no insert/delete/rebuild |
| Manual SQL UPDATE | Not the primary Save route |
| dryRun | Remains read-only |
| readBack | Used for post-Save verification |

---

## 3. Controlled Save payload conditions

Handler may allow `operation=save` **only** when all match:

| Field | Required value |
| --- | --- |
| `siteSlug` | `gosaki-piano` |
| `approvalId` | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| `sliceId` | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| discography legacy | `discography-002` |
| target row id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| `track_number` | `1` |
| before title | `On a Clear Day` |
| after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count before / after | **8** / **8** |
| track_7 | remains `Like a Lover` |
| release scalars | unchanged |
| semantic add/remove | none |
| changed lines | **exactly one** |
| changed field | **title only** |

---

## 4. DB update plan

| Item | Value |
| --- | --- |
| Shape | **single-row UPDATE only** |
| Table | `public.discography_tracks` |
| Payload | `{ title: 'On a Clear Day [CMS Kit staging G-20u36e]' }` |
| WHERE | `site_slug='gosaki-piano'` AND `discography_legacy_id='discography-002'` AND `track_number=1` AND `id='e30c5ea9-2857-492b-8a78-58cbfcbe7929'` AND `title='On a Clear Day'` |
| Client `updated_at` | **do not send** (DB trigger if any) |
| discography table | **no update** |
| insert / delete / rebuild | **forbidden** |
| Expected rows | **exactly 1** |
| 0 rows | conflict / already changed / permission miss → **STOP** |
| >1 rows | impossible → **STOP** |

### Post-update readBack expect

- title = `On a Clear Day [CMS Kit staging G-20u36e]`
- track_count = 8
- track_7_title = `Like a Lover`
- release scalars unchanged

---

## 5. Expected failure cases (handler must reject)

- missing Authorization
- invalid / expired JWT
- `is_admin()` false
- siteSlug / approvalId / sliceId / discographyLegacyId mismatch
- target row mismatch
- current title ≠ `On a Clear Day`
- requested title ≠ exact target string
- track count mismatch
- track_7 changed
- release scalar change
- add / delete / reorder
- service_role required / present
- DB update returns 0 rows
- RLS / permission denied
- `operation=save` without explicit controlled gate

---

## 6. Pre-save verification (SELECT-only · before First controlled Save)

Confirm still true:

- permission / RLS state still applied
- actual restrictive policy exists (`…_restric`)
- title UPDATE grant = **1**
- anon write = **0**
- target title still **old** (`On a Clear Day`)
- track_count = **8** · track_7 = `Like a Lover`
- operator JWT admin still **true**
- rollback actual policy name prepared

---

## 7. Post-save verification

After First controlled Save:

- target title = `On a Clear Day [CMS Kit staging G-20u36e]`
- target_row_count = 1
- track_count = 8 · track_7 = `Like a Lover`
- no added/removed tracks
- result shows **exactly one** controlled update
- permission remains open until **adjusted rollback** / close step
- next: **permission close** via adjusted rollback SQL — **not more edits**

---

## 8. Rollout sequence

1. handler permission-aware **planning** ← **this phase**
2. handler permission-aware **implementation-prep**
3. handler implementation + local/static verification
4. Edge deploy plan / review
5. Edge deploy (manual / controlled)
6. STG package / UI freshness if UI changes needed
7. pre-save SELECT-only verification
8. **first controlled Save** execution
9. post-save verification
10. permission close via **adjusted** rollback SQL
11. post-rollback verification
12. result record / commit

---

## 9. STOP conditions

Stop planning / implementation escalation if:

- service_role becomes necessary
- handler must update fields other than title
- handler needs delete / insert / rebuild
- Save possible without approvalId / sliceId
- any album / any track becomes updatable
- design bypasses RLS / permission denied
- target title already changed before Save
- permission / RLS state broken
- rollback actual policy name unverified
- `operation=save` sent before implementation
- production ref / path appears

---

## 10. Recommended next phase

```txt
G-20u36e-controlled-save-handler-permission-aware-implementation-prep
```

Prep concrete patch boundaries, gate constants (`sliceId`, row id, titles), and test checklist — **no Edge deploy / no Save** yet.

Alternative later split: `…-implementation-plan` if prep and detailed patch design should stay separate.

---

## Gate summary

```txt
gosakiDiscographyControlledSaveHandlerPermissionAwarePlanPrepared: true
planningOnly: true
edgeImplementationExecuted: false
saveExecuted: false
operationSaveSent: false
recommendedNextPhase: G-20u36e-controlled-save-handler-permission-aware-implementation-prep
```
