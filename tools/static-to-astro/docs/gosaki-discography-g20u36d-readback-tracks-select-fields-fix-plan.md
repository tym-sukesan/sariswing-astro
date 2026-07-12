# G-20u36d — Gosaki Discography Edge dry-run readBack tracks SELECT fields fix plan

**Phase:** `G-20u36d-readback-tracks-select-fields-fix-planning`  
**Status:** **complete** — fix planning doc only · **no root/tools draft edit / Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `6e677cf`  
**Prior:** G-20u36d readBack live verify retry · PARTIAL STOP · tracks SELECT 400

| Check | Status |
| --- | --- |
| Fix plan doc | **yes** (this file) |
| Root `supabase/functions/**` edited | **no** |
| Tools draft handler edited | **no** |
| readBack lib edited | **no** |
| Edge Function redeployed | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| service_role used | **no** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackTracksSelectFieldsFixPlanPrepared: true
phase: G-20u36d-readback-tracks-select-fields-fix-planning
planOnly: true
rootEditExecuted: false
toolsDraftEditExecuted: false
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
proceedToToolsDraftFix: true
proceedToRootPlacement: false
proceedToEdgeDeploy: false
proceedToLiveVerifyRetry2: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-select-fields-fix-planning scope:** plan doc + verifier only. No code fix, no deploy, no SQL, no Save enablement, no admin UI change.

---

## STOP cause (from live verify retry)

| Observation | Status |
| --- | --- |
| `readBack.enabled` | **true** — PASS |
| `readBack.source` | **`supabase-select`** — PASS |
| `readBack.releaseFound` | **true** — PASS |
| Release SELECT internal `id` | **PASS** — release-id fix deployed |
| Tracks SELECT reached | **yes** — progress vs prior live verify |
| Tracks SELECT HTTP status | **400** — STOP |
| PostgREST error | **`42703`** — `column discography_tracks.duration does not exist` |
| `readBack.trackCount` | **0** — STOP (expected **8** for `discography-002`) |
| matching dryRun | **400** — `empty track list blocked` |
| +1 track dryRun | **200** — `wouldWrite=true` · `tracksAdded=1` — PASS |
| operation=save | **400** reject — PASS |
| write flags | **all false** — PASS (not a dangerous failure) |

**Root cause:** `TRACK_SELECT_FIELDS` includes **`duration`**, but staging table **`public.discography_tracks` has no `duration` column**. PostgREST rejects the SELECT → handler warning `readBack: anon SELECT tracks failed (400)` → empty tracks → `trackCount=0` → matching payload `tracksText` empty → **400** `empty track list blocked`.

**Safety note:** write flags remained **false** throughout live verify retry. This is a readBack SELECT field-list bug, not a write-path regression. **Do not proceed** to G-20u36e controlled Save planning until live verify retry **PASS** after this fix.

---

## Progress vs prior STOP (release-id fix)

| Step | Prior live verify | Live verify retry |
| --- | --- | --- |
| Release anon SELECT | OK | OK |
| Internal `id` in release row | missing (old deploy) | **present** |
| Tracks anon SELECT attempted | skipped | **yes** |
| Tracks anon SELECT result | N/A | **400** (`duration` column) |

Release-id fix is **complete**. Remaining blocker is **tracks SELECT field list vs staging schema**.

---

## Current code (bug location — read-only review)

