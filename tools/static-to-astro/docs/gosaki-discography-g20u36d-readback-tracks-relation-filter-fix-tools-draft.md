# G-20u36d — Gosaki Discography Edge dry-run readBack tracks relation filter fix tools draft

**Phase:** `G-20u36d-readback-tracks-relation-filter-fix-tools-draft`  
**Status:** **complete** — tools draft filter fix only · **no root edit / Edge deploy / SQL / Save enablement** · service_role **not used**  
**Date:** 2026-07-13  
**Base commit:** `4b79db8`  
**Prior:** G-20u36d readBack tracks relation filter fix planning · inspection result · `discography_legacy_id` confirmed

| Check | Status |
| --- | --- |
| Tools draft fix | **yes** |
| Root `supabase/functions/**` edited | **no** |
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
gosakiDiscographyEdgeDryRunReadBackTracksRelationFilterFixToolsDraftImplemented: true
phase: G-20u36d-readback-tracks-relation-filter-fix-tools-draft
toolsDraftOnly: true
rootSupabaseFunctionsChanged: false
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
releaseIdFilterRemovedFromToolsDraft: true
discographyLegacyIdFilterImplemented: true
proceedToRootPlacement: true
proceedToEdgeDeploy: false
proceedToLiveVerifyRetry3: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-relation-filter-fix-tools-draft scope:** tools draft + readback lib only. No root placement, no deploy, no SQL, no Save enablement.

---

## Problem (from inspection result)

| Item | Value |
| --- | --- |
| Wrong filter | `release_id=eq.{releaseRow.id}` |
| Staging column `release_id` | **absent** |
| Correct relation | `discography_tracks.discography_legacy_id` = `discography.legacy_id` |
| Join match | **8/8** for `discography-002` |
| DB migration | add `release_id` — **not required** |

---

## Filter fix (tools draft)

### Before

```txt
/rest/v1/discography_tracks?site_slug=eq.{siteSlug}&release_id=eq.{uuid}&select=...
```

### After

```txt
/rest/v1/discography_tracks?site_slug=eq.{siteSlug}&discography_legacy_id=eq.{legacyId}&select=...
```

| Filter | Source |
| --- | --- |
| `site_slug` | request / readBack input `siteSlug` |
| `discography_legacy_id` | request / readBack input `legacyId` |

**Removed:** `releaseRow.id` / UUID from tracks relation path.

---

## Files changed (tools draft only)

| File | Change |
| --- | --- |
| `scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` | Path builder · adapter · mock · `resolveReadBackSnapshot` |
| `scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | Same filter fix · type signature |
| `scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | Header comment only |

---

## `resolveReadBackSnapshot` behavior

| Step | Behavior |
| --- | --- |
| Release lookup | **`site_slug` + `legacy_id`** — unchanged |
| Tracks lookup | **`site_slug` + `discography_legacy_id`** via input `legacyId` |
| `releaseRow.id` gate | **removed** — tracks no longer depend on internal UUID |
| Sanitized summary | **no UUID** — `legacyId` + `siteSlug` only |

---

## `TRACK_SELECT_FIELDS` policy (unchanged)

```txt
track_number, title, sort_order, site_slug
```

| Field | In SELECT? |
| --- | --- |
| `duration` | **no** |
| `release_id` | **no** |
| `discography_legacy_id` | **no** — **filter only** (PostgREST filter; raw rows not returned) |

---

## Mock dry-run expectations (verifier)

| Case | Expected |
| --- | --- |
| **matching dryRun** | `ok=true` · `readBack.trackCount=8` · `wouldWrite=false` · `tracksAdded=0` |
| **+1 track dryRun** | `wouldWrite=true` · `tracksAdded=1` |
| **schema-only baseline** | `wouldWrite=true` (false positive preserved) |
| **operation=save** | **400 reject** |
| **write flags** | `didWrite=false` · `dbWrite=false` · `networkWrite=false` · `saveEnabled=false` |

---

## Generalization note

| Topic | Note |
| --- | --- |
| Gosaki | Uses **`discography_legacy_id`** as tracks relation key |
| Other sites | Relation column may differ |
| Future | Site profile / schema mapping for `tracksRelationKey` |
| This sprint | Gosaki readBack safe fix in tools draft — explicit filter change |

---

## Root / live endpoint

Root `supabase/functions/gosaki-discography-save-dry-run/handler.ts` **unchanged** — still uses `release_id=eq.{uuid}`. Live staging endpoint **pre-fix** until root placement + Edge deploy.

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Root placement | **not executed** |
| Edge deploy | **not executed** |
| SQL / DB write | **not executed** |
| Save enablement | **not executed** |
| Live verify retry-3 | **not executed** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-tracks-relation-filter-fix-root-placement** | Copy tools draft → root handler |
| Edge deploy preflight → operator deploy | Staging |
| **G-20u36d-readback-live-verify-retry-3** | Live HTTP verify |
| **G-20u36e-controlled-save-planning** | After retry-3 PASS |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-relation-filter-fix-tools-draft
npm run verify:g20u36d-readback-tracks-relation-filter-fix-plan
npm run verify:g20u36d-readback-tracks-relation-column-inspection-result
npm run verify:current-active-regression
```
