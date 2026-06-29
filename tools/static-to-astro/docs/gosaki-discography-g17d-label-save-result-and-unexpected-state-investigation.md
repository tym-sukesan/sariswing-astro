# G-17d-execution — Gosaki Discography label Save result + unexpected already-applied DB state investigation

**Phases:**

- `G-17d-execution-gosaki-discography-label-save-result` — label UPDATE **succeeded** (DB confirmed)
- `G-17d-execution-gosaki-discography-label-unexpected-state-investigation` — write timing unclear; Preview `no_changes` explained

**Status:** **complete** — afterVerification confirms target state; **no re-Save**; **no rollback**; documentation / code review only (no DB write in this phase)  
**Date:** 2026-06-29  
**Base commit:** `9016d5a`  
**Prior:** G-17d readiness fix (`gosaki-discography-g17d-label-save-readiness-investigation.md`)

| Check | Status |
| --- | --- |
| Label UPDATE succeeded in DB | **yes** |
| `updated_at` advanced from G-17c baseline | **yes** |
| Post-bridge-fix Preview wrote DB | **no** (`actualWrite: false`, `no_changes`) |
| Exact write click timing | **uncertain** — likely prior armed G-17d Save |
| Cursor Save / DB write | **no** |
| Re-Save needed | **no** |
| Rollback needed | **no** |
| Public reflection | **pending** (G-17e) |

---

## Gates

```txt
gosakiDiscographyG17cLabelSaveSuccess: true
gosakiDiscographyG17dLabelSaveExecutionComplete: true
gosakiDiscographyG17dUpdatedAtTriggerLiveProofSuccess: true
gosakiDiscographyG17dUnexpectedAlreadyAppliedStateInvestigationComplete: true
phase: G-17d-execution-gosaki-discography-label-save-result-and-unexpected-state-investigation
readyForG17eDiscographyLabelPublicReflectionPreflight: true
readyForG17cLabelSaveReExecution: false
readyForG17ePublicReflection: false
rollbackNeeded: false
rollbackSqlExecuted: false
cursorDbWriteExecuted: false
```

**Do not re-Save** `discography-004` / `label`.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only.

---

## 1. Git state (verified)

```txt
HEAD: 9016d5a
origin/main: 9016d5a
G-17d save readiness bridge fix: committed at 9016d5a
```

---

## 2. afterVerification SELECT (operator — read-only)

```sql
SELECT *
FROM public.discography
WHERE legacy_id = 'discography-004';
```

| Field | Value |
| --- | --- |
| **id** | `32b83506-8766-4cf6-9de7-40defbfc0b38` |
| **legacy_id** | `discography-004` |
| **title** | `Ja-Jaaaaan!` |
| **artist** | `新谷健介オノマトペ` |
| **label** | `Mardi Gras JAPAN Records` |
| **year** | `2015` |
| **release_date** | `2015-03-21` |
| **catalog_number** | `OMP-001` |
| **purchase_url** | `null` |
| **streaming_url** | `null` |
| **updated_at** | `2026-06-29T07:36:49.044397+00:00` |

### G-17d update success judgment

| Criterion | Result |
| --- | --- |
| Target field `label` | `null` (G-17c baseline) → **`Mardi Gras JAPAN Records`** |
| Other scalars unchanged | **yes** |
| `rowsAffected` (inferred) | **1** |
| `updated_at` advanced | **yes** — from `2026-06-05T17:39:44.201802+00:00` |
| Further Save required | **no** |
| Rollback required | **no** |

---

## 3. Post-bridge-fix Preview (operator — no intentional Save after fix)

Operator ran **`変更を確認`** only (claims no intentional **`更新する`** after bridge fix).

| Field | Value |
| --- | --- |
| `ok` | **false** |
| `dryRun` | **true** |
| `actualWrite` | **false** |
| `wouldWrite` | **false** |
| `target legacy_id` | `discography-004` |
| `changedFields` | — (empty) |
| `expectedBeforeUpdatedAt` | `2026-06-29T07:36:49.044397+00:00` |
| `stale` | **false** |
| `hostGatePassed` | **true** |
| `saveReadiness` | `no_changes` |
| `saveAllowed` | **false** |
| `before` | `{"label":"Mardi Gras JAPAN Records"}` |
| `after` | `{"label":"Mardi Gras JAPAN Records"}` |
| `guardErrors` | none |

**Interpretation:** Preview correctly detected **no pending change** — DB / snapshot / form already show the target label.

---

## 4. Preview `no_changes` vs DB already-applied — consistency

| Layer | `label` value | `updated_at` |
| --- | --- | --- |
| G-17c preflight baseline | `null` | `2026-06-05T17:39:44.201802+00:00` |
| Live DB (afterVerification) | `Mardi Gras JAPAN Records` | `2026-06-29T07:36:49.044397+00:00` |
| Preview `beforeSnapshot` | `Mardi Gras JAPAN Records` | `2026-06-29T07:36:49.044397+00:00` |
| Form input | `Mardi Gras JAPAN Records` | — |

