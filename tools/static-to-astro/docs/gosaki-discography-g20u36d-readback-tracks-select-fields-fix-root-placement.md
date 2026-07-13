# G-20u36d — Gosaki Discography Edge dry-run readBack tracks SELECT fields fix (root placement)

**Phase:** `G-20u36d-readback-tracks-select-fields-fix-root-placement`  
**Status:** **complete** — root source placed · **no Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `6cf991d`  
**Prior:** G-20u36d readBack tracks SELECT fields fix tools draft

| Check | Status |
| --- | --- |
| Root tracks-select-fields fix placed | **yes** |
| Scope exception files | **2 only** — index.ts + handler.ts |
| Other `supabase/functions/**` changed | **no** |
| Edge Function redeployed | **no** — Cursor did not deploy |
| Supabase CLI deploy | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Secrets printed | **no** |
| service_role used | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackTracksSelectFieldsFixRootPlaced: true
phase: G-20u36d-readback-tracks-select-fields-fix-root-placement
rootPlacementOnly: true
scopeExceptionFiles: 2
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
liveEndpointStillPreFix: true
proceedToEdgeDeployPreflight: true
proceedToLiveVerifyRetry2: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-select-fields-fix root-placement scope:** copy tools draft tracks SELECT fix to root only. No deploy, no SQL, no Save enablement, no admin UI change.

---

## Problem (live verify retry PARTIAL STOP — pre-fix deployed Edge)

| Observation | Status |
| --- | --- |
| readBack.enabled / source / releaseFound | **PASS** |
| Release internal `id` | **PASS** |
| Tracks SELECT reached | **yes** |
| Tracks SELECT | **400** — PostgREST **`42703`** |
| Error | `column discography_tracks.duration does not exist` |
| readBack.trackCount | **0** — STOP (expected **8**) |
| matching dryRun | **400** |
| write flags | **all false** |

**Cause:** deployed Edge `TRACK_SELECT_FIELDS` included **`duration`** but staging `public.discography_tracks` has no `duration` column.

---

## Fix placed (root source)

### A. `TRACK_SELECT_FIELDS` — remove `duration`

| Before | After |
| --- | --- |
| `track_number, title, duration, sort_order, site_slug` | **`track_number, title, sort_order, site_slug`** |

### B. `duration` — optional / absent

| Item | Rule |
| --- | --- |
| PostgREST SELECT | **no `duration`** |
| `mapTrackRowsToTracksText()` | uses **`title` only** — unchanged |
| `sortTrackRows()` | uses **`track_number`** + **`sort_order`** — unchanged |

### C. Unchanged (sanitized output + safety)

| Policy | Rule |
| --- | --- |
| readBack summary | 6 fields only · no UUID · no raw rows |
| `operation=save` | **reject** |
| Write flags | **all false** — `didWrite: false` · `dbWrite: false` · `networkWrite: false` · `saveEnabled: false` |
| Auth | **anon SELECT** only |
| `service_role` | **not used** |

---

## Copy source → target

| Source | Target |
| --- | --- |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | `supabase/functions/gosaki-discography-save-dry-run/index.ts` |

**Scope exception:** exactly **2 files** under `supabase/functions/gosaki-discography-save-dry-run/`.

---

## Live endpoint status

**Live endpoint still runs pre-fix code** until operator Edge redeploy in a separate phase. Root placement does **not** change deployed behavior.

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function deploy | **not executed** |
| SQL / migration | **not executed** |
| DB write | **not executed** |
| Live HTTP verify retry-2 | **not executed** |

---

## Next phase

**G-20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight** — deploy preflight for tracks SELECT fields fix redeploy on staging ref `kmjqppxjdnwwrtaeqjta`.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-select-fields-fix-root-placement
npm run verify:g20u36d-readback-tracks-select-fields-fix-tools-draft
npm run verify:g20u36d-readback-tracks-select-fields-fix-plan
```
