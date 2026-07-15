# G-20u36f — Gosaki Discography marker title restore slice complete

**Phase:** `G-20u36f-discography-marker-title-restore-slice-complete`  
**Status:** **COMPLETE** — slice closure record only · **marker title restore full loop PASS** · **no Save / SQL / package / FTP / Edge in this phase**  
**Date:** 2026-07-15  
**Result-record commit:** `f4265b9`  
**Uploaded package sourceCommit:** `e3616a3ab0fbda280d75278b0a6275205ae74763` (short: `e3616a3`)  
**Current HEAD:** `f4265b9`  
**Prior:** [manual-upload-ui-pass-result](./gosaki-discography-g20u36f-marker-title-restore-manual-upload-ui-pass-result.md) · [save-result](./gosaki-discography-g20u36f-marker-title-restore-save-result.md) · [planning](./gosaki-discography-g20u36f-marker-title-restore-planning.md)

| Check | Status |
| --- | --- |
| Slice complete | **yes** |
| Result | **COMPLETE** |
| Marker title restore full loop | **PASS** |
| Pre-restore SELECT | **PASS** |
| Temporary permission open | **PASS** |
| Controlled restore Save | **PASS** |
| Permission close + post-close SELECT | **PASS** |
| Package regeneration | **PASS** |
| Package freshness / preflight / verify:manual-upload | **PASS** |
| Manual FTP upload (FileZilla) | **done** |
| Admin UI original title | **PASS** |
| Public UI original title | **PASS** |
| Marker removed (DB / package / STG UI) | **PASS** |
| Like a Lover preserved | **PASS** |
| Permission closed | **yes** |
| current-active-regression | **23/23 PASS** |
| Result-record commit | `f4265b9` |
| Additional Save | **no** |
| SQL executed | **no** |
| DB write (this phase) | **no** |
| Package generation (this phase) | **no** |
| FTP / upload (this phase) | **no** |
| Edge deploy | **no** |
| service_role | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiDiscographyMarkerTitleRestoreSliceCompleted: true
phase: G-20u36f-discography-marker-title-restore-slice-complete
result: COMPLETE
markerTitleRestoreFullLoopPass: true
resultRecordCommit: f4265b9
currentActiveRegression: 23/23 PASS
preRestoreSelectPass: true
permissionOpenPass: true
restoreSavePass: true
permissionClosePass: true
postCloseSelectPass: true
packageRegenerationPass: true
packageFreshnessPass: true
preflightPass: true
verifyManualUploadPass: true
manualFtpUploadCompleted: true
adminUiPass: true
publicUiPass: true
markerRemovedFromDbPackageStgUi: true
originalTitleRestored: true
likeALoverPreserved: true
permissionClosed: true
additionalSaveExecuted: false
sqlExecuted: false
dbWriteInThisPhase: false
packageGenerationInThisPhase: false
ftpUploadInThisPhase: false
edgeDeployExecuted: false
serviceRoleUsed: false
productionChanged: false
uploadedPackageSourceCommit: e3616a3ab0fbda280d75278b0a6275205ae74763
currentHead: f4265b9
reUploadRequiresPackageRegeneration: true
noFurtherFtpNeeded: true
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use** · **unchanged**.

---

## 1. Slice summary — full loop PASS

| Step | Status |
| --- | --- |
| Planning + handler implementation | **PASS** |
| Edge deploy + smoke | **PASS** |
| Pre-restore SELECT | **PASS** |
| Temporary permission open | **PASS** |
| Controlled restore Save (Edge · one-time) | **PASS** |
| Permission close + post-close SELECT | **PASS** |
| Package regeneration at `e3616a3` | **PASS** |
| Package freshness / preflight / verify:manual-upload | **PASS** |
| Manual FTP upload (operator · FileZilla) | **done** |
| Admin UI — `On a Clear Day` + Like a Lover · marker absent | **PASS** |
| Public `/discography/` — `On a Clear Day` + Like a Lover · marker absent | **PASS** |
| Manual-upload UI pass result record | **commit `f4265b9`** |
| current-active-regression | **23/23 PASS** |

**Target slice (reference):**

| Item | Value |
| --- | --- |
| Table | `public.discography_tracks` |
| site_slug | `gosaki-piano` |
| discography_legacy_id | `discography-002` |
| track_number | **1** |
| row id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| Restored title (DB + STG UI) | `On a Clear Day` |
| Prior marker title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count | **8** |
| track_7_title | `Like a Lover` |
| title UPDATE grant | **0** (closed) |
| G-20u36f restrictive policy | **removed** (count **0**) |
| anon write grants | **0** |

---

## 2. Controlled restore Save (reference)

| Field | Value |
| --- | --- |
| operation | `save` |
| ok | `true` |
| controlledSave | `true` |
| beforeTitle | `On a Clear Day [CMS Kit staging G-20u36e]` |
| afterTitle | `On a Clear Day` |
| updatedRows | **1** |
| readBack.targetTitle | `On a Clear Day` |
| readBack.trackCount | **8** |
| readBack.track_7_title | `Like a Lover` |
| readBack.noAddedRemoved | **true** |

---

## 3. Permission close (reference)

| Check | Value |
| --- | --- |
| authenticated title UPDATE grant | **0** |
| authenticated table UPDATE grant | **0** |
| G-20u36f restrictive policy count | **0** |
| anon write grants | **0** |
| admin_all policy count | **2** |
| RLS enabled on discography_tracks | **true** |

---

## 4. Package + STG UI (reference)

| Item | Value |
| --- | --- |
| Package sourceCommit | `e3616a3ab0fbda280d75278b0a6275205ae74763` |
| fileCount | **31** |
| safeForStaticFtp | **true** |
| Remote path | `/cms-kit-staging/gosaki-piano/` |
| Marker grep in public-dist | **absent** |
| Admin SKYLARK first track | `On a Clear Day` |
| Public SKYLARK Track List first track | `On a Clear Day` |
| Like a Lover (Admin + Public) | **present** |

---

## 5. sourceCommit / HEAD mismatch note

| Item | Value |
| --- | --- |
| STG uploaded package `sourceCommit` | `e3616a3` (`e3616a3ab0fbda280d75278b0a6275205ae74763`) |
| Current HEAD (after result-record commit) | `f4265b9` |
| Match | **no** |

**Re-upload rule:** Uploaded package `sourceCommit` `e3616a3` is **already deployed to STG** and matches the restored DB title. **No further FTP is needed** unless the package is regenerated again. Any re-upload **after commit `f4265b9`** requires **package regeneration at current HEAD**, then freshness / preflight / verify:manual-upload PASS, before manual FileZilla upload. Do **not** re-upload the `e3616a3` package after newer commits without regenerating.

---

## 6. Not executed in this phase

| Item | Status |
| --- | --- |
| Additional Save / operation=save | **no** |
| SQL execution | **no** |
| DB write | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| Edge deploy | **no** |
| service_role | **not used** |
| Production change | **no** |
| JWT / tokens displayed | **no** |

---

## 7. Next candidates

| # | Candidate | Notes |
| --- | --- | --- |
| 1 | **Gosaki public-readiness QA** | Broader staging QA before client preview / launch |
| 2 | **Discography Save UI generalization** | Extend beyond one-off controlled Save slices; staging shell only |
| 3 | **Schedule / YouTube / About / Contact / Link / Home readiness check** | Per G-9a CMS MVP scope |

No single next phase is mandated here — operator chooses based on priority.
