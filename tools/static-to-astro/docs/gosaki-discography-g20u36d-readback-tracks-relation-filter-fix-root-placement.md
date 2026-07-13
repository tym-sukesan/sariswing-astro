# G-20u36d — Gosaki Discography Edge dry-run readBack tracks relation filter fix root placement

**Phase:** `G-20u36d-readback-tracks-relation-filter-fix-root-placement`  
**Status:** **complete** — root source placed · **no Edge deploy / SQL / Save enablement** · service_role **not used**  
**Date:** 2026-07-13  
**Base commit:** `a4b6973`  
**Prior:** G-20u36d readBack tracks relation filter fix tools draft

| Check | Status |
| --- | --- |
| Root placement doc | **yes** (this file) |
| Root `supabase/functions/**` edited | **yes** — scope exception **2 files only** |
| Tools draft source | **unchanged** (already complete) |
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
gosakiDiscographyEdgeDryRunReadBackTracksRelationFilterFixRootPlaced: true
phase: G-20u36d-readback-tracks-relation-filter-fix-root-placement
rootPlacementOnly: true
rootSupabaseFunctionsChanged: true
rootSupabaseFunctionsScopeExceptionFiles: 2
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
releaseIdFilterRemovedFromRoot: true
discographyLegacyIdFilterPlacedInRoot: true
liveEndpointStillPreFixUntilRedeploy: true
proceedToEdgeDeployPreflight: true
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-relation-filter-fix-root-placement scope:** copy tools draft filter fix to root handler only. No deploy, no SQL, no Save enablement.

---

## Scope exception (root placement)

| File | Action |
| --- | --- |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` | **placed** — tracks filter fix |
| `supabase/functions/gosaki-discography-save-dry-run/index.ts` | **placed** — header comment only |

**All other** `supabase/functions/**` — **unchanged**

---

## Copy source → target

| From | To |
| --- | --- |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | `supabase/functions/gosaki-discography-save-dry-run/index.ts` |

ReadBack-related logic **matches** tools draft after normalization (phase constant names differ).

---

## Filter fix placed in root

### Before (pre-placement)

```txt
/rest/v1/discography_tracks?site_slug=eq.{siteSlug}&release_id=eq.{uuid}&select=...
```

### After (root placed)

```txt
/rest/v1/discography_tracks?site_slug=eq.{siteSlug}&discography_legacy_id=eq.{legacyId}&select=...
```

| Item | Root behavior |
| --- | --- |
| `release_id` filter | **removed** |
| `discography_legacy_id` filter | **yes** |
| `site_slug` filter | **maintained** |
| `fetchTracks` input | `{ siteSlug, legacyId }` |
| `releaseRow.id` / UUID for tracks | **not used** |
| `TRACK_SELECT_FIELDS` | `track_number, title, sort_order, site_slug` — no `duration` / `release_id` |
| `discography_legacy_id` in SELECT list | **no** — filter only |

---

## Safety (unchanged)

| Check | Status |
| --- | --- |
| `operation=save` | **400 reject** |
| Write flags | `didWrite=false` · `dbWrite=false` · `networkWrite=false` · `saveEnabled=false` |
| `SUPABASE_SERVICE_ROLE_KEY` | **not referenced** |
| `createClient` | **not used** |
| DB mutations | **none** |
| Sanitized readBack summary | **no UUID** · no raw rows · no secrets |

---

## Live endpoint status

Root source is **placed** but **NOT redeployed**. Staging Edge endpoint **`gosaki-discography-save-dry-run`** still runs **pre-fix code** until operator deploy in a future phase.

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge deploy | **not executed** |
| SQL / DB write | **not executed** |
| Save enablement | **not executed** |
| Live verify retry-3 | **not executed** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-tracks-relation-filter-fix-edge-deploy-preflight** | Deploy preflight for operator |
| Operator Edge deploy | Staging `kmjqppxjdnwwrtaeqjta` |
| **G-20u36d-readback-live-verify-retry-3** | Live HTTP verify |
| **G-20u36e-controlled-save-planning** | After retry-3 PASS |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-relation-filter-fix-root-placement
npm run verify:g20u36d-readback-tracks-relation-filter-fix-tools-draft
npm run verify:g20u36d-readback-tracks-relation-filter-fix-plan
npm run verify:current-active-regression
```
