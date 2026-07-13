# G-20u36d — Gosaki Discography Edge dry-run readBack tracks relation filter fix plan

**Phase:** `G-20u36d-readback-tracks-relation-filter-fix-planning`  
**Status:** **complete** — fix planning doc only · **no root/tools draft edit / Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `3a8a655`  
**Prior:** G-20u36d readBack tracks relation column inspection result · `discography_legacy_id` confirmed

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
gosakiDiscographyEdgeDryRunReadBackTracksRelationFilterFixPlanPrepared: true
phase: G-20u36d-readback-tracks-relation-filter-fix-planning
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
releaseIdFilterIncorrect: true
tracksRelationColumn: discography_legacy_id
dbMigrationForReleaseIdRequired: false
proceedToToolsDraftFix: true
proceedToRootPlacement: false
proceedToEdgeDeploy: false
proceedToLiveVerifyRetry3: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-relation-filter-fix-planning scope:** plan doc + verifier only. No code fix, no deploy, no SQL, no Save enablement.

---

## STOP cause (from inspection result + live verify retry-2)

| Observation | Status |
| --- | --- |
| `readBack.enabled` / `source` / `releaseFound` | **PASS** |
| Duration column issue | **resolved** |
| Tracks SELECT filter (current code) | **`release_id=eq.{uuid}`** — **incorrect** |
| Staging column `release_id` | **absent** |
| PostgREST error | **`42703`** — `discography_tracks.release_id does not exist` |
| `readBack.trackCount` | **0** (expected **8**) |
| matching dryRun | **400** |
| +1 track dryRun | **200** · `wouldWrite=true` · `tracksAdded=1` |
| operation=save | **400 reject** |
| write flags | **all false** |

**Root cause:** Edge readBack uses **`releaseRow.id` (internal UUID)** to filter tracks via non-existent column **`release_id`**. Staging schema relates tracks via **`discography_legacy_id`** → **`discography.legacy_id`**.

---

## Inspection result summary (input to this plan)

| Item | Value |
| --- | --- |
| Tracks actual columns | `id`, `discography_legacy_id`, `track_number`, `title`, `sort_order`, `created_at`, `site_slug` |
| Absent columns | `release_id`, `discography_id`, `album_id`, `duration` |
| FK count | **0** |
| Index | **`discography_tracks_legacy_id_idx`** present |
| Parent (`discography-002`) | `site_slug=gosaki-piano` · `title=SKYLARK` · `parent_row_count=1` |
| Join match | **`tracks_matching_discography_legacy_id_in_json = 8`** |
| `tracks_with_release_id_key_in_json` | **0** |

**Confirmed relation:** **`discography_tracks.discography_legacy_id = discography.legacy_id`**

**DB migration:** add `release_id` column — **not required at this time**

---

## Planned filter fix

### Before (incorrect)

```txt
GET /rest/v1/discography_tracks
  ?site_slug=eq.{siteSlug}
  &release_id=eq.{releaseRow.id}
  &select=track_number,title,sort_order,site_slug
```

### After (planned)

```txt
GET /rest/v1/discography_tracks
  ?site_slug=eq.{siteSlug}
  &discography_legacy_id=eq.{legacyId}
  &select=track_number,title,sort_order,site_slug
  &order=track_number.asc.nullslast,sort_order.asc.nullslast
```

| Filter | Value |
| --- | --- |
| `site_slug` | target **`siteSlug`** (e.g. `gosaki-piano`) |
| `discography_legacy_id` | target **`legacyId`** (e.g. `discography-002`) |

**Do not use** `releaseRow.id` / internal UUID for tracks SELECT.

---

## Release row lookup (unchanged intent)

| Step | Plan |
| --- | --- |
| Release existence | Continue anon SELECT on **`discography`** with **`site_slug` + `legacy_id`** |
| `releaseFound` | **true** when release row exists |
| Internal `id` on release row | May remain in **`RELEASE_SELECT_FIELDS`** for internal use if needed elsewhere — **not used for tracks relation** |
| Tracks fetch trigger | After release found, fetch tracks using **same `legacyId`** passed to readBack — **not `releaseRow.id`** |

**Planned simplification in `resolveReadBackSnapshot`:** remove gate that skips tracks when `releaseRow.id` is missing; tracks filter uses **`legacyId`** from input, independent of UUID.

---

## `TRACK_SELECT_FIELDS` policy (planned — unchanged list)

```txt
track_number, title, sort_order, site_slug
```