| File | Issue |
| --- | --- |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` | `TRACK_SELECT_FIELDS` includes **`duration`** |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | same |
| `tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` | same in path builder |

**Current `TRACK_SELECT_FIELDS` (bug):**

```txt
track_number, title, duration, sort_order, site_slug
```

**Staging `public.discography_tracks` columns confirmed usable for readBack (live + migration baseline):**

| Column | In staging | Used by readBack |
| --- | --- | --- |
| `release_id` | **yes** | filter only (not in SELECT list) |
| `track_number` | **yes** | sort + ordering |
| `title` | **yes** | `tracksText` baseline |
| `sort_order` | **yes** | sort tie-break |
| `site_slug` | **yes** | filter + row scope |
| **`duration`** | **no** | **must not SELECT** |

**Note:** Early planning doc (`g20u36d-discography-edge-dry-run-readback-enhancement-plan.md`) assumed `duration` existed — **staging reality overrides**. Prefer **code fix (remove from SELECT)** over **SQL migration (add column)** in this phase.

---

## Fix design

### A. `TRACK_SELECT_FIELDS` — remove `duration`

| Item | Value |
| --- | --- |
| Change | Remove **`duration`** from PostgREST `select=` list |
| Proposed fields | **`track_number`, `title`, `sort_order`, `site_slug`** |
| Rationale | Match staging schema · anon SELECT must not reference absent columns |

### B. `duration` — optional / absent

| Item | Value |
| --- | --- |
| Row mapping | Do **not** require `duration` on track rows |
| `mapTrackRowsToTracksText()` | Uses **`title` only** — no change needed |
| `sortTrackRows()` | Uses **`track_number`** + **`sort_order`** — no change needed |
| Mock fixture | May keep `duration: null` on in-memory objects — **not** in PostgREST SELECT |
| Future schema | If `duration` is added later, SELECT list update is a **separate optional phase** |

### C. Unchanged (sanitized output + safety)

| Function / policy | Rule |
| --- | --- |
| `buildSanitizedReadBackSummary()` | **6 fields only** — no UUID · no raw rows |
| HTTP `readBack` | sanitized summary only |
| Admin UI | **no change** in fix phases |
| Auth | **anon SELECT** via PostgREST GET · `SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | **not referenced** |
| `operation=save` | **rejected** |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| Staging ref | `kmjqppxjdnwwrtaeqjta` only |
| Production STOP | `vsbvndwuajjhnzpohghh` — **forbidden** |

---

## Mock / verifier expectations (implementation phases)

| Case | readBack.trackCount | wouldWrite | tracksAdded | Notes |
| --- | --- | --- | --- | --- |
| **matching payload** (`discography-002`) | **8** | **false** | **0** | requires mock/live tracks SELECT without `duration` |
| **+1 track** | 8 (baseline) | **true** | **1** | diff on title lines |
| **schema-only baseline** | — | may true (false positive) | — | readBack disabled path unchanged |
| **operation=save** | — | — | — | **400 reject** |
| **write flags** | — | — | — | **all false** |

---

## Implementation sequence (next phases — not this phase)

| # | Phase | Scope |
| --- | --- | --- |
| 1 | **G-20u36d-readback-tracks-select-fields-fix-tools-draft** | tools draft handler + readback lib · remove `duration` from SELECT |
| 2 | **G-20u36d-readback-tracks-select-fields-fix-root-placement** | scope exception · copy to root `index.ts` + `handler.ts` |
| 3 | **G-20u36d-readback-tracks-select-fields-fix-edge-deploy** | operator staging redeploy |
| 4 | **G-20u36d-readback-live-verify-retry-2** | direct endpoint · expect `trackCount=8` · matching **200** |
| 5 | **G-20u36e-controlled-save-planning** | **only after** live verify retry-2 **PASS** |

Optional parallel (only if needed after retry-2): **G-20u36d-admin-sanitizer-readback-summary-update** — admin display only.

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Fix requires **adding `duration` column** via SQL migration | **STOP** — prefer SELECT fix; migration needs separate approval |
| SQL migration / ALTER TABLE required | **STOP** |
| `SUPABASE_SERVICE_ROLE_KEY` required for readBack | **STOP** |
| anon SELECT no longer viable | **STOP** |
| Response must expose raw DB rows / UUID | **STOP** |
| Mutation (`insert` / `update` / `delete` / `upsert` / `rpc`) required | **STOP** |
| `operation=save` must succeed | **STOP** |
| Write flags must become true | **STOP** |
| Production ref `vsbvndwuajjhnzpohghh` in target | **STOP** |
| Save enablement required | **STOP** |
| Admin UI change required before deploy | **STOP** (unless separate sanitizer phase) |
| FTP upload required | **STOP** |

**Preferred fix path:** remove `duration` from `TRACK_SELECT_FIELDS` — **no DB schema change**.

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Tools draft / root handler edit | **not executed** |
| Edge Function deploy | **not executed** |
| SQL / migration | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP upload | **not executed** |
| Live HTTP verify | **not executed** (recorded in prior retry doc) |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-select-fields-fix-plan
npm run verify:g20u36d-readback-live-verify-retry
npm run verify:g20u36d-readback-release-id-select-fix-edge-deploy-result
```

Historical verifiers — not in active regression suite.
