# G-20u36e — Gosaki Discography controlled Save manual upload UI pass result

**Phase:** `G-20u36e-controlled-save-manual-upload-ui-pass-result-record`  
**Status:** **complete** — result record only · operator manual FTP done · Admin + Public UI **PASS** · **First controlled Save full loop PASS**  
**Date:** 2026-07-15  
**Package sourceCommit:** `8c9cd9210641d473c72c752f7b20903cb4d501bf` (short: `8c9cd92`)  
**Prior:** [static-package-regeneration-prep](./gosaki-discography-g20u36e-controlled-save-static-package-regeneration-prep.md) · [ui-visible-verification-result](./gosaki-discography-g20u36e-controlled-save-ui-visible-verification-result.md) · [post-close-result](./gosaki-discography-g20u36e-controlled-save-post-close-result.md)

| Check | Status |
| --- | --- |
| First controlled Save full loop | **PASS** |
| DB Save | **PASS** |
| Permission close | **PASS** |
| Package regeneration | **PASS** |
| Package freshness | **PASS** |
| Preflight | **PASS** |
| verify:manual-upload | **PASS** |
| Manual FTP upload | **done** (operator · FileZilla) |
| Admin UI | **PASS** |
| Public UI | **PASS** |
| Marker title visible | **yes** |
| Like a Lover visible | **yes** |
| Additional Save | **no** |
| SQL executed | **no** |
| DB write (this phase) | **no** |
| Package re-generation (this phase) | **no** |
| FTP re-upload (this phase) | **no** |
| FTP automation | **no** |
| Edge deploy | **no** |
| service_role | **not used** |
| Production changed | **no** |
| commit / push (this phase) | **no** (operator) |

---

## Gates

```txt
gosakiDiscographyControlledSaveManualUploadUiPassCompleted: true
phase: G-20u36e-controlled-save-manual-upload-ui-pass-result-record
firstControlledSaveFullLoopPass: true
dbSavePass: true
permissionClosePass: true
packageRegenerationPass: true
packageFreshnessPass: true
preflightPass: true
verifyManualUploadPass: true
manualFtpUploadCompletedByOperator: true
adminUiPass: true
publicUiPass: true
markerTitleVisible: true
likeALoverVisible: true
additionalSaveExecuted: false
sqlExecuted: false
dbWriteInThisPhase: false
packageRegenerationInThisPhase: false
ftpReuploadInThisPhase: false
ftpAutomationUsed: false
edgeDeployExecuted: false
serviceRoleUsed: false
productionChanged: false
packageSourceCommit: 8c9cd9210641d473c72c752f7b20903cb4d501bf
titleUpdateGrantCount: 0
g20u36eRestrictivePolicy: removed
recommendedNextPhase: G-20u36e-controlled-save-slice-complete
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. Full loop summary

| Step | Status |
| --- | --- |
| Permission change + First controlled Save (Edge) | **PASS** |
| Permission close + post-close SELECT | **PASS** |
| UI lag diagnosis (static snapshot) | **recorded** |
| Package regeneration at `8c9cd92` | **PASS** |
| Package freshness / preflight / verify:manual-upload | **PASS** |
| Manual FTP upload (operator) | **done** |
| Admin UI marker title | **PASS** |
| Public UI marker title | **PASS** |

**Target slice (reference):**

| Item | Value |
| --- | --- |
| Table | `public.discography_tracks` |
| site_slug | `gosaki-piano` |
| discography_legacy_id | `discography-002` |
| track_number | **1** |
| Marker title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count | **8** |
| track_7_title | `Like a Lover` |
| title UPDATE grant | **0** (closed) |
| G-20u36e restrictive policy | **removed** |

---

## 2. Manual FTP upload summary

| Item | Value |
| --- | --- |
| Method | Operator **manual FileZilla** |
| Local source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** |
| Remote target | `/cms-kit-staging/gosaki-piano/` |
| Package `sourceCommit` | `8c9cd9210641d473c72c752f7b20903cb4d501bf` |
| CLI FTP / mirror / sync delete / remote delete | **not executed** |
| FTP automation | **no** |
| Production path | **not targeted** |

**Pre-upload package checks (operator · recorded):**

| Check | Result |
| --- | --- |
| `verify:package-freshness:gosaki:staging` | **PASS** |
| `preflight:gosaki:staging` | **PASS** |
| `verify:manual-upload` | **PASS** |
| Marker grep in `admin/index.html` | **present** |
| Marker grep in `discography/index.html` | **present** |

---

## 3. UI confirmation (operator browser)

### Admin

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

| Observation | Result |
| --- | --- |
| `On a Clear Day [CMS Kit staging G-20u36e]` | **visible** · **PASS** |
| `Like a Lover` | **visible** · **PASS** |

### Public

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

| Observation | Result |
| --- | --- |
| `On a Clear Day [CMS Kit staging G-20u36e]` | **visible** · **PASS** |
| `Like a Lover` | **visible** · **PASS** |

**Note on title grep:** Marker string is the primary PASS criterion. Bare `On a Clear Day` may appear as substring of the marker title.

---

## 4. Not executed in this phase

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

---

## 5. Re-upload note

**Important:** If re-upload is needed **after this result-record commit**, the uploaded package `sourceCommit` (`8c9cd92…`) will become stale relative to new HEAD. **Package regeneration is required** before any future manual upload. Do not upload an old package after code/doc commits without regenerating at current HEAD and re-running freshness checks.

---

## 6. Next

```txt
recommendedNextPhase: G-20u36e-controlled-save-slice-complete
```

First controlled Save slice loop **complete**. Await next slice planning (e.g. additional discography fields, general edit UI) per project roadmap.
