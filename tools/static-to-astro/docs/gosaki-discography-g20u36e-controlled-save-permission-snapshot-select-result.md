# G-20u36e — Gosaki Discography controlled Save permission snapshot SELECT result

**Phase:** `G-20u36e-controlled-save-permission-snapshot-select-result-record`  
**Status:** **complete** — operator SELECT-only permission snapshot recorded · **PASS** · **no DB write**  
**Date:** 2026-07-14  
**Base commit:** `329f48d`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-permission-snapshot-select-prep.md](./gosaki-discography-g20u36e-controlled-save-permission-snapshot-select-prep.md)

| Check | Status |
| --- | --- |
| SELECT-only permission snapshot | **executed by operator** (staging SQL Editor) |
| SQL re-run by Cursor | **no** |
| DB write | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| Edge implementation | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP sent | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSavePermissionSnapshotSelectResultRecorded: true
phase: G-20u36e-controlled-save-permission-snapshot-select-result-record
permissionSnapshotSelectExecutedByOperator: true
permissionSnapshotPass: true
sqlReExecutedByCursor: false
dbWriteExecuted: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
edgeImplementationExecuted: false
edgeDeployExecuted: false
operationSaveSent: false
dryRunHttpSent: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
currentSavePathDbWriteLikelyBlocked: true
readyForG20u36ePermissionModelDecision: true
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. Execution summary

| Item | Value |
| --- | --- |
| Executor | **operator** — Supabase SQL Editor |
| SQL source | prep doc §SELECT-only SQL block |
| Output column | `g20u36e_permission_snapshot` |
| Rows returned | **1** (JSON) |
| Cursor SQL execution | **no** |
| SQL re-run | **no** |
| Classification | **SELECT-only** |

---

## 2. Snapshot JSON metadata

| Field | Recorded value |
| --- | --- |
| `phase` | `G-20u36e-controlled-save-permission-snapshot-select-execution` |
| `expected_project_ref` | `kmjqppxjdnwwrtaeqjta` |
| `production_project_ref_stop` | `vsbvndwuajjhnzpohghh` |
| `captured_at` | `2026-07-13T17:13:51.876147+00:00` |
| `target_site_slug` | `gosaki-piano` |
| `target_legacy_id` | `discography-002` |

---

## 3. Checks (recorded)

| check_key | Value | Expected | Verdict |
| --- | --- | --- | --- |
| `track_count` | **8** | 8 | **PASS** |
| `track_7_title` | **`Like a Lover`** | Like a Lover | **PASS** |
| `target_row_count` | **1** | 1 | **PASS** |
| `target_track_1_title` | **`On a Clear Day`** | On a Clear Day | **PASS** |
| `admin_all_policy_count` | **2** | 2 (likely) | **PASS** |
| `anon_write_grants_count` | **0** | 0 | **PASS** |
| `rls_enabled_discography` | **true** | true | **PASS** |
| `rls_enabled_discography_tracks` | **true** | true | **PASS** |
| `authenticated_update_grants_count` | **0** | 0 (likely) | **PASS** |
| `authenticated_title_update_column_grants_count` | **0** | 0 (likely) | **PASS** |
| `authenticated_discography_tracks_update_grants_count` | **0** | 0 (likely) | **PASS** |

**Checks layer verdict:** **PASS** — all recorded checks match prep doc expectations.

---

## 4. role_table_grants (recorded)

| Table | Grantee | Privilege |
| --- | --- | --- |
| `public.discography` | **anon** | **SELECT** |
| `public.discography` | **authenticated** | **SELECT** |
| `public.discography_tracks` | **anon** | **SELECT** |
| `public.discography_tracks` | **authenticated** | **SELECT** |

**No INSERT / UPDATE / DELETE** grants for anon or authenticated on target tables.

**Grants verdict:** **SELECT-only** — matches G-20u36b deploy preflight baseline · no drift observed.

---

## 5. column_privileges_title (recorded)

```txt
[]
```

No column-level UPDATE grant on `discography_tracks.title` for anon or authenticated.

---

## 6. rls_status (recorded)

| Table | rls_enabled | rls_forced |
| --- | --- | --- |
| `discography` | **true** | **false** |
| `discography_tracks` | **true** | **false** |

---

## 7. policies (recorded)

