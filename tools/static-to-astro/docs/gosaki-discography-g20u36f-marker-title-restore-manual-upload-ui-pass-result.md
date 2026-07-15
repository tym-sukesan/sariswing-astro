# G-20u36f — Gosaki Discography marker title restore manual upload UI pass result

**Phase:** `G-20u36f-discography-marker-title-restore-manual-upload-ui-pass-result`  
**Status:** **complete** — result record only · operator package regen + manual FTP done · Admin + Public UI **PASS** · **marker title restore full loop PASS**  
**Date:** 2026-07-15  
**Package sourceCommit:** `e3616a3ab0fbda280d75278b0a6275205ae74763` (short: `e3616a3`)  
**Prior:** [save-result](./gosaki-discography-g20u36f-marker-title-restore-save-result.md) · [edge-deploy-result](./gosaki-discography-g20u36f-marker-title-restore-edge-deploy-result.md)

| Check | Status |
| --- | --- |
| Marker title restore full loop | **PASS** |
| DB title restored | **PASS** (prior phase) |
| Permission closed | **PASS** (prior phase) |
| Package regeneration | **PASS** (operator · prior to this record) |
| Package freshness | **PASS** |
| Preflight | **PASS** |
| verify:manual-upload | **PASS** |
| Manual FTP upload | **done** (operator · FileZilla) |
| Admin UI | **PASS** |
| Public UI | **PASS** |
| Marker title in STG UI | **absent** · **PASS** |
| On a Clear Day in STG UI | **restored** · **PASS** |
| Like a Lover preserved | **yes** · **PASS** |
| Additional Save | **no** |
| SQL executed | **no** |
| DB write (this phase) | **no** |
| Package re-generation (this phase) | **no** |
| FTP re-upload (this phase) | **no** |
| Edge deploy | **no** |
| service_role | **not used** |
| Production changed | **no** |
| commit / push (this phase) | **no** (operator) |

---

## Gates

```txt
gosakiDiscographyMarkerTitleRestoreManualUploadUiPassCompleted: true
phase: G-20u36f-discography-marker-title-restore-manual-upload-ui-pass-result
markerTitleRestoreFullLoopPass: true
dbTitleRestored: true
permissionClosed: true
packageRegenerationPass: true
packageFreshnessPass: true
preflightPass: true
verifyManualUploadPass: true
manualFtpUploadCompletedByOperator: true
adminUiPass: true
publicUiPass: true
markerTitleRemovedFromStgUi: true
onAClearDayRestoredInStgUi: true
likeALoverPreserved: true
additionalSaveExecuted: false
sqlExecuted: false
dbWriteInThisPhase: false
packageRegenerationInThisPhase: false
ftpReuploadInThisPhase: false
ftpAutomationUsed: false
edgeDeployExecuted: false
serviceRoleUsed: false
productionChanged: false
packageSourceCommit: e3616a3ab0fbda280d75278b0a6275205ae74763
packageGeneratedAt: 2026-07-15T03:32:33.596Z
packageFileCount: 31
safeForStaticFtp: true
recommendedNextPhase: G-20u36f-discography-marker-title-restore-slice-complete
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use** · **unchanged**.

---

## 1. Full loop summary

| Step | Status |
| --- | --- |
| Handler implementation + Edge deploy | **PASS** (prior phases) |
| Pre-restore SELECT + permission open | **PASS** (operator) |
| Restore controlled Save (Edge) | **PASS** |
| Permission close + post-close SELECT | **PASS** |
| Package regeneration at `e3616a3` | **PASS** |
| Package freshness / preflight / verify:manual-upload | **PASS** |
| Manual FTP upload (operator) | **done** |
| Admin UI original title | **PASS** |
| Public UI original title | **PASS** |

**Target slice (reference):**

| Item | Value |
| --- | --- |
| Table | `public.discography_tracks` |
| site_slug | `gosaki-piano` |
| discography_legacy_id | `discography-002` |
| track_number | **1** |
| Restored title | `On a Clear Day` |
| Prior marker title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count | **8** |
| track_7_title | `Like a Lover` |
| title UPDATE grant | **0** (closed) |
| G-20u36f restrictive policy | **removed** |

---

## 2. Package regeneration summary (operator · recorded)

| Item | Value |
| --- | --- |
| Command | `npm run build:gosaki:staging` |
| sourceCommit | `e3616a3ab0fbda280d75278b0a6275205ae74763` |
| generatedAt | `2026-07-15T03:32:33.596Z` |
| fileCount | **31** |
| safeForStaticFtp | **true** |
| intendedRemotePath | `/cms-kit-staging/gosaki-piano/` |
| publicBaseUrl | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

### Package verification (operator · recorded)

| Check | Result |
| --- | --- |
| `build:gosaki:staging` | **PASS** |
| `verify:package-freshness:gosaki:staging` | **PASS** |
| `preflight:gosaki:staging` | **PASS** |
| `verify:manual-upload` | **PASS** |
| Marker grep in `public-dist/` | **absent** — `On a Clear Day [CMS Kit staging G-20u36e]` not found |
| `On a Clear Day` in `admin/index.html` | **present** |
| `On a Clear Day` in `discography/index.html` | **present** |
| `Like a Lover` in `admin/index.html` | **present** |
| `Like a Lover` in `discography/index.html` | **present** |

---

## 3. Manual FTP upload summary

| Item | Value |
| --- | --- |
| Method | Operator **manual FileZilla** |
| Local source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** |
| Remote target | `/cms-kit-staging/gosaki-piano/` |
| Upload mode | **overwrite only** |
| CLI FTP / mirror / sync delete / remote delete | **not executed** |
| Package `sourceCommit` | `e3616a3ab0fbda280d75278b0a6275205ae74763` |
| Production path | **not targeted** |

---

## 4. UI confirmation (operator browser)

### Admin

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

| Observation | Result |
| --- | --- |
| SKYLARK textarea first track | `On a Clear Day` · **PASS** |
| Marker title `On a Clear Day [CMS Kit staging G-20u36e]` | **absent** · **PASS** |
| `Like a Lover` | **visible** · **PASS** |

### Public Discography

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

| Observation | Result |
| --- | --- |
| SKYLARK Track List first track | `On a Clear Day` · **PASS** |
| Marker title `On a Clear Day [CMS Kit staging G-20u36e]` | **absent** · **PASS** |
| `Like a Lover` | **visible** · **PASS** |

---

## 5. Not executed in this phase

| Item | Status |
| --- | --- |
| Additional Save / operation=save | **no** |
| SQL execution | **no** |
| DB write | **no** |
| Package re-generation | **no** |
| FTP re-upload | **no** |
| CLI FTP / mirror / sync delete | **no** |
| Edge deploy | **no** |
| service_role | **not used** |
| Production change | **no** |
| JWT / tokens displayed | **no** |

---

## 6. Re-upload note

**Important:** No further FTP is needed unless the package is regenerated again. If re-upload is required **after this result-record commit**, the uploaded package `sourceCommit` (`e3616a3…`) will become stale relative to new HEAD. **Package regeneration is required** before any future manual upload.

---

## 7. Next

```txt
recommendedNextPhase: G-20u36f-discography-marker-title-restore-slice-complete
```

Marker title restore slice loop **complete** pending slice-complete record.