| Field | In SELECT? | Notes |
| --- | --- | --- |
| `track_number` | **yes** | sort + diff |
| `title` | **yes** | `tracksText` / diff |
| `sort_order` | **yes** | sort |
| `site_slug` | **yes** | staging schema column |
| `duration` | **no** | column absent on staging |
| `release_id` | **no** | column absent · wrong relation |
| `discography_legacy_id` | **no** | **filter only** — not needed in `select=` because sanitized readBack does not expose raw track rows; PostgREST filter works without selecting the filter column |

**Verifier policy:** `discography_legacy_id` is a **filter parameter only**, not a SELECT field, unless a future phase requires raw row echo (not planned).

---

## Sanitized readBack summary (no UUID exposure)

Current `buildSanitizedReadBackSummary` returns:

```txt
enabled, source, releaseFound, trackCount, legacyId, siteSlug
```

**Plan:** keep this shape · **do not add** internal release UUID to summary · raw track rows never returned to client.

---

## Code change targets (implementation phases — not this phase)

| File | Planned change |
| --- | --- |
| `tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` | tools draft first |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | tools draft mirror |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` | root placement |

| Function / type | Change |
| --- | --- |
| `buildAnonSelectDiscographyTracksPath(siteSlug, legacyId)` | Replace `release_id=eq.{uuid}` → **`discography_legacy_id=eq.{legacyId}`** · rename 2nd param |
| `ReadBackQueryAdapter.fetchTracks` | Input **`{ siteSlug, legacyId }`** instead of `{ siteSlug, releaseId }` |
| `resolveReadBackSnapshot` | Call `fetchTracks({ siteSlug, legacyId })` · remove UUID dependency |
| `createAnonSelectReadBackAdapter.fetchTracks` | Use new path builder |
| Mock adapter in readback lib | Update mock tracks filter to match |

**No change planned:** `TRACK_SELECT_FIELDS` list · `buildSanitizedReadBackSummary` fields · write path · Save gate.

---

## Live verify retry-3 expectations (after deploy)

Target: `discography-002` · `gosaki-piano` · staging ref **`kmjqppxjdnwwrtaeqjta`**

| Case | Expected |
| --- | --- |
| **matching dryRun** | status **200** · `readBack.trackCount=8` · `wouldWrite=false` · `tracksAdded=0` |
| **+1 track dryRun** | status **200** · `wouldWrite=true` · `tracksAdded=1` |
| **operation=save** | status **400** reject — **unchanged** |
| **wrong siteSlug** | status **400** reject — **unchanged** |
| **write flags** | `didWrite=false` · `dbWrite=false` · `networkWrite=false` · `saveEnabled=false` |
| **Gate** | `gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry3Passed: true` (future phase) |

---

## Generalization notes (future — not this implementation scope)

| Topic | Note |
| --- | --- |
| Gosaki staging schema | Uses **`discography_legacy_id`** string FK-style column (no DB FK constraint) |
| Other sites | Relation column may differ (`release_id`, `discography_id`, etc.) |
| CMS Kit direction | Future **site profile / schema mapping** could declare `tracksRelationKey` per site |
| This sprint | **Gosaki readBack safe fix first** — hardcode Gosaki relation column in handler path builder is acceptable for now |
| Migration | Do not assume all sites need `release_id` UUID column |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Tools draft edit | **not executed** |
| Root handler edit | **not executed** |
| Edge deploy | **not executed** |
| SQL execution | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Live verify retry-3 | **not executed** |

---

## Next phases (ordered)

| # | Phase | Scope |
| --- | --- | --- |
| 1 | **G-20u36d-readback-tracks-relation-filter-fix-tools-draft** | Implement filter fix in tools draft + readback lib |
| 2 | **G-20u36d-readback-tracks-relation-filter-fix-root-placement** | Copy to root handler |
| 3 | Edge deploy preflight → operator deploy |
| 4 | **G-20u36d-readback-live-verify-retry-3** | Live HTTP verify |
| 5 | **G-20u36e-controlled-save-planning** | **only after retry-3 PASS** |

---

## STOP conditions

| Condition | Action |
| --- | --- |
| ALTER TABLE / migration required to add `release_id` | **STOP** — not needed per inspection |
| **service_role** required for readBack | **STOP** |
| Proceed to **G-20u36e** before retry-3 PASS | **STOP** |
| Save enablement in filter-fix phase | **STOP** |
| Production ref `vsbvndwuajjhnzpohghh` | **STOP** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-relation-filter-fix-plan
npm run verify:g20u36d-readback-tracks-relation-column-inspection-result
npm run verify:g20u36d-readback-live-verify-retry-2
```