| policyname | cmd | roles | qual | with_check |
| --- | --- | --- | --- | --- |
| `discography_admin_all` | **ALL** | authenticated | `is_admin()` | `is_admin()` |
| `discography_public_select` | **SELECT** | anon, authenticated | `published = true` | — |
| `discography_tracks_admin_all` | **ALL** | authenticated | `is_admin()` | `is_admin()` |
| `discography_tracks_public_select` | **SELECT** | anon, authenticated | EXISTS published discography row | — |

**Policies note:** Admin ALL policies exist for authenticated + `is_admin()`. Public SELECT policies allow read for published data. **Grant layer** has no UPDATE privilege — direct PostgREST UPDATE remains blocked unless grants are added in a future approved phase.

---

## 8. Target row (recorded)

| Field | Value |
| --- | --- |
| `id` | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| `site_slug` | `gosaki-piano` |
| `discography_legacy_id` | `discography-002` |
| `track_number` | **1** |
| `title` | **`On a Clear Day`** |
| `sort_order` | **1** |

---

## 9. Target tracks (8 rows — recorded)

| track_number | title |
| --- | --- |
| 1 | On a Clear Day |
| 2 | My Blue Heaven |
| 3 | How Deep Is The Ocean |
| 4 | Skylark |
| 5 | Set Sail |
| 6 | What a Wonderful World |
| 7 | Like a Lover |
| 8 | The Water Is Wide |

---

## 10. PASS / STOP judgment

| Layer | Verdict |
| --- | --- |
| Snapshot execution | **PASS** — operator SELECT-only on staging |
| Target row / slice | **PASS** — row count 1 · track count 8 · track 7 canonical |
| Grants safety | **PASS** — anon write 0 · authenticated UPDATE 0 |
| RLS | **PASS** — enabled on both tables |
| Policies inventory | **PASS** — recorded · admin ALL + public SELECT as expected |
| Overall permission snapshot | **PASS** |

**PASS does not authorize Save** — only records permission baseline and unlocks permission model decision phase.

**STOP conditions (prep doc):** none triggered.

---

## 11. Permission model judgment

| Item | Judgment |
| --- | --- |
| Snapshot layer | **PASS** |
| Target row / track count / track 7 | **As expected** — controlled Save slice baseline confirmed |
| anon write grants = 0 | **Safe** — no anon INSERT/UPDATE/DELETE |
| authenticated UPDATE grants = 0 | **Confirmed** — table-level UPDATE absent |
| authenticated title column UPDATE grants = 0 | **Confirmed** — column-level grant absent · Option A requires future grant phase |
| Admin ALL policies | **Present (2)** — but **UPDATE grant = 0** → grant layer likely blocks direct PostgREST UPDATE even for authenticated |
| Edge Save path today | **DB write would likely fail** — anon-only Edge client + zero UPDATE grants |
| service_role | **Not used** — project policy unchanged |
| First controlled Save | **Still not executable** |

### Implications for Option A (from preflight plan)

To enable one-row UPDATE via Edge without service_role:

1. Staging-only **authenticated UPDATE** on `discography_tracks.title` (column-level if supported)
2. Restrictive **RLS policy** scoped to slice row
3. Edge must forward **operator authenticated JWT** (not anon key only)
4. Separate **permission change preflight + operator approval** before any GRANT/RLS SQL

**No executable GRANT/RLS SQL in this result-record phase.**

---

## 12. Next phase

| Candidate | Recommendation |
| --- | --- |
| **G-20u36e-controlled-save-permission-model-decision** | **Recommended next** — decide Option A path · JWT requirement · temporary vs permanent grants |
| G-20u36e-controlled-save-permission-change-preflight-planning | After model decision — plan GRANT/RLS change SQL (still no execution in planning) |

**Not next:** Edge Save tools draft arm · operation=save · First controlled Save execution.

---

## 13. Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| SQL re-run by Cursor | **no** |
| GRANT / REVOKE executed | **no** |
| RLS policy change | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP sent | **no** |
| Save enabled | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| service_role used | **no** |
| Executable GRANT/RLS SQL created | **no** |

---

## Verifier

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-permission-snapshot-select-result
```

Script: `scripts/verify-g20u36e-controlled-save-permission-snapshot-select-result.mjs`
