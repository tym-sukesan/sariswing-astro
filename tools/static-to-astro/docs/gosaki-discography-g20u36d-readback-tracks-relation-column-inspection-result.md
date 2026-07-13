# G-20u36d — Gosaki Discography Edge dry-run readBack tracks relation column inspection result

**Phase:** `G-20u36d-readback-tracks-relation-column-inspection-result-record`  
**Status:** **complete** — operator SELECT-only inspection result recorded · **no SQL re-run / tools-root edit / Edge deploy / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `4103f21`  
**Prior:** G-20u36d readBack tracks relation column inspection preflight · operator manual SELECT-only SQL execution

| Check | Status |
| --- | --- |
| Result doc | **yes** (this file) |
| SQL executed by operator | **yes** — human operator · Supabase SQL Editor |
| SQL executed by Cursor | **no** |
| SQL classification | **SELECT-only** |
| DB write | **no** |
| Tools / root code edit | **no** |
| Edge Function redeploy | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Secrets printed | **no** |
| service_role used | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackTracksRelationColumnInspectionResultRecorded: true
phase: G-20u36d-readback-tracks-relation-column-inspection-result-record
sqlExecutedByOperator: true
sqlExecutedByCursor: false
sqlClassification: SELECT-only
cursorDbWriteExecuted: false
toolsRootEditExecuted: false
edgeDeployExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
productionProjectUsed: false
relationColumnConfirmed: discography_legacy_id
releaseIdFilterIncorrect: true
dbMigrationForReleaseIdRequired: false
proceedToTracksRelationFilterFixPlanning: true
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-relation-column-inspection-result-record scope:** record operator SELECT-only inspection outcome only. No SQL re-run, no code edit, no Save enablement.

---

## Target environment

| Item | Value |
| --- | --- |
| **Staging project ref** | **`kmjqppxjdnwwrtaeqjta`** |
| **Production STOP** | **`vsbvndwuajjhnzpohghh`** — **not used** |
| Target `site_slug` | `gosaki-piano` |
| Target `legacy_id` | `discography-002` |
| SQL source | `gosaki-discography-g20u36d-readback-tracks-relation-column-inspection-preflight.md` |

---

## 1. `public.discography_tracks` — actual columns (staging)

| column_name | Present |
| --- | --- |
| `id` | **yes** |
| `discography_legacy_id` | **yes** |
| `track_number` | **yes** |
| `title` | **yes** |
| `sort_order` | **yes** |
| `created_at` | **yes** |
| `site_slug` | **yes** |

---

## 2. Candidate columns — absent on staging

| column_name | Present (F flags) |
| --- | --- |
| `release_id` | **false** |
| `discography_id` | **false** |
| `album_id` | **false** |
| `duration` | **false** |

---

## 3. Relation column · index

| Item | Result |
| --- | --- |
| Relation column on tracks | **`discography_legacy_id`** — **present** |
| Join candidate | **`discography_tracks.discography_legacy_id`** → **`discography.legacy_id`** |
| Index | **`discography_tracks_legacy_id_idx`** — **present** |

---

## 4. Foreign keys

| Item | Result |
| --- | --- |
| `foreign_key_count` on `discography_tracks` | **0** |
| DB-level FK constraint | **none** |

---

## 5. Target parent row (`discography-002`)

| Field | Value |
| --- | --- |
| `legacy_id` | `discography-002` |
| `site_slug` | `gosaki-piano` |
| `title` | `SKYLARK` |
| `id` | `ed59d236-881a-45ce-ab9f-de5427e39dad` |
| `parent_row_count` | **1** |

---

## 6. Join feasibility (section G)

| Metric | Value |
| --- | --- |
| `expected_track_count` | **8** |
| `tracks_site_slug_count` | **34** |
| `tracks_matching_discography_legacy_id_in_json` | **8** |
| `tracks_with_release_id_key_in_json` | **0** |
| `tracks_with_discography_id_key_in_json` | **0** |
| `tracks_with_album_id_key_in_json` | **0** |

---

## 7. Conclusion

| Finding | Decision |
| --- | --- |
| Current Edge readBack tracks filter | **`release_id=eq.{uuid}`** — **incorrect** for staging schema |
| `releaseRow.id` / UUID-based tracks SELECT | **not viable** — `release_id` column absent |
| DB migration to add `release_id` | **not required at this time** |
| Correct tracks SELECT filter (recommended) | **`site_slug=eq.gosaki-piano`** + **`discography_legacy_id=eq.{legacyId}`** |
| Controlled Save planning (`G-20u36e`) | **not ready** — filter fix + deploy + live verify retry-3 first |

**Relation column confirmed:** **`discography_legacy_id`**

---

## Current code state (unchanged in result-record phase)

| Location | Tracks filter (still wrong) |
| --- | --- |
| `buildAnonSelectDiscographyTracksPath()` | `site_slug=eq.{slug}&release_id=eq.{uuid}` |
| Root + tools draft handler | **unchanged** — awaits filter-fix planning |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| SQL re-run (Cursor or operator) | **not executed** |
| DB write | **not executed** |
| Tools / root handler edit | **not executed** |
| Edge deploy | **not executed** |
| Save enablement | **not executed** |
| Filter fix implementation | **not executed** |

---

## Next phases (ordered)

| # | Phase | Scope |
| --- | --- | --- |
| 1 | **G-20u36d-readback-tracks-relation-filter-fix-planning** | Plan tracks SELECT filter → `discography_legacy_id` |
| 2 | tools draft → root placement → Edge deploy → **live verify retry-3** |
| 3 | **G-20u36e-controlled-save-planning** | **only after retry-3 PASS** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-relation-column-inspection-result
npm run verify:g20u36d-readback-tracks-relation-column-inspection-preflight
npm run verify:g20u36d-readback-live-verify-retry-2
```
