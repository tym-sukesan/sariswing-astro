# G-20u36d — Gosaki Discography Edge dry-run readBack release id SELECT fix (root placement)

**Phase:** `G-20u36d-readback-release-id-select-fix-root-placement`  
**Status:** **complete** — root source placed · **no Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `49791bd`  
**Prior:** G-20u36d readBack release-id select fix tools draft

| Check | Status |
| --- | --- |
| Root release-id fix placed | **yes** |
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
gosakiDiscographyEdgeDryRunReadBackReleaseIdSelectFixRootPlaced: true
phase: G-20u36d-readback-release-id-select-fix-root-placement
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
proceedToEdgeDeploy: true
proceedToLiveVerifyRetry: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack release-id-select-fix root-placement scope:** copy tools draft release-id fix to root only. No deploy, no SQL, no Save enablement, no admin UI change.

---

## Problem (live verify PARTIAL STOP — pre-fix deployed Edge)

| Observation | Status |
| --- | --- |
| readBack.enabled / source / releaseFound | **PASS** |
| readBack.trackCount | **0** — STOP (expected **8**) |
| matching dryRun | **400** — empty track list blocked |
| write flags | **all false** |

**Cause:** deployed Edge `RELEASE_SELECT_FIELDS` omitted internal `id` → tracks SELECT skipped.

---

## Fix placed (root source)

### A. `RELEASE_SELECT_FIELDS` — internal `id`

| Item | Value |
| --- | --- |
| Change | Prepend **`id`** to PostgREST `select=` list |
| Purpose | Resolve `release_id` for tracks anon SELECT |
| Exposure | **internal only** — not in snapshot release · not in readBack summary |

### B. `resolveReadBackSnapshot()` — tracks lookup + safe fallback

| Condition | Behavior |
| --- | --- |
| release row missing | empty snapshot · `releaseFound=false` |
| release row without `id` | warning · empty tracks · **no id in response** |
| release row with `id` | fetch tracks via `release_id=eq.{id}` |
| tracks SELECT failure | warning · empty tracks · **no id in response** |

### C. Unchanged (sanitized output)

| Function | Rule |
| --- | --- |
| `mapReleaseRowToCurrentSnapshotRelease()` | **No `id`** in snapshot release |
| `buildSanitizedReadBackSummary()` | **6 fields only** — no UUID |
| HTTP `readBack` | sanitized summary only |
| Admin UI | **no change** |
| `operation=save` | **reject** |
| Write flags | **all false** |

---

## Copy map (executed)

| Copy from (tools draft) | Copy to (repo root) |
| --- | --- |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | `supabase/functions/gosaki-discography-save-dry-run/index.ts` |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |

**Not copied:** `tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` (verifier/mock only)

---

## Scope exception

| Rule | Value |
| --- | --- |
| Allowed root edits | **`supabase/functions/gosaki-discography-save-dry-run/index.ts`** · **`handler.ts` only** |
| Other `supabase/functions/**` | **unchanged** |
| Intentional diff from tools draft | **header comments + phase constant names only** |

---

## Live endpoint note

**Deployed staging Edge still runs pre-fix code** until **G-20u36d-readback-release-id-select-fix-edge-deploy** with operator approval. Root placement alone does not change live behavior — live verify PARTIAL STOP (trackCount=0 / matching 400) is expected until redeploy.

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge deploy | **NOT EXECUTED** |
| Supabase CLI deploy | **NOT EXECUTED** |
| SQL / migration | **NOT EXECUTED** |
| DB write | **NOT EXECUTED** |
| Save enablement | **NOT EXECUTED** |
| Admin UI change | **NOT EXECUTED** |
| FTP upload | **NOT EXECUTED** |
| service_role | **NOT USED** |

---

## Next phase

**G-20u36d-readback-release-id-select-fix-edge-deploy** — operator redeploy staging Edge · then **G-20u36d-readback-live-verify-retry**.

**Do not proceed** to G-20u36e controlled Save planning until live verify retry **PASS**.
