# G-20u36f — Gosaki Discography marker title restore Save result

**Phase:** `G-20u36f-discography-marker-title-restore-save-result-record`  
**Status:** **complete** — restore Save **PASS** · permission close **PASS** · post-close snapshot **PASS** · result record only  
**Date:** 2026-07-15  
**Prior:** [edge-deploy-result](./gosaki-discography-g20u36f-marker-title-restore-edge-deploy-result.md) · [planning](./gosaki-discography-g20u36f-marker-title-restore-planning.md)

| Check | Status |
| --- | --- |
| Restore controlled Save | **PASS** (once) |
| Permission close | **PASS** |
| Post-close SELECT | **PASS** |
| DB title restored | **yes** — `On a Clear Day` |
| Permission closed | **yes** |
| Package regenerated | **no** |
| STG static UI | **may still show marker** until package regen + manual FTP |
| Additional Save | **not allowed** |
| Additional SQL / Edge deploy | **not executed** |
| service_role | **not used** |
| Production changed | **no** |
| This phase Cursor Save / SQL | **not executed** (result record only) |

---

## Gates

```txt
gosakiDiscographyMarkerTitleRestoreSaveCompleted: true
phase: G-20u36f-discography-marker-title-restore-save-result-record
restoreSavePass: true
permissionClosePass: true
postCloseSelectPass: true
dbTitleRestoredToOriginal: true
permissionClosed: true
markerTitleCountForTarget: 0
packageGenerated: false
ftpUploadExecuted: false
additionalSaveNotAllowed: true
additionalSqlNotExecuted: true
edgeDeployNotExecuted: true
serviceRoleUsed: false
productionChanged: false
dbDataWriteThisPhase: false
recommendedNextPhase: G-20u36f-discography-marker-title-restore-static-package-regeneration-prep
manualFtpAfter: package-freshness PASS
```

**Endpoint:** `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run`  
**Staging project ref:** `kmjqppxjdnwwrtaeqjta`  
**Production STOP:** `vsbvndwuajjhnzpohghh` — **never use** · **unchanged**  
**Closed policy name:** `discography_tracks_g20u36f_marker_title_restore_restrictive`

---

## 1. Slice outcome summary

| Item | Value |
| --- | --- |
| site_slug | `gosaki-piano` |
| discography_legacy_id | `discography-002` |
| track_number | `1` |
| row id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| title before Save | `On a Clear Day [CMS Kit staging G-20u36e]` |
| title after Save (final) | `On a Clear Day` |
| track_count | **8** (unchanged) |
| track_7_title | `Like a Lover` (unchanged) |
| no added/removed tracks | **yes** |

---

## 2. Restore Save response (sanitized)

| Field | Value |
| --- | --- |
| ok | `true` |
| operation | `save` |
| controlledSave | `true` |
| endpoint | `gosaki-discography-save-dry-run` |
| siteSlug | `gosaki-piano` |
| legacyId / discographyLegacyId | `discography-002` |
| approvalId | `G-20u36f-gosaki-discography-marker-title-restore` |
| sliceId | `G-20u36f-discography-002-track-1-title-restore` |
| trackNumber | `1` |
| targetRowId | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| beforeTitle | `On a Clear Day [CMS Kit staging G-20u36e]` |
| afterTitle | `On a Clear Day` |
| updatedRows | `1` |
| errors | `[]` |
| warnings | `[]` |
| didWrite | `true` |
| dbWrite | `true` |
| networkWrite | `true` |
| saveEnabled | `true` |
| status | `200` |
| JWT / anon key / tokens / user_id / email | **not recorded** |

### readBack

| Field | Value |
| --- | --- |
| enabled | `true` |
| source | `user-jwt-select` |
| releaseFound | `true` |
| trackCount | `8` |
| track_7_title | `Like a Lover` |
| targetTitle | `On a Clear Day` |
| targetRowCount | `1` |
| noAddedRemoved | `true` |

### Save judgment

| Item | Status |
| --- | --- |
| Restore controlled Save | **PASS** · exactly once |
| Title change | marker → original |
| Track list integrity | **PASS** · track_count=8 · track_7 unchanged |
| service_role | **not used** |
| Production | **unchanged** |
| Executor | operator (manual Edge HTTP) · Cursor did **not** send Save |

---

## 3. Permission close

| Item | Value |
| --- | --- |
| Judgment | **PASS** |
| Effect | REVOKE title UPDATE + DROP G-20u36f restrictive policy (operator-executed) |
| Permission state | **closed** |
| This phase Cursor SQL | **not executed** (result record only) |

---

## 4. Post-close SELECT snapshot

| Field | Value |
| --- | --- |
| phase | `G-20u36f-discography-marker-title-restore-post-close` |
| captured_at | `2026-07-15T02:06:25.045055+00:00` |
| expected_project_ref | `kmjqppxjdnwwrtaeqjta` |
| production_project_ref_stop | `vsbvndwuajjhnzpohghh` |

### Checks — PASS

| check | Value | Verdict |
| --- | --- | --- |
| `target_title` | `On a Clear Day` | **PASS** |
| `target_title_is_original` | **true** | **PASS** |
| `marker_title_count_for_target` | **0** | **PASS** |
| `target_row_count` | **1** | **PASS** |
| `target_row_id_matches` | **true** | **PASS** |
| `track_count` | **8** | **PASS** |
| `track_7_title` | `Like a Lover` | **PASS** |
| `authenticated_title_update_column_grants_count` | **0** | **PASS** |
| `authenticated_table_update_grants_count` | **0** | **PASS** |
| `anon_write_grants_count` | **0** | **PASS** |
| `g20u36f_restrictive_policy_count` | **0** | **PASS** (closed) |
| `admin_all_policy_count` | **2** | **PASS** |
| `rls_enabled_discography_tracks` | **true** | **PASS** |
| `permission_close_involved` | **true** | **PASS** |
| `data_mutation` | **false** | **PASS** |
| `operation_save_involved` | **false** | **PASS** |

---

## 5. DB vs static UI lag

| Layer | Status |
| --- | --- |
| DB (post-restore Save + close) | **PASS** · title = `On a Clear Day` |
| Packaged STG Admin `/admin/` | **may still show marker** · build-time JSON snapshot lag |
| Public `/discography/` | **may still show marker** · convert/build baked HTML lag |
| Remediation | package regen at clean HEAD → manual FTP after freshness PASS |

---

## 6. What was NOT done this phase

| Item | Status |
| --- | --- |
| Additional Save / operation=save | **no** |
| Additional SQL | **no** |
| DB write (Cursor) | **no** |
| Edge deploy | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| Production change | **no** |
| JWT / tokens displayed | **no** |

---

## 7. Next

```txt
recommendedNextPhase: G-20u36f-discography-marker-title-restore-static-package-regeneration-prep
then: package regen at clean HEAD
then: verify:package-freshness:gosaki:staging PASS
then: manual FileZilla upload public-dist/ → /cms-kit-staging/gosaki-piano/
then: UI verify Admin + Public show On a Clear Day (not marker)
```

**Package regen is next.** Manual FTP is after package freshness **PASS**.