Dry-run compares `selectedRowSnapshot.label` vs form `label` (`computeDiscographyScalarSliceChangedFields`). When both equal the target string, `changedFields` is empty → `ok: false`, `saveReadiness: no_changes`, `wouldWrite: false`.

`stale: false` because `checkDiscographyRowStale` found live `updated_at` matches snapshot baseline (`2026-06-29…`) — consistent with **post-Save** state, not pre-Save G-17c baseline.

---

## 5. Code-only investigation (read-only)

### Q1. Could Preview have triggered actual Save?

**No.** `wireDryRunPreview()` → `runDryRunPreview()` only. `runSave()` is bound to **`更新する`** (`gosaki-disc-update-btn`) separately.

### Q2. Does `executeDiscographyScalarSliceDryRun` call write paths?

**No.** It does not import or call `updateDiscographyWrite` or `executeDiscographyScalarSliceSave`. Return value hardcodes:

```txt
safety.supabaseWriteCalled: false
safety.writeAdapterUsed: false
safety.actualWrite: false
```

Only `executeDiscographyScalarSliceSave` → `updateDiscographyWrite` performs UPDATE (via `runSave`).

### Q3. Did bridge fix change `beforeSnapshot` source?

**No meaningful change to snapshot source.** Bridge fix added G-17c **save-page-config** DOM injection + `getG17cDiscographyLabelSaveConfig()` for **Save readiness** only. Preview still uses:

- `selectedRowSnapshot` from SSR `data-discography-rows` JSON and/or list `data-label` / `data-updated-at` attributes
- `readDiscographyDryRunFormValues(form)` for form side

After a successful Save (or fresh page load with Supabase read), snapshot already contains the new `label` and `updated_at`.

### Q4. When did the write likely happen?

**Most likely hypothesis (high confidence):** A **prior armed G-17d Save** (`更新する`) in the same or earlier operator session **after** the readiness bridge fix enabled `ready_to_save`.

**Evidence:**

| Evidence | Detail |
| --- | --- |
| `updated_at` | `2026-06-29T07:36:49.044397+00:00` — trigger-fired timestamp **before** post-fix Preview |
| Preview baseline | Already post-Save `updated_at`, not G-17c `2026-06-05…` |
| Admin UI after Save | `runSave` success path sets `selectedRowSnapshot = outcome.afterSnapshot` (includes new label + `updated_at`) |
| Operator session log | Prior operator report: Save succeeded, admin UI showed label, SELECT confirmed |

**Alternative hypotheses (low confidence):**

| Hypothesis | Assessment |
| --- | --- |
| Preview path wrote | **Ruled out** by code |
| Cursor / script write | **Ruled out** — not executed |
| External SQL | No evidence; operator SELECT-only verification |
| Bridge fix auto-write | **Ruled out** — config bridge is read-only env merge |

**Timing uncertainty:** Operator may not recall a single **`更新する`** click after bridge fix when `saveAllowed` first became `true`. The DB timestamp is the authoritative write marker.

### Q5. Further Save / rollback?

| Item | Decision |
| --- | --- |
| Further Save | **not needed** — target state achieved |
| Rollback | **not needed** — intentional G-17c target value |
| Re-Save | **prohibited** — chain closed |

---

## 6. updated_at trigger live proof

| Item | Value |
| --- | --- |
| Trigger | `discography_set_updated_at` (staging, since G-15b-f8) |
| Before (G-17c baseline) | `2026-06-05T17:39:44.201802+00:00` |
| After (live) | `2026-06-29T07:36:49.044397+00:00` |
| Prior proofs | G-15d (`003`), G-16a (`001`) |
| G-17d proof | **satisfied** on `discography-004` |

---

## 7. Public reflection (G-17e — next)

| Item | Value |
| --- | --- |
| Required? | **yes** (later phase) |
| Reason | Public `/discography/` Ja-Jaaaaan! Release line shows label from Wix HTML; DB now matches — hook should read Supabase `label` for consistency |
| Current hook | `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` — `purchase_url` + `artist` only |
| This phase | No regen / no upload |

---

## 8. Backlog (known issue — unchanged)

Post-Save admin header may still show `Save: disabled` / `DB write: disabled` while DB is correct. Display only — see prior execution notes. UI status refresh deferred.

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g17d-gosaki-discography-label-save-result-and-unexpected-state-investigation.mjs
```

---

## 10. Related docs

| Doc | Role |
| --- | --- |
| `gosaki-discography-g17d-label-save-readiness-investigation.md` | Bridge fix root cause |
| `gosaki-discography-g17c-label-dry-run-result-and-g17d-save-final-preflight.md` | Pre-execution preflight |
| `gosaki-discography-g17d-label-save-execution-result.md` | Operator session log (draft — superseded by this investigation for timing analysis) |
